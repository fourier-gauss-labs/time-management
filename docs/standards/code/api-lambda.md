# API & Lambda Standards

This document defines coding standards for serverless Lambda handlers and API patterns for the time-management platform's backend, built on AWS Lambda (Node.js 20), API Gateway HTTP API, and DynamoDB.

## Core Principles

1. **Stateless functions** - Each Lambda invocation is independent
2. **Single responsibility** - One function, one purpose
3. **Fail fast** - Validate early, return errors clearly
4. **Security first** - Always validate auth, never trust input
5. **Cost-conscious** - Minimize cold starts and execution time
6. **Testable** - Pure logic, mocked dependencies

## Architecture Overview

### Lambda Function Structure

```
services/api/
  src/
    handlers/
      tasks/
        create-task.ts
        get-tasks.ts
        update-task.ts
        delete-task.ts
      calendar/
        sync-events.ts
        get-events.ts
    middleware/
      auth.ts
      validation.ts
      error-handler.ts
    repositories/
      task-repository.ts
      user-repository.ts
    services/
      task-service.ts
      calendar-service.ts
    utils/
      dynamo-client.ts
      response.ts
      logger.ts
    types/
      api-types.ts
  tests/
    handlers/
    services/
  package.json
  tsconfig.json
```

### Handler Organization

- **One file per endpoint** - Each Lambda function in its own file
- **Group by domain** - Related handlers in domain folders (tasks, calendar, etc.)
- **Clear naming** - File name matches handler purpose: `create-task.ts`, `get-tasks.ts`

## Lambda Handler Pattern

### Basic Handler Structure

```typescript
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { logger } from '@/utils/logger';
import { success, error, badRequest } from '@/utils/response';
import { taskService } from '@/services/task-service';
import type { CreateTaskInput, Task } from '@time-management/shared';

/**
 * Creates a new task for the authenticated user.
 *
 * @param event - API Gateway event with user context and request body
 * @returns Task creation response with 201 status
 */
export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  try {
    // 1. Extract user ID from authorizer context
    const userId = event.requestContext.authorizer?.jwt?.claims?.sub as string;
    if (!userId) {
      return error('Unauthorized', 401);
    }

    // 2. Parse and validate request body
    const body = JSON.parse(event.body || '{}');
    const input = validateCreateTaskInput(body);

    // 3. Execute business logic
    const task = await taskService.createTask(userId, input);

    // 4. Return success response
    return success(task, 201);
  } catch (err) {
    logger.error('Failed to create task', { error: err });

    if (err instanceof ValidationError) {
      return badRequest(err.message, err.fields);
    }

    return error('Internal server error', 500);
  }
}
```

### Handler Best Practices

**✅ Good:**

```typescript
export async function handler(event: APIGatewayProxyEventV2) {
  // Extract user from authorizer
  const userId = extractUserId(event);

  // Parse body once
  const body = parseBody<CreateTaskInput>(event);

  // Validate input
  const input = validateInput(body);

  // Business logic
  const result = await service.execute(userId, input);

  // Return response
  return success(result);
}
```

**❌ Avoid:**

```typescript
export async function handler(event: any) {
  // Untyped
  // Multiple try-catches
  try {
    const userId = event.requestContext.authorizer.jwt.claims.sub; // No null check

    // Inline business logic
    const task = await dynamoClient
      .put({
        TableName: 'tasks',
        Item: {
          /* ... */
        },
      })
      .promise();

    // Inconsistent response format
    return { statusCode: 200, body: task };
  } catch (e) {
    return { statusCode: 500 }; // No error details
  }
}
```

## Request/Response Patterns

### Response Utilities

```typescript
// utils/response.ts
import type { APIGatewayProxyResultV2 } from 'aws-lambda';

export function success<T>(data: T, statusCode = 200): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(data),
  };
}

export function error(message: string, statusCode = 500): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      error: message,
      statusCode,
    }),
  };
}

export function badRequest(
  message: string,
  fields?: Record<string, string>
): APIGatewayProxyResultV2 {
  return {
    statusCode: 400,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      error: message,
      fields,
      statusCode: 400,
    }),
  };
}

export function notFound(resource: string, id: string): APIGatewayProxyResultV2 {
  return error(`${resource} not found: ${id}`, 404);
}
```

### Standard Response Formats

**Success Response:**

```json
{
  "id": "task_123",
  "title": "Buy groceries",
  "completed": false,
  "createdAt": "2025-12-12T10:00:00Z"
}
```

**Error Response:**

```json
{
  "error": "Invalid input",
  "statusCode": 400,
  "fields": {
    "title": "Title is required",
    "dueDate": "Must be a future date"
  }
}
```

**List Response:**

```json
{
  "items": [...],
  "nextToken": "abc123",
  "count": 25
}
```

## Authentication & Authorization

### Extracting User Identity

```typescript
// utils/auth.ts
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import type { UserId } from '@time-management/shared';

export function extractUserId(event: APIGatewayProxyEventV2): UserId {
  const userId = event.requestContext.authorizer?.jwt?.claims?.sub as string;

  if (!userId) {
    throw new UnauthorizedError('Missing user identity');
  }

  return userId;
}

export function extractUserEmail(event: APIGatewayProxyEventV2): string {
  const email = event.requestContext.authorizer?.jwt?.claims?.email as string;

  if (!email) {
    throw new UnauthorizedError('Missing user email');
  }

  return email;
}

export function hasRole(event: APIGatewayProxyEventV2, role: string): boolean {
  const groups =
    (event.requestContext.authorizer?.jwt?.claims?.['cognito:groups'] as string[]) || [];
  return groups.includes(role);
}
```

### Usage in Handlers

```typescript
export async function handler(event: APIGatewayProxyEventV2) {
  try {
    const userId = extractUserId(event);

    // User can only access their own data
    const tasks = await taskService.getUserTasks(userId);

    return success(tasks);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return error('Unauthorized', 401);
    }
    throw err;
  }
}
```

### Authorization Checks

```typescript
export async function deleteTaskHandler(event: APIGatewayProxyEventV2) {
  const userId = extractUserId(event);
  const taskId = event.pathParameters?.taskId;

  if (!taskId) {
    return badRequest('Task ID is required');
  }

  // Verify task belongs to user
  const task = await taskRepository.findById(taskId);

  if (!task) {
    return notFound('Task', taskId);
  }

  if (task.userId !== userId) {
    return error('Forbidden: You do not own this task', 403);
  }

  await taskRepository.delete(taskId);

  return success({ deleted: true });
}
```

## Input Validation

### Validation Functions

```typescript
// utils/validation.ts
import { z } from 'zod';
import type { CreateTaskInput } from '@time-management/shared';

const CreateTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  dueDate: z.string().datetime().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
});

export function validateCreateTaskInput(input: unknown): CreateTaskInput {
  try {
    return CreateTaskSchema.parse(input);
  } catch (err) {
    if (err instanceof z.ZodError) {
      const fields: Record<string, string> = {};
      err.errors.forEach(error => {
        if (error.path.length > 0) {
          fields[error.path.join('.')] = error.message;
        }
      });
      throw new ValidationError('Invalid input', fields);
    }
    throw err;
  }
}
```

### Using Validation

```typescript
export async function handler(event: APIGatewayProxyEventV2) {
  try {
    const userId = extractUserId(event);
    const body = JSON.parse(event.body || '{}');

    // Validate will throw ValidationError if invalid
    const input = validateCreateTaskInput(body);

    const task = await taskService.createTask(userId, input);

    return success(task, 201);
  } catch (err) {
    if (err instanceof ValidationError) {
      return badRequest(err.message, err.fields);
    }
    return error('Internal server error', 500);
  }
}
```

## DynamoDB Access Patterns

### Single-Table Design

```
PK                    SK                        Attributes
USER#<sub>            PROFILE                   { name, email, ... }
USER#<sub>            TASK#<taskId>             { title, completed, ... }
USER#<sub>            EVENT#<eventId>           { title, startTime, ... }
USER#<sub>            TIMEBLOCK#<blockId>       { startTime, endTime, ... }
```

### Repository Pattern

```typescript
// repositories/task-repository.ts
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import type { Task, TaskId, UserId } from '@time-management/shared';

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE_NAME = process.env.TABLE_NAME!;

export class TaskRepository {
  async create(task: Task): Promise<Task> {
    await client.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: `USER#${task.userId}`,
          SK: `TASK#${task.id}`,
          ...task,
          createdAt: task.createdAt.toISOString(),
          updatedAt: task.updatedAt.toISOString(),
        },
      })
    );

    return task;
  }

  async findByUserId(userId: UserId): Promise<Task[]> {
    const response = await client.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': `USER#${userId}`,
          ':sk': 'TASK#',
        },
      })
    );

    return (response.Items || []).map(
      item =>
        ({
          ...item,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt),
        }) as Task
    );
  }

  async findById(taskId: TaskId, userId: UserId): Promise<Task | null> {
    const response = await client.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: `TASK#${taskId}`,
        },
      })
    );

    if (!response.Item) {
      return null;
    }

    return {
      ...response.Item,
      createdAt: new Date(response.Item.createdAt),
      updatedAt: new Date(response.Item.updatedAt),
    } as Task;
  }

  async delete(taskId: TaskId, userId: UserId): Promise<void> {
    await client.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: `TASK#${taskId}`,
        },
      })
    );
  }
}

export const taskRepository = new TaskRepository();
```

### Best Practices for DynamoDB

**✅ Good:**

```typescript
// Use consistent PK/SK patterns
const pk = `USER#${userId}`;
const sk = `TASK#${taskId}`;

// Query with begin_with for prefixes
KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',

// Use projection expressions to limit data
ProjectionExpression: 'id, title, completed, dueDate',

// Handle pagination
if (response.LastEvaluatedKey) {
  return {
    items: response.Items,
    nextToken: Buffer.from(JSON.stringify(response.LastEvaluatedKey)).toString('base64'),
  };
}
```

**❌ Avoid:**

```typescript
// Scan operations (expensive!)
const response = await client.scan({ TableName: TABLE_NAME });

// Fetching all attributes when not needed
// (Increases cost and latency)

// Not handling pagination
// (May miss items or timeout)
```

## Service Layer

### Separating Business Logic

```typescript
// services/task-service.ts
import { ulid } from 'ulid';
import { taskRepository } from '@/repositories/task-repository';
import type { Task, UserId, CreateTaskInput } from '@time-management/shared';

export class TaskService {
  async createTask(userId: UserId, input: CreateTaskInput): Promise<Task> {
    const now = new Date();

    const task: Task = {
      id: ulid(),
      userId,
      title: input.title,
      description: input.description,
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      priority: input.priority || 'medium',
      completed: false,
      createdAt: now,
      updatedAt: now,
    };

    return await taskRepository.create(task);
  }

  async getUserTasks(userId: UserId): Promise<Task[]> {
    return await taskRepository.findByUserId(userId);
  }

  async getActiveTasksCount(userId: UserId): Promise<number> {
    const tasks = await taskRepository.findByUserId(userId);
    return tasks.filter(t => !t.completed).length;
  }

  async completeTask(taskId: TaskId, userId: UserId): Promise<Task> {
    const task = await taskRepository.findById(taskId, userId);

    if (!task) {
      throw new NotFoundError('Task', taskId);
    }

    if (task.userId !== userId) {
      throw new ForbiddenError("Cannot modify another user's task");
    }

    task.completed = true;
    task.updatedAt = new Date();

    return await taskRepository.update(task);
  }
}

export const taskService = new TaskService();
```

### Why Separate Service Layer?

- **Testability** - Mock repositories in service tests
- **Reusability** - Share logic across multiple handlers
- **Single Responsibility** - Handlers route, services execute
- **Transaction Logic** - Coordinate multiple repository calls

## Error Handling

### Custom Error Classes

```typescript
// utils/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly isOperational = true
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public readonly fields: Record<string, string> = {}
  ) {
    super(message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`, 404);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}
```

### Error Handler Middleware

```typescript
// middleware/error-handler.ts
import type { APIGatewayProxyResultV2 } from 'aws-lambda';
import { logger } from '@/utils/logger';
import { error, badRequest } from '@/utils/response';
import { AppError, ValidationError } from '@/utils/errors';

export function handleError(err: unknown): APIGatewayProxyResultV2 {
  // Log all errors
  logger.error('Handler error', { error: err });

  // Operational errors - safe to expose
  if (err instanceof ValidationError) {
    return badRequest(err.message, err.fields);
  }

  if (err instanceof AppError) {
    return error(err.message, err.statusCode);
  }

  // Unknown errors - don't expose internals
  return error('Internal server error', 500);
}
```

### Using Error Handler

```typescript
export async function handler(event: APIGatewayProxyEventV2) {
  try {
    const userId = extractUserId(event);
    const taskId = event.pathParameters?.taskId!;

    const task = await taskService.completeTask(taskId, userId);

    return success(task);
  } catch (err) {
    return handleError(err);
  }
}
```

## Logging

### Structured Logging

```typescript
// utils/logger.ts
export interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private log(level: string, message: string, context?: LogContext) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context,
    };

    console.log(JSON.stringify(entry));
  }

  info(message: string, context?: LogContext) {
    this.log('INFO', message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log('WARN', message, context);
  }

  error(message: string, context?: LogContext) {
    this.log('ERROR', message, context);
  }

  debug(message: string, context?: LogContext) {
    if (process.env.LOG_LEVEL === 'DEBUG') {
      this.log('DEBUG', message, context);
    }
  }
}

export const logger = new Logger();
```

### Logging Best Practices

**✅ Good:**

```typescript
logger.info('Task created', {
  userId,
  taskId: task.id,
  priority: task.priority,
});

logger.error('Failed to save task', {
  error: err instanceof Error ? err.message : 'Unknown error',
  userId,
  input,
});
```

**❌ Avoid:**

```typescript
console.log('Task created'); // Not structured
console.log(task); // May contain sensitive data

logger.info('Error', { error: err }); // Don't log entire error objects
logger.info('User data', { user }); // May contain PII
```

### What to Log

**DO log:**

- Request/response metadata (user ID, endpoint, status)
- Business events (task created, event synced)
- Errors with context
- Performance metrics (execution time)

**DON'T log:**

- Passwords or secrets
- Full JWT tokens
- Personally identifiable information (PII) in production
- Entire request/response bodies

## Environment Configuration

### Environment Variables

```typescript
// utils/config.ts
export const config = {
  tableName: process.env.TABLE_NAME!,
  region: process.env.AWS_REGION || 'us-east-1',
  environment: process.env.ENVIRONMENT || 'dev',
  logLevel: process.env.LOG_LEVEL || 'INFO',

  // Feature flags
  enableCalendarSync: process.env.ENABLE_CALENDAR_SYNC === 'true',

  // External services
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  microsoftClientId: process.env.MICROSOFT_CLIENT_ID,
} as const;

// Validate required config at startup
export function validateConfig() {
  if (!config.tableName) {
    throw new Error('TABLE_NAME environment variable is required');
  }
}
```

### Using Configuration

```typescript
import { config } from '@/utils/config';

export async function handler(event: APIGatewayProxyEventV2) {
  const response = await client.send(
    new QueryCommand({
      TableName: config.tableName,
      // ...
    })
  );

  return success(response.Items);
}
```

## Testing

### Unit Tests for Handlers

```typescript
// tests/handlers/create-task.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handler } from '@/handlers/tasks/create-task';
import { taskService } from '@/services/task-service';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';

vi.mock('@/services/task-service');

describe('create-task handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('creates task successfully', async () => {
    const mockTask = {
      id: 'task_123',
      userId: 'user_456',
      title: 'Buy groceries',
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(taskService.createTask).mockResolvedValue(mockTask);

    const event = {
      body: JSON.stringify({ title: 'Buy groceries' }),
      requestContext: {
        authorizer: {
          jwt: {
            claims: { sub: 'user_456' },
          },
        },
      },
    } as unknown as APIGatewayProxyEventV2;

    const response = await handler(event);

    expect(response.statusCode).toBe(201);
    expect(JSON.parse(response.body!)).toEqual(mockTask);
    expect(taskService.createTask).toHaveBeenCalledWith('user_456', { title: 'Buy groceries' });
  });

  it('returns 400 for invalid input', async () => {
    const event = {
      body: JSON.stringify({ title: '' }), // Invalid: empty title
      requestContext: {
        authorizer: {
          jwt: {
            claims: { sub: 'user_456' },
          },
        },
      },
    } as unknown as APIGatewayProxyEventV2;

    const response = await handler(event);

    expect(response.statusCode).toBe(400);
  });

  it('returns 401 for missing auth', async () => {
    const event = {
      body: JSON.stringify({ title: 'Buy groceries' }),
      requestContext: {},
    } as unknown as APIGatewayProxyEventV2;

    const response = await handler(event);

    expect(response.statusCode).toBe(401);
  });
});
```

### Unit Tests for Services

```typescript
// tests/services/task-service.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TaskService } from '@/services/task-service';
import { taskRepository } from '@/repositories/task-repository';

vi.mock('@/repositories/task-repository');

describe('TaskService', () => {
  let service: TaskService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TaskService();
  });

  it('creates task with defaults', async () => {
    const input = { title: 'Buy groceries' };
    const userId = 'user_123';

    vi.mocked(taskRepository.create).mockResolvedValue({
      id: 'task_456',
      userId,
      title: input.title,
      priority: 'medium', // Default
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const task = await service.createTask(userId, input);

    expect(task.priority).toBe('medium');
    expect(task.completed).toBe(false);
    expect(taskRepository.create).toHaveBeenCalled();
  });

  it('throws NotFoundError when completing non-existent task', async () => {
    vi.mocked(taskRepository.findById).mockResolvedValue(null);

    await expect(service.completeTask('task_123', 'user_456')).rejects.toThrow('Task not found');
  });
});
```

### Integration Tests

```typescript
// tests/integration/tasks-api.test.ts
import { describe, it, expect } from 'vitest';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { handler as createHandler } from '@/handlers/tasks/create-task';
import { handler as getHandler } from '@/handlers/tasks/get-tasks';

// Use local DynamoDB or test environment
const testClient = new DynamoDBClient({
  endpoint: 'http://localhost:8000',
});

describe('Tasks API Integration', () => {
  it('creates and retrieves task', async () => {
    const userId = 'test_user_123';

    // Create task
    const createEvent = mockEvent({
      body: JSON.stringify({ title: 'Test task' }),
      userId,
    });

    const createResponse = await createHandler(createEvent);
    expect(createResponse.statusCode).toBe(201);

    const createdTask = JSON.parse(createResponse.body!);

    // Retrieve tasks
    const getEvent = mockEvent({ userId });
    const getResponse = await getHandler(getEvent);

    expect(getResponse.statusCode).toBe(200);
    const tasks = JSON.parse(getResponse.body!);

    expect(tasks).toContainEqual(expect.objectContaining({ id: createdTask.id }));
  });
});
```

## Performance Optimization

### Cold Start Reduction

```typescript
// ✅ Good: Initialize clients outside handler
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({}); // Reused across invocations

export async function handler(event: APIGatewayProxyEventV2) {
  // Handler logic
}

// ❌ Avoid: Creating clients inside handler
export async function handler(event: APIGatewayProxyEventV2) {
  const client = new DynamoDBClient({}); // Created every invocation
  // ...
}
```

### Connection Reuse

```typescript
// Keep connections alive between invocations
const client = new DynamoDBClient({
  maxAttempts: 3,
  requestHandler: {
    connectionTimeout: 3000,
    socketTimeout: 3000,
  },
});
```

### Minimize Package Size

```typescript
// ✅ Good: Import only what you need
import { QueryCommand } from '@aws-sdk/lib-dynamodb';

// ❌ Avoid: Importing entire SDK
import * as AWS from 'aws-sdk';
```

## Security Best Practices

### Input Sanitization

```typescript
function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML
    .substring(0, 1000); // Limit length
}
```

### Data Isolation

```typescript
// Always scope queries by user ID
export async function getUserTasks(userId: UserId) {
  return await client.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`, // User can only see their data
        ':sk': 'TASK#',
      },
    })
  );
}
```

### Secrets Management

```typescript
// utils/secrets.ts
import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({});

export async function getSecret(secretName: string): Promise<string> {
  const response = await client.send(new GetSecretValueCommand({ SecretId: secretName }));

  return response.SecretString!;
}

// Usage
const googleClientSecret = await getSecret('google-oauth-client-secret');
```

### Rate Limiting Considerations

```typescript
// Return 429 when user exceeds limits
if (await isRateLimited(userId)) {
  return {
    statusCode: 429,
    body: JSON.stringify({ error: 'Too many requests' }),
    headers: {
      'Retry-After': '60',
    },
  };
}
```

## API Gateway Integration

### Path Parameters

```typescript
export async function handler(event: APIGatewayProxyEventV2) {
  const taskId = event.pathParameters?.taskId;

  if (!taskId) {
    return badRequest('Task ID is required');
  }

  // Use taskId
}
```

### Query Parameters

```typescript
export async function handler(event: APIGatewayProxyEventV2) {
  const queryParams = event.queryStringParameters || {};

  const limit = parseInt(queryParams.limit || '25', 10);
  const nextToken = queryParams.nextToken;
  const filter = queryParams.filter;

  const tasks = await taskService.getUserTasks(userId, {
    limit,
    nextToken,
    filter,
  });

  return success(tasks);
}
```

### CORS Headers

```typescript
// Always include CORS headers in responses
const headers = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
```

## Summary

- **Structure handlers cleanly** - Extract user, validate input, execute logic, return response
- **Use TypeScript** - Type event, response, and all data structures
- **Separate concerns** - Handlers route, services execute, repositories access data
- **Fail fast** - Validate auth and input immediately
- **Single-table DynamoDB** - Use consistent PK/SK patterns for user data isolation
- **Handle errors gracefully** - Custom error classes, structured error responses
- **Log structurally** - JSON logs with context, never log secrets
- **Test thoroughly** - Unit tests for logic, integration tests for workflows
- **Optimize for cost** - Minimize cold starts, reuse connections, limit package size
- **Security first** - Validate auth, isolate data, sanitize input, use secrets manager

Refer to related standards:

- [TypeScript Standards](./typescript.md)
- [Security Standards](../infrastructure/security.md)
- [Testing Standards](../process/testing.md)
