# Testing Standards

This document defines testing practices and patterns for the time-management platform.

## Core Principles

1. **Test early, test often** - Write tests alongside code, not after
2. **Test behavior, not implementation** - Focus on what code does, not how
3. **Readable tests** - Tests are documentation; make them clear
4. **Fast tests** - Unit tests should run in milliseconds
5. **Isolated tests** - Each test should be independent
6. **Comprehensive coverage** - Aim for 80%+ code coverage
7. **Test pyramid** - More unit tests, fewer integration tests, minimal E2E
8. **Fail fast** - Tests should fail clearly and quickly

## Test Pyramid

```
        /\
       /  \      E2E Tests (Few)
      /____\     - Full user workflows
     /      \    - Critical paths only
    /        \
   /__________\  Integration Tests (Some)
  /            \ - API endpoints
 /              \- Database operations
/________________\
                  Unit Tests (Many)
                  - Functions, components
                  - Business logic
                  - Utilities
```

**Target ratio:** 70% unit, 20% integration, 10% E2E

## Test Framework Setup

### Vitest Configuration

**Root vitest.config.ts:**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.config.ts',
        '**/types.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
```

### React Testing Library Setup

**Frontend test setup:**

```typescript
// apps/web/src/test/setup.ts
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

**Vitest config for React:**

```typescript
// apps/web/vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.config.ts',
        'src/main.tsx',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
```

## Unit Testing

### Testing Pure Functions

**✅ Good:**

```typescript
// src/utils/date.ts
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// src/utils/date.test.ts
import { describe, it, expect } from 'vitest';
import { formatDate } from './date';

describe('formatDate', () => {
  it('should format date correctly', () => {
    const date = new Date('2024-01-15');
    expect(formatDate(date)).toBe('January 15, 2024');
  });

  it('should handle different months', () => {
    const date = new Date('2024-12-25');
    expect(formatDate(date)).toBe('December 25, 2024');
  });
});
```

### Testing Business Logic

**✅ Good:**

```typescript
// src/domain/task.ts
export interface Task {
  id: string;
  title: string;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
}

export function isOverdue(task: Task): boolean {
  if (!task.dueDate || task.completed) {
    return false;
  }
  return task.dueDate < new Date();
}

export function sortByPriority(tasks: Task[]): Task[] {
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return [...tasks].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );
}

// src/domain/task.test.ts
import { describe, it, expect } from 'vitest';
import { isOverdue, sortByPriority, Task } from './task';

describe('isOverdue', () => {
  it('should return true for overdue task', () => {
    const task: Task = {
      id: '1',
      title: 'Test',
      dueDate: new Date('2020-01-01'),
      priority: 'high',
      completed: false,
    };
    expect(isOverdue(task)).toBe(true);
  });

  it('should return false for completed task', () => {
    const task: Task = {
      id: '1',
      title: 'Test',
      dueDate: new Date('2020-01-01'),
      priority: 'high',
      completed: true,
    };
    expect(isOverdue(task)).toBe(false);
  });

  it('should return false for task without due date', () => {
    const task: Task = {
      id: '1',
      title: 'Test',
      priority: 'high',
      completed: false,
    };
    expect(isOverdue(task)).toBe(false);
  });
});

describe('sortByPriority', () => {
  it('should sort tasks by priority', () => {
    const tasks: Task[] = [
      { id: '1', title: 'Low', priority: 'low', completed: false },
      { id: '2', title: 'High', priority: 'high', completed: false },
      { id: '3', title: 'Medium', priority: 'medium', completed: false },
    ];

    const sorted = sortByPriority(tasks);
    expect(sorted[0].priority).toBe('high');
    expect(sorted[1].priority).toBe('medium');
    expect(sorted[2].priority).toBe('low');
  });

  it('should not mutate original array', () => {
    const tasks: Task[] = [
      { id: '1', title: 'Low', priority: 'low', completed: false },
    ];
    const original = [...tasks];

    sortByPriority(tasks);
    expect(tasks).toEqual(original);
  });
});
```

### Testing React Components

**✅ Good:**

```typescript
// src/components/TaskCard.tsx
import { Task } from '../types';

interface TaskCardProps {
  task: Task;
  onToggle: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

export function TaskCard({ task, onToggle, onDelete }: TaskCardProps) {
  return (
    <div className="task-card" data-testid="task-card">
      <h3>{task.title}</h3>
      <p className={task.completed ? 'completed' : ''}>
        {task.description}
      </p>
      <button onClick={() => onToggle(task.id)}>
        {task.completed ? 'Undo' : 'Complete'}
      </button>
      <button onClick={() => onDelete(task.id)}>Delete</button>
    </div>
  );
}

// src/components/TaskCard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TaskCard } from './TaskCard';
import { Task } from '../types';

describe('TaskCard', () => {
  const mockTask: Task = {
    id: '1',
    title: 'Test Task',
    description: 'Test description',
    priority: 'high',
    completed: false,
  };

  it('should render task information', () => {
    render(
      <TaskCard task={mockTask} onToggle={vi.fn()} onDelete={vi.fn()} />
    );

    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('should call onToggle when complete button clicked', () => {
    const onToggle = vi.fn();
    render(
      <TaskCard task={mockTask} onToggle={onToggle} onDelete={vi.fn()} />
    );

    fireEvent.click(screen.getByText('Complete'));
    expect(onToggle).toHaveBeenCalledWith('1');
  });

  it('should call onDelete when delete button clicked', () => {
    const onDelete = vi.fn();
    render(
      <TaskCard task={mockTask} onToggle={vi.fn()} onDelete={onDelete} />
    );

    fireEvent.click(screen.getByText('Delete'));
    expect(onDelete).toHaveBeenCalledWith('1');
  });

  it('should show "Undo" for completed tasks', () => {
    const completedTask = { ...mockTask, completed: true };
    render(
      <TaskCard
        task={completedTask}
        onToggle={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    expect(screen.getByText('Undo')).toBeInTheDocument();
  });
});
```

### Testing React Hooks

**✅ Good:**

```typescript
// src/hooks/useTasks.ts
import { useState, useEffect } from 'react';
import { Task } from '../types';
import { fetchTasks } from '../api/tasks';

export function useTasks(userId: string) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadTasks() {
      try {
        setLoading(true);
        const data = await fetchTasks(userId);
        setTasks(data);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    loadTasks();
  }, [userId]);

  return { tasks, loading, error };
}

// src/hooks/useTasks.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useTasks } from './useTasks';
import * as tasksApi from '../api/tasks';

vi.mock('../api/tasks');

describe('useTasks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should load tasks successfully', async () => {
    const mockTasks = [
      { id: '1', title: 'Task 1', completed: false },
      { id: '2', title: 'Task 2', completed: true },
    ];

    vi.mocked(tasksApi.fetchTasks).mockResolvedValue(mockTasks);

    const { result } = renderHook(() => useTasks('user-123'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.tasks).toEqual(mockTasks);
    expect(result.current.error).toBeNull();
  });

  it('should handle errors', async () => {
    const mockError = new Error('Failed to fetch');
    vi.mocked(tasksApi.fetchTasks).mockRejectedValue(mockError);

    const { result } = renderHook(() => useTasks('user-123'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toEqual(mockError);
    expect(result.current.tasks).toEqual([]);
  });
});
```

## Integration Testing

### Testing API Endpoints

**✅ Good:**

```typescript
// services/api/src/handlers/tasks.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { createTask, getTask } from './tasks';
import { taskRepository } from '../repositories/task-repository';

// Mock DynamoDB
vi.mock('../repositories/task-repository');

describe('Task Handlers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createTask', () => {
    it('should create a task successfully', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        body: JSON.stringify({
          title: 'New Task',
          priority: 'high',
        }),
        requestContext: {
          authorizer: {
            claims: { sub: 'user-123' },
          },
        } as any,
      };

      const mockTask = {
        id: 'task-1',
        userId: 'user-123',
        title: 'New Task',
        priority: 'high',
        completed: false,
      };

      vi.mocked(taskRepository.create).mockResolvedValue(mockTask);

      const response = await createTask(event as APIGatewayProxyEvent);

      expect(response.statusCode).toBe(201);
      expect(JSON.parse(response.body)).toEqual(mockTask);
    });

    it('should return 400 for invalid input', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        body: JSON.stringify({ title: '' }), // Invalid
        requestContext: {
          authorizer: {
            claims: { sub: 'user-123' },
          },
        } as any,
      };

      const response = await createTask(event as APIGatewayProxyEvent);

      expect(response.statusCode).toBe(400);
    });
  });

  describe('getTask', () => {
    it('should return task for authorized user', async () => {
      const mockTask = {
        id: 'task-1',
        userId: 'user-123',
        title: 'Test Task',
      };

      vi.mocked(taskRepository.findById).mockResolvedValue(mockTask);

      const event: Partial<APIGatewayProxyEvent> = {
        pathParameters: { taskId: 'task-1' },
        requestContext: {
          authorizer: {
            claims: { sub: 'user-123' },
          },
        } as any,
      };

      const response = await getTask(event as APIGatewayProxyEvent);

      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual(mockTask);
    });

    it('should return 403 for unauthorized access', async () => {
      const mockTask = {
        id: 'task-1',
        userId: 'other-user',
        title: 'Test Task',
      };

      vi.mocked(taskRepository.findById).mockResolvedValue(mockTask);

      const event: Partial<APIGatewayProxyEvent> = {
        pathParameters: { taskId: 'task-1' },
        requestContext: {
          authorizer: {
            claims: { sub: 'user-123' },
          },
        } as any,
      };

      const response = await getTask(event as APIGatewayProxyEvent);

      expect(response.statusCode).toBe(403);
    });
  });
});
```

### Testing Database Operations

**✅ Good:**

```typescript
// services/api/src/repositories/task-repository.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { TaskRepository } from './task-repository';

// Use local DynamoDB or mock
describe('TaskRepository', () => {
  let repository: TaskRepository;
  let mockClient: DynamoDBDocumentClient;

  beforeEach(() => {
    // Setup mock or local DynamoDB
    mockClient = {} as DynamoDBDocumentClient;
    repository = new TaskRepository(mockClient);
  });

  it('should create a task', async () => {
    const taskData = {
      userId: 'user-123',
      title: 'Test Task',
      priority: 'high' as const,
    };

    const task = await repository.create(taskData);

    expect(task).toHaveProperty('id');
    expect(task.userId).toBe('user-123');
    expect(task.title).toBe('Test Task');
    expect(task.completed).toBe(false);
  });

  it('should find task by id', async () => {
    // First create
    const created = await repository.create({
      userId: 'user-123',
      title: 'Test Task',
      priority: 'high',
    });

    // Then find
    const found = await repository.findById(created.id);

    expect(found).toEqual(created);
  });

  it('should return null for non-existent task', async () => {
    const found = await repository.findById('non-existent');
    expect(found).toBeNull();
  });
});
```

## Mocking

### Mocking External APIs

**✅ Good:**

```typescript
// src/api/client.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchUserTasks } from './client';

// Mock fetch
global.fetch = vi.fn();

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch user tasks', async () => {
    const mockResponse = {
      ok: true,
      json: async () => [{ id: '1', title: 'Task 1' }],
    };

    vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

    const tasks = await fetchUserTasks('user-123');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/tasks'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: expect.any(String),
        }),
      })
    );

    expect(tasks).toEqual([{ id: '1', title: 'Task 1' }]);
  });

  it('should handle API errors', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
    };

    vi.mocked(fetch).mockResolvedValue(mockResponse as Response);

    await expect(fetchUserTasks('user-123')).rejects.toThrow(
      'Failed to fetch tasks'
    );
  });
});
```

### Mocking AWS SDK

**✅ Good:**

```typescript
// Use aws-sdk-client-mock
import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const ddbMock = mockClient(DynamoDBDocumentClient);

beforeEach(() => {
  ddbMock.reset();
});

it('should get item from DynamoDB', async () => {
  ddbMock.on(GetCommand).resolves({
    Item: { id: '1', title: 'Test' },
  });

  const item = await getTaskFromDb('1');
  expect(item).toEqual({ id: '1', title: 'Test' });
});
```

## Test Organization

### File Structure

```
src/
  components/
    TaskCard.tsx
    TaskCard.test.tsx        # Co-located with component
  hooks/
    useTasks.ts
    useTasks.test.ts         # Co-located with hook
  utils/
    date.ts
    date.test.ts             # Co-located with utility
  test/
    setup.ts                 # Test configuration
    helpers.ts               # Test utilities
    factories.ts             # Test data factories
```

### Test Data Factories

**✅ Good:**

```typescript
// src/test/factories.ts
import { Task } from '../types';

let taskIdCounter = 1;

export function createTask(overrides?: Partial<Task>): Task {
  return {
    id: `task-${taskIdCounter++}`,
    userId: 'user-123',
    title: 'Test Task',
    priority: 'medium',
    completed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// Usage in tests
it('should handle completed tasks', () => {
  const task = createTask({ completed: true });
  // ...
});
```

## Code Coverage

### Coverage Requirements

**Minimum coverage:**
- Overall: 80%
- New code: 90%
- Critical paths: 100%

### Checking Coverage

```bash
# Run tests with coverage
pnpm test:ci

# View coverage report
open coverage/index.html
```

### Coverage Configuration

```typescript
// vitest.config.ts
coverage: {
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 80,
    statements: 80,
  },
  exclude: [
    'node_modules/',
    'dist/',
    '**/*.test.ts',
    '**/*.config.ts',
    '**/types.ts',
    'src/main.tsx',  // Entry point
  ],
}
```

## Test Best Practices

### 1. AAA Pattern (Arrange-Act-Assert)

**✅ Good:**

```typescript
it('should calculate total price', () => {
  // Arrange
  const items = [
    { price: 10, quantity: 2 },
    { price: 5, quantity: 3 },
  ];

  // Act
  const total = calculateTotal(items);

  // Assert
  expect(total).toBe(35);
});
```

### 2. One Assertion Per Test

**✅ Good:**

```typescript
describe('isOverdue', () => {
  it('should return true for overdue task', () => {
    expect(isOverdue(overdueTask)).toBe(true);
  });

  it('should return false for completed task', () => {
    expect(isOverdue(completedTask)).toBe(false);
  });
});
```

### 3. Descriptive Test Names

**✅ Good:**
```typescript
it('should format date in user locale')
it('should return 400 for invalid email')
it('should disable submit button when form is invalid')
```

**❌ Avoid:**
```typescript
it('works')
it('test 1')
it('should work correctly')
```

### 4. Test Edge Cases

**✅ Good:**

```typescript
describe('divide', () => {
  it('should divide positive numbers', () => {
    expect(divide(10, 2)).toBe(5);
  });

  it('should handle division by zero', () => {
    expect(() => divide(10, 0)).toThrow('Division by zero');
  });

  it('should handle negative numbers', () => {
    expect(divide(-10, 2)).toBe(-5);
  });

  it('should handle decimals', () => {
    expect(divide(10, 3)).toBeCloseTo(3.33, 2);
  });
});
```

### 5. Avoid Test Interdependence

**❌ Avoid:**

```typescript
let sharedState;

it('should create user', () => {
  sharedState = createUser();
  expect(sharedState).toBeDefined();
});

it('should update user', () => {
  // Depends on previous test!
  updateUser(sharedState);
});
```

**✅ Good:**

```typescript
it('should update user', () => {
  const user = createUser(); // Independent
  updateUser(user);
  expect(user.updated).toBe(true);
});
```

## Testing Checklist

- [ ] All new code has unit tests
- [ ] Critical paths have 100% coverage
- [ ] Tests follow AAA pattern
- [ ] Tests are independent and isolated
- [ ] Test names are descriptive
- [ ] Edge cases are tested
- [ ] Error handling is tested
- [ ] Mocks are used appropriately
- [ ] Tests run quickly (< 5 seconds for unit tests)
- [ ] Tests pass in CI/CD pipeline
- [ ] No skipped or disabled tests in main branch
- [ ] Coverage thresholds are met (80%+)
