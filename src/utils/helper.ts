import path from 'path';
import { createTranscodeStream } from './ffmpegConfig';
import { Readable } from 'stream';
import { DeleteObjectCommand, GetObjectCommandOutput, PutObjectCommand } from '@aws-sdk/client-s3';
import { S3 } from './s3Config';
import fs, { createReadStream } from 'fs';
import sharp from 'sharp';
import { getPlaiceholder } from 'plaiceholder';
import { prisma } from '../lib/prisma';
import env from './envConfig';
import esClient from '../lib/elasticSearch';

const index = 'properties';

export async function getLocalFiles(dir: string): Promise<string | string[]> {
  const dirents = await fs.promises.readdir(dir, {
    withFileTypes: true,
  });

  const files = await Promise.all(
    dirents.map((dirent) => {
      const file = path.resolve(dir, dirent.name);
      return dirent.isDirectory() ? getLocalFiles(file) : file;
    }),
  );

  return Array.prototype.concat(...files);
}

export const streamToBuffer = async (stream: ReadableStream) => {
  const chunks: Buffer[] = [];

  for await (const chunk of stream) chunks.push(chunk);

  return Buffer.concat(chunks);
};

export const videoTranscode = async (
  outputFolder: string,
  bucketName: string,
  fileOriginalName: string,
  uniqueString: string,
  Key: string,
  res: GetObjectCommandOutput,
  propertyId: string,
  mediaId?: string,
) => {
  const ffmpeg = createTranscodeStream(outputFolder);
  const stream = res.Body as Readable;
  stream.pipe(ffmpeg.stdin);

  let stderrOutput = '';

  ffmpeg.stderr.on('data', (data) => {
    console.log('Transcoding on process ...');
    stderrOutput += data.toString();
  });

  ffmpeg.on('close', async (code) => {
    if (code === 0) {
      console.log(`Transcoding finished successfully: ${outputFolder}`);

      const files = (await getLocalFiles(outputFolder)) as string[];

      const uploads = files.map((filePath) =>
        S3.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: 'hls_output'.concat('/', fileOriginalName, '_', uniqueString, '/', path.relative(outputFolder, filePath).replace(/\\/g, '/')),
            Body: createReadStream(filePath),
            ContentType: filePath.endsWith('.m3u8') ? 'application/vnd.apple.mpegurl' : 'video/mp2t',
          }),
        ).then((res) => {
          console.log(res.ETag);
        }),
      );

      await Promise.all(uploads);

      const mediaUrl = `https://${bucketName}.s3.${env.BACKBLAZE_B2_REGION}.backblazeb2.com/hls_output/${fileOriginalName}_${uniqueString}/master.m3u8`;

      if (mediaId) {
        await prisma.propertyMedia.update({
          where: { id: mediaId },
          data: { mediaUrl },
          select: {
            id: true,
          },
        });
      }

      await prisma.propertyMedia.create({
        data: { contentType: 'video', mediaUrl, propertyId },
        select: {
          id: true,
        },
      });

      console.info('All file upload success fully');

      fs.promises.rm(outputFolder, { recursive: true, force: true });

      await S3.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key,
        }),
      );

      console.log('delete transcoded media file');
    } else {
      console.error(`ffmpeg exited with code ${code}`);
      console.error(`ffmpeg stderr:\\n${stderrOutput}`);

      fs.unlink(outputFolder, (err) => {
        if (err && err.code !== 'ENOENT') {
          console.error(`Error deleting incomplete output file: ${err.message}`);
        }
      });
    }
  });

  ffmpeg.on('error', (err) => {
    console.error('Failed to start ffmpeg process:', err);
  });
};

export const imageOptimize = async (
  bucketName: string,
  fileOriginalName: string,
  uniqueString: string,
  Key: string,
  res: GetObjectCommandOutput,
  propertyId: string,
  mediaId?: string,
) => {
  const fileName = fileOriginalName.concat('_', uniqueString, '.', 'webp');

  const buffer = await streamToBuffer(res.Body as ReadableStream);

  const image = await sharp(buffer)
    .webp({
      lossless: true,
      force: true,
      smartDeblock: true,
      preset: 'photo',
    })
    .toBuffer();

  const readable = Readable.from(image);

  await S3.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: 'optimize_image'.concat('/', fileName),
      Body: readable,
      ContentType: 'image/webp',
      ContentLength: image.length,
    }),
  );

  const { base64 } = await getPlaiceholder(image);

  const mediaUrl = `https://${bucketName}.s3.${env.BACKBLAZE_B2_REGION}.backblazeb2.com/optimize_image/${fileName}`;

  let idString: string;

  if (mediaId) {
    const { id } = await prisma.propertyMedia.update({
      where: { id: mediaId },
      data: { mediaUrl },
      select: {
        id: true,
      },
    });
    idString = id;
  }

  const { id } = await prisma.propertyMedia.create({
    data: { contentType: 'image', mediaUrl, propertyId, blurDataUrl: base64 },
  });

  idString = id;

  await esClient.update({
    index,
    id: propertyId,
    script: {
      lang: 'painless',
      source: `
          if(ctx._source.media==mull){
            ctx._source.media=[];
          }

          boolean found = false;

          for (int i = 0; i < ctx._source.media.size(); i++) {
            if (ctx._source.media[i].id == params.media.id) {
              ctx._source.media[i] = params.media;
              found = true;
              break;
            }
          }

          if (!found) {
            ctx._source.media.add(params.media);
          }
          `,
      params: {
        media: {
          id: idString,
          contentType: 'image',
          mediaUrl,
        },
      },
    },
    upsert: {
      media: [
        {
          id: idString,
          contentType: 'image',
          mediaUrl,
        },
      ],
    },
  });

  await S3.send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key,
    }),
  );
};
