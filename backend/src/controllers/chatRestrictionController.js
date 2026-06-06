import * as svc from '../services/chatRestrictionService.js';
import { describeCorePatterns } from '../services/chatCompliance.js';
import { asyncHandler } from '../lib/helpers.js';

/** GET /api/admin/chat-restrictions
 *  Returns both the locked core patterns (read-only) and the
 *  admin-editable custom restrictions. The UI renders these as
 *  two separate sections. */
export const listAll = asyncHandler(async (_req, res) => {
  const [custom] = await Promise.all([svc.listAll()]);
  res.json({
    data: {
      core: describeCorePatterns(),
      custom,
    },
  });
});

export const create = asyncHandler(async (req, res) => {
  const item = await svc.create(req.body || {});
  res.status(201).json({ data: item, message: 'Restriction added.' });
});

export const update = asyncHandler(async (req, res) => {
  const item = await svc.update(req.params.id, req.body || {});
  res.json({ data: item, message: 'Restriction updated.' });
});

export const remove = asyncHandler(async (req, res) => {
  await svc.remove(req.params.id);
  res.json({ message: 'Restriction deleted.' });
});
