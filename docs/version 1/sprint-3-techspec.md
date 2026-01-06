# Sprint 3 — CI/CD & Quality Gates

**Primary Epic:** EPIC 3 — CI/CD Pipelines & Quality Gates

**Sprint Intent**
Establish automated continuous integration and deployment pipelines with comprehensive quality gates to prevent regressions and enable safe, repeatable deployments across all environments. This sprint transforms manual deployments into automated, auditable workflows that enforce code quality standards before any code reaches production.

---

## Goals

Define what success looks like for this sprint.

- Automated CI pipeline running on every pull request
- Automated deployment to dev environment on main branch merge
- Quality gates preventing broken code from shipping
- Repeatable, boring deployments that require no manual intervention
- Comprehensive test coverage baseline established

---

## In Scope

Explicitly list what this sprint will cover.

- GitHub Actions workflow for continuous integration:
  - Linting (ESLint)
  - Type checking (TypeScript)
  - Unit tests (Vitest)
  - CDK synth validation
  - Build verification

- GitHub Actions workflow for dev environment deployment:
  - Automatic deployment on main branch merge
  - CDK deployment to dev environment
  - Frontend build and S3 upload
  - CloudFront cache invalidation

- GitHub Actions workflow for QA environment deployment:
  - Triggered by version tag or manual dispatch
  - Full infrastructure and frontend deployment

- GitHub Actions workflow for production deployment:
  - Manual approval required before deployment
  - Production safeguards and validation
  - Deployment verification

- Vitest configuration and baseline test suite:
  - Test setup for frontend and backend
  - Example tests demonstrating patterns
  - Test coverage reporting

- Secrets management in GitHub Actions:
  - AWS credentials stored as GitHub secrets
  - Environment-specific secrets
  - Secure secret handling in workflows

- Deployment status and notifications:
  - Deployment success/failure reporting
  - CloudFormation stack drift detection (optional)

---

## Out of Scope

Explicitly list what this sprint will _not_ attempt to do.

- End-to-end testing automation (deferred to Sprint 8)
- Performance testing or load testing
- Security scanning (SAST/DAST) - future enhancement
- Dependency vulnerability scanning (Dependabot is sufficient for now)
- Blue/green deployments or canary releases
- Rollback automation (manual rollback is acceptable)
- Infrastructure testing (CDK assertions) - future enhancement
- Contract testing for APIs
- Visual regression testing for frontend
- Automated database migrations (no migrations needed yet)
- Custom deployment approval workflows beyond GitHub's native capabilities

> This section exists to prevent scope creep and over-eager AI assistance.

---

## System Context & Assumptions

Describe the system-level truths and constraints that apply during this sprint.

- **Dependency on Sprint 1 & 2:** Authentication, infrastructure, and multi-environment support are complete
- **GitHub as CI/CD platform:** Using GitHub Actions (no external CI/CD tools)
- **AWS deployment target:** All deployments target AWS using CDK
- **Branch strategy:**
  - `main` branch is protected and requires PR reviews
  - All feature work happens on feature branches
  - `main` branch auto-deploys to dev environment
- **Environment promotion:**
  - Dev: Automatic deployment on main merge
  - QA: Triggered by version tag (e.g., `v1.0.0-qa.1`)
  - Prod: Manual approval required, triggered by version tag (e.g., `v1.0.0`)
- **Test framework:** Vitest for both frontend and backend tests
- **AWS credentials:** Stored as GitHub repository secrets
- **Deployment verification:** Basic smoke tests after deployment (health check)
- **Monorepo structure:** All packages share CI pipeline, selective deployment based on changes
- **No database migrations yet:** DynamoDB schema changes are additive only in v1
- **CloudFormation changeset review:** Manual review of changesets for prod deployments

---

## Functional Requirements

Describe the business-level behaviors the system must support as a result of this sprint.
Each requirement should be independently testable.

### FR-1: Continuous Integration Pipeline

**Description**
Every pull request must run a comprehensive CI pipeline that validates code quality, type safety, tests, and infrastructure validity before the PR can be merged.

**Acceptance Criteria**

- Given a pull request is opened, when the CI workflow runs, then it executes linting, type checking, unit tests, and CDK synth
- Given the CI pipeline fails on any check, when viewing the PR, then the PR is blocked from merging
- Given all CI checks pass, when viewing the PR, then the PR is approved for merge
- Given a CI workflow fails, when viewing the workflow logs, then the specific failure is clearly identified with actionable error messages
- Given changes only affect documentation, when CI runs, then the pipeline completes faster by skipping unnecessary steps

---

### FR-2: Automated Dev Deployment

**Description**
When code is merged to the main branch, the system automatically deploys the updated infrastructure and frontend to the dev environment without manual intervention.

**Acceptance Criteria**

- Given code is merged to main, when the deploy workflow runs, then it deploys CDK infrastructure to dev environment
- Given infrastructure deployment succeeds, when the deploy workflow continues, then it builds and uploads the frontend to S3
- Given frontend is uploaded to S3, when the deploy workflow completes, then it invalidates the CloudFront cache
- Given deployment fails, when viewing GitHub Actions, then the failure is reported with details
- Given deployment succeeds, when viewing GitHub Actions, then stack outputs are logged for verification
- Given deployment takes longer than expected, when the workflow times out, then it fails safely without partial deployments

---

### FR-3: QA Environment Deployment Pipeline

**Description**
The QA environment can be deployed either manually via GitHub Actions UI or automatically when a QA version tag is pushed to the repository.

**Acceptance Criteria**

- Given a version tag matching `v*-qa.*` pattern is pushed, when the QA deploy workflow runs, then it deploys to the QA environment
- Given a developer triggers manual deployment from GitHub Actions UI, when providing the environment parameter, then infrastructure and frontend deploy to QA
- Given QA deployment completes, when viewing outputs, then QA environment URLs are displayed
- Given QA deployment fails, when the workflow stops, then dev and prod environments remain unaffected

---

### FR-4: Production Deployment Pipeline with Manual Approval

**Description**
Production deployments require explicit manual approval from authorized personnel before infrastructure changes are applied, ensuring production safety and compliance.

**Acceptance Criteria**

- Given a production version tag (e.g., `v1.0.0`) is pushed, when the prod deploy workflow starts, then it pauses for manual approval
- Given an approver reviews the deployment plan, when they approve, then the deployment proceeds to production
- Given an approver denies approval, when they reject, then the deployment is cancelled without changes
- Given production deployment completes, when verifying the stack, then all resources are tagged correctly and outputs are visible
- Given no approval is given within 24 hours, when the approval times out, then the deployment is automatically cancelled

---

### FR-5: Test Suite Baseline

**Description**
A comprehensive test suite baseline is established using Vitest for both frontend and backend code, with clear patterns for unit testing and integration testing.

**Acceptance Criteria**

- Given Vitest is configured, when running `pnpm test`, then all tests execute successfully
- Given a test fails, when running CI, then the build fails and displays the test failure details
- Given tests are run locally, when using watch mode, then tests re-run on file changes
- Given test coverage is generated, when viewing the report, then coverage metrics are displayed by package
- Given example tests exist, when developers review them, then clear patterns for testing React components, Lambda handlers, and utility functions are demonstrated

---

### FR-6: Secrets Management in CI/CD

**Description**
Sensitive credentials (AWS access keys, environment variables) are securely stored in GitHub Secrets and injected into workflows without exposure in logs or code.

**Acceptance Criteria**

- Given AWS credentials are stored as GitHub secrets, when workflows run, then they authenticate to AWS without exposing credentials
- Given different environments require different secrets, when deploying to an environment, then environment-specific secrets are used
- Given a secret is updated in GitHub, when the next workflow runs, then it uses the updated secret value
- Given workflow logs are viewed, when searching for secrets, then no secret values are visible in logs
- Given a workflow needs a secret, when the secret is missing, then the workflow fails early with a clear error message

---

## Non-Functional Requirements

List only the non-functional requirements that are relevant _for this sprint_.

### Security

- AWS credentials must never be committed to repository
- Secrets must be stored in GitHub encrypted secrets
- Workflow logs must not expose sensitive values
- Production deployments require approval from authorized GitHub users only
- IAM roles used by GitHub Actions follow least-privilege principle

### Performance

- CI pipeline should complete in under 5 minutes for typical changes
- Dev deployment should complete in under 10 minutes
- Frontend build and upload should complete in under 3 minutes
- Test suite should execute in under 2 minutes

### Reliability & Error Handling

- Failed deployments must not leave environment in partial state
- CloudFormation rollback must be automatic on failure
- Workflow failures must send notifications (GitHub status checks)
- Retry logic for transient failures (AWS API throttling, network issues)
- Clear error messages for all failure scenarios

### Developer Experience

- Workflow status visible in PR interface
- Fast feedback on CI failures (fail fast)
- Easy to run tests locally with same configuration as CI
- Clear documentation for adding new tests
- Simple process to manually trigger deployments when needed

---

## Data & State Changes

Describe any changes to persisted data or system state.

- **No schema changes:** This sprint does not modify DynamoDB schema or data structures
- **GitHub Actions state:** Workflow run history persisted by GitHub
- **Deployment artifacts:** Frontend builds temporarily stored in GitHub Actions artifacts
- **CloudFormation state:** Stack state managed by AWS CloudFormation
- **No database migrations needed:** All existing data remains unchanged

> Do not include implementation code here—describe intent.

---

## API & Integration Touchpoints

Include this section only if APIs or integrations are affected.

- **GitHub Actions API:** Used for workflow orchestration and secrets access
- **AWS CloudFormation API:** Used for infrastructure deployment via CDK
- **AWS S3 API:** Used for frontend deployment and artifact storage
- **AWS CloudFront API:** Used for cache invalidation
- **AWS IAM API:** Used for role assumption and credential validation
- **No application API changes:** Existing API endpoints remain unchanged

---

## Testing Strategy

Describe how correctness will be validated for this sprint.

- **Unit tests:**
  - Frontend components using React Testing Library
  - Lambda handlers with mocked AWS SDK calls
  - Utility functions and shared code
  - Target: 80%+ code coverage for critical paths

- **Integration tests:**
  - CDK stack synthesis validation
  - Infrastructure snapshot tests (optional)
  - API contract validation (smoke tests)

- **CI/CD validation:**
  - Intentionally fail a test to verify CI blocks merge
  - Deploy to dev environment and verify functionality
  - Test manual approval workflow for prod deployment
  - Verify secrets are properly injected and not exposed

- **Manual testing:**
  - Trigger QA deployment via GitHub UI
  - Review CloudFormation changeset before prod deployment
  - Verify deployment outputs are correct
  - Test frontend after deployment to each environment

- **Edge cases:**
  - Deployment failure scenarios (invalid CDK, AWS errors)
  - Concurrent deployments to same environment (should queue or fail)
  - Missing required secrets (should fail early)
  - Network failures during deployment (should retry or fail safely)

---

## Observability & Diagnostics

If relevant, describe expectations for visibility into system behavior.

- **Logging:**
  - GitHub Actions workflow logs capture all deployment steps
  - CloudFormation events logged and accessible
  - CDK synth output logged for review
  - Build and test output captured in workflow logs

- **Metrics:**
  - Workflow execution time tracked by GitHub
  - Deployment success/failure rate visible in Actions dashboard
  - Test execution time and pass rate tracked
  - Infrastructure changes visible in CloudFormation changesets

- **Notifications:**
  - GitHub status checks on PRs
  - Deployment success/failure notifications (optional: Slack/email integration)
  - Manual approval notifications for prod deployments

- **Debugging:**
  - Workflow logs downloadable for offline analysis
  - CloudFormation stack events for deployment troubleshooting
  - Test failure details with stack traces
  - Deployment artifacts (build outputs) available for inspection

---

## Open Questions & Decisions

Capture known uncertainties without blocking progress.

- **Decision:** Should we use GitHub-hosted runners or self-hosted runners?
  - **Resolution:** Use GitHub-hosted runners for Sprint 3; self-hosted runners can be added later if needed for cost or control

- **Decision:** Should we implement automatic rollback on deployment failure?
  - **Resolution:** CloudFormation automatic rollback is sufficient; manual rollback via CDK destroy/deploy is acceptable for v1

- **Decision:** What test coverage threshold should block merges?
  - **Resolution:** No hard threshold for Sprint 3; establish baseline and set threshold in Sprint 4

- **Question:** Should we implement deployment notifications to Slack or email?
  - **Owner:** Team decision in Sprint 3 implementation
  - **Target timing:** Optional enhancement if time permits

- **Question:** How should we handle long-running deployments (>30 minutes)?
  - **Owner:** Monitor in Sprint 3 and adjust timeout values as needed
  - **Target timing:** Sprint 3 or Sprint 4

- **Question:** Should we implement infrastructure drift detection?
  - **Owner:** Security review
  - **Target timing:** Sprint 8 (security hardening)

---

## Exit Criteria

Restate the conditions under which this sprint is considered complete.

- ✅ CI pipeline runs on every pull request (lint, typecheck, test, CDK synth)
- ✅ Failed CI checks block PR merges
- ✅ Main branch merges automatically deploy to dev environment
- ✅ Dev deployment includes infrastructure (CDK) and frontend (S3/CloudFront)
- ✅ QA deployment can be triggered manually or via version tag
- ✅ Production deployment requires manual approval before executing
- ✅ Vitest is configured and running tests for frontend and backend
- ✅ At least one intentionally failing test validates CI enforcement
- ✅ AWS credentials and secrets managed securely via GitHub Secrets
- ✅ Workflow logs provide clear visibility into deployment steps and failures
- ✅ Documentation updated with CI/CD pipeline descriptions and usage instructions
- ✅ Deployments are repeatable and require no manual AWS Console steps

> If all exit criteria are met, the sprint is done.

---

## Sprint Notes

- Sprint 3 establishes the foundation for safe, rapid iteration on features
- CI/CD automation is critical before building domain features to prevent regression
- This sprint does not include domain-specific tests yet - those come in Sprint 4
- Manual approval for production is a deliberate safety measure; automation can increase later
- Test coverage baseline is established but not enforced strictly until domain model exists
- GitHub Actions was chosen for its tight GitHub integration and zero infrastructure overhead
- Consider cost implications of GitHub Actions usage; self-hosted runners may be more cost-effective at scale
- CloudFormation changeset review for production deployments ensures visibility into infrastructure changes
- This sprint enables "boring" deployments: predictable, safe, and automated
- Failed deployments should never require manual cleanup; CloudFormation rollback handles it
- Secrets rotation strategy should be established in later sprint (not blocking for v1)
