import { cleanEnv, num, port, str } from 'envalid';

const env = cleanEnv(process.env, {
  PORT: port(),
});

export default env;
