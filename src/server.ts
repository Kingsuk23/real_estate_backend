import 'dotenv/config';
import app from './app';
import env from './utils/envConfig';
import { errorHandler } from './utils/Errorhandler';

process.on('unhandledRejection', (reason: Error) => {
  console.error('UNHANDLED REJECTION ❌');
  console.error(reason);
  throw reason;
});

process.on('uncaughtException', (err: Error) => {
  console.error('UNCAUGHT EXCEPTION ❌');
  console.error(err);
  errorHandler.handleError(err);
  if (!errorHandler.isTrustedError(err)) {
    process.exit(1);
  }
});

app.listen(env.PORT, () => {
  console.log(`server start at http://localhost:${env.PORT}`);
});
