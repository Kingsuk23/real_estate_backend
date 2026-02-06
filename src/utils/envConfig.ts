import { cleanEnv, port, str } from 'envalid';

const env = cleanEnv(process.env, {
  PORT: port(),
  JWT_SECRET: str(),
  REDIS_URL: str(),
  ARCJET_KEY: str(),
  ELASTICSEARCH_ENDPOINT: str(),
  ELASTICSEARCH_API_KEY: str(),
});

export default env;
