import { describe, it, expect } from 'vitest';
import {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  ValidationError,
} from '../../src/errors/app-error';

describe('AppError Hierarchy', () => {
  it('should instantiate base AppError with defaults', () => {
    const error = new AppError('Something failed');
    expect(error.message).toBe('Something failed');
    expect(error.statusCode).toBe(400);
    expect(error.errorCode).toBe('BAD_REQUEST');
    expect(error.details).toBeNull();
  });

  it('should instantiate NotFoundError with 404', () => {
    const error = new NotFoundError('Item not found');
    expect(error.statusCode).toBe(404);
    expect(error.errorCode).toBe('NOT_FOUND');
    expect(error.message).toBe('Item not found');
  });

  it('should instantiate UnauthorizedError with 401', () => {
    const error = new UnauthorizedError();
    expect(error.statusCode).toBe(401);
    expect(error.errorCode).toBe('UNAUTHORIZED');
  });

  it('should instantiate ForbiddenError with 403', () => {
    const error = new ForbiddenError();
    expect(error.statusCode).toBe(403);
    expect(error.errorCode).toBe('FORBIDDEN');
  });

  it('should instantiate ConflictError with 409', () => {
    const error = new ConflictError('Duplicate key');
    expect(error.statusCode).toBe(409);
    expect(error.errorCode).toBe('CONFLICT');
  });

  it('should instantiate ValidationError with 422 and details', () => {
    const details = { field: 'weightKg', issue: 'Must be positive' };
    const error = new ValidationError('Invalid payload', details);
    expect(error.statusCode).toBe(422);
    expect(error.errorCode).toBe('VALIDATION_ERROR');
    expect(error.details).toEqual(details);
  });
});
