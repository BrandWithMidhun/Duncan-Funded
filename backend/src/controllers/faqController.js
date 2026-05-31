import * as faqService from '../services/faqService.js';
import { asyncHandler } from '../lib/helpers.js';

// Public — used by the homepage FAQ section and /faq page
export const listPublic = asyncHandler(async (_req, res) => {
  res.json({ data: await faqService.listCategoriesWithItems() });
});

// Admin
export const adminList = asyncHandler(async (_req, res) => {
  res.json({ data: await faqService.adminListCategoriesWithItems() });
});

export const createCategory = asyncHandler(async (req, res) => {
  const cat = await faqService.createCategory(req.body || {});
  res.status(201).json({ message: 'Category created.', data: cat });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const cat = await faqService.updateCategory(req.params.id, req.body || {});
  res.json({ message: 'Category updated.', data: cat });
});

export const deleteCategory = asyncHandler(async (req, res) => {
  await faqService.deleteCategory(req.params.id);
  res.json({ message: 'Category deleted.' });
});

export const createItem = asyncHandler(async (req, res) => {
  const item = await faqService.createItem(req.body || {});
  res.status(201).json({ message: 'Question created.', data: item });
});

export const updateItem = asyncHandler(async (req, res) => {
  const item = await faqService.updateItem(req.params.id, req.body || {});
  res.json({ message: 'Question updated.', data: item });
});

export const deleteItem = asyncHandler(async (req, res) => {
  await faqService.deleteItem(req.params.id);
  res.json({ message: 'Question deleted.' });
});
