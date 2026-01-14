# Sprint 4 — Core Domain Model

**Primary Epic:** EPIC 4 — Drivers, Actions, Milestones

**Sprint Intent**
Implement the fundamental domain model that encodes the system's philosophy into data structures and business rules. This sprint establishes the hierarchical relationship between drivers (why), milestones (when), and actions (what), ensuring all work traces back to meaningful purpose and preventing the creation of orphaned or misaligned actions.

---

## Goals

Define what success looks like for this sprint.

- Domain models defined and enforced in shared package
- Driver → milestone → action hierarchy implemented and validated
- Action states and lifecycle properly managed
- Recurrence model for habits functioning correctly
- Daily snapshot persistence working
- All domain rules backed by comprehensive unit tests

---

## In Scope

Explicitly list what this sprint will cover.

- **Domain model definitions:**
  - Driver entity (purpose, meaning, strategic intent)
  - Milestone entity (temporal targets linked to drivers)
  - Action entity (executable work linked to milestones)
  - Action states (planned, in-progress, completed, deferred, rolled-over)
  - Recurrence patterns for habitual actions

- **Hierarchical relationships:**
  - Every action must link to a milestone
  - Every milestone must link to a driver
  - Orphan detection and prevention

- **DynamoDB single-table schema design:**
  - Entity type discrimination
  - Partition and sort key strategy
  - Access patterns for queries
  - User isolation enforcement

- **Daily snapshot persistence:**
  - Snapshot creation logic
  - Historical state preservation
  - Query patterns for retrieving snapshots

- **Domain-level unit tests:**
  - Entity validation tests
  - Relationship enforcement tests
  - State transition tests
  - Recurrence logic tests

- **TypeScript types and interfaces in shared package:**
  - Exported types for use across frontend and backend
  - Zod schemas for runtime validation
  - Domain invariants enforced by types

---

## Out of Scope

Explicitly list what this sprint will _not_ attempt to do.

- User interface implementation (deferred to Sprint 5+)
- API endpoints for creating/updating entities (deferred to Sprint 5+)
- Onboarding flow and default content creation (Sprint 5)
- Weekly review workflow (Sprint 6)
- Daily planning workflow (Sprint 7)
- Coach integration and suggestions (Sprint 11)
- Data migration or import from external systems
- Soft delete or archive functionality (hard delete is sufficient for v1)
- Audit logging or change history tracking
- Optimistic locking or conflict resolution
- Multi-user collaboration or sharing
- Bulk operations or batch processing

> This section exists to prevent scope creep and over-eager AI assistance.

---

## System Context & Assumptions

Describe the system-level truths and constraints that apply during this sprint.

- **Dependency on Sprint 1-3:** Authentication, infrastructure, DynamoDB, and CI/CD are operational
- **Philosophy-driven design:** The domain model directly reflects the system's core philosophy:
  - Drivers represent "why" (meaning before execution)
  - Milestones represent "when" (temporal anchors)
  - Actions represent "what" (executable work)
  - Every action must trace to meaningful purpose
- **Single-table DynamoDB design:** All entities stored in one table with composite keys
- **User data isolation:** All entities scoped to authenticated user via partition key
- **No shared data:** Users cannot see or interact with other users' data
- **Immutable snapshots:** Daily snapshots are never modified after creation
- **Action lifecycle:** Actions progress through defined states, never arbitrary
- **Recurrence as first-class concept:** Habits and recurring actions are core, not afterthoughts
- **TypeScript-first validation:** Runtime validation using Zod schemas
- **Shared package as source of truth:** Domain logic lives in `/packages/shared`, not duplicated
- **Eventual consistency acceptable:** DynamoDB strong consistency not required for v1

---

## Functional Requirements

Describe the business-level behaviors the system must support as a result of this sprint.
Each requirement should be independently testable.

### FR-1: Driver Entity Management

**Description**
Drivers represent the fundamental "why" behind work. They capture strategic intent, personal values, and meaningful purpose. The system must enforce that drivers are well-formed and that they serve as the root of the hierarchy.

**Acceptance Criteria**

- Given a driver is created, when validating the entity, then it must have a unique ID, user ID, title, and creation timestamp
- Given a driver is created, when checking for required fields, then description and active status are optional with defaults
- Given a driver has no milestones, when querying for orphaned drivers, then it appears in the orphan detection results
- Given a driver is deactivated, when querying active drivers, then it is excluded from results
- Given a driver is deleted, when checking for cascade rules, then all dependent milestones and actions are identified for cleanup

---

### FR-2: Milestone Entity Management

**Description**
Milestones represent temporal targets or outcomes tied to drivers. They provide the "when" dimension of planning. The system must ensure milestones are always linked to valid drivers.

**Acceptance Criteria**

- Given a milestone is created, when validating the entity, then it must have a unique ID, user ID, driver ID, title, and creation timestamp
- Given a milestone references a driver ID, when validating, then the driver must exist and belong to the same user
- Given a milestone is created without a driver ID, when attempting to persist, then the operation fails with a clear error
- Given a milestone has an optional target date, when provided, then it must be a valid ISO 8601 date string
- Given a milestone is deleted, when checking for cascade rules, then all dependent actions are identified for cleanup

---

### FR-3: Action Entity Management

**Description**
Actions represent executable work tied to milestones. The system must enforce that actions are always linked to valid milestones (and by extension, drivers), preventing orphaned actions.

**Acceptance Criteria**

- Given an action is created, when validating the entity, then it must have a unique ID, user ID, milestone ID, title, state, and creation timestamp
- Given an action references a milestone ID, when validating, then the milestone must exist and belong to the same user
- Given an action is created without a milestone ID, when attempting to persist, then the operation fails with a clear error message
- Given an action has no milestone link, when running orphan detection, then it is identified and flagged for correction
- Given an action is deleted, when the operation completes, then no cascade deletion occurs (actions are leaf nodes)

---

### FR-4: Action State Lifecycle

**Description**
Actions progress through well-defined states representing their lifecycle. The system must enforce valid state transitions and maintain state history for daily snapshots.

**Acceptance Criteria**

- Given an action is created, when no state is specified, then it defaults to "planned"
- Given an action is in "planned" state, when transitioning, then it can move to "in-progress" or "deferred"
- Given an action is in "in-progress" state, when transitioning, then it can move to "completed", "deferred", or back to "planned"
- Given an action is in "completed" state, when transitioning, then it can only move to "rolled-over" (for recurring actions) or remain completed
- Given an action is in "deferred" state, when transitioning, then it can move to "planned" or remain deferred
- Given an action is in "rolled-over" state, when a new instance is created, then the original action maintains its state

---

### FR-5: Recurrence Model for Habits

**Description**
Actions can be marked as recurring, representing habitual behaviors. The system must support various recurrence patterns and generate new action instances based on the pattern.

**Acceptance Criteria**

- Given an action has a recurrence pattern, when validating, then the pattern must specify frequency (daily, weekly, monthly) and optional end condition
- Given a daily recurring action is completed, when the next day begins, then a new action instance is created with "planned" state
- Given a weekly recurring action is completed, when the specified weekday arrives, then a new action instance is created
- Given a recurring action has an end date, when the end date is reached, then no new instances are created
- Given a recurring action is deleted, when checking the impact, then future instances are prevented but historical instances remain unchanged
- Given a recurring action is modified, when the change is saved, then only future instances are affected

---

### FR-6: Daily Snapshot Persistence

**Description**
The system captures a snapshot of all actions and their states at the end of each day, preserving historical data for retrospective analysis and insight generation.

**Acceptance Criteria**

- Given the day ends (defined as UTC midnight or user's timezone), when the snapshot process runs, then all active actions and their current states are persisted
- Given a snapshot is created, when validating its structure, then it includes timestamp, user ID, and complete action list with states
- Given a snapshot exists, when querying historical data, then snapshots are retrievable by user ID and date range
- Given multiple snapshots exist for a user, when querying, then they are returned in chronological order
- Given a snapshot is created, when attempting to modify it, then the operation fails (snapshots are immutable)
- Given an action is deleted, when a snapshot was previously created, then the historical snapshot remains unchanged

---

### FR-7: DynamoDB Single-Table Schema

**Description**
All domain entities are stored in a single DynamoDB table with a carefully designed key structure that enables efficient queries while maintaining user data isolation.

**Acceptance Criteria**

- Given the schema design, when examining partition keys, then they follow the pattern `USER#<userId>#<entityType>#<entityId>`
- Given the schema design, when examining sort keys, then they enable entity-type queries and hierarchical traversal
- Given a user queries their data, when using partition key, then only their data is accessible (enforced by key design)
- Given entities must be retrieved by hierarchy, when querying, then driver → milestone → action relationships are efficiently traversable
- Given a daily snapshot is stored, when using the partition key, then it follows the pattern `USER#<userId>#SNAPSHOT#<date>`
- Given DynamoDB best practices, when designing access patterns, then they avoid expensive scans in favor of queries

---

### FR-8: Domain Invariant Enforcement

**Description**
The shared package must enforce domain invariants through TypeScript types, Zod schemas, and validation logic that prevents invalid data from entering the system.

**Acceptance Criteria**

- Given an action is created without a milestone ID, when validation runs, then it fails with error "Actions must be linked to a milestone"
- Given a milestone is created without a driver ID, when validation runs, then it fails with error "Milestones must be linked to a driver"
- Given an entity has a circular reference, when validation runs, then it fails with error indicating the circular dependency
- Given an entity is created by a user, when validation runs, then the user ID must match the authenticated user context
- Given an action transitions to an invalid state, when validation runs, then it fails with error listing valid state transitions
- Given a recurring pattern is malformed, when validation runs, then it fails with specific error about the pattern structure

---

## Non-Functional Requirements

List only the non-functional requirements that are relevant _for this sprint_.

### Security

- User data must be isolated by partition key (no cross-user data access)
- All entity IDs must be UUIDs (not sequential) to prevent enumeration attacks
- Validation must occur both client-side (TypeScript types) and server-side (Zod schemas)
- DynamoDB access must use least-privilege IAM policies per Lambda function

### Performance

- Entity validation should complete in <10ms for typical entities
- DynamoDB queries for user's entities should complete in <100ms
- Single-table design should support all required access patterns without scans
- Daily snapshot creation should complete in <5 seconds for typical user data (up to 100 actions)

### Reliability & Error Handling

- Validation failures must return clear, actionable error messages
- Invalid data must never be persisted to DynamoDB
- Schema validation failures must be logged for debugging
- DynamoDB write failures must be retried with exponential backoff
- Orphan detection must be defensive and never throw exceptions

### Developer Experience

- Domain types exported from shared package for use in frontend and backend
- Comprehensive unit test coverage (90%+ for domain logic)
- Clear TypeScript interfaces with JSDoc comments
- Test fixtures and factories for creating test entities
- Easy to add new entity types following established patterns

---

## Data & State Changes

Describe any changes to persisted data or system state.

- **New DynamoDB table:** `TimeManagement-{env}` single table for all entities
- **New entity types:**
  - Driver (strategic intent)
  - Milestone (temporal target)
  - Action (executable work)
  - DailySnapshot (immutable historical state)
- **Key schema:**
  - PK: `USER#<userId>#<entityType>#<entityId>`
  - SK: varies by entity type to support hierarchical queries
- **Global Secondary Indexes (GSIs):**
  - Potentially one GSI for querying by entity type (e.g., all drivers for a user)
  - GSI for snapshot retrieval by date range
- **New attributes:**
  - All entities: id, userId, createdAt, updatedAt
  - Driver: title, description, isActive
  - Milestone: driverId, title, description, targetDate
  - Action: milestoneId, title, description, state, recurrencePattern, estimatedMinutes, trigger
  - DailySnapshot: date, actions (array), createdAt
- **No migration needed:** This is the first sprint introducing persistent domain data

> Do not include implementation code here—describe intent.

---

## API & Integration Touchpoints

Include this section only if APIs or integrations are affected.

- **No new API endpoints in this sprint:** This sprint focuses on domain model and data layer
- **Shared package exports:** Domain types and validation logic exported for use by API handlers (future sprints)
- **DynamoDB SDK:** Integration with AWS SDK for DynamoDB operations
- **No external API calls:** All logic is internal to the system

> API endpoint implementation deferred to Sprint 5 when onboarding and UI are introduced.

---

## Testing Strategy

Describe how correctness will be validated for this sprint.

- **Unit tests for domain entities:**
  - Driver creation, validation, and default values
  - Milestone creation, validation, and driver linkage
  - Action creation, validation, and milestone linkage
  - Action state transitions and lifecycle
  - Recurrence pattern parsing and validation
  - Daily snapshot creation and immutability

- **Unit tests for validation logic:**
  - Zod schema validation for all entity types
  - TypeScript type guards and narrowing
  - Error message clarity and actionability

- **Unit tests for DynamoDB operations:**
  - Mocked DynamoDB SDK calls
  - Correct key construction (PK and SK)
  - Query patterns for hierarchical traversal
  - User isolation verification (wrong user cannot access data)

- **Integration tests (optional for this sprint):**
  - End-to-end entity creation flow (driver → milestone → action)
  - Orphan detection across multiple entities
  - Daily snapshot creation with real-like data

- **Edge cases to cover:**
  - Creating action without milestone (should fail)
  - Creating milestone without driver (should fail)
  - Invalid state transitions (should fail)
  - Malformed recurrence patterns (should fail)
  - Orphan detection with complex hierarchies
  - Concurrent updates to same entity (last-write-wins acceptable for v1)
  - Daily snapshot with zero actions (should succeed)
  - Daily snapshot with 1000+ actions (performance test)

- **Test data factories:**
  - Factory functions for creating valid test entities
  - Fixtures for common test scenarios
  - Helper functions for asserting validation failures

---

## Observability & Diagnostics

If relevant, describe expectations for visibility into system behavior.

- **Logging requirements:**
  - Log validation failures with entity type and specific field errors
  - Log DynamoDB write failures with error details
  - Log orphan detection results (count and entity IDs)
  - Log daily snapshot creation (timestamp and action count)

- **Metrics to emit:**
  - Count of validation failures by entity type
  - Count of orphaned actions/milestones detected
  - Count of actions by state (planned, in-progress, completed, etc.)
  - Daily snapshot creation success/failure rate

- **Debugging support:**
  - Include entity IDs in all log messages
  - Include user IDs (hashed or truncated) for cross-referencing
  - Clear error messages for common validation failures

---

## Open Questions & Decisions

Capture known uncertainties without blocking progress.

- **Q: Should daily snapshots run on a scheduled Lambda or be triggered by user activity?**
  - Decision: Scheduled Lambda at UTC midnight (simplest for v1)
  - Owner: Architecture team
  - Timing: Before Sprint 5 implementation

- **Q: How should action rollover work when a user doesn't complete an action?**
  - Decision: Addressed in Sprint 7 (deliberate rollover with user confirmation)
  - Owner: Product team
  - Timing: Sprint 7 planning

- **Q: Should recurrence patterns support complex rules (e.g., "every other Tuesday")?**
  - Decision: Start with simple patterns (daily, weekly, monthly) in Sprint 4; defer complex patterns to future
  - Owner: Product team
  - Timing: Decided for v1

- **Q: How many GSIs are needed for optimal query performance?**
  - Decision: Start with 1-2 GSIs; monitor and add more if needed
  - Owner: Backend team
  - Timing: During Sprint 4 implementation

- **Q: Should we support soft delete or only hard delete?**
  - Decision: Hard delete is sufficient for v1; soft delete can be added later if needed
  - Owner: Product team
  - Timing: Decided for v1

---

## Exit Criteria

Restate the conditions under which this sprint is considered complete.

- Shared package exports TypeScript types and Zod schemas for Driver, Milestone, Action, and DailySnapshot entities
- Unit tests achieve 90%+ code coverage for domain logic
- All tests pass in CI pipeline
- DynamoDB single-table schema is defined and documented
- Creating an action without a milestone fails validation with clear error message
- Creating a milestone without a driver fails validation with clear error message
- Action state transitions follow defined lifecycle rules
- Recurrence patterns are parsed and validated correctly
- Daily snapshot creation logic is implemented and tested
- Orphan detection logic identifies actions/milestones not linked to drivers
- All domain invariants are enforced by validation logic
- Documentation exists for adding new entity types following established patterns

> If all exit criteria are met, the sprint is done.

---

## Notes

**Philosophy Alignment**
This sprint directly implements the core philosophy of the system:

- **Meaning before execution:** Every action must trace to a driver (why)
- **Intentional planning:** The hierarchy prevents arbitrary or orphaned work
- **Honest reflection:** Daily snapshots enable retrospective analysis without judgment

**Technical Debt Acceptable for v1**

- No optimistic locking or conflict resolution (last-write-wins is acceptable)
- No audit trail or change history (snapshots provide historical state)
- No soft delete (hard delete simplifies logic)
- No multi-user features or sharing (out of scope)

**Future Considerations**

- Sprint 5 will build onboarding flow and create default drivers/actions
- Sprint 6 will implement weekly review workflow using these entities
- Sprint 7 will implement daily planning using these entities
- Sprint 10 will use daily snapshots for insights and reflection
- Sprint 11 will use domain rules for coach suggestions

**References**

- [Sprint Plan](sprint-plan.md) — Overall sprint breakdown
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [Zod Documentation](https://zod.dev/) — Runtime validation library
