# Sprint 6 — Weekly Review (Strategic Layer)

**Primary Epic:** EPIC 6 — Weekly Driver Review

**Sprint Intent**
This sprint makes introspection a first-class citizen by implementing a structured weekly review workflow. Users will pause, reflect on their drivers, and plan the week ahead—transforming the system from a passive task manager into an active partner in strategic thinking.

---

## Goals

Define what success looks like for this sprint.

- Implement a repeatable weekly review workflow that feels calm and purposeful
- Enable users to edit drivers and create milestones/actions during review
- Provide coach reminders for missed reviews to maintain consistency
- Create a UI state that encourages focus and reflection

---

## In Scope

Explicitly list what this sprint will cover.

- Weekly review workflow implementation
- Review day configuration (user-selectable)
- Driver editing capabilities during review
- Milestone and action creation within the review context
- Coach reminder system for missed reviews
- Focused, calm UI state for review mode
- Minimal persistence enhancements to support review state

---

## Out of Scope

Explicitly list what this sprint will _not_ attempt to do.

- Historical review analytics or trends (deferred to Sprint 10)
- AI-driven review suggestions
- Integration with calendar systems (Sprint 9)
- Multi-week planning or forecasting
- Detailed completion metrics or dashboards
- Review templates or customizable review flows

> This section exists to prevent scope creep and over-eager AI assistance.

---

## System Context & Assumptions

Describe the system-level truths and constraints that apply during this sprint.

- Domain model (drivers → milestones → actions) exists from Sprint 4
- User authentication and per-user data isolation is fully functional (Sprint 1)
- Infrastructure supports serverless Lambda functions and DynamoDB (Sprint 2)
- CI/CD pipelines are operational (Sprint 3)
- System-initiated onboarding has created default drivers (Sprint 5)
- Users have a mental model of drivers as the "why" behind their actions
- The coach framework does not yet exist—reminders will be simple, rules-based triggers
- Review is a weekly ritual, not an on-demand feature

---

## Functional Requirements

Describe the business-level behaviors the system must support as a result of this sprint.

### FR-1: Review Day Configuration

**Description**
Users must be able to configure which day of the week they prefer to conduct their weekly review. This preference is stored per-user and used to determine when review reminders are triggered.

**Acceptance Criteria**

- Given a logged-in user, when they access settings, then they can select a review day from Sunday through Saturday
- Given a user has configured a review day, when the system checks reminder eligibility, then it uses the configured day
- Given a user has not yet configured a review day, when they first access the system, then a sensible default (e.g., Sunday) is applied

---

### FR-2: Weekly Review Workflow Initiation

**Description**
Users can initiate a weekly review session on their configured day or manually at any time. The review session transitions the UI into a focused, calm state optimized for reflection.

**Acceptance Criteria**

- Given a user's configured review day has arrived, when they log in, then they are prompted to begin their weekly review
- Given a user is in the main application, when they manually initiate a review, then the system enters review mode
- Given a user is in review mode, when the UI renders, then it presents a calm, distraction-free interface focused on drivers and strategic planning

---

### FR-3: Driver Editing During Review

**Description**
Users can edit their existing drivers during the weekly review. This includes updating driver titles, descriptions, and archiving drivers that are no longer relevant.

**Acceptance Criteria**

- Given a user is in review mode, when they view a driver, then they can edit its title and description
- Given a user is editing a driver, when they save changes, then the updates are persisted immediately
- Given a user has a driver that is no longer relevant, when they archive it, then it no longer appears in active views but remains in the system for historical purposes
- Given a user archives a driver, when they view their driver list, then the archived driver is excluded from the default view

---

### FR-4: Milestone and Action Creation in Review

**Description**
Users can create new milestones and actions linked to their drivers during the weekly review session. This allows strategic planning to flow naturally into tactical execution.

**Acceptance Criteria**

- Given a user is reviewing a driver, when they create a milestone, then it is associated with that driver
- Given a user has created a milestone, when they create an action, then they can link it to that milestone
- Given a user creates an action during review, when they specify it as recurring, then the recurrence pattern is applied (leveraging Sprint 4 capabilities)
- Given a user creates milestones or actions during review, when they complete the review, then all created items are available in the main application

---

### FR-5: Coach Reminders for Missed Reviews

**Description**
The system detects when a user has not completed their weekly review and provides gentle reminders to encourage consistency.

**Acceptance Criteria**

- Given a user's review day has passed, when they have not initiated a review, then the system surfaces a reminder on their next login
- Given a user sees a review reminder, when they dismiss it, then they can continue using the application normally
- Given a user consistently misses reviews, when they log in, then the reminder persists but does not block access to other features
- Given a user completes a review, when the next review day arrives, then the reminder logic resets

---

### FR-6: Review Completion and Exit

**Description**
Users can complete their weekly review session, transitioning back to normal application mode while persisting their review completion timestamp.

**Acceptance Criteria**

- Given a user is in review mode, when they mark the review as complete, then the system records the completion timestamp
- Given a user completes a review, when they return to the main application, then the UI exits review mode
- Given a review completion is recorded, when the reminder system checks eligibility, then it calculates the next review date based on the user's configured day

---

## Non-Functional Requirements

List only the non-functional requirements that are relevant _for this sprint_.

### Security

- All review data (driver edits, new milestones/actions) must respect per-user data isolation
- Review day configuration is stored securely and associated with the authenticated user

### Performance

- Review mode transition should feel instant (< 200ms UI state change)
- Driver, milestone, and action mutations during review must complete within 1 second
- Review reminder checks should not add noticeable latency to application load

### Reliability & Error Handling

- If a driver edit fails during review, the user is notified clearly and can retry
- Partial completion of review (e.g., creating some milestones but not finishing) should not result in data loss
- Review reminders must handle timezone differences correctly based on user settings

### Developer Experience

- Review mode UI components should be testable in isolation
- Review logic should have comprehensive unit tests covering reminder timing and state transitions
- CI pipeline must pass with full test coverage for review workflows

---

## Data & State Changes

Describe any changes to persisted data or system state.

- **User settings table/entity:** Add `reviewDay` field (enum: Sunday-Saturday) with default value
- **Review completion tracking:** New entity or attribute to store timestamp of last completed review per user
- **Driver archival:** Add `isArchived` boolean flag to driver entity (default: false)
- **No schema migrations required for existing drivers, milestones, or actions**
- Review state is ephemeral (UI state only)—no new "review session" entity needed
- All mutations during review use existing CRUD operations on drivers, milestones, and actions

> Do not include implementation code here—describe intent.

---

## API & Integration Touchpoints

Include this section only if APIs or integrations are affected.

- **GET /user/settings:** Retrieve user's review day configuration
- **PUT /user/settings:** Update review day configuration
- **GET /review/status:** Check if review is due and return last completion timestamp
- **POST /review/complete:** Mark review as completed (records timestamp)
- **PUT /drivers/{driverId}:** Update driver (existing endpoint, supports archival flag)
- **POST /drivers/{driverId}/milestones:** Create milestone (existing endpoint)
- **POST /milestones/{milestoneId}/actions:** Create action (existing endpoint)

All endpoints require authenticated user context and enforce per-user data isolation.

---

## Testing Strategy

Describe how correctness will be validated for this sprint.

- **Unit tests:**
  - Review reminder logic (day-of-week calculation, timezone handling)
  - Driver archival behavior
  - Review completion timestamp persistence
  - Review day configuration validation

- **Integration tests:**
  - Complete review workflow: initiate → edit driver → create milestone → create action → complete
  - Review reminder triggers after missed review
  - Archived drivers do not appear in active views

- **Edge cases:**
  - User changes review day mid-week
  - User initiates review on non-configured day
  - Timezone edge cases (e.g., user in UTC-12 vs UTC+12)
  - Multiple missed reviews (reminder persistence)

- **Definition of "done" from a testing perspective:**
  - All API endpoints have 90%+ code coverage
  - Frontend review mode has snapshot tests
  - Reminder logic is deterministic and testable without mocking system time

---

## Observability & Diagnostics

If relevant, describe expectations for visibility into system behavior.

- **Logging:**
  - Log review initiation and completion events (with user ID, timestamp)
  - Log reminder trigger events
  - Log driver archival actions

- **Metrics:**
  - Count of weekly reviews completed vs. missed (per user, aggregated)
  - Average time spent in review mode (if feasible without invasive tracking)

- **Tracing:**
  - Trace review workflow API calls to identify bottlenecks

---

## Open Questions & Decisions

Capture known uncertainties without blocking progress.

- **Q:** Should review day configuration be visible during onboarding, or discovered later?
  - **Decision:** Defer to post-onboarding settings. Default to Sunday. Review in Sprint 5 retro.

- **Q:** How aggressively should reminders surface? (e.g., banner vs. modal vs. subtle indicator)
  - **Decision:** Start with persistent banner. Avoid modals. Gather feedback in early access.

- **Q:** Should archived drivers be permanently hidden or toggleable via a "show archived" option?
  - **Decision:** Implement "show archived" toggle in driver list view. Hidden by default.

---

## Exit Criteria

Restate the conditions under which this sprint is considered complete.

- A user can configure their preferred review day and the setting persists
- A user can initiate a weekly review and the UI enters a calm, focused state
- A user can edit drivers, create milestones, and create actions during review
- A user can archive drivers and they no longer appear in active views
- The system reminds users when a weekly review is overdue
- A user can complete a review and the system records the completion timestamp
- All API endpoints and workflows are tested with 90%+ coverage
- Review mode UI is visually distinct and optimized for reflection
- The system feels like it encourages strategic thinking, not just task completion

> If all exit criteria are met, the sprint is done.

---

## Notes

- This sprint lays the groundwork for Sprint 11's coach framework by establishing the weekly review ritual
- The "calm, focused UI state" should align with design principles documented in `/docs/design/design-principles.md`
- Consider accessibility implications of review mode (e.g., reduced visual noise should not compromise screen reader usability)
- The philosophy of "meaning before execution" is embodied in the review workflow—drivers are the center of attention, not tasks
