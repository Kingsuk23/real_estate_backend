import { z } from 'zod';

export const filterQueryValidateSchema = z.object({
  price: z
    .object({
      lt: z.coerce.number().positive().optional(),
      lte: z.coerce.number().positive().optional(),
      gt: z.coerce.number().positive().optional(),
      gte: z.coerce.number().positive().optional(),
    })
    .optional(),
  lotsSize: z
    .object({
      lt: z.coerce.number().positive().optional(),
      lte: z.coerce.number().positive().optional(),
      gt: z.coerce.number().positive().optional(),
      gte: z.coerce.number().positive().optional(),
    })
    .optional(),
  areaSize: z
    .object({
      lt: z.coerce.number().positive().optional(),
      lte: z.coerce.number().positive().optional(),
      gt: z.coerce.number().positive().optional(),
      gte: z.coerce.number().positive().optional(),
    })
    .optional(),
  garage: z
    .object({
      lt: z.coerce.number().positive().optional(),
      lte: z.coerce.number().positive().optional(),
      gt: z.coerce.number().positive().optional(),
      gte: z.coerce.number().positive().optional(),
    })
    .optional(),

  listingStatus: z.string().optional(),
  purchaseType: z.string().optional(),
  propertyType: z.string().optional(),
  tour: z.string().optional(),
  stories: z.string().optional(),
  searchText: z.string().optional(),

  beds: z.coerce.number().int().min(0).optional(),
  baths: z.coerce.number().int().min(0).optional(),
  listingDate: z.coerce.number().positive().optional(),
  buildDate: z.coerce.number().positive().optional(),
  lat: z.coerce.number().optional(),
  lng: z.coerce.number().optional(),

  amenities: z
    .union([z.string(), z.array(z.string())])
    .transform((v) => (Array.isArray(v) ? v : v.split(',')))
    .optional(),
  features: z
    .union([z.string(), z.array(z.string())])
    .transform((v) => (Array.isArray(v) ? v : v.split(',')))
    .optional(),

  page: z.coerce.number().positive().optional(),
});
