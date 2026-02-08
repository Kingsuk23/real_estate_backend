import { ChildProcessWithoutNullStreams, spawn } from 'child_process';

export const createTranscodeStream = (outputFolder: string): ChildProcessWithoutNullStreams => {
  const ffmpegArgs = [
    '-i',
    'pipe:0',

    '-map_metadata',
    '-1',
    '-map_chapters',
    '-1',

    '-filter_complex',
    '[0:v]split=4[v360][v480][v720][v1080];' +
      '[v360]scale=640:360[v360out];' +
      '[v480]scale=854:480[v480out];' +
      '[v720]scale=1280:720[v720out];' +
      '[v1080]scale=1920:1080[v1080out]',

    '-map',
    '[v360out]',
    '-map',
    '0:a:0',
    '-map',
    '[v480out]',
    '-map',
    '0:a:0',
    '-map',
    '[v720out]',
    '-map',
    '0:a:0',
    '-map',
    '[v1080out]',
    '-map',
    '0:a:0',

    '-c:v',
    'libx264',
    '-preset',
    'slow',
    '-c:a',
    'aac',
    '-ac',
    '2',
    '-ar',
    '48000',
    '-profile:a',
    'aac_low',

    '-b:v:0',
    '800k',
    '-b:a:0',
    '96k',
    '-b:v:1',
    '1400k',
    '-b:a:1',
    '160k',
    '-b:v:2',
    '2800k',
    '-b:a:2',
    '128k',
    '-b:v:3',
    '5000k',
    '-b:a:3',
    '192k',

    '-f',
    'hls',
    '-hls_time',
    '-hls_flags',
    'independent_segments',
    '10',
    '-hls_playlist_type',
    'vod',
    '-hls_segment_filename',
    `${outputFolder}/v%v/segment%03d.ts`,

    '-var_stream_map',
    'v:0,a:0 v:1,a:1 v:2,a:2 v:3,a:3',

    '-master_pl_name',
    'master.m3u8',
    `${outputFolder}/v%v/index.m3u8`,
  ];

  const ffmpeg = spawn('ffmpeg', ffmpegArgs);

  return ffmpeg;
};
