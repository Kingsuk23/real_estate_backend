import { S3Client } from '@aws-sdk/client-s3';

import env from './envConfig';

export const S3 = new S3Client({
  endpoint: env.BACKBLAZE_B2_ENDPOINT,
  region: env.BACKBLAZE_B2_REGION,
  credentials: {
    accessKeyId: env.BACKBLAZE_B2_KEY_ID,
    secretAccessKey: env.BACKBLAZE_B2_API_KEY,
  },
});
