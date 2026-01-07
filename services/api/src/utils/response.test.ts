import { describe, it, expect } from 'vitest';
import { success, error } from './response';

describe('Response Utilities', () => {
  describe('success', () => {
    it('returns 200 status code by default', () => {
      const response = success({ message: 'test' });

      expect(response.statusCode).toBe(200);
    });

    it('includes JSON content type header', () => {
      const response = success({ data: 'test' });

      expect(response.headers?.['Content-Type']).toBe('application/json');
    });

    it('includes CORS header', () => {
      const response = success({ data: 'test' });

      expect(response.headers?.['Access-Control-Allow-Origin']).toBe('*');
    });

    it('serializes data to JSON in body', () => {
      const data = { userId: '123', email: 'test@example.com' };
      const response = success(data);

      expect(response.body).toBe(JSON.stringify(data));
    });

    it('accepts custom status code', () => {
      const response = success({ message: 'created' }, 201);

      expect(response.statusCode).toBe(201);
    });
  });

  describe('error', () => {
    it('returns 500 status code by default', () => {
      const response = error('Internal error');

      expect(response.statusCode).toBe(500);
    });

    it('includes error message in body', () => {
      const response = error('Something went wrong');
      const body = JSON.parse(response.body as string);

      expect(body.error).toBe('Something went wrong');
    });

    it('includes status code in body', () => {
      const response = error('Not found', 404);
      const body = JSON.parse(response.body as string);

      expect(body.statusCode).toBe(404);
    });

    it('accepts custom status code', () => {
      const response = error('Unauthorized', 401);

      expect(response.statusCode).toBe(401);
    });

    it('includes CORS headers', () => {
      const response = error('Error');

      expect(response.headers?.['Access-Control-Allow-Origin']).toBe('*');
    });
  });
});
