type ValidationResult = { valid: boolean };

export function validate(schema: unknown, data: unknown): ValidationResult {
  const schemaObj = schema as Record<string, (...args: unknown[]) => unknown>;

  if (typeof schemaObj.safeParse === 'function') {
    const result = schemaObj.safeParse(data) as { success: boolean };
    return { valid: result.success };
  }

  if (typeof schemaObj.validate === 'function') {
    const result = schemaObj.validate(data) as { error?: unknown };
    return { valid: !result.error };
  }

  throw new Error('Unknown schema type');
}
