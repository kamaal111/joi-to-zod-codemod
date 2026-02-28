import Joi from 'joi';

export const userSchema = Joi.object().keys({
  name: Joi.string().min(2).max(50).required(),
  age: Joi.number().integer().min(0).max(150),
  email: Joi.string().required(),
});

export const configSchema = Joi.object().pattern(Joi.string(), Joi.number());

export enum MemberStatus {
  Active = 'active',
  Inactive = 'inactive',
  Pending = 'pending',
}

// articleSchema covers: boolean, uri, guid, isoDate, array of items,
// nullable (allow null), description, and number greater/less validations.
export const articleSchema = Joi.object().keys({
  id: Joi.string().guid().required(),
  title: Joi.string().min(1).max(200).required(),
  url: Joi.string().uri().required(),
  isPublished: Joi.boolean().required(),
  publishedAt: Joi.string().isoDate().required(),
  tags: Joi.array().items(Joi.string()).required(),
  rating: Joi.number().greater(0).less(10),
  notes: Joi.string().allow(null),
  summary: Joi.string().description('A brief summary of the article'),
});

// memberSchema covers: alternatives/try (union), valid/enum via a TypeScript enum (optional),
// and valid/enum with .required() (both spread and literal forms).
export const memberSchema = Joi.object().keys({
  id: Joi.alternatives().try(Joi.string(), Joi.number()).required(),
  name: Joi.string().min(1).required(),
  status: Joi.string().valid(...Object.values(MemberStatus)).required(),
  role: Joi.string().valid('admin', 'editor', 'viewer').required(),
  preferredTheme: Joi.string().valid('light', 'dark'),
});

// addressSchema and orderItemSchema are sub-schemas used inside orderSchema to
// demonstrate complex nested schema composition.
const addressSchema = Joi.object().keys({
  street: Joi.string().min(5).required(),
  city: Joi.string().min(3).required(),
  postalCode: Joi.string().alphanum().required(),
});

const orderItemSchema = Joi.object().keys({
  productId: Joi.string().min(8).required(),
  quantity: Joi.number().integer().min(1).required(),
  unitPrice: Joi.number().greater(0).required(),
});

// orderSchema is a complex schema that composes addressSchema and orderItemSchema,
// demonstrates pattern-to-record, and mixes required, optional, and nullable fields.
export const orderSchema = Joi.object().keys({
  orderId: Joi.string().min(10).max(36).required(),
  customerId: Joi.string().min(2).required(),
  items: Joi.array().items(orderItemSchema).required(),
  shippingAddress: addressSchema,
  discount: Joi.number().min(0).max(100).allow(null),
  metadata: Joi.object().pattern(Joi.string(), Joi.string()),
});
