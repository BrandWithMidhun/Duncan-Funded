import { z } from 'zod';

const STATUS = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

export const createPostSchema = z.object({
  title: z.string().min(3).max(200),
  excerpt: z.string().min(10).max(400),
  content: z.string().min(20),
  coverImage: z.string().url().optional().nullable(),
  status: z.enum(STATUS).optional(),
  featured: z.boolean().optional(),
  categoryName: z.string().min(2).max(80).optional().nullable(),
  tags: z.array(z.string().min(1).max(40)).max(12).optional(),
  authorName: z.string().min(2).max(120).optional().nullable(),
  metaTitle: z.string().max(200).optional().nullable(),
  metaDescription: z.string().max(320).optional().nullable(),
  ogImage: z.string().url().optional().nullable(),
  canonicalUrl: z.string().url().optional().nullable(),
  publishedAt: z.string().datetime().optional().nullable(),
});

export const updatePostSchema = createPostSchema.partial();

export const subscriberSchema = z.object({
  email: z.string().email().max(200),
  source: z.string().max(60).optional(),
});

export const contactSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  message: z.string().min(10).max(4000),
});

/** Parse a request body against a schema, throwing a 400 ApiError on failure. */
export function validate(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const details = result.error.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    const err = new Error('Validation failed');
    err.status = 400;
    err.details = details;
    throw err;
  }
  return result.data;
}
