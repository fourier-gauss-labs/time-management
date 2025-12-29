# Sprint Plan — Time Management SaaS (Early Access)

## Guiding Constraints

* **Each sprint has one primary epic**
* Supporting stories are explicitly allowed
* Each sprint ends with a **demoable, shippable increment**
* “Early access” means:

  * secure
  * stable
  * opinionated
  * intentionally incomplete

---

## Sprint 0 — Project Bootstrap & Guardrails

**Primary Epic:** EPIC 0 — Project Foundation & DX

### Goals

Create a repo that is safe to iterate on aggressively.

### Scope

* Monorepo structure finalized
* Shared TypeScript configuration
* Linting + formatting
* pnpm workspace
* Base README (already largely done)
* Local dev scripts verified

### Supporting Work

* Skeleton CI pipeline (lint + typecheck only)
* Copilot project instructions committed

### Exit Criteria

* `pnpm install` works cleanly
* CI passes on PR
* Repo is “vibe-safe”

---

## Sprint 1 — Identity & Security Baseline

**Primary Epic:** EPIC 1 — Identity, Authentication & User Isolation

### Goals

No app exists without identity.

### Scope

* Cognito User Pool via CDK
* Hosted UI auth flow
* Frontend login/logout
* API Gateway protected by Cognito authorizer
* User identity injected into Lambda context
* Per-user data isolation enforced by design

### Supporting Work

* IAM least-privilege policies
* Secure environment variable handling
* CI update to include infra synth

### Exit Criteria

* Authenticated user can call API
* No unauthenticated access possible
* Clear data ownership boundary

---

## Sprint 2 — Infrastructure & Environments

**Primary Epic:** EPIC 2 — Infrastructure as Code & Environments

### Goals

Production posture before production features.

### Scope

* Full CDK stacks:

  * API
  * DynamoDB
  * Auth
  * Frontend hosting
* Environment parameterization
* Dev environment auto-deploy
* QA and Prod pipelines scaffolded (even if unused)

### Supporting Work

* Secrets handling
* Environment documentation
* Cost-control guardrails

### Exit Criteria

* `dev` environment deploys automatically
* Infra reproducible from scratch
* Zero manual AWS console work required

---

## Sprint 3 — CI/CD & Quality Gates

**Primary Epic:** EPIC 3 — CI/CD Pipelines & Quality Gates

### Goals

Prevent regressions before they exist.

### Scope

* CI pipeline:

  * lint
  * typecheck
  * unit tests
  * CDK synth
* Dev deploy pipeline
* QA deploy pipeline
* Prod deploy pipeline (manual approval)
* Secrets wired into pipelines

### Supporting Work

* Vitest baseline
* Example failing test to validate CI enforcement

### Exit Criteria

* Every PR runs CI
* Deployments are boring and repeatable
* Broken builds cannot ship

---

## Sprint 4 — Core Domain Model

**Primary Epic:** EPIC 4 — Drivers, Actions, Milestones

### Goals

Encode the philosophy into data and rules.

### Scope

* Domain models defined in shared package
* Driver → milestone → action hierarchy enforced
* No orphan actions (API + UI)
* Action states implemented
* Recurrence model for habits
* Daily snapshot persistence

### Supporting Work

* DynamoDB single-table schema
* Domain-level unit tests

### Exit Criteria

* Impossible to create misaligned data
* Domain rules are test-backed
* Everything traces to a driver

---

## Sprint 5 — System-Initiated Onboarding

**Primary Epic:** EPIC 5 — Guided Onboarding

### Goals

The system explains itself by existing.

### Scope

* Default driver creation
* Default recurring actions
* First-run experience
* Idempotent onboarding logic
* Editable/removable defaults

### Supporting Work

* UI copy refinement
* Coach scaffolding hooks
* **Copy alignment with philosophy:**
  * Use "drivers" and "actions" consistently (never "goals" or "tasks")
  * Reference the three core problems the system solves
  * Reinforce "meaning before execution" principle

### Exit Criteria

* New user sees a meaningful system immediately
* Zero blank screens
* No tutorial required
* Terminology matches system philosophy

---

## Sprint 6 — Weekly Review (Strategic Layer)

**Primary Epic:** EPIC 6 — Weekly Driver Review

### Goals

Make introspection first-class.

### Scope

* Weekly review workflow
* Review day configuration
* Driver editing during review
* Milestone/action creation in review
* Coach reminders for missed reviews

### Supporting Work

* Calm, focused UI state
* Minimal persistence enhancements

### Exit Criteria

* Weekly planning is a repeatable ritual
* Drivers feel “alive”

---

## Sprint 7 — Daily Planning & Execution

**Primary Epic:** EPIC 7 — Daily Planning & Execution

### Goals

Make “today” intentional.

### Scope

* Daily planning workflow
* **Rollover logic (deliberate, not passive):**
  * Automatic rollover detection
  * User confirmation required during daily planning
  * Time estimation validation on rollover
* Priority classification
* Time estimation with realism checks
* Trigger definition
* Coach nudges for:

  * rollovers
  * oversized actions
  * missing triggers

### Supporting Work

* Execution-mode UI
* Action status transitions

### Exit Criteria

* A full day can be planned and completed
* Planning friction is low
* System feels honest, not aspirational
* Rollovers are acknowledged, not automatic

---

## Sprint 8 — Focus & Pomodoro

**Primary Epic:** EPIC 8 — Time & Focus Management

### Goals

Protect attention.

### Scope

* Pomodoro timer
* Configurable intervals
* Break notifications
* Visual timeline
* Execution focus mode

### Supporting Work

* Accessibility considerations
* Offline tolerance (PWA groundwork)

### Exit Criteria

* Focused work feels supported, not gamified
* Timer integrates naturally with daily plan

---

## Sprint 9 — Calendar Integration (Read-Only)

**Primary Epic:** EPIC 9 — External Calendars

### Goals

Anchor planning to reality.

### Scope

* Google Calendar OAuth
* Outlook OAuth
* Secure backend token storage
* Daily appointment aggregation
* Conflict-aware planning
* Feature flags

### Supporting Work

* Rate-limit handling
* Token refresh logic

### Exit Criteria

* External commitments shape the day
* No calendar takeover
* Security posture intact

---

## Sprint 10 — History, Insights & Reflection

**Primary Epic:** EPIC 10 — Reflection & Insights

### Goals

Turn activity into learning.

### Scope

* Daily & weekly history views
* Driver-level summaries
* Completion vs rollover trends
* Anti-pattern detection
* Reflection prompts surfaced via coach
* **Success metrics & trend analysis:**
  * Driver completion indicators
  * Action completion rate trends over time
  * Time estimation accuracy improvements
  * Rollover frequency patterns

### Supporting Work

* Read-optimized queries
* Explainability of insights

### Exit Criteria

* Users can answer: "Why did this week feel hard?"
* History feels illuminating, not judgmental
* Progress is visible and measurable

---

## Sprint 11 — Coach Framework (v1)

**Primary Epic:** EPIC 11 — Coach & Guided Usage

### Goals

Make the system self-correcting.

### Scope

* Coach signal model
* Rules-based suggestion engine
* UI for suggestions
* User control over coach verbosity
* Logging for future AI enhancement
* **Coach personality & tone:**
  * Guidance, never enforcement
  * Encouragement without judgment
  * Questions over commands
  * Avoid gamification patterns
  * Respect user autonomy

### Supporting Work

* Telemetry hooks
* Documentation for future AI upgrades
* Coach tone guidelines document

### Exit Criteria

* System gently teaches itself
* No chatbot required
* Coach feels helpful, not nagging
* Tone aligns with philosophy principles

---

## Sprint 12 — Early Access Hardening & Launch

**Primary Epic:** *Early Access Readiness*

### Goals

Be publicly usable without embarrassment.

### Scope

* Security review
* Cost review
* Error handling polish
* UX refinement
* Early access feature flags
* Feedback collection hooks
* Legal basics (privacy policy, ToS)
* **Data portability & user rights:**
  * User data export functionality (JSON format)
  * Account deletion flow
  * Data portability documentation
  * GDPR/CCPA compliance basics

### Exit Criteria

* App is safe, stable, and opinionated
* Clear "early access" positioning
* You are comfortable inviting users
* Users can export and delete their data
