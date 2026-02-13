# Sprint Goals

This document is a compiled reference of the in-scope goals for the project

## Sprint 0

### Goals

Define what success looks like for this sprint.

- Create a monorepo structure that scales from MVP to production
- Establish TypeScript, linting, and formatting standards that enforce code quality automatically
- Implement a minimal CI pipeline that prevents broken code from merging
- Ensure the repository is "vibe-safe" for AI-assisted development

---

### In Scope

Explicitly list what this sprint will cover.

- Monorepo workspace configuration with pnpm
- Shared TypeScript configuration across all packages
- ESLint configuration with TypeScript support
- Prettier configuration for consistent formatting
- Base package.json scripts (lint, type-check, test placeholders)
- Skeleton CI pipeline (GitHub Actions) that runs lint and type-check on PRs
- README documentation for repository structure and development workflow
- .gitignore configuration
- VS Code workspace settings (recommended extensions, settings)

---

## Sprint 1

### Goals

Define what success looks like for this sprint.

- Secure user authentication via AWS Cognito Hosted UI
- Protected API Gateway with Cognito authorizer
- User identity available in all Lambda contexts
- Per-user data isolation enforced at the architectural level

---

### In Scope

Explicitly list what this sprint will cover.

- AWS Cognito User Pool infrastructure via CDK
- Cognito Hosted UI configuration and deployment
- Frontend login/logout flow with Cognito integration
- API Gateway HTTP API with Cognito authorizer
- Lambda context enrichment with authenticated user identity
- IAM least-privilege policies for Lambda execution roles
- Secure environment variable handling for Cognito configuration
- CI pipeline update to include CDK synth validation

---

## Sprint 2

### Goals

Define what success looks like for this sprint.

- Complete infrastructure-as-code coverage for all application components
- Multi-environment support (dev, QA, prod) with proper parameterization
- DynamoDB table for per-user data storage
- Frontend hosting infrastructure (S3 + CloudFront)
- Automated deployment for dev environment
- Production-ready infrastructure patterns established

---

### In Scope

Explicitly list what this sprint will cover.

- DynamoDB table with single-table design for user data
- S3 bucket and CloudFront distribution for frontend hosting
- Environment-specific configuration (dev, QA, prod)
- Environment parameter file structure
- AWS Secrets Manager integration for sensitive configuration
- Cost control guardrails (budget alerts, resource tagging)
- Dev environment auto-deployment pipeline
- QA and Prod deployment pipeline scaffolding
- Infrastructure documentation and deployment guides
- CDK context and environment variable handling

---

## Sprint 3

### Goals

Define what success looks like for this sprint.

- Automated CI pipeline running on every pull request
- Automated deployment to dev environment on main branch merge
- Quality gates preventing broken code from shipping
- Repeatable, boring deployments that require no manual intervention
- Comprehensive test coverage baseline established

---

### In Scope

Explicitly list what this sprint will cover.

- GitHub Actions workflow for continuous integration:
- GitHub Actions workflow for dev environment deployment:
- GitHub Actions workflow for QA environment deployment:
- GitHub Actions workflow for production deployment:
- Vitest configuration and baseline test suite:
- Secrets management in GitHub Actions:
- Deployment status and notifications:

---

## Sprint 4

## Sprint 5

## Sprint 6

### Goals

Define what success looks like for this sprint.

- Implement a repeatable weekly review workflow that feels calm and purposeful
- Enable users to edit drivers and create milestones/actions during review
- Provide coach reminders for missed reviews to maintain consistency
- Create a UI state that encourages focus and reflection

---

### In Scope

Explicitly list what this sprint will cover.

- Weekly review workflow implementation
- Review day configuration (user-selectable)
- Driver editing capabilities during review
- Milestone and action creation within the review context
- Coach reminder system for missed reviews
- Focused, calm UI state for review mode
- Minimal persistence enhancements to support review state
