import { Client } from '@elastic/elasticsearch';
import env from '../utils/envConfig';

const esClient = new Client({
  node: env.ELASTICSEARCH_ENDPOINT,
  auth: {
    apiKey: env.ELASTICSEARCH_API_KEY,
  },
});

export default esClient;
