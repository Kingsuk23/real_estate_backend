import { cleanEnv, port, str } from 'envalid';

const env = cleanEnv(process.env, {
  PORT: port(),
  OPTIMIZE_API_KEY: str(),
  JWT_SECRET: str(),
  REDIS_URL: str(),
  ARCJET_KEY: str(),
});

export default env;
