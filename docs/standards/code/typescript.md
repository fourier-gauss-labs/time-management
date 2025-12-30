# TypeScript Standards

This document defines TypeScript conventions and patterns for the time-management platform.

## Core Principles

1. **Strict mode always** - Use strict TypeScript settings for maximum type safety
2. **Explicit over implicit** - Prefer explicit types when they improve clarity
3. **Type safety first** - Avoid `any` unless absolutely necessary
4. **Shared types** - Domain types live in `packages/shared`
5. **Modern ES features** - Target ES2020+, use modern JavaScript features

## Configuration

### Base Configuration (`tsconfig.base.json`)

All packages extend from the root `tsconfig.base.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "types": ["node"]
  }
}
```

### Package-Specific Overrides

- **Frontend (`apps/web`)**: Use `"moduleResolution": "bundler"` and `"jsx": "react-jsx"`
- **Backend (`services/api`)**: Use `"module": "commonjs"` for Lambda compatibility
- **Infrastructure (`infra/cdk`)**: Use `"module": "commonjs"` for CDK

## Type Definitions

### Use Explicit Types for Function Signatures

**✅ Good:**

```typescript
function calculateDuration(startTime: Date, endTime: Date): number {
  return endTime.getTime() - startTime.getTime();
}

async function fetchUserTasks(userId: UserId): Promise<Task[]> {
  // ...
}
```

**❌ Avoid:**

```typescript
function calculateDuration(startTime, endTime) {
  // No types
  return endTime.getTime() - startTime.getTime();
}
```

### Allow Type Inference for Simple Variables

**✅ Good:**

```typescript
const count = 5; // number inferred
const items = tasks.filter(t => t.completed); // Task[] inferred
const message = `Found ${count} items`; // string inferred
```

**❌ Avoid (over-specification):**

```typescript
const count: number = 5; // Redundant
const message: string = `Found ${count} items`; // Redundant
```

### Use Type Aliases for Domain Concepts

**✅ Good:**

```typescript
// In packages/shared/src/types.ts
export type UserId = string;
export type TaskId = string;
export type ISO8601DateTime = string;

// In usage
function deleteTask(userId: UserId, taskId: TaskId): Promise<void> {
  // ...
}
```

**❌ Avoid:**

```typescript
function deleteTask(userId: string, taskId: string): Promise<void> {
  // Less semantic meaning
}
```

### Use Interfaces for Object Shapes

**✅ Good:**

```typescript
export interface Task {
  id: TaskId;
  userId: UserId;
  title: string;
  description?: string;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  dueDate?: Date;
  priority?: 'low' | 'medium' | 'high';
}
```

### Use Enums Sparingly

Prefer union types over enums for most cases:

**✅ Good:**

```typescript
export type Priority = 'low' | 'medium' | 'high';
export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled';
```

**Use enums only when you need reverse mapping or namespace grouping:**

```typescript
export enum HttpStatus {
  OK = 200,
  Created = 201,
  BadRequest = 400,
  Unauthorized = 401,
  NotFound = 404,
  InternalServerError = 500,
}
```

## Null and Undefined Handling

### Use Optional Properties and Parameters

**✅ Good:**

```typescript
interface UpdateTaskInput {
  title?: string;
  description?: string;
  dueDate?: Date | null; // Explicit null for clearing
}

function formatDate(date?: Date): string {
  return date ? date.toISOString() : 'No date';
}
```

### Avoid Non-Null Assertions

**❌ Avoid:**

```typescript
const user = users.find(u => u.id === userId)!; // Dangerous!
```

**✅ Good:**

```typescript
const user = users.find(u => u.id === userId);
if (!user) {
  throw new Error(`User not found: ${userId}`);
}
```

### Use Nullish Coalescing and Optional Chaining

**✅ Good:**

```typescript
const displayName = user.name ?? 'Anonymous';
const city = user.address?.city ?? 'Unknown';
const count = options?.maxResults ?? 10;
```

## Async/Await

### Always Use Async/Await Over Promises

**✅ Good:**

```typescript
async function fetchUserData(userId: UserId): Promise<User> {
  const user = await userRepository.findById(userId);
  const tasks = await taskRepository.findByUserId(userId);
  return { ...user, tasks };
}
```

**❌ Avoid:**

```typescript
function fetchUserData(userId: UserId): Promise<User> {
  return userRepository
    .findById(userId)
    .then(user => taskRepository.findByUserId(userId).then(tasks => ({ ...user, tasks })));
}
```

### Handle Errors Explicitly

**✅ Good:**

```typescript
async function saveTask(task: Task): Promise<void> {
  try {
    await taskRepository.save(task);
    await auditLog.record({ action: 'TASK_CREATED', taskId: task.id });
  } catch (error) {
    logger.error('Failed to save task', { error, taskId: task.id });
    throw new TaskSaveError('Unable to save task', { cause: error });
  }
}
```

## Error Handling

### Use Custom Error Classes

**✅ Good:**

```typescript
// In packages/shared/src/errors.ts
export class NotFoundError extends Error {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly fields: Record<string, string>
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Usage
throw new NotFoundError('Task', taskId);
throw new ValidationError('Invalid input', { title: 'Title is required' });
```

## Imports and Exports

### Use Named Exports

**✅ Good:**

```typescript
// user-service.ts
export async function createUser(input: CreateUserInput): Promise<User> {
  // ...
}

export async function deleteUser(userId: UserId): Promise<void> {
  // ...
}
```

**⚠️ Default exports only for React components:**

```typescript
// App.tsx
function App() {
  return <div>...</div>;
}

export default App;
```

### Organize Imports

```typescript
// 1. External libraries
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import React, { useState, useEffect } from 'react';

// 2. Internal packages
import type { Task, UserId } from '@time-management/shared';

// 3. Relative imports
import { TaskRepository } from './task-repository';
import { logger } from '../utils/logger';
```

### Use Path Aliases Sparingly

For large projects, consider path aliases in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "paths": {
      "@shared/*": ["../../packages/shared/src/*"]
    }
  }
}
```

But prefer explicit relative paths for co-located code.

## Array and Object Operations

### Use Modern Array Methods

**✅ Good:**

```typescript
const completedTasks = tasks.filter(t => t.completed);
const taskIds = tasks.map(t => t.id);
const hasHighPriority = tasks.some(t => t.priority === 'high');
const allCompleted = tasks.every(t => t.completed);
```

### Use Spread Operators

**✅ Good:**

```typescript
const updatedTask = { ...task, completed: true, updatedAt: new Date() };
const allTasks = [...userTasks, ...sharedTasks];
```

### Use Object Destructuring

**✅ Good:**

```typescript
function displayTask({ title, dueDate, priority }: Task): string {
  return `${title} (${priority}) - Due: ${dueDate}`;
}

const { id, userId, ...taskData } = request.body;
```

## Type Guards

### Use Type Guards for Runtime Checks

**✅ Good:**

```typescript
function isTask(obj: unknown): obj is Task {
  return (
    typeof obj === 'object' && obj !== null && 'id' in obj && 'title' in obj && 'completed' in obj
  );
}

if (isTask(data)) {
  console.log(data.title); // TypeScript knows it's a Task
}
```

### Use Discriminated Unions

**✅ Good:**

```typescript
type ApiResponse<T> = { success: true; data: T } | { success: false; error: string };

function handleResponse<T>(response: ApiResponse<T>): T {
  if (response.success) {
    return response.data; // TypeScript knows this exists
  } else {
    throw new Error(response.error); // TypeScript knows this exists
  }
}
```

## Utility Types

Use TypeScript's built-in utility types:

```typescript
// Make all properties optional
type PartialTask = Partial<Task>;

// Make all properties required
type RequiredTask = Required<Task>;

// Pick specific properties
type TaskSummary = Pick<Task, 'id' | 'title' | 'completed'>;

// Omit specific properties
type TaskWithoutDates = Omit<Task, 'createdAt' | 'updatedAt'>;

// Extract from union
type CompletedStatus = Extract<TaskStatus, 'completed'>;

// Exclude from union
type IncompleteStatus = Exclude<TaskStatus, 'completed'>;

// Non-nullable
type DefinedValue = NonNullable<string | null | undefined>; // string

// Return type of function
type Result = ReturnType<typeof fetchUserTasks>;

// Parameters of function
type Params = Parameters<typeof createTask>;
```

## Avoid Common Pitfalls

### Don't Use `any`

**❌ Avoid:**

```typescript
function processData(data: any): any {
  return data.value;
}
```

**✅ Good:**

```typescript
function processData<T>(data: T): T {
  return data;
}

// Or be specific
function processTaskData(data: unknown): Task {
  if (!isTask(data)) {
    throw new ValidationError('Invalid task data');
  }
  return data;
}
```

### Don't Use `as` Casts Excessively

**❌ Avoid:**

```typescript
const task = response.data as Task; // No runtime validation!
```

**✅ Good:**

```typescript
const task = parseTask(response.data); // Validates and returns Task

function parseTask(data: unknown): Task {
  if (!isTask(data)) {
    throw new ValidationError('Invalid task format');
  }
  return data;
}
```

### Don't Mix Promises and Callbacks

**❌ Avoid:**

```typescript
function loadData(callback: (error: Error | null, data?: Data) => void) {
  // Callback style
}
```

**✅ Good:**

```typescript
async function loadData(): Promise<Data> {
  // Promise/async style
}
```

## Comments and Documentation

### Use JSDoc for Public APIs

**✅ Good:**

```typescript
/**
 * Fetches all tasks for a given user.
 *
 * @param userId - The unique identifier for the user
 * @param options - Optional filtering and pagination options
 * @returns A promise that resolves to an array of tasks
 * @throws {NotFoundError} If the user does not exist
 */
export async function fetchUserTasks(userId: UserId, options?: TaskQueryOptions): Promise<Task[]> {
  // ...
}
```

### Avoid Obvious Comments

**❌ Avoid:**

```typescript
// Increment count
count++;

// Return the task
return task;
```

**✅ Good (explain why, not what):**

```typescript
// Force re-fetch to ensure we have the latest OAuth tokens
await refreshUserSession(userId);

// DynamoDB requires at least 1 second between rate-limited retries
await sleep(1000);
```

## File Naming

- Use **kebab-case** for file names: `task-repository.ts`, `user-service.ts`
- Use **PascalCase** for React components: `TaskList.tsx`, `UserProfile.tsx`
- Use **index.ts** for barrel exports, but don't overuse them
- Test files: `task-repository.test.ts`, `UserProfile.test.tsx`

## Summary

- Enable strict mode and leverage TypeScript's type system
- Be explicit with function signatures, allow inference for simple variables
- Use interfaces for objects, type aliases for primitives and unions
- Prefer async/await over raw promises
- Use custom error classes for better error handling
- Favor named exports except for React components
- Use modern JavaScript features (spread, destructuring, optional chaining)
- Document public APIs with JSDoc
- Avoid `any`, excessive type assertions, and callbacks
