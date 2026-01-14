# Sprint 5 — System-Initiated Onboarding

**Primary Epic:** EPIC 5 — Guided Onboarding

**Sprint Intent**
Create a first-run experience that demonstrates the system's philosophy and structure by providing meaningful, editable defaults. New users should immediately see a working system with example drivers, milestones, and recurring actions rather than blank screens, eliminating the need for tutorials while teaching proper terminology and usage patterns.

---

## Goals

Define what success looks like for this sprint.

- New users see a meaningful, functional system immediately upon first login
- Default content demonstrates the driver → milestone → action hierarchy
- System terminology (drivers, actions) is reinforced through example content
- Users can edit or remove defaults without friction
- Onboarding logic is idempotent and safe to re-run

---

## In Scope

Explicitly list what this sprint will cover.

- Default driver creation with meaningful examples
- Default recurring actions aligned with system philosophy
- First-run detection and initialization logic
- Idempotent onboarding workflow (safe re-execution)
- UI support for viewing, editing, and removing default content
- Copy that consistently uses "drivers" and "actions" (never "goals" or "tasks")
- References to the three core problems the system addresses
- Reinforcement of "meaning before execution" principle

---

## Out of Scope

Explicitly list what this sprint will _not_ attempt to do.

- Interactive tutorial or walkthrough UI
- Multi-step wizard flows
- User-customized onboarding paths
- AI-generated personalized content
- Migration of existing user data
- Coach integration (reserved for Sprint 11)
- Advanced onboarding analytics or A/B testing

> This section exists to prevent scope creep and over-eager AI assistance.

---

## System Context & Assumptions

Describe the system-level truths and constraints that apply during this sprint.

- **Dependencies on Sprint 4:** Core domain model (drivers, actions, milestones) must be fully implemented and tested
- **User isolation:** All default content is created per-user and stored in user-partitioned DynamoDB space
- **Authentication:** Cognito user identity is available for all operations (Sprint 1 foundation)
- **Philosophy alignment:** Content must reflect the system's core principles about meaning, intentionality, and the three core problems
- **Single-table design:** Default entities follow the same DynamoDB patterns as user-created data
- **Frontend state:** React application can detect first-run status via API
- **Idempotency:** Onboarding logic must be safe to invoke multiple times without creating duplicate data

---

## Functional Requirements

Describe the business-level behaviors the system must support as a result of this sprint.
Each requirement should be independently testable.

### FR-1: First-Run Detection

**Description**
The system must reliably detect when a user is logging in for the first time and has not yet been onboarded.

**Acceptance Criteria**

- Given a user who has never logged in, when they authenticate, then the system identifies them as requiring onboarding
- Given a user who has been onboarded, when they log in again, then the system does not re-trigger onboarding
- Given onboarding is in progress, when it fails mid-process, then subsequent login attempts can safely resume or retry

---

### FR-2: Default Driver Creation

**Description**
New users receive a set of example drivers that demonstrate the driver → milestone → action hierarchy and illustrate the system's philosophy.

**Acceptance Criteria**

- Given a new user completes onboarding, when they view their drivers, then they see at least 2-3 meaningful example drivers
- Given example drivers exist, when a user views them, then each driver has clear, philosophy-aligned descriptions
- Given example drivers are created, when the user wants to edit or delete them, then they have full ownership and control
- Given default drivers, when they reference the three core problems, then the copy is clear and educational

---

### FR-3: Default Recurring Actions

**Description**
New users receive example recurring actions (habits) that demonstrate the recurrence model and daily action flow.

**Acceptance Criteria**

- Given a new user completes onboarding, when they view their actions, then they see at least 2-3 recurring action examples
- Given recurring actions exist, when the system processes daily snapshots, then example actions appear correctly in daily planning
- Given example recurring actions, when a user wants to modify their schedule or remove them, then they can do so without restrictions
- Given recurring actions are created, when they are linked to drivers, then the hierarchy is properly maintained

---

### FR-4: Idempotent Onboarding Logic

**Description**
Onboarding can be safely invoked multiple times without creating duplicate default content or corrupting user data.

**Acceptance Criteria**

- Given a user has already been onboarded, when onboarding is invoked again, then no duplicate drivers or actions are created
- Given onboarding fails partway through, when it is retried, then it completes successfully without leaving orphaned data
- Given onboarding logic runs, when it checks for existing data, then it accurately detects what has already been created
- Given onboarding completes, when the user manually creates their first driver, then the system does not re-trigger onboarding

---

### FR-5: Terminology and Philosophy Consistency

**Description**
All onboarding copy, examples, and UI text must consistently use system terminology and reinforce core principles.

**Acceptance Criteria**

- Given any onboarding content, when a user reads it, then they see "drivers" and "actions" (never "goals" or "tasks")
- Given example content, when it describes the system purpose, then it references the three core problems the system solves
- Given onboarding copy, when it explains the hierarchy, then it reinforces "meaning before execution"
- Given UI labels during onboarding, when users interact with them, then terminology matches the philosophy document

---

### FR-6: Zero Blank Screens Experience

**Description**
New users should never see empty states that require explanation—the system should feel populated and ready to use.

**Acceptance Criteria**

- Given a new user completes login, when they navigate to any core view (drivers, daily planning, weekly review), then they see content immediately
- Given example content is displayed, when the user interacts with it, then it behaves identically to user-created content
- Given a new user views the system, when they explore drivers and actions, then the relationships and structure are self-evident
- Given default content exists, when the user decides to start fresh, then they can remove all defaults in a clear, straightforward manner

---

## Non-Functional Requirements

List only the non-functional requirements that are relevant _for this sprint_.

### Security

- Default content must be created within the authenticated user's partition
- Onboarding logic must not expose or access data from other users
- Onboarding API endpoints must require valid Cognito authentication

### Performance

- Onboarding completion should occur in under 3 seconds
- First-run detection should add no more than 100ms to initial page load
- Default content creation should not impact Lambda cold start times

### Reliability & Error Handling

- Partial onboarding failures must be logged and recoverable
- Network failures during onboarding should present clear user feedback
- Onboarding state must be persisted to allow safe retries
- System should gracefully handle concurrent onboarding requests (though unlikely)

### Developer Experience

- Onboarding logic must be independently testable (unit tests for business logic)
- Default content should be defined in configuration, not hardcoded in Lambda logic
- CI must validate onboarding idempotency with automated tests
- Mock data for onboarding tests should be realistic and philosophy-aligned

---

## Data & State Changes

Describe any changes to persisted data or system state.

### New Entities

- **OnboardingStatus:** Per-user flag indicating onboarding completion
  - Attributes: userId, isOnboarded, onboardingVersion, completedAt
  - Used for first-run detection and safe re-execution

### Modified Entities

- **Driver entities:** Default drivers marked with metadata (e.g., `isDefault: true` or `source: 'onboarding'`) to support future features
- **Action entities:** Default recurring actions include onboarding metadata for potential cleanup or explanation features

### Invariants

- Default drivers must always have associated milestones to demonstrate proper hierarchy
- Default recurring actions must always link to a driver (no orphan actions)
- Onboarding status can only transition from `false` to `true`, never backward (unless user explicitly resets)

### Migration Considerations

- Existing users (pre-Sprint 5) should not be marked as "new" and should not receive default content
- Onboarding version field supports future onboarding content updates without re-triggering for existing users

---

## API & Integration Touchpoints

Include this section only if APIs or integrations are affected.

### New Endpoints

- **POST /user/onboarding/initialize**
  - Triggers onboarding for authenticated user
  - Returns onboarding status and default content IDs
  - Idempotent: safe to call multiple times

- **GET /user/onboarding/status**
  - Returns current onboarding state for authenticated user
  - Used by frontend to determine if onboarding should run

### Modified Endpoints

- **POST /auth/callback** (or equivalent login completion handler)
  - Enhanced to check onboarding status and trigger initialization if needed
  - Returns indication of whether onboarding is required

### Authentication & Authorization

- All onboarding endpoints require valid Cognito authentication
- User identity from Cognito authorizer is used to partition data
- No special permissions or roles required beyond authenticated user

---

## Testing Strategy

Describe how correctness will be validated for this sprint.

### Unit Tests Required

- Onboarding logic correctly detects first-run vs. returning users
- Idempotency: calling onboarding multiple times produces identical state
- Default driver creation follows domain rules (no orphan milestones or actions)
- Default recurring actions are properly configured with correct recurrence rules
- Onboarding status persistence and retrieval

### Integration Tests Required

- Full onboarding flow from unauthenticated user to populated system
- Default content appears correctly in daily planning snapshot
- User can edit or delete default drivers and actions without errors
- Concurrent login attempts do not create duplicate onboarding data
- Failed onboarding (simulated DynamoDB error) can recover on retry

### Edge Cases to Cover

- User with partially completed onboarding data (e.g., drivers created but not actions)
- Onboarding invoked when user has manually created their first driver
- Network timeout during onboarding content creation
- User logs out and back in during onboarding initialization

### Definition of "Done" from Testing Perspective

- All unit tests pass with 100% coverage of onboarding logic
- Integration tests verify full user journey from blank account to populated system
- CI validates idempotency with automated scenario tests
- Manual QA confirms terminology consistency and philosophy alignment in all copy
- No blank screens visible in new user experience

---

## Observability & Diagnostics

If relevant, describe expectations for visibility into system behavior.

### Logging Requirements

- Log onboarding initiation with userId and timestamp
- Log each step of default content creation (drivers, milestones, actions)
- Log onboarding completion with duration metrics
- Log any errors or retries during onboarding process

### Metrics to Emit

- Onboarding success rate (percentage of successful initializations)
- Average onboarding duration
- Count of onboarding retries due to failures
- Rate of users who delete default content vs. keep it

### Tracing Considerations

- Onboarding workflow should be traceable end-to-end in CloudWatch
- Each Lambda invocation related to onboarding should include correlation ID
- Frontend onboarding flow should emit telemetry for user journey tracking

---

## Open Questions & Decisions

Capture known uncertainties without blocking progress.

### Q1: Specific Default Content

**Question:** What are the exact default drivers and actions to create?
**Owner:** Product/Design
**Decision Timing:** Before development begins
**Notes:** Content must align with philosophy document and demonstrate the three core problems

### Q2: Onboarding Version Strategy

**Question:** How do we version onboarding content for future improvements?
**Owner:** Engineering
**Decision Timing:** During implementation
**Notes:** Need to decide if onboarding version is simple integer or semantic version

### Q3: User Opt-Out

**Question:** Should users be able to skip default content creation?
**Owner:** Product
**Decision Timing:** Before Sprint 5 begins
**Notes:** Current philosophy is "no blank screens," which implies no skip option

### Q4: Onboarding Timing

**Question:** Should onboarding happen synchronously during first login or asynchronously?
**Owner:** Engineering
**Decision Timing:** During technical design
**Notes:** Tradeoff between immediate availability vs. potential login delay

---

## Exit Criteria

Restate the conditions under which this sprint is considered complete.

- New user sees meaningful drivers, milestones, and actions immediately upon first login
- Zero blank screens or empty states in new user experience
- All onboarding copy uses correct terminology (drivers, actions) and reinforces philosophy
- Onboarding logic is proven idempotent through automated tests
- Users can edit or delete default content with full control
- Integration tests validate complete onboarding flow from authentication to populated system
- Observability confirms onboarding success rate and duration metrics are captured
- Code review confirms philosophy alignment in all default content and copy

> If all exit criteria are met, the sprint is done.

---

## Notes

### Related Documents

- [System Philosophy](../standards/overview.md) — Core principles for terminology and tone
- [Sprint 4 TechSpec](sprint-4-techspec.md) — Domain model dependencies
- [Sprint Plan](sprint-plan.md) — Overall roadmap context

### Philosophy Alignment

The three core problems this system addresses (reference these in default content):

1. **Disconnection between daily actions and meaningful goals**
2. **Lack of deliberate planning and intentionality**
3. **No system for reflection and continuous improvement**

Default content should illustrate how drivers provide meaning, actions provide execution structure, and the system bridges the gap between the two.

### Future Considerations (Post-Sprint 5)

- Coach integration (Sprint 11) may enhance onboarding with contextual suggestions
- Analytics on default content retention could inform future onboarding iterations
- Multi-language support will require onboarding content localization
- Advanced users may want ability to "reset to defaults" after customization
