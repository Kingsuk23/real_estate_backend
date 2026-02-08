import { cleanEnv, port, str } from 'envalid';

const env = cleanEnv(process.env, {
  PORT: port(),
  JWT_SECRET: str(),
  REDIS_URL: str(),
  ARCJET_KEY: str(),
  ELASTICSEARCH_ENDPOINT: str(),
  ELASTICSEARCH_API_KEY: str(),
  BACKBLAZE_B2_API_KEY: str(),
  BACKBLAZE_B2_ENDPOINT: str(),
  BACKBLAZE_B2_REGION: str(),
  BACKBLAZE_B2_BUCKET_NAME: str(),
  BACKBLAZE_B2_KEY_ID: str(),
});

export default env;
