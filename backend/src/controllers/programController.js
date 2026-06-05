import * as programService from '../services/programService.js';
import { asyncHandler } from '../lib/helpers.js';

export const listPublic = asyncHandler(async (_req, res) => {
  res.json({ data: await programService.listPrograms() });
});

export const adminList = asyncHandler(async (_req, res) => {
  res.json({ data: await programService.listPrograms() });
});

export const adminGet = asyncHandler(async (req, res) => {
  const p = await programService.getProgram(req.params.id);
  if (!p) return res.status(404).json({ error: 'Program not found' });
  res.json({ data: p });
});

export const adminCreate = asyncHandler(async (req, res) => {
  const p = await programService.createProgram(req.body || {});
  res.status(201).json({ message: 'Program created.', data: p });
});

export const adminUpdate = asyncHandler(async (req, res) => {
  const p = await programService.updateProgram(req.params.id, req.body || {});
  res.json({ message: 'Program updated.', data: p });
});

export const adminDelete = asyncHandler(async (req, res) => {
  await programService.deleteProgram(req.params.id);
  res.json({ message: 'Program deleted.' });
});
