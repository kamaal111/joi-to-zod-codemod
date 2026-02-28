import { describe, test, expect } from 'vitest';

import { userSchema } from './schemas';
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
