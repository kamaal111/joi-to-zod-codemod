import { z } from 'zod';

export const userSchema = z
  .object({
    name: z.string().min(2).max(50),
    age: z.number().int().min(0).max(150).optional(),
    email: z.string(),
  })
  .strict();

export const configSchema = z.record(z.string(), z.number()).optional();

export enum MemberStatus {
  Active = 'active',
  Inactive = 'inactive',
  Pending = 'pending',
}

// articleSchema covers: boolean, uri, guid, isoDate, array of items,
// nullable (allow null), description, and number greater/less validations.
export const articleSchema = z
  .object({
    id: z.string().uuid(),
    title: z.string().min(1).max(200),
    url: z.string().url(),
    isPublished: z.boolean(),
    publishedAt: z.string().datetime(),
    tags: z.array(z.string()),
    rating: z.number().gt(0).lt(10).optional(),
    notes: z.string().nullable().optional(),
    summary: z.string().describe('A brief summary of the article').optional(),
  })
  .strict();

// memberSchema covers: alternatives/try (union), valid/enum via a TypeScript enum (optional),
// and valid/enum with .required() (both spread and literal forms).
export const memberSchema = z
  .object({
    id: z.union([z.string(), z.number()]),
    name: z.string().min(1),
    status: z.enum([...(Object.values(MemberStatus) as [string, ...Array<string>])]),
    role: z.enum(['admin', 'editor', 'viewer'] as [string, ...Array<string>]),
    preferredTheme: z.enum(['light', 'dark'] as [string, ...Array<string>]).optional(),
  })
  .strict();

// addressSchema and orderItemSchema are sub-schemas used inside orderSchema to
// demonstrate complex nested schema composition.
const addressSchema = z
  .object({
    street: z.string().min(5),
    city: z.string().min(3),
    postalCode: z.string().regex(/^[a-z0-9]+$/),
  })
  .strict();

const orderItemSchema = z
  .object({
    productId: z.string().min(8),
    quantity: z.number().int().min(1),
    unitPrice: z.number().gt(0),
  })
  .strict();

// orderSchema is a complex schema that composes addressSchema and orderItemSchema,
// demonstrates pattern-to-record, and mixes required, optional, and nullable fields.
export const orderSchema = z
  .object({
    orderId: z.string().min(10).max(36),
    customerId: z.string().min(2),
    items: z.array(orderItemSchema),
    shippingAddress: addressSchema,
    discount: z.number().min(0).max(100).nullable().optional(),
    metadata: z.record(z.string(), z.string()).optional(),
  })
  .strict();
