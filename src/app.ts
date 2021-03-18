import 'reflect-metadata';
import express, { NextFunction, Request, Response } from 'express';
import createConnection from './database';
import { router } from './routes';
import { AppError } from './errors/AppError';
import 'express-async-errors';

createConnection();
const app = express();

app.use(express.json());
app.use(router);

app.use((err: Error, request: Request, response: Response, _next: NextFunction) => {
    if (err instanceof AppError)
        return response.status(err.statusCode).json(err.message);
    return response.status(500).json({ status: 'Error', message: `Internal server Error ${err.message}` });
});

export { app }