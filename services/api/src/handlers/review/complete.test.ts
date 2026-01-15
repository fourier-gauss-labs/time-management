import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import type { APIGatewayProxyEvent } from 'aws-lambda';
import { handler } from './complete';

const ddbMock = mockClient(DynamoDBDocumentClient);

describe('complete-review handler', () => {
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
    httpMethod: 'POST',
    path: '/api/review/complete',
    pathParameters: null,
    queryStringParameters: null,
    multiValueHeaders: {},
    multiValueQueryStringParameters: null,
    stageVariables: null,
    resource: '',
  });

  it('should record review completion with timestamp', async () => {
    const userId = 'user-123';
    const now = new Date('2024-01-10T15:30:00.000Z');
    vi.setSystemTime(now);

    ddbMock.on(PutCommand).resolves({});

    const result = await handler(createMockEvent(userId));

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.userId).toBe(userId);
    expect(body.lastCompletedAt).toBe(now.toISOString());
    expect(body.createdAt).toBeDefined();
    expect(body.updatedAt).toBeDefined();
    expect(ddbMock.calls()).toHaveLength(1);
  });

  it('should use ISO 8601 format for timestamp', async () => {
    const userId = 'user-123';
    const now = new Date('2024-03-15T08:45:22.123Z');
    vi.setSystemTime(now);

    ddbMock.on(PutCommand).resolves({});

    const result = await handler(createMockEvent(userId));

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.lastCompletedAt).toBe('2024-03-15T08:45:22.123Z');
  });

  it('should handle missing userId', async () => {
    const event = createMockEvent('');
    event.requestContext.authorizer = { claims: {} } as any;

    const result = await handler(event);

    expect(result.statusCode).toBe(401);
  });

  it('should handle DynamoDB errors', async () => {
    const userId = 'user-123';

    ddbMock.on(PutCommand).rejects(new Error('DynamoDB error'));

    const result = await handler(createMockEvent(userId));

    expect(result.statusCode).toBe(500);
    const body = JSON.parse(result.body);
    expect(body.error).toBe('Internal server error');
  });

  it('should write to correct table', async () => {
    const userId = 'user-123';

    ddbMock.on(PutCommand).resolves({});

    await handler(createMockEvent(userId));

    const call = ddbMock.calls()[0];
    expect(call.args[0].input).toMatchObject({
      TableName: 'test-table',
    });
  });

  it('should include correct DynamoDB keys', async () => {
    const userId = 'user-123';

    ddbMock.on(PutCommand).resolves({});

    await handler(createMockEvent(userId));

    const call = ddbMock.calls()[0];
    const item = (call.args[0].input as any).Item;
    expect(item.PK).toBe(`USER#${userId}#REVIEW_STATUS`);
    expect(item.SK).toBe('REVIEW_STATUS');
    expect(item.EntityType).toBe('REVIEW_STATUS');
  });
});
