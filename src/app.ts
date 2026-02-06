import express from 'express';
import { centralizeErrorHandler } from './middlewares/centralizeErrorHandler';
import authenticationRoute from './routes/authenticationRoutes';
import propertiesRoute from './routes/propertyRoutes';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api/v1/auth', authenticationRoute);
app.use('/api/v1/property', propertiesRoute);

app.use(centralizeErrorHandler);

export default app;
