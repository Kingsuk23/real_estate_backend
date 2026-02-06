import { Router } from 'express';
import { validateInput } from '../middlewares/validateInput';
import authUser from '../middlewares/authUser';
import { ensureUserExists } from '../middlewares/ensureUserExists';
import checkPermission from '../middlewares/permission';
import { createPropertyValidateSchema, updatePropertyValidateSchema } from '../validations/propertyValidators';
import {
  createPropertyController,
  deletePropertyController,
  updatePropertyController,
  getPropertyById,
  getPropertyByUserID,
  getProperties,
} from '../controllers/propertiesControllers';
import { validateQuery } from '../middlewares/validateQuery';
import { filterQueryValidateSchema } from '../validations/queryValidators';

const route = Router();

route
  .get('/search', validateQuery(filterQueryValidateSchema), getProperties)
  .post('/', authUser, ensureUserExists, checkPermission('create_record'), validateInput(createPropertyValidateSchema), createPropertyController)
  .get('/', authUser, ensureUserExists, checkPermission('read_record'), getPropertyByUserID)
  .put('/:id', authUser, ensureUserExists, checkPermission('update_record'), validateInput(updatePropertyValidateSchema), updatePropertyController)
  .delete('/:id', authUser, ensureUserExists, checkPermission('delete_record'), deletePropertyController)
  .get('/:id', getPropertyById);

export default route;
