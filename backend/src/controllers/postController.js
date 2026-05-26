import * as postService from '../services/postService.js';
import { asyncHandler } from '../lib/helpers.js';
import { createPostSchema, updatePostSchema, validate } from '../lib/validation.js';

export const getPosts = asyncHandler(async (req, res) => {
  const { page, limit, category, tag, search, featured } = req.query;
  res.json(
    await postService.listPosts({
      page,
      limit,
      category,
      tag,
      search,
      featured: featured === undefined ? undefined : featured === 'true',
    }),
  );
});

export const getPost = asyncHandler(async (req, res) => {
  const countView = req.query.view === 'true';
  res.json({ data: await postService.getPostBySlug(req.params.slug, { countView }) });
});

export const getCategories = asyncHandler(async (_req, res) => {
  res.json({ data: await postService.listCategories() });
});

export const getTags = asyncHandler(async (_req, res) => {
  res.json({ data: await postService.listTags() });
});

// ----- Admin (write) -----

export const adminGetPosts = asyncHandler(async (req, res) => {
  const { page, limit, status } = req.query;
  res.json(await postService.listPosts({ page, limit, status, includeAll: true }));
});

export const createPost = asyncHandler(async (req, res) => {
  const input = validate(createPostSchema, req.body);
  res.status(201).json({ data: await postService.createPost(input) });
});

export const updatePost = asyncHandler(async (req, res) => {
  const input = validate(updatePostSchema, req.body);
  res.json({ data: await postService.updatePost(req.params.id, input) });
});

export const deletePost = asyncHandler(async (req, res) => {
  res.json({ data: await postService.deletePost(req.params.id) });
});
