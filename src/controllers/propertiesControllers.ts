import { Request, Response } from 'express';
import { createPropertyValidateSchema, updatePropertyValidateSchema } from '../validations/propertyValidators';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import { asyncHandler } from '../utils/asyncHandler';
import { prisma } from '../lib/prisma';
import { PrismaClient } from '../generated/prisma/client';
import { DefaultArgs } from '@prisma/client/runtime/client';
import esClient from '../lib/elasticSearch';
import { filterQueryValidateSchema } from '../validations/queryValidators';
import { QueryDslQueryContainer } from '@elastic/elasticsearch/lib/api/types';

const index = 'properties';

async function upsertAmenities(
  tx: Omit<PrismaClient<never, undefined, DefaultArgs>, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>,
  propertyId: string,
  amenities: string[] | undefined,
) {
  if (amenities !== undefined) {
    const existingAmenities = await tx.amenities.findMany({
      where: { name: { in: amenities } },
      select: { name: true },
    });

    const filterAmenities = amenities.filter((amenity) => !existingAmenities.some((exist) => amenity === exist.name));

    if (filterAmenities.length > 0) {
      await tx.amenities.createMany({
        data: filterAmenities.map((name) => ({ name })),
        skipDuplicates: true,
      });
    }

    const amenityRecords = await tx.amenities.findMany({
      where: { name: { in: amenities } },
      select: { id: true },
    });

    await tx.propertyAmenities.createMany({
      data: amenityRecords.map((amenity) => ({
        amenityId: amenity.id,
        propertyId,
      })),
    });
  }
}

async function upsertFeatures(
  tx: Omit<PrismaClient<never, undefined, DefaultArgs>, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>,
  propertyId: string,
  features: string[] | undefined,
) {
  if (features !== undefined) {
    const existFeatures = await tx.features.findMany({
      where: {
        name: { in: features },
      },
      select: { name: true },
    });

    const filterFeatures = features.filter((feature) => !existFeatures.some((existFeature) => feature === existFeature.name));

    if (filterFeatures.length > 0) {
      await tx.features.createMany({
        data: filterFeatures.map((feature) => ({
          name: feature,
        })),
        skipDuplicates: true,
      });
    }

    const featuresRecords = await tx.features.findMany({
      where: {
        name: { in: features },
      },
      select: { id: true },
    });

    await tx.propertyFeature.createMany({
      data: featuresRecords.map((feature) => ({
        featureId: feature.id,
        propertyId,
      })),
    });
  }
}

export const createPropertyController = asyncHandler(async (req: Request, res: Response) => {
  const {
    address,
    areaSize,
    baths,
    beds,
    buildDate,
    city,
    constructionStatus,
    country,
    description,
    listingDate,
    lat,
    lng,
    lotsSize,
    openHouse,
    price,
    propertyType,
    purchaseType,
    stories,
    street,
    tour,
    zipcode,
    amenities,
    features,
    garage,
    listingStatus,
  } = createPropertyValidateSchema.parse(req.body);

  // Todo:Bull Mq

  const property = await prisma.$transaction(async (tx) => {
    const property = await tx.properties.create({
      data: {
        agentId: req.user?.id as string,
        description,
        price,
        beds,
        baths,
        garage,
        listingStatus,
        tour,
        constructionStatus,
        purchaseType,
        propertyType,
        stories,
        listingDate,
        buildDate,
        lotsSize,
        areaSize,
        openHouse,
        address,
        city,
        country,
        street,
        zipcode,
        lat,
        lng,
      },
      select: {
        id: true,
      },
    });

    await upsertAmenities(tx, property.id, amenities);
    await upsertFeatures(tx, property.id, features);

    return property;
  });

  await esClient.index({
    index,
    id: property.id,
    body: {
      price,

      purchaseType,
      propertyType,
      listingStatus,
      tour,
      stories,

      beds,
      baths,
      garage,

      features,
      amenities,

      areaSize,
      lotSize: lotsSize,

      address,
      street,
      city,
      country,

      zipcode,

      location: {
        lat,
        lng,
      },

      listingDate,
      buildDate,
      openHouse,

      like: false,

      images: [],
    },
  });

  res.status(StatusCodes.CREATED).json({
    name: getReasonPhrase(StatusCodes.CREATED),
    message: 'Property created successfully',
    data: {
      id: property.id,
    },
  });
});

export const updatePropertyController = asyncHandler(async (req: Request, res: Response) => {
  const propertyId = req.params.id as string;

  const {
    address,
    amenities,
    areaSize,
    baths,
    beds,
    buildDate,
    city,
    constructionStatus,
    country,
    description,
    features,
    garage,
    listingDate,
    listingStatus,
    lat,
    lng,
    lotsSize,
    openHouse,
    price,
    propertyType,
    purchaseType,
    stories,
    street,
    tour,
    zipcode,
  } = updatePropertyValidateSchema.parse(req.body);

  // Todo:Bull Mq

  const updatedValues = {
    ...(address && { address }),
    ...(areaSize && { areaSize }),
    ...(listingDate && { listingDate }),
    ...(buildDate && { buildDate }),
    ...(lng && { lng }),
    ...(lat && { lat }),
    ...(baths && { baths }),
    ...(beds && { beds }),
    ...(city && { city }),
    ...(constructionStatus && { constructionStatus }),
    ...(country && { country }),
    ...(description && { description }),
    ...(garage && { garage }),
    ...(listingDate && { listingDate }),
    ...(lotsSize && { lotsSize }),
    ...(price && { price }),
    ...(propertyType && { propertyType }),
    ...(purchaseType && { purchaseType }),
    ...(stories && { stories }),
    ...(street && { street }),
    ...(tour && { tour }),
    ...(zipcode && { zipcode }),
    ...(listingStatus && { listingStatus }),
    ...(openHouse && { openHouse }),
  };

  const updateIndex = {
    ...(price && { price }),

    ...(purchaseType && { purchaseType }),
    ...(propertyType && { propertyType }),
    ...(listingStatus && { listingStatus }),
    ...(tour && { tour }),
    ...(stories && { stories }),

    ...(beds && { beds }),
    ...(baths && { baths }),
    ...(garage && { garage }),

    ...(features && { features }),
    ...(amenities && { amenities }),

    ...(areaSize && { areaSize }),
    ...(lotsSize && { lotSize: lotsSize }),

    ...(address && { address }),
    ...(street && { street }),
    ...(city && { city }),
    ...(country && { country }),

    ...(zipcode && { zipcode }),

    ...(lng != null &&
      lat != null && {
        location: { lon: lng, lat },
      }),

    ...(listingDate && { listingDate }),
    ...(buildDate && { buildDate }),
    ...(openHouse && { openHouse }),
  };

  const property = await prisma.$transaction(async (tx) => {
    const existProperty = await tx.properties.findUnique({ where: { id: propertyId, agentId: req.user?.id }, select: { id: true } });

    if (!existProperty) {
      return res.status(StatusCodes.NOT_FOUND).json({
        name: getReasonPhrase(StatusCodes.NOT_FOUND),
        message: `Property with ID ${propertyId} not found`,
      });
    }

    const updateProperty = await tx.properties.update({ where: { id: propertyId }, data: updatedValues, select: { id: true } });

    if (amenities) {
      const isExistAmenities = await tx.propertyAmenities.findMany({
        where: {
          propertyId,
        },
        select: { propertyId: true },
      });

      if (isExistAmenities?.length) {
        await tx.propertyAmenities.deleteMany({
          where: {
            propertyId,
          },
        });
      }

      await upsertAmenities(tx, propertyId, amenities);
    }

    if (features) {
      const isExistFeature = await tx.propertyFeature.findMany({
        where: {
          propertyId,
        },
        select: { propertyId: true },
      });

      if (isExistFeature?.length) {
        await tx.propertyFeature.deleteMany({
          where: {
            propertyId,
          },
        });
      }

      await upsertFeatures(tx, propertyId, features);
    }

    return updateProperty;
  });
  await esClient.update({
    index,
    id: propertyId,
    doc: updateIndex,
  });

  res.status(StatusCodes.OK).json({
    name: getReasonPhrase(StatusCodes.OK),
    message: 'Property updated successfully',
    data: { ...property },
  });
});

export const deletePropertyController = asyncHandler(async (req: Request, res: Response) => {
  const propertyId = req.params.id as string;

  await prisma.$transaction(async (tx) => {
    const existProperty = await tx.properties.findUnique({ where: { id: propertyId, agentId: req.user?.id }, select: { id: true } });

    if (!existProperty) {
      return res.status(StatusCodes.NOT_FOUND).json({
        name: getReasonPhrase(StatusCodes.NOT_FOUND),
        message: `Property with ID ${propertyId} not found`,
      });
    }

    await tx.propertyFeature.deleteMany({ where: { propertyId } });
    await tx.propertyAmenities.deleteMany({ where: { propertyId } });

    await tx.properties.delete({ where: { id: propertyId } });
  });

  await esClient.delete({
    index,
    id: propertyId,
  });

  res.status(StatusCodes.OK).json({
    name: getReasonPhrase(StatusCodes.OK),
    message: 'Property delete successfully',
  });
});

export const getPropertyById = asyncHandler(async (req: Request, res: Response) => {
  const propertyId = req.params.id as string;

  await prisma.$transaction(async (tx) => {
    const property = await tx.properties.findUnique({
      where: { id: propertyId },
      include: {
        features: { select: { feature: { select: { name: true } } } },
        amenities: { select: { amenity: { select: { name: true } } } },
      },
    });

    if (!property) {
      return res.status(StatusCodes.NOT_FOUND).json({
        name: getReasonPhrase(StatusCodes.NOT_FOUND),
        message: `Property with ID ${propertyId} not found`,
      });
    }

    res.status(StatusCodes.OK).json({
      name: getReasonPhrase(StatusCodes.OK),
      message: 'Property fetch successfully',
      data: {
        ...property,
      },
    });
  });
});

export const getPropertyByUserID = asyncHandler(async (req: Request, res: Response) => {
  await prisma.$transaction(async (tx) => {
    const property = await tx.properties.findMany({
      where: { agentId: req.user?.id },
      include: {
        features: { select: { feature: { select: { name: true } } } },
        amenities: { select: { amenity: { select: { name: true } } } },
      },
    });

    res.status(StatusCodes.OK).json({
      name: getReasonPhrase(StatusCodes.OK),
      message: 'Property fetch successfully',
      data: {
        ...property,
      },
    });
  });
});

export const getProperties = asyncHandler(async (req: Request, res: Response) => {
  const {
    amenities,
    areaSize,
    baths,
    beds,
    buildDate,
    features,
    garage,
    lat,
    listingDate,
    listingStatus,
    lng,
    lotsSize,
    price,
    propertyType,
    purchaseType,
    searchText,
    stories,
    tour,
    page,
  } = filterQueryValidateSchema.parse(req.query);

  const must: QueryDslQueryContainer[] = [];
  const filter: QueryDslQueryContainer[] = [];

  if (searchText) {
    must.push({
      multi_match: {
        query: searchText,
        fields: ['city', 'zipcode', 'address', 'street', 'country'],
      },
    });
  }

  if (beds) filter.push({ term: { beds } });
  if (baths) filter.push({ term: { baths } });
  if (stories) filter.push({ term: { stories } });
  if (tour) filter.push({ term: { tour } });
  if (purchaseType) filter.push({ term: { purchaseType } });
  if (propertyType) filter.push({ term: { propertyType } });
  if (listingStatus) filter.push({ term: { listingStatus } });

  if (lotsSize) {
    filter.push({
      range: {
        lotsSize: {
          ...(lotsSize.lt && { lt: lotsSize.lt }),
          ...(lotsSize.lte && { lte: lotsSize.lte }),
          ...(lotsSize.gt && { gt: lotsSize.gt }),
          ...(lotsSize.gte && { gte: lotsSize.gte }),
        },
      },
    });
  }

  if (areaSize) {
    filter.push({
      range: {
        areaSize: {
          ...(areaSize.lt && { lt: areaSize.lt }),
          ...(areaSize.lte && { lte: areaSize.lte }),
          ...(areaSize.gt && { gt: areaSize.gt }),
          ...(areaSize.gte && { gte: areaSize.gte }),
        },
      },
    });
  }

  if (garage) {
    filter.push({
      range: {
        garage: {
          ...(garage.lt && { lt: garage.lt }),
          ...(garage.lte && { lte: garage.lte }),
          ...(garage.gt && { gt: garage.gt }),
          ...(garage.gte && { gte: garage.gte }),
        },
      },
    });
  }

  if (price) {
    filter.push({
      range: {
        price: {
          ...(price.lt && { lt: price.lt }),
          ...(price.lte && { lte: price.lte }),
          ...(price.gt && { gt: price.gt }),
          ...(price.gte && { gte: price.gte }),
        },
      },
    });
  }

  if (buildDate) {
    filter.push({
      range: {
        buildDate: {
          lte: `now-${buildDate}y/y`,
        },
      },
    });
  }

  if (listingDate) {
    filter.push({
      range: {
        listingDate: {
          lte: `now-${listingDate}y/y`,
        },
      },
    });
  }

  if (amenities?.length) {
    filter.push({
      terms: { amenities },
    });
  }

  if (features?.length) {
    filter.push({
      terms: { features },
    });
  }

  if (lat != null && lng != null) {
    filter.push({
      geo_distance: {
        distance: '5km',
        location: {
          lat,
          lon: lng,
        },
      },
    });
  }

  const value = await esClient.search({
    index,
    from: !page ? 0 : page,
    size: 30,
    query: {
      bool: {
        must,
        filter,
      },
    },
  });

  res.status(StatusCodes.OK).json({
    name: getReasonPhrase(StatusCodes.OK),
    message: 'properties fetched successfully',
    data: value.hits.hits,
  });
});
