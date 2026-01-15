import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from './get-status';

const ddbMock = mockClient(DynamoDBDocumentClient);

describe('get-review-status handler', () => {
  beforeEach(() => {
    ddbMock.reset();
    process.env.TABLE_NAME = 'test-table';
    vi.useFakeTimers();
  });

  const createMockEvent = (userId: string): APIGatewayProxyEvent => ({
    requestContext: {
      authorizer: { claims: { sub: userId } },
    } as any,
    headers: {},
    body: null,
    isBase64Encoded: false,
    httpMethod: 'GET',
    path: '/api/review/status',
    pathParameters: null,
    queryStringParameters: null,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null,
    stageVariables: null,
    resource: '',
  });

  it('should indicate review is due when not completed this week', async () => {
    const userId = 'user-123';

    // Set to Wednesday
    vi.setSystemTime(new Date('2024-01-10T12:00:00.000Z'));

    ddbMock
      .on(GetCommand)
      .resolvesOnce({
        Item: { userId, reviewDay: 'monday', createdAt: '', updatedAt: '' },
      })
      .resolvesOnce({
        Item: {
          userId,
          lastCompletedAt: '2024-01-01T12:00:00.000Z', // Last week
          createdAt: '',
          updatedAt: '',
        },
      });

    const result = await handler(createMockEvent(userId));

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.isDue).toBe(true);
    expect(body.reviewDay).toBe('monday');
    expect(body.lastCompletedAt).toBe('2024-01-01T12:00:00.000Z');
  });

  it('should indicate review is not due when completed this week', async () => {
    const userId = 'user-123';

    // Set to Wednesday
    vi.setSystemTime(new Date('2024-01-10T12:00:00.000Z'));

    ddbMock
      .on(GetCommand)
      .resolvesOnce({
        Item: { userId, reviewDay: 'monday', createdAt: '', updatedAt: '' },
      })
      .resolvesOnce({
        Item: {
          userId,
          lastCompletedAt: '2024-01-08T12:00:00.000Z', // This Monday
          createdAt: '',
          updatedAt: '',
        },
      });

    const result = await handler(createMockEvent(userId));

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.isDue).toBe(false);
  });

  it('should handle never completed review', async () => {
    const userId = 'user-123';

    vi.setSystemTime(new Date('2024-01-10T12:00:00.000Z'));

    ddbMock
      .on(GetCommand)
      .resolvesOnce({
        Item: { userId, reviewDay: 'sunday', createdAt: '', updatedAt: '' },
      })
      .resolvesOnce({});

    const result = await handler(createMockEvent(userId));

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.isDue).toBe(true);
    expect(body.lastCompletedAt).toBeUndefined();
  });

  it('should use default review day when settings not found', async () => {
    const userId = 'user-123';

    vi.setSystemTime(new Date('2024-01-10T12:00:00.000Z'));

    ddbMock.on(GetCommand).resolvesOnce({}).resolvesOnce({});

    const result = await handler(createMockEvent(userId));

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.reviewDay).toBe('sunday'); // Default
    expect(body.isDue).toBe(true);
  });

  it('should handle different review days correctly', async () => {
    const userId = 'user-123';

    // Set to Friday
    vi.setSystemTime(new Date('2024-01-12T12:00:00.000Z'));

    ddbMock
      .on(GetCommand)
      .resolvesOnce({
        Item: { userId, reviewDay: 'friday', createdAt: '', updatedAt: '' },
      })
      .resolvesOnce({});

    const result = await handler(createMockEvent(userId));

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.isDue).toBe(true);
    expect(body.reviewDay).toBe('friday');
  });

  it('should handle missing userId', async () => {
    const event = createMockEvent('');
    event.requestContext.authorizer = { claims: {} } as any;

    const result = await handler(event);

    expect(result.statusCode).toBe(401);
  });

  it('should handle DynamoDB errors', async () => {
    const userId = 'user-123';

    ddbMock.on(GetCommand).rejects(new Error('DynamoDB error'));

    const result = await handler(createMockEvent(userId));

    expect(result.statusCode).toBe(500);
  });
});
