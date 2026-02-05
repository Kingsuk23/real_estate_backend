import { Router } from 'express';
import { validateInput } from '../middlewares/validateInput';
import { login, logout, register } from '../controllers/authenticationControllers';

import authUser from '../middlewares/authUser';
import { loginValidateSchema, registerValidateSchema } from '../validations/authValidators';

const route = Router();

route.post('/reg', validateInput(registerValidateSchema), register);
route.post('/login', validateInput(loginValidateSchema), login);
route.get('/logout', authUser, logout);

export default route;
