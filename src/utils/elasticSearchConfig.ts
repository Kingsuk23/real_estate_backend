import { MappingTypeMapping } from '@elastic/elasticsearch/lib/api/types';
import esClient from '../lib/elasticSearch';

export const createMapping = async (index: string, mappings: MappingTypeMapping) => {
  await esClient.indices.create({
    index,
    mappings,
  });
};

export const propertiesMapping: MappingTypeMapping = {
  properties: {
    price: { type: 'scaled_float', scaling_factor: 100 },

    purchaseType: { type: 'keyword' },
    propertyType: { type: 'keyword' },
    listingStatus: { type: 'keyword' },
    tour: { type: 'keyword' },
    stories: { type: 'keyword' },

    beds: { type: 'integer' },
    baths: { type: 'integer' },
    garage: { type: 'integer' },

    features: { type: 'keyword' },
    amenities: { type: 'keyword' },

    areaSize: { type: 'float' },
    lotSize: { type: 'float' },

    address: {
      type: 'text',
      fields: { keyword: { type: 'keyword' } },
      copy_to: 'semantic_field',
    },
    street: {
      type: 'text',
      fields: { keyword: { type: 'keyword' } },
      copy_to: 'semantic_field',
    },
    city: {
      type: 'text',
      fields: { keyword: { type: 'keyword' } },
      copy_to: 'semantic_field',
    },
    country: {
      type: 'text',
      fields: { keyword: { type: 'keyword' } },
      copy_to: 'semantic_field',
    },

    zipcode: { type: 'keyword' },

    location: { type: 'geo_point' },

    listingDate: { type: 'date' },
    buildDate: { type: 'date' },
    openHouse: { type: 'date' },

    images: { type: 'keyword' },

    semantic_field: { type: 'text' },
  },
};
