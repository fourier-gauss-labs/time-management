# DynamoDB Data Architecture

This system uses a **single-table, multi-entity DynamoDB design** with explicit versioning and immutable snapshots. The model is optimized for:

- Strong user data isolation
- Full historical tracking (“source control” semantics)
- Efficient reads for current state
- Extensibility for future features

The architecture is built around two independent but structurally similar domains:

1. **Values Tree Repository** — drivers, milestones, actions
2. **Daily Plan Repository** — daily to-do list and time blocks

Each domain is modeled as a **versioned repository** with:

- A commit log
- A HEAD pointer
- Immutable snapshots per revision

---

## Core Design Principles

### 1. Tenant Isolation

All items are partitioned by user:

```text
PK begins with: U#<userId>
```

This enables:

- Physical data isolation
- Efficient per-user queries
- IAM enforcement via `dynamodb:LeadingKeys`

No cross-user queries are ever required.

---

### 2. Source-Control Semantics

All major datasets are modeled like Git:

- Every change produces a new **revision**
- Revisions are immutable
- A `HEAD` pointer tracks the current revision
- Historical revisions remain accessible forever

This supports:

- Weekly reviews
- Daily rollovers
- Auditing and time travel
- Undo / rollback features

---

## Single Table

**Table Name:** `App`

**Primary Key:**

- `PK` (string)
- `SK` (string)

No GSIs required for MVP.

---

# Domain A — Values Tree Repository

This repository stores the hierarchy of:

- Drivers
- Milestones
- Actions

It is updated during weekly reviews and as actions complete.

---

## Values Metadata Partition

### Partition Key

```text
PK = U#<userId>
```

### Items

#### HEAD pointer

```text
SK = HEAD#VALUES
```

Attributes:

- `headRevId`
- `headRevTs`
- `updatedAt`

#### Commit log (append-only)

```text
SK = REV#VALUES#<timestamp>#<revId>
```

Attributes:

- `revId`
- `revTs`
- `parentRevId`
- `message`
- `source` (weekly_review | daily_update | completion)

---

## Values Snapshot (Materialized View)

Each revision has its own immutable snapshot partition.

### Snapshot Partition Key

```text
PK = U#<userId>#VALUES#<revId>
```

All data for that revision lives inside this partition.

---

### Node Items

One per driver, milestone, or action.

```text
SK = NODE#<nodeId>
```

Attributes:

- `nodeType`: DRIVER | MILESTONE | ACTION
- `title`
- `notes`
- `createdAt`
- `completedAt`
- `archived`
- `driverId` (required for ACTION)
- `parentMilestoneId` (nullable)
- `rootDriverId`

---

### Edge Items (Hierarchy)

Parent → child relationships with explicit ordering.

```text
SK = EDGE#<parentNodeId>#<order>#<childNodeId>
```

Attributes:

- `childNodeId`
- `childNodeType`

This supports:

- Ordered traversal
- Arbitrary depth
- Non-strict hierarchies

---

## Hierarchy Rules

- Every ACTION **must** have a `driverId`
- An ACTION **may or may not** have a `parentMilestoneId`
- Milestones may have:
  - child milestones
  - child actions

- Drivers only have children

This enforces:

- Actions always live under a driver
- Milestones are optional decomposition layers

---

## Creating a New Values Revision

1. Read `HEAD#VALUES`
2. Create new `REV#VALUES#...`
3. Write new snapshot partition:

   ```text
   U#<userId>#VALUES#<newRevId>
   ```

4. Update `HEAD#VALUES` (conditional write)

---

# Domain B — Daily Plan Repository

The daily plan is versioned per day.

Each day is its own repository with full history.

---

## Daily Plan Metadata Partition

### Partition Key

```text
PK = U#<userId>#PLAN#<YYYY-MM-DD>
```

### Items

#### HEAD pointer

```text
SK = HEAD
```

Attributes:

- `headRevId`
- `updatedAt`

#### Commit log

```text
SK = REV#<timestamp>#<revId>
```

Attributes:

- `revId`
- `parentRevId`
- `reason` (morning_plan | midday_replan | rollover | completion)

---

## Daily Plan Snapshot

### Snapshot Partition Key

```text
PK = U#<userId>#PLAN#<YYYY-MM-DD>#<revId>
```

---

### To-Do List Items

Ordered list of actions selected for the day.

```text
SK = TODO#<order>#A#<actionId>
```

Attributes:

- `actionId`
- `classification` (urgent | important | other)
- `estimatedPomodoros`
- `notes`

---

### Time Blocks

Calendar timeline.

```text
SK = BLOCK#<startTimeIso>#<blockId>
```

Attributes:

- `blockType`: MEETING | POMODORO | BREAK | BUFFER
- `endTimeIso`
- If POMODORO:
  - `actionId`
  - `pomodoroIndex`

---

# Query Patterns

## Current Values Tree

```text
GetItem:
  PK = U#<userId>
  SK = HEAD#VALUES
```

Then:

```text
Query:
  PK = U#<userId>#VALUES#<revId>
```

---

## Values History

```text
Query:
  PK = U#<userId>
  begins_with(SK, "REV#VALUES#")
```

---

## Current Daily Plan

```text
GetItem:
  PK = U#<userId>#PLAN#2026-01-23
  SK = HEAD
```

Then:

```text
Query:
  PK = U#<userId>#PLAN#2026-01-23#<revId>
```

---

## List Children of Node

```text
Query:
  PK = U#<userId>#VALUES#<revId>
  begins_with(SK, "EDGE#<parentNodeId>#")
```

---

# Identity & Security

All items are keyed by:

```text
PK starts with: U#<userId>
```

This allows IAM policies such as:

```json
"Condition": {
  "ForAllValues:StringLike": {
    "dynamodb:LeadingKeys": ["U#${cognito:sub}*"]
  }
}
```

This guarantees:

- No accidental cross-user reads
- Hard security boundary at the database layer

---

# Deletion & History

No hard deletes.

Instead:

- Nodes are tombstoned:
  - `archived = true`
  - `deletedAt`

- Tombstones are preserved across snapshots

This guarantees:

- Historical integrity
- Referential safety
- Full auditability

---

# Why This Architecture Works

| Requirement          | Satisfied By         |
| -------------------- | -------------------- |
| User privacy         | PK prefix isolation  |
| Weekly evolution     | Immutable revisions  |
| Daily evolution      | Per-day repositories |
| History              | Git-style commits    |
| Non-strict hierarchy | Edge graph           |
| Efficient reads      | Snapshot partitions  |
| Extensibility        | New node types       |
| Rollbacks            | HEAD pointer         |
| Audit trail          | Commit log           |

---

# Mental Model

This system treats DynamoDB as:

> A **versioned, append-only object store** with
> **materialized views per revision**.

We are not storing “records”.

We are storing **time-indexed state transitions**.
