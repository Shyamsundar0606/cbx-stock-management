import { ProductInput } from '../models/Product';

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

export function isValidQuantity(value: unknown, minimum = 0): value is number {
  return (
    typeof value === 'number' &&
    Number.isSafeInteger(value) &&
    value >= minimum &&
    value <= 1_000_000
  );
}

function requiredText(body: Record<string, unknown>, field: string): string {
  const value = body[field];
  if (typeof value !== 'string' || !value.trim() || value.trim().length > 100) {
    throw new ApiError(400, `${field} is required and must be 100 characters or fewer.`);
  }
  return value.trim();
}

export function validateProduct(body: Record<string, unknown>): ProductInput {
  const name = requiredText(body, 'name');
  const reference = requiredText(body, 'reference');
  const category = requiredText(body, 'category');
  const description = body.description === undefined ? '' : body.description;

  if (typeof description !== 'string' || description.length > 2_000) {
    throw new ApiError(400, 'Description must be text and no longer than 2,000 characters.');
  }
  if (!isValidQuantity(body.quantity) || !isValidQuantity(body.threshold)) {
    throw new ApiError(400, 'Quantity and threshold must be whole numbers from 0 to 1,000,000.');
  }

  return {
    name,
    reference,
    category,
    description: description.trim(),
    quantity: body.quantity,
    threshold: body.threshold,
  };
}
