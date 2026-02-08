import { Router } from 'express';
import authUser from '../middlewares/authUser';
import { ensureUserExists } from '../middlewares/ensureUserExists';
import { likeProperty } from '../controllers/PropertyLikeController';

const route = Router();

route.get('/:id', authUser, ensureUserExists, likeProperty);

export default route;
