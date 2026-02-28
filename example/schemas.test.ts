import { describe, test, expect } from 'vitest';

import { userSchema, configSchema, articleSchema, memberSchema, orderSchema } from './schemas';
import { validate } from './validate';

describe('userSchema', () => {
  test('accepts a valid user', () => {
    const result = validate(userSchema, { name: 'John', age: 30, email: 'john@example.com' });
    expect(result.valid).toBe(true);
  });

  test('rejects when required name is missing', () => {
    const result = validate(userSchema, { age: 30, email: 'john@example.com' });
    expect(result.valid).toBe(false);
  });

  test('rejects when required email is missing', () => {
    const result = validate(userSchema, { name: 'John', age: 30 });
    expect(result.valid).toBe(false);
  });

  test('accepts when optional age is missing', () => {
    const result = validate(userSchema, { name: 'John', email: 'john@example.com' });
    expect(result.valid).toBe(true);
  });

  test('rejects name shorter than minimum length', () => {
    const result = validate(userSchema, { name: 'J', age: 30, email: 'john@example.com' });
    expect(result.valid).toBe(false);
  });

  test('rejects name longer than maximum length', () => {
    const longName = 'a'.repeat(51);
    const result = validate(userSchema, { name: longName, age: 30, email: 'john@example.com' });
    expect(result.valid).toBe(false);
  });

  test('rejects non-integer age', () => {
    const result = validate(userSchema, { name: 'John', age: 25.5, email: 'john@example.com' });
    expect(result.valid).toBe(false);
  });

  test('rejects age below minimum', () => {
    const result = validate(userSchema, { name: 'John', age: -1, email: 'john@example.com' });
    expect(result.valid).toBe(false);
  });

  test('rejects age above maximum', () => {
    const result = validate(userSchema, { name: 'John', age: 151, email: 'john@example.com' });
    expect(result.valid).toBe(false);
  });

  test('rejects wrong type for name', () => {
    const result = validate(userSchema, { name: 123, age: 30, email: 'john@example.com' });
    expect(result.valid).toBe(false);
  });

  test('rejects wrong type for age', () => {
    const result = validate(userSchema, { name: 'John', age: 'thirty', email: 'john@example.com' });
    expect(result.valid).toBe(false);
  });
});

describe('configSchema', () => {
  test('accepts a valid config with string keys and number values', () => {
    const result = validate(configSchema, { timeout: 30, retries: 3 });
    expect(result.valid).toBe(true);
  });

  test('rejects when value is not a number', () => {
    const result = validate(configSchema, { timeout: 'thirty' });
    expect(result.valid).toBe(false);
  });

  test('accepts an empty config object', () => {
    const result = validate(configSchema, {});
    expect(result.valid).toBe(true);
  });
});

describe('articleSchema', () => {
  const validArticle = {
    id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    title: 'Hello World',
    url: 'https://example.com/articles/hello-world',
    isPublished: true,
    publishedAt: '2024-01-15T10:30:00.000Z',
    tags: ['typescript', 'zod'],
    rating: 8.5,
    notes: 'This is a note',
    summary: 'A brief summary',
  };

  test('accepts a valid article with all fields', () => {
    const result = validate(articleSchema, validArticle);
    expect(result.valid).toBe(true);
  });

  test('accepts a valid article with only required fields', () => {
    const result = validate(articleSchema, {
      id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      title: 'Hello World',
      url: 'https://example.com/articles/hello-world',
      isPublished: true,
      publishedAt: '2024-01-15T10:30:00.000Z',
      tags: ['typescript', 'zod'],
    });
    expect(result.valid).toBe(true);
  });

  test('rejects when required title is missing', () => {
    const result = validate(articleSchema, { ...validArticle, title: undefined });
    expect(result.valid).toBe(false);
  });

  test('rejects when url is not a valid URI', () => {
    const result = validate(articleSchema, { ...validArticle, url: 'not-a-url' });
    expect(result.valid).toBe(false);
  });

  test('rejects when id is not a valid UUID', () => {
    const result = validate(articleSchema, { ...validArticle, id: 'not-a-uuid' });
    expect(result.valid).toBe(false);
  });

  test('rejects when publishedAt is not an ISO date', () => {
    const result = validate(articleSchema, { ...validArticle, publishedAt: 'not-a-date' });
    expect(result.valid).toBe(false);
  });

  test('accepts when notes is null (nullable field)', () => {
    const result = validate(articleSchema, { ...validArticle, notes: null });
    expect(result.valid).toBe(true);
  });

  test('rejects when isPublished is not a boolean', () => {
    const result = validate(articleSchema, { ...validArticle, isPublished: 'yes' });
    expect(result.valid).toBe(false);
  });

  test('rejects rating at the lower exclusive boundary', () => {
    const result = validate(articleSchema, { ...validArticle, rating: 0 });
    expect(result.valid).toBe(false);
  });

  test('rejects rating at the upper exclusive boundary', () => {
    const result = validate(articleSchema, { ...validArticle, rating: 10 });
    expect(result.valid).toBe(false);
  });

  test('accepts rating within range', () => {
    const result = validate(articleSchema, { ...validArticle, rating: 5 });
    expect(result.valid).toBe(true);
  });

  test('rejects when tags is not an array', () => {
    const result = validate(articleSchema, { ...validArticle, tags: 'typescript' });
    expect(result.valid).toBe(false);
  });
});

describe('memberSchema', () => {
  const validMember = { id: 'member-abc', name: 'Alice', status: 'active', role: 'admin' };

  test('accepts with a string id', () => {
    const result = validate(memberSchema, validMember);
    expect(result.valid).toBe(true);
  });

  test('accepts with a number id', () => {
    const result = validate(memberSchema, { ...validMember, id: 42 });
    expect(result.valid).toBe(true);
  });

  test('rejects when required id is missing', () => {
    const result = validate(memberSchema, { name: 'Charlie', status: 'active', role: 'admin' });
    expect(result.valid).toBe(false);
  });

  test('rejects when id is not a string or number', () => {
    const result = validate(memberSchema, { ...validMember, id: {} });
    expect(result.valid).toBe(false);
  });

  test('accepts with a valid status enum value (required spread enum)', () => {
    const result = validate(memberSchema, validMember);
    expect(result.valid).toBe(true);
  });

  test('rejects when required status is missing', () => {
    const result = validate(memberSchema, { id: 'member-1', name: 'Eve', role: 'admin' });
    expect(result.valid).toBe(false);
  });

  test('rejects with an invalid status value', () => {
    const result = validate(memberSchema, { ...validMember, status: 'unknown' });
    expect(result.valid).toBe(false);
  });

  test('accepts with a valid role literal enum value (required literal enum)', () => {
    const result = validate(memberSchema, { ...validMember, role: 'editor' });
    expect(result.valid).toBe(true);
  });

  test('rejects when required role is missing', () => {
    const result = validate(memberSchema, { id: 'member-2', name: 'Bob', status: 'active' });
    expect(result.valid).toBe(false);
  });

  test('rejects with an invalid role value', () => {
    const result = validate(memberSchema, { ...validMember, role: 'superuser' });
    expect(result.valid).toBe(false);
  });

  test('accepts without preferredTheme (optional literal enum)', () => {
    const result = validate(memberSchema, validMember);
    expect(result.valid).toBe(true);
  });

  test('accepts with a valid preferredTheme value', () => {
    const result = validate(memberSchema, { ...validMember, preferredTheme: 'dark' });
    expect(result.valid).toBe(true);
  });

  test('rejects with an invalid preferredTheme value', () => {
    const result = validate(memberSchema, { ...validMember, preferredTheme: 'solarized' });
    expect(result.valid).toBe(false);
  });
});

describe('orderSchema', () => {
  const validOrder = {
    orderId: 'ORD-001-2024',
    customerId: 'CUST01',
    items: [{ productId: 'PROD-0001', quantity: 2, unitPrice: 19.99 }],
    shippingAddress: { street: '123 Main St', city: 'Springfield', postalCode: 'abc123' },
  };

  test('accepts a valid order', () => {
    const result = validate(orderSchema, validOrder);
    expect(result.valid).toBe(true);
  });

  test('rejects when required orderId is missing', () => {
    const result = validate(orderSchema, { ...validOrder, orderId: undefined });
    expect(result.valid).toBe(false);
  });

  test('rejects when required items array is missing', () => {
    const result = validate(orderSchema, { ...validOrder, items: undefined });
    expect(result.valid).toBe(false);
  });

  test('rejects when items is not an array', () => {
    const result = validate(orderSchema, { ...validOrder, items: 'not-an-array' });
    expect(result.valid).toBe(false);
  });

  test('rejects when item quantity is below minimum', () => {
    const result = validate(orderSchema, {
      ...validOrder,
      items: [{ productId: 'PROD-0001', quantity: 0, unitPrice: 19.99 }],
    });
    expect(result.valid).toBe(false);
  });

  test('rejects when item unitPrice is not greater than zero', () => {
    const result = validate(orderSchema, {
      ...validOrder,
      items: [{ productId: 'PROD-0001', quantity: 1, unitPrice: 0 }],
    });
    expect(result.valid).toBe(false);
  });

  test('accepts when discount is null (nullable field)', () => {
    const result = validate(orderSchema, { ...validOrder, discount: null });
    expect(result.valid).toBe(true);
  });

  test('rejects when discount exceeds maximum', () => {
    const result = validate(orderSchema, { ...validOrder, discount: 101 });
    expect(result.valid).toBe(false);
  });

  test('accepts with metadata as a record of strings', () => {
    const result = validate(orderSchema, { ...validOrder, metadata: { source: 'web', channel: 'email' } });
    expect(result.valid).toBe(true);
  });

  test('rejects when shipping address postalCode is not alphanumeric', () => {
    const result = validate(orderSchema, {
      ...validOrder,
      shippingAddress: { street: '123 Main St', city: 'Springfield', postalCode: 'abc-123' },
    });
    expect(result.valid).toBe(false);
  });
});
