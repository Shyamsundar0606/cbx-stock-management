import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { openDatabase } from './database/db';
import { ApiError } from './controllers/productController';
import { registerProductRoutes } from './routes/productRoutes';

export function createApp(path?: string, seed = true) {
  const db = openDatabase(path, seed);
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '32kb' }));
  registerProductRoutes(app, db);
  app.use((_req, _res, next) => next(new ApiError(404, 'Endpoint not found.')));
  app.use((error: Error & { type?: string }, _req: Request, res: Response, _next: NextFunction) => {
    if (error instanceof ApiError) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    if (error.message.includes('UNIQUE constraint failed')) {
      res.status(409).json({ message: 'A product with this reference already exists.' });
      return;
    }
    if (['entity.parse.failed', 'entity.too.large'].includes(error.type || '')) {
      res.status(400).json({ message: 'The JSON request is invalid or too large.' });
      return;
    }
    console.error(error);
    res.status(500).json({ message: 'Something went wrong on the server.' });
  });
  return { app, db };
}
