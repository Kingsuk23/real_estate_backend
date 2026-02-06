import { z } from 'zod';
import { constructionStatusEnum, listingStatusEnum, propertyTypeEnum, purchaseTypeEnum, tourEnum } from '../generated/prisma/enums';

export const createPropertyValidateSchema = z.object({
  description: z
    .string({
      message: 'Description is required.',
    })
    .min(10, 'Description must be at least 10 characters.'),

  price: z.number('price must be a number').positive('must be greater than 0'),

  beds: z
    .number({
      message: 'Beds must be a number.',
    })
    .int('Beds must be a whole number.')
    .min(0, 'Beds cannot be negative.'),

  baths: z
    .number({
      message: 'Baths must be a number.',
    })
    .int('Baths must be a whole number.')
    .min(0, 'Baths cannot be negative.'),

  listingStatus: z.enum(listingStatusEnum, { message: "Listing status must be 'active' or 'pending'." }),

  constructionStatus: z.enum(constructionStatusEnum, { message: 'Invalid construction status' }),

  purchaseType: z.enum(purchaseTypeEnum, { message: "Purchase type must be 'sold' or 'rent'." }),

  propertyType: z.enum(propertyTypeEnum, {
    message: 'Please select a valid property type.',
  }),

  tour: z.enum(tourEnum, { message: "Tour type must be '3d' or 'open house'." }),

  listingDate: z.coerce.date({
    message: 'Listing date must be a valid date',
  }),

  buildDate: z.coerce.date({ message: 'Build date must be a valid date' }),

  lotsSize: z.number('Lot size must be a number').positive('must be greater than 0'),

  areaSize: z.number('Area size must be a number').positive('must be greater than 0'),

  address: z
    .string({
      message: 'Address is required.',
    })
    .min(5, 'Address must be at least 5 characters long.'),

  street: z
    .string({
      message: 'Street is required.',
    })
    .min(2, 'Street name must be at least 2 characters.'),

  city: z
    .string({
      message: 'City is required.',
    })
    .min(2, 'City name must be at least 2 characters.'),

  country: z
    .string({
      message: 'Country is required.',
    })
    .min(2, 'Country name must be at least 2 characters.'),

  zipcode: z.number({
    message: 'Zip code is required.',
  }),

  garage: z.number({ message: 'Garage spaces are required.' }).optional(),

  stories: z.enum(['single', 'multi'], { message: 'stories etcher single or multi' }),

  amenities: z.array(z.string()).optional(),
  features: z.array(z.string()).optional(),

  openHouse: z.string().optional(),

  lat: z.number('Latitude be a number'),
  lng: z.number('longitude must be a number'),
});

export const updatePropertyValidateSchema = createPropertyValidateSchema.partial();
