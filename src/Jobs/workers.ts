import { redisClient } from '../lib/redisDb';
import { Job, Worker } from 'bullmq';
import env from '../utils/envConfig';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { GetObjectCommand, S3ServiceException } from '@aws-sdk/client-s3';
import { S3 } from '../utils/s3Config';
import { imageOptimize, videoTranscode } from '../utils/helper';

const mediaOptimizerWorker = new Worker(
  'media-optimizer',
  async (job: Job<{ propertyId: string; mediaId?: string; Key: string }, unknown, string>) => {
    const { Key, propertyId, mediaId } = job.data;
    const bucketName = env.BACKBLAZE_B2_BUCKET_NAME;
    const parse = path.parse(Key);

    try {
      const uniqueString = uuid();
      const outputFolder = path.join(process.cwd(), 'hls-output', uniqueString);

      const res = await S3.send(
        new GetObjectCommand({
          Bucket: bucketName,
          Key,
        }),
      );
      if (res.ContentType?.startsWith('video/')) {
        videoTranscode(outputFolder, bucketName, parse.name, uniqueString, Key, res, propertyId, mediaId);
      }
      if (res.ContentType?.startsWith('image/')) {
        imageOptimize(bucketName, parse.name, uniqueString, Key, res, propertyId, mediaId);
      }
    } catch (err) {
      if (err instanceof S3ServiceException) {
        console.error('S3 error:', {
          name: err.name,
          code: err.$metadata?.httpStatusCode,
          message: err.message,
        });
      } else {
        console.error(err);
        throw err;
      }
    }
  },
  {
    connection: redisClient,
    removeOnComplete: {
      age: 3600,
      count: 1000,
    },
    removeOnFail: {
      age: 3600 * 24,
      count: 1000,
    },
    concurrency: 50,
  },
);

mediaOptimizerWorker.on('completed', (job: Job) => {
  console.info(`${job.id} is complete`);
});

mediaOptimizerWorker.on('drained', () => {
  console.info(`Queue is drained, no more jobs left `);
});

mediaOptimizerWorker.on('failed', (job: Job | undefined, error: Error, prev: string) => {
  if (!job) {
    console.error('Job failed, but job is undefined', error);
    return;
  }

  console.info(`${job.id} failed. Previous state: ${prev}`);
});
