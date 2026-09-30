import { Router } from 'express';
import {
  createInput,
  listInput,
  resolutionInput,
  identifier,
} from '../validators/inspections.js';
export function inspectionRouter(service) {
  const router = Router();
  const send = (res, data, status = 200) =>
    res.status(status).json({ data, error: null });
  router.get('/summary', async (req, res) =>
    send(res, await service.summary()),
  );
  router.get('/', async (req, res) =>
    send(res, await service.list(listInput(req.query))),
  );
  router.post('/', async (req, res) =>
    send(res, await service.create(createInput(req.body)), 201),
  );
  router.get('/:id', async (req, res) =>
    send(res, await service.get(identifier(req.params.id))),
  );
  router.patch('/:id/resolve', async (req, res) =>
    send(
      res,
      await service.resolve(
        identifier(req.params.id),
        resolutionInput(req.body),
      ),
    ),
  );
  return router;
}
