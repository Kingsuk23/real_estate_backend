import 'dotenv/config';
import app from './app';
import env from './utils/envConfig';
import { errorHandler } from './utils/Errorhandler';
import esClient from './lib/elasticSearch';
import { createMapping, propertiesMapping } from './utils/elasticSearchConfig';

(async function () {
  try {
    await esClient.ping();
    console.log('Elastic Search Connect SuccessFully');
  } catch (err) {
    console.error('Error connecting to Elasticsearch:', err);
  }
})();

const bootstrap = async () => {
  const index = 'properties';

  const exists = await esClient.indices.exists({ index });
  console.log(exists);

  if (!exists) {
    await createMapping(index, propertiesMapping);
    console.log('Properties index created');
  }
};

bootstrap();

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
