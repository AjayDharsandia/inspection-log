import express from 'express';
import cors from 'cors';
import { inspectionRouter } from './routes/inspections.js';
import { inspectionService } from './services/inspections.js';
import { ApiError, errorHandler } from './middleware/errors.js';

export function createApp(db, origin = 'http://localhost:5173') {
  const app = express();
  app.disable('x-powered-by');
  app.use(cors({ origin }));
  app.use(express.json({ limit: '64kb' }));
  app.get('/api/health', async (req, res) => {
    await db.query('SELECT 1');
    res.json({ data: { status: 'ok', database: 'connected' }, error: null });
  });
  app.use('/api/inspections', inspectionRouter(inspectionService(db)));
  app.use((req, res, next) =>
    next(new ApiError(404, 'NOT_FOUND', 'Route not found.')),
  );
  app.use(errorHandler);
  return app;
}
