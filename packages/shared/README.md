# Shared Package - Domain Model Documentation

This package contains the core domain model for the time-management application, including types, validation schemas, business logic, and database utilities.

## Table of Contents

- [Domain Model Overview](#domain-model-overview)
- [Entity Types](#entity-types)
- [DynamoDB Schema](#dynamodb-schema)
- [Validation](#validation)
- [Business Logic](#business-logic)
- [Testing](#testing)
- [Adding New Entity Types](#adding-new-entity-types)

## Domain Model Overview

The domain model implements the system's core philosophy:

- **Drivers** represent "why" (meaning before execution)
- **Milestones** represent "when" (temporal anchors)
- **Actions** represent "what" (executable work)
- **DailySnapshots** capture historical state for reflection

### Hierarchical Relationships

```
Driver (1) ──> (N) Milestone (1) ──> (N) Action
```

**Invariants:**

- Every Action must link to a Milestone
- Every Milestone must link to a Driver
- No orphaned entities are allowed

## Entity Types

### Driver

Represents strategic intent and purpose.

```typescript
interface Driver {
  id: DriverId;
  userId: UserId;
  title: string;
  description?: string;
  isActive: boolean;
  createdAt: ISO8601Date;
  updatedAt: ISO8601Date;
}
```

### Milestone

Represents temporal targets linked to drivers.

```typescript
interface Milestone {
  id: MilestoneId;
  userId: UserId;
  driverId: DriverId;
  title: string;
  description?: string;
  targetDate?: ISO8601Date;
  createdAt: ISO8601Date;
  updatedAt: ISO8601Date;
}
```

### Action

Represents executable work linked to milestones.

```typescript
interface Action {
  id: ActionId;
  userId: UserId;
  milestoneId: MilestoneId;
  title: string;
  description?: string;
  state: ActionState;
  recurrencePattern?: RecurrencePattern;
  estimatedMinutes?: number;
  trigger?: string;
  createdAt: ISO8601Date;
  updatedAt: ISO8601Date;
}
```

**Action States:**

- `planned` - Default state
- `in-progress` - Currently being worked on
- `completed` - Finished
- `deferred` - Postponed
- `rolled-over` - Terminal state for recurring actions

### DailySnapshot

Immutable historical state of actions for a specific day.

```typescript
interface DailySnapshot {
  id: string;
  userId: UserId;
  date: string; // YYYY-MM-DD format
  actions: Action[];
  createdAt: ISO8601Date;
}
```

## DynamoDB Schema

### Single-Table Design

All entities are stored in one DynamoDB table using composite keys.

### Key Structure

**Partition Key (PK):** `USER#<userId>#<entityType>#<entityId>`

**Sort Key (SK):** Varies by entity type to support hierarchical queries

#### Driver Keys

- **PK:** `USER#<userId>#DRIVER#<driverId>`
- **SK:** `DRIVER#<driverId>`

#### Milestone Keys

- **PK:** `USER#<userId>#MILESTONE#<milestoneId>`
- **SK:** `DRIVER#<driverId>#MILESTONE#<milestoneId>`

#### Action Keys

- **PK:** `USER#<userId>#ACTION#<actionId>`
- **SK:** `MILESTONE#<milestoneId>#ACTION#<actionId>`

#### Snapshot Keys

- **PK:** `USER#<userId>#SNAPSHOT#<date>`
- **SK:** `SNAPSHOT#<date>`

### Usage Example

```typescript
import { getActionKey } from '@time-management/shared';

const key = getActionKey('user-123', 'milestone-456', 'action-789');
// Returns:
// {
//   PK: 'USER#user-123#ACTION#action-789',
//   SK: 'MILESTONE#milestone-456#ACTION#action-789'
// }
```

### Benefits

1. **User Isolation:** Partition key includes user ID
2. **Hierarchical Queries:** Sort key enables parent-child traversal
3. **Efficient Queries:** No table scans required for common access patterns
4. **Single Table:** Reduces complexity and cost

## Validation

### Zod Schemas

All entities have corresponding Zod schemas for runtime validation.

```typescript
import { DriverSchema, CreateDriverInputSchema } from '@time-management/shared';

// Validate existing entity
const result = DriverSchema.safeParse(driver);
if (!result.success) {
  console.error(result.error.issues);
}

// Validate creation input
const inputResult = CreateDriverInputSchema.safeParse({
  userId: 'user-123',
  title: 'My Driver',
  isActive: true,
});
```

### Validation Rules

- **Title:** Required, 1-200 characters
- **Description:** Optional, max 1000 characters
- **UUIDs:** All IDs must be valid UUIDs
- **EstimatedMinutes:** If provided, must be positive integer ≤ 1440 (24 hours)
- **Recurrence End Date:** Cannot be in the past

## Business Logic

### Action State Transitions

```typescript
import { validateStateTransition, getValidNextStates } from '@time-management/shared';

// Check valid transitions
validateStateTransition('planned', 'in-progress'); // OK
validateStateTransition('planned', 'completed'); // Throws InvalidStateTransitionError

// Get available next states
const nextStates = getValidNextStates('in-progress');
// Returns: ['completed', 'deferred', 'planned']
```

### Recurrence Patterns

```typescript
import { getNextOccurrence, shouldCreateInstance } from '@time-management/shared';

const pattern = {
  frequency: 'weekly',
  interval: [1, 3, 5], // Monday, Wednesday, Friday
  endDate: '2026-12-31T00:00:00.000Z',
};

const nextDate = getNextOccurrence(pattern, new Date());
const shouldCreate = shouldCreateInstance(pattern, new Date(), lastOccurrence);
```

### Orphan Detection

```typescript
import { detectOrphans, validateActionNotOrphaned } from '@time-management/shared';

const result = detectOrphans(drivers, milestones, actions);
// Returns:
// {
//   orphanedActions: Action[],
//   orphanedMilestones: Milestone[],
//   orphanedDrivers: Driver[]
// }

// Validate before creating
validateActionNotOrphaned(milestoneId, milestones);
// Throws if milestone doesn't exist
```

## Testing

### Running Tests

```bash
# Run tests
pnpm test

# Run with coverage
pnpm test:coverage

# Watch mode
pnpm test:ui
```

### Test Fixtures

```typescript
import {
  createTestDriver,
  createTestMilestone,
  createTestAction,
  createTestHierarchy,
} from '@time-management/shared';

// Create individual entities
const driver = createTestDriver({ title: 'Custom Title' });
const milestone = createTestMilestone({ driverId: driver.id });

// Create complete hierarchy
const { driver, milestone, action } = createTestHierarchy();
```

### Coverage Target

- **Overall:** 90%+ coverage
- **Domain Logic:** 95%+ coverage
- **Validation:** 100% coverage

## Adding New Entity Types

Follow these steps to add a new entity type:

### 1. Define Types

Add to `src/types/domain.ts`:

```typescript
export type NewEntityId = string;

export interface NewEntity extends TimestampedEntity {
  id: NewEntityId;
  userId: UserId;
  // ... other fields
}

export interface CreateNewEntityInput {
  userId: UserId;
  // ... required fields
}
```

### 2. Create Zod Schema

Add to `src/validation/schemas.ts`:

```typescript
export const NewEntitySchema = z.object({
  id: z.string().uuid(),
  userId: z.string(),
  // ... other fields
  createdAt: ISO8601DateSchema,
  updatedAt: ISO8601DateSchema,
});

export const CreateNewEntityInputSchema = z.object({
  userId: z.string(),
  // ... required fields
});
```

### 3. Add DynamoDB Key Functions

Add to `src/database/dynamodb-keys.ts`:

```typescript
export function getNewEntityPK(userId: UserId, entityId: NewEntityId): string {
  return `USER#${userId}#NEWENTITY#${entityId}`;
}

export function getNewEntitySK(entityId: NewEntityId): string {
  return `NEWENTITY#${entityId}`;
}

export function getNewEntityKey(userId: UserId, entityId: NewEntityId): DynamoDBKey {
  return {
    PK: getNewEntityPK(userId, entityId),
    SK: getNewEntitySK(entityId),
  };
}
```

### 4. Create Test Fixtures

Add to `src/test/fixtures.ts`:

```typescript
export function createTestNewEntity(overrides?: Partial<NewEntity>): NewEntity {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    userId: 'test-user-id',
    // ... default values
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}
```

### 5. Write Tests

Create `src/validation/new-entity-schemas.test.ts` and add comprehensive tests.

### 6. Update Exports

Add to `src/index.ts`:

```typescript
export * from './types/domain'; // Types already exported
export * from './validation/schemas'; // Schemas already exported
export * from './database/dynamodb-keys'; // Functions already exported
```

### 7. Update Entity Type Enum

Add to `src/database/dynamodb-keys.ts`:

```typescript
export type EntityType = 'DRIVER' | 'MILESTONE' | 'ACTION' | 'SNAPSHOT' | 'NEWENTITY';
```

## Philosophy Alignment

This domain model directly implements the system's core philosophy:

- **Meaning before execution:** Every action must trace to a driver (why)
- **Intentional planning:** The hierarchy prevents arbitrary or orphaned work
- **Honest reflection:** Daily snapshots enable retrospective analysis without judgment

## License

Private - Internal use only
