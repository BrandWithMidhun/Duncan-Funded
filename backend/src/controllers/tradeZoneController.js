import * as svc from '../services/tradeZoneService.js';
import { asyncHandler } from '../lib/helpers.js';

/** Public — enabled tools only. */
export const listPublic = asyncHandler(async (_req, res) => {
  res.json({ data: await svc.listPublic() });
});

/** Public — single tool by slug for the /trade-zone/<slug> detail page. */
export const getBySlug = asyncHandler(async (req, res) => {
  res.json({ data: await svc.getBySlug(req.params.slug) });
});

/** Admin endpoints. */
export const listAll = asyncHandler(async (_req, res) => {
  res.json({ data: await svc.listAll() });
});

export const getOne = asyncHandler(async (req, res) => {
  res.json({ data: await svc.getById(req.params.id) });
});

export const create = asyncHandler(async (req, res) => {
  res.status(201).json({ data: await svc.create(req.body || {}) });
});

export const update = asyncHandler(async (req, res) => {
  res.json({ data: await svc.update(req.params.id, req.body || {}) });
});

export const remove = asyncHandler(async (req, res) => {
  res.json({ data: await svc.remove(req.params.id) });
});
