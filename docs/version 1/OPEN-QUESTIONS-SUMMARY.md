# Open Questions & Decisions Summary — Sprints 0-5

**Generated:** January 14, 2026
**Purpose:** Comprehensive compilation of all open questions and decisions across Sprint 0-5 tech specs to facilitate resolution before moving forward.

---

## Executive Summary

This document consolidates all open questions, pending decisions, and unresolved items from Sprint 0 through Sprint 5 technical specifications. Items are organized by sprint, categorized by status (resolved, pending, or deferred), and prioritized for resolution.

**Status Overview:**

- **Resolved:** Decisions already made and documented
- **Pending:** Requires decision before proceeding
- **Deferred:** Explicitly pushed to future sprints

---

## Sprint 0 — Project Bootstrap & Guardrails

### Q1: ESLint Rule Strictness

**Question:** Should we enforce zero warnings in CI, or only errors?
**Status:** ✅ Resolved
**Decision:** Start with errors-only enforcement. Warnings allowed but visible. Can be tightened in future sprints.
**Owner:** Team decision during sprint
**Notes:** Recommended errors-only for v1

### Q2: Pre-commit Hooks

**Question:** Should we use Husky/lint-staged for pre-commit validation?
**Status:** ⏸️ Deferred
**Decision:** Defer to Sprint 1. CI enforcement is sufficient for Sprint 0.
**Owner:** Deferred
**Notes:** Out of scope for Sprint 0

### Q3: Package Versioning Strategy

**Status:** ❓ Not fully documented in tech spec
**Notes:** Tech spec appears truncated; full question not captured

---

## Sprint 1 — Identity & Security Baseline

### Q1: Cognito Hosted UI vs. Custom Authentication UI

**Question:** Use Cognito Hosted UI or build custom authentication UI?
**Status:** ✅ Resolved
**Decision:** Use Hosted UI for Sprint 1 to minimize frontend complexity; custom UI can be added later if needed
**Owner:** Architecture team
**Notes:** Prioritizes speed to market

### Q2: Token Storage Strategy

**Question:** Store tokens in localStorage or httpOnly cookies?
**Status:** ✅ Resolved
**Decision:** Use secure localStorage pattern for Sprint 1; evaluate cookie-based approach in future sprint
**Owner:** Security team
**Notes:** Cookie-based approach may be more secure; revisit in security hardening sprint

### Q3: Password Policy Strictness

**Question:** Should password policy be stricter than Cognito defaults?
**Status:** ⏸️ Deferred
**Decision:** Deferred to security review in Sprint 12
**Owner:** Security review
**Target Timing:** Before early access launch
**Notes:** Default Cognito policy acceptable for v1 development

---

## Sprint 2 — Infrastructure & Environments

### Q1: CloudFront Domain Strategy

**Question:** Use CloudFront default domain or custom domain?
**Status:** ✅ Resolved
**Decision:** Use CloudFront default for Sprint 2; custom domain can be added in future sprint
**Owner:** Product team
**Notes:** Reduces complexity and cost for early development

### Q2: DynamoDB Point-in-Time Recovery Scope

**Question:** Enable DynamoDB point-in-time recovery for all environments?
**Status:** ✅ Resolved
**Decision:** Enable for prod only to reduce costs; dev/QA can be recreated
**Owner:** Infrastructure team
**Notes:** Balances data protection with cost efficiency

---

## Sprint 3 — CI/CD & Quality Gates

### Q1: GitHub-Hosted vs. Self-Hosted Runners

**Question:** Should we use GitHub-hosted runners or self-hosted runners?
**Status:** ✅ Resolved
**Decision:** Use GitHub-hosted runners for Sprint 3; self-hosted runners can be added later if needed for cost or control
**Owner:** DevOps team
**Notes:** GitHub-hosted is simpler; evaluate self-hosted if costs escalate

### Q2: Automatic Rollback Strategy

**Question:** Should we implement automatic rollback on deployment failure?
**Status:** ✅ Resolved
**Decision:** CloudFormation automatic rollback is sufficient; manual rollback via CDK destroy/deploy is acceptable for v1
**Owner:** DevOps team
**Notes:** Keeps initial implementation simple

### Q3: Test Coverage Threshold

**Question:** What test coverage threshold should block merges?
**Status:** ⏸️ Deferred
**Decision:** No hard threshold for Sprint 3; establish baseline and set threshold in Sprint 4
**Owner:** Engineering team
**Target Timing:** Sprint 4
**Notes:** Baseline needed before enforcing thresholds

### Q4: Deployment Notifications

**Question:** Should we implement deployment notifications to Slack or email?
**Status:** ⏸️ Optional Enhancement
**Decision:** Optional enhancement if time permits
**Owner:** Team decision in Sprint 3 implementation
**Target Timing:** Sprint 3 or later
**Notes:** Not blocking; nice-to-have feature

### Q5: Long-Running Deployment Handling

**Question:** How should we handle long-running deployments (>30 minutes)?
**Status:** ⚠️ Pending
**Decision:** Monitor in Sprint 3 and adjust timeout values as needed
**Owner:** DevOps team
**Target Timing:** Sprint 3 or Sprint 4
**Notes:** Requires empirical data from actual deployments

### Q6: Infrastructure Drift Detection

**Question:** Should we implement infrastructure drift detection?
**Status:** ⏸️ Deferred
**Decision:** Deferred to Sprint 8 (security hardening)
**Owner:** Security review
**Target Timing:** Sprint 8
**Notes:** Important for production but not critical for initial development

---

## Sprint 4 — Core Domain Model

### Q1: Daily Snapshot Execution Strategy

**Question:** Should daily snapshots run on a scheduled Lambda or be triggered by user activity?
**Status:** ✅ Resolved
**Decision:** Scheduled Lambda at UTC midnight (simplest for v1)
**Owner:** Architecture team
**Target Timing:** Before Sprint 5 implementation
**Notes:** Scheduled approach is most predictable and reliable

### Q2: Action Rollover Logic

**Question:** How should action rollover work when a user doesn't complete an action?
**Status:** ⏸️ Deferred
**Decision:** Addressed in Sprint 7 (deliberate rollover with user confirmation)
**Owner:** Product team
**Target Timing:** Sprint 7 planning
**Notes:** Sprint 7 specifically focuses on daily planning and rollover workflow

### Q3: Recurrence Pattern Complexity

**Question:** Should recurrence patterns support complex rules (e.g., "every other Tuesday")?
**Status:** ✅ Resolved
**Decision:** Start with simple patterns (daily, weekly, monthly) in Sprint 4; defer complex patterns to future
**Owner:** Product team
**Target Timing:** Decided for v1
**Notes:** Keeps initial scope manageable; can be enhanced based on user feedback

### Q4: DynamoDB GSI Count

**Question:** How many GSIs are needed for optimal query performance?
**Status:** ⚠️ Pending
**Decision:** Start with 1-2 GSIs; monitor and add more if needed
**Owner:** Backend team
**Target Timing:** During Sprint 4 implementation
**Notes:** Performance testing will inform final decision

### Q5: Delete Strategy (Soft vs. Hard)

**Question:** Should we support soft delete or only hard delete?
**Status:** ✅ Resolved
**Decision:** Hard delete is sufficient for v1; soft delete can be added later if needed
**Owner:** Product team
**Target Timing:** Decided for v1
**Notes:** Simplifies initial implementation

---

## Sprint 5 — System-Initiated Onboarding

### Q1: Specific Default Content

**Question:** What are the exact default drivers and actions to create?
**Status:** ✅ **RESOLVED**
**Decision:** Default content will be stored in a parameter store (JSON configuration file), making it product manager-editable without code changes. Content will be build-time configurable.
**Owner:** Product/Design (to populate JSON configuration)
**Implementation Approach:**

- JSON file location: `infra/cdk/config/onboarding-defaults.json` or AWS Systems Manager Parameter Store
- Schema validated at build time
- Changes require rebuild and deploy
- Initial focus: Learning-oriented content to help users understand the system
  **Action Required:** Product manager to populate JSON with specific drivers, milestones, and actions
  **Notes:** This approach separates content from code, allowing iteration without engineering involvement (though requires redeploy)

### Q2: Onboarding Version Strategy

**Question:** How do we version onboarding content for future improvements?
**Status:** ⚠️ Pending
**Decision:** Need to decide if onboarding version is simple integer or semantic version
**Owner:** Engineering
**Target Timing:** During implementation
**Notes:** Affects how we handle future onboarding content updates

### Q3: User Opt-Out Option

**Question:** Should users be able to skip default content creation?
**Status:** ✅ **RESOLVED**
**Decision:** No opt-out mechanism. Default content is always populated during user registration.
**Owner:** Product
**Implementation:** Users can delete default content afterward if they don't want to use the tutorial
**Rationale:** Aligns with "no blank screens" philosophy while preserving user autonomy through deletion capability
**Notes:** Simplifies onboarding flow; no conditional logic needed for content creation

### Q4: Onboarding Timing (Sync vs. Async)

**Question:** Should onboarding happen synchronously during first login or asynchronously?
**Status:** ⚠️ Pending
**Decision:** Required during technical design
**Owner:** Engineering
**Target Timing:** During technical design
**Notes:** Tradeoff between immediate availability vs. potential login delay
**Recommendation:** Consider async with loading state to avoid blocking login

---

## Priority Action Items

### 🔴 Critical — Must Resolve Before Sprint 5

**All critical Sprint 5 items resolved! ✅**

1. **Sprint 5 — Default Content Definition (Q1)** ✅ **RESOLVED**
   - **Resolution:** Default content stored in parameter store as JSON object
   - **Approach:** Build-time configurable, product manager-editable
   - **Implementation:** `infra/cdk/config/onboarding-defaults.json`
   - **Requirement:** JSON schema validation at build time
   - **Action:** Product manager to populate JSON with learning-focused content

2. **Sprint 5 — User Opt-Out Decision (Q3)** ✅ **RESOLVED**
   - **Resolution:** No opt-out mechanism; content always created
   - **User Control:** Users can delete default content after onboarding
   - **Impact:** Simplifies implementation; no conditional logic needed

### 🟡 Important — Should Resolve During Sprint Implementation

3. **Sprint 4 — DynamoDB GSI Count (Q4)**
   - **Owner:** Backend team
   - **Action:** Performance test access patterns and determine optimal GSI configuration
   - **Deliverable:** GSI schema documented in code

4. **Sprint 5 — Onboarding Version Strategy (Q2)**
   - **Owner:** Engineering team
   - **Action:** Define versioning scheme for onboarding content
   - **Deliverable:** Documentation and implementation of version tracking

5. **Sprint 5 — Onboarding Timing Strategy (Q4)**
   - **Owner:** Engineering team
   - **Action:** Design onboarding execution flow (sync vs. async)
   - **Deliverable:** Technical design document with flow diagrams

6. **Sprint 3 — Long-Running Deployment Handling (Q5)**
   - **Owner:** DevOps team
   - **Action:** Monitor deployment times and set appropriate timeouts
   - **Deliverable:** Configured timeout values in CI/CD pipelines

### 🟢 Optional — Can Defer or Handle Later

7. **Sprint 3 — Deployment Notifications (Q4)**
   - **Owner:** Team decision
   - **Action:** Evaluate need for Slack/email notifications
   - **Deliverable:** Optional feature if time permits

8. **Sprint 0 — Package Versioning Strategy (Q3)**
   - **Owner:** Engineering team
   - **Action:** Complete documentation of package versioning approach
   - **Deliverable:** Versioning strategy documented in standards

---

## Deferred to Future Sprints

The following items are explicitly deferred and do not require immediate action:

- **Sprint 0 — Pre-commit Hooks:** Deferred to Sprint 1+
- **Sprint 1 — Password Policy:** Deferred to Sprint 12 security review
- **Sprint 1 — Token Storage (Cookie-based):** Evaluate in future security sprint
- **Sprint 3 — Test Coverage Threshold:** Establish in Sprint 4
- **Sprint 3 — Infrastructure Drift Detection:** Deferred to Sprint 8
- **Sprint 4 — Action Rollover Logic:** Addressed in Sprint 7
- **Sprint 4 — Complex Recurrence Patterns:** Future enhancement
- **Sprint 4 — Soft Delete:** Future enhancement if needed

---

## Recommendations

### For Immediate Action

1. **Schedule Product/Design Workshop** for Sprint 5 default content creation
   - Invite: Product, Design, Engineering leads
   - Duration: 2-3 hours
   - Deliverable: Finalized default content specification
   - Timeline: Before Sprint 5 development begins

2. **Product Decision Meeting** for user opt-out strategy
   - Attendees: Product team + UX
   - Duration: 1 hour
   - Deliverable: Clear yes/no decision with rationale
   - Timeline: This week

3. **Engineering Design Session** for onboarding implementation
   - Focus: Version strategy and sync/async execution
   - Attendees: Backend engineers
   - Duration: 2 hours
   - Deliverable: Technical design document
   - Timeline: Early in Sprint 5

### For Sprint 4 Implementation

1. **Performance Testing Plan** for DynamoDB access patterns
   - Test various GSI configurations
   - Measure query performance with realistic data volumes
   - Document optimal configuration

### For Ongoing Monitoring

1. **Deployment Metrics Dashboard**
   - Track deployment duration
   - Monitor failure rates
   - Identify timeout issues early

2. **Test Coverage Baseline**
   - Establish current coverage metrics
   - Set reasonable thresholds for Sprint 4+
   - Enforce via CI gates

---

## Document Change Log

| Date       | Change                               | Author         |
| ---------- | ------------------------------------ | -------------- |
| 2026-01-14 | Initial compilation from Sprints 0-5 | GitHub Copilot |

---

## Next Steps

1. ✅ Share this document with Product, Design, and Engineering teams
2. ⏳ Schedule workshops to resolve critical Sprint 5 questions
3. ⏳ Assign owners to pending items
4. ⏳ Track resolution in sprint planning meetings
5. ⏳ Update this document as decisions are made

---

_This is a living document. Update as questions are resolved or new questions emerge._
