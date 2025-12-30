# Product Requirements Document (PRD)

## Time Management Application

### Use Cases (Revised)

---

## 1. User Account, Identity, and Data Ownership

### UC-1: Create and Manage a User Account

**Description**
A user creates and manages an account in order to securely access their productivity system across devices and environments.

**Business Value**
Enables personalized planning, persistence, and multi-device usage.

**Key Capabilities**

- Secure user authentication
- Session management
- User profile management
- Environment-aware configuration (dev, QA, prod)

---

### UC-2: Ensure Data Privacy, Ownership, and Isolation

**Description**
A user’s data is private, owned exclusively by that user, and isolated from all other users by default.

**Business Value**
Builds trust and ensures the system can safely support multiple users without social or collaborative features.

**Key Capabilities**

- Private-by-default data model
- Explicit user ownership of all data
- Ability to export and delete personal data
- No user-to-user data sharing in v1

**Out of Scope (Future)**
Shared planning, delegation, and social productivity features.

---

## 2. System-Initiated Onboarding & Guided Adoption

### UC-3: Initialize the Productivity System

**Description**
When a user first uses the app, the system initializes a reasonable starting structure that demonstrates how the productivity system works.

**Business Value**
Reduces onboarding friction and teaches the system through use rather than documentation.

**Key Capabilities**

- Creation of a default driver:
  - _“Be the most productive version of myself”_

- Creation of two default recurring actions:
  - “Weekly introspection”
  - “Daily introspection and planning”

- All default items are editable or removable by the user

---

### UC-4: Guide Users Through System Usage (Coach)

**Description**
The system provides contextual guidance to help users make effective use of the productivity system.

**Business Value**
Encourages correct system usage and continuous improvement without prescribing behavior.

**Key Capabilities**

- Non-intrusive suggestions based on usage patterns
- Guidance rather than enforcement
- Rules-based in v1, AI-enhanced in later versions
- Suggestions may include:
  - Completing a weekly review
  - Performing daily planning
  - Adding triggers to stalled actions
  - Breaking down oversized actions

---

## 3. Driver Management (Strategic Layer)

### UC-5: Define and Maintain Drivers

**Description**
A user defines and maintains drivers representing goals, habits, or identity-level outcomes they are actively pursuing.

**Business Value**
Provides strategic intent and meaning for all actions in the system.

**Key Capabilities**

- Create, edit, archive drivers
- Soft encouragement to limit active drivers (ideal range: 6–10)
- Drivers serve as the required root of all planning hierarchies

---

### UC-6: Conduct Weekly Driver Review

**Description**
A user performs a structured weekly review to reflect on drivers and plan upcoming work.

**Business Value**
Ensures planning remains intentional rather than reactive.

**Key Capabilities**

- User-selected weekly review day
- Dedicated weekly review workflow
- Review and refinement of drivers
- Creation or adjustment of milestones and actions during review

---

## 4. Action & Milestone Management (Execution Layer)

### UC-7: Create and Manage Actions

**Description**
A user creates actions representing concrete tasks or recurring habits.

**Business Value**
Enables day-to-day execution aligned with strategic intent.

**Key Capabilities**

- Actions must be associated with a driver
- Actions may be one-time or recurring
- Estimated time allocation per action
- Priority classification: urgent, important, other

---

### UC-8: Prevent Orphan Actions

**Description**
The system ensures that every action and milestone is associated with a driver.

**Business Value**
Preserves alignment between effort and purpose.

**Key Capabilities**

- Driver selection required when creating actions
- Inline creation of new drivers when needed
- Coach-based nudges rather than hard errors
- No silent defaults or automatic driver assignment

---

### UC-9: Define Triggers for Actions

**Description**
A user defines triggers—concrete starting steps—to reduce friction and procrastination.

**Business Value**
Improves initiation and completion of actions.

**Key Capabilities**

- Optional trigger field for actions
- Coach-initiated suggestions for triggers on stalled actions
- Visibility of triggers during execution

---

### UC-10: Convert Actions into Milestones

**Description**
A user converts an oversized action into a milestone with child actions.

**Business Value**
Ensures daily plans contain only workable items.

**Key Capabilities**

- Promote action to milestone
- Create child actions under milestone
- Automatic milestone completion when all actions are complete
- Discourage excessive nesting (2–3 levels max)

---

## 5. Daily Planning & Status Tracking

### UC-11: Perform Daily Planning

**Description**
A user plans the current day by reviewing, prioritizing, and scheduling actions.

**Business Value**
Creates clarity and realistic expectations for daily work.

**Key Capabilities**

- Dedicated daily planning workflow
- Rollover of incomplete actions
- Scope validation and time realism checks
- Priority classification review
- Trigger suggestions when appropriate

---

### UC-12: Track Action Status

**Description**
A user tracks the lifecycle of actions using simple, expressive states.

**Business Value**
Provides visibility, accountability, and historical insight.

**Key Capabilities**

- States: not started, started, completed, canceled, rolled over
- Automatic rollover tracking
- Daily historical snapshots

---

## 6. Time & Focus Management

### UC-13: Integrate External Calendars

**Description**
A user integrates external calendars to inform daily planning.

**Business Value**
Ensures realistic scheduling without duplicating calendar management.

**Key Capabilities**

- Read-only integration with multiple calendars
- Daily aggregation of appointments
- Conflict-aware planning

---

### UC-14: Allocate Actions Using Pomodoro

**Description**
The system schedules actions into the day using Pomodoro-based focus blocks.

**Business Value**
Improves focus, energy management, and execution discipline.

**Key Capabilities**

- Configurable Pomodoro intervals
- Automatic scheduling around calendar commitments
- Priority-based time allocation
- Visual daily timeline

---

### UC-15: Execute Actions Against the Clock

**Description**
A user works through the planned day with real-time feedback.

**Business Value**
Encourages sustained focus and reduces distraction.

**Key Capabilities**

- Active Pomodoro timer
- Break notifications
- Minimal-distraction execution mode

---

## 7. Reflection & Insight

### UC-16: Review Historical Productivity

**Description**
A user reviews past activity to understand how time and effort were spent.

**Business Value**
Creates feedback loops for continuous improvement.

**Key Capabilities**

- Daily and weekly history views
- Action and driver-level summaries
- Completion and rollover trends

---

### UC-17: Identify Friction and Anti-Patterns

**Description**
The system identifies patterns that indicate planning or execution issues.

**Business Value**
Helps users refine their system rather than blame themselves.

**Key Capabilities**

- Detection of repeated rollovers
- Oversized action indicators
- Missed planning rituals
- Coach-driven reflection prompts

---

## 8. Platform & Operational Requirements

### UC-18: Support Multi-Environment Operation

**Description**
The system supports local development, hosted development, QA, and production.

**Business Value**
Enables safe iteration, testing, and deployment.

**Key Capabilities**

- Infrastructure as code
- Environment-specific configuration
- CI/CD compatibility

---

### UC-19: Ensure Security and Reliability

**Description**
The system protects user data and operates reliably.

**Business Value**
Builds trust and supports long-term use.

**Key Capabilities**

- Secure authentication
- Encrypted data in transit and at rest
- Observability and audit hooks
- Principle-of-least-privilege access
