import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { prisma } from '../lib/prisma';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';
import esClient from '../lib/elasticSearch';

const index = 'properties';

export const likeProperty = asyncHandler(async (req: Request, res: Response) => {
  const propertyId = req.params?.id as string;

  await prisma.$transaction(async (tx) => {
    const existLike = await tx.likedProperty.findUnique({
      where: {
        propertyId,
      },
      select: { id: true },
    });

    if (existLike) {
      await tx.likedProperty.delete({
        where: {
          propertyId,
        },
      });

      await esClient.update({
        index,
        id: propertyId,
        doc: { like: false },
      });

      return res.status(StatusCodes.OK).json({
        name: getReasonPhrase(StatusCodes.OK),
        message: 'Property liked remove successfully',
      });
    }

    await tx.likedProperty.create({
      data: {
        propertyId,
        userId: req.user?.id as string,
      },
    });

    await esClient.update({
      index,
      id: propertyId,
      doc: { like: true },
    });

    return res.status(StatusCodes.OK).json({
      name: getReasonPhrase(StatusCodes.OK),
      message: 'Property liked successfully',
    });
  });
});
