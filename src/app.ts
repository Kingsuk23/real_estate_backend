import express from 'express';
import { centralizeErrorHandler } from './middlewares/centralizeErrorHandler';
import authenticationRoute from './routes/authenticationRoutes';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api/v1/auth', authenticationRoute);

app.use(centralizeErrorHandler);

export default app;
