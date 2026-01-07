/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from 'vitest';
import { handler } from './verify';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';

describe('Auth Verify Handler', () => {
  it('returns user identity when JWT claims are present', async () => {
    const mockEvent = {
      requestContext: {
        authorizer: {
          jwt: {
            claims: {
              sub: 'test-user-123',
              email: 'test@example.com',
            },
          },
        },
      },
    } as unknown as APIGatewayProxyEventV2;

    const response = await handler(mockEvent);

    expect((response as any).statusCode).toBe(200);
    const body = JSON.parse((response as any).body as string);
    expect(body.userId).toBe('test-user-123');
    expect(body.email).toBe('test@example.com');
    expect(body.message).toBe('Authentication verified successfully');
  });

  it('returns 401 when user ID is missing', async () => {
    const mockEvent = {
      requestContext: {
        authorizer: {
          jwt: {
            claims: {},
          },
        },
      },
    } as unknown as APIGatewayProxyEventV2;

    const response = await handler(mockEvent);

    expect((response as any).statusCode).toBe(401);
    const body = JSON.parse((response as any).body as string);
    expect(body.error).toBe('Unauthorized - missing user identity');
  });

  it('returns 401 when authorizer context is missing', async () => {
    const mockEvent = {
      requestContext: {},
    } as unknown as APIGatewayProxyEventV2;

    const response = await handler(mockEvent);

    expect((response as any).statusCode).toBe(401);
  });
});
