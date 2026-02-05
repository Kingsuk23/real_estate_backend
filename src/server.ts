import 'dotenv/config';
import app from './app';
import env from './utils/envConfig';

app.listen(env.PORT, () => {
  console.log(`server start at http://localhost:${env.PORT}`);
});
