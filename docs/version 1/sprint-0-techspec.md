# Sprint 0 — Project Bootstrap & Guardrails

**Primary Epic:** EPIC 0 — Project Foundation & DX

**Sprint Intent**
Establish a safe, well-structured development environment that enables rapid iteration through vibe coding with GitHub Copilot. This sprint creates the foundational repository structure, tooling, and CI guardrails that will support all future development without forcing manual consistency checks or unsafe commits.

---

## Goals

Define what success looks like for this sprint.

- Create a monorepo structure that scales from MVP to production
- Establish TypeScript, linting, and formatting standards that enforce code quality automatically
- Implement a minimal CI pipeline that prevents broken code from merging
- Ensure the repository is "vibe-safe" for AI-assisted development

---

## In Scope

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

## Out of Scope

Explicitly list what this sprint will *not* attempt to do.

- Actual application code (React, Lambda, CDK)
- Test framework implementation (deferred to Sprint 1+)
- Build tooling (Vite, esbuild, etc.)
- Deployment pipelines (covered in Sprint 3)
- Database schemas or domain models
- Authentication or security implementation
- Docker or containerization
- Package publishing or version management

> This section exists to prevent scope creep and over-eager AI assistance.

---

## System Context & Assumptions

Describe the system-level truths and constraints that apply during this sprint.

- **Node.js version**: 20.x LTS (specified in engines)
- **Package manager**: pnpm 8.x+ (workspace support, faster than npm/yarn)
- **Monorepo structure**: Follows standard patterns (apps/, packages/, infra/)
- **TypeScript strict mode**: All TypeScript code must compile with strict settings
- **Version control**: Git with GitHub as remote
- **CI/CD platform**: GitHub Actions
- **Code editor**: VS Code is the primary development environment
- **Coding standards**: Already defined in docs/standards/
- **No existing codebase**: Starting from empty structure (minimal friction)
- **Developer experience is a first-class concern**: Tools must not slow down iteration

---

## Functional Requirements

Describe the business-level behaviors the system must support as a result of this sprint.
Each requirement should be independently testable.

### FR-1: Monorepo Workspace Initialization

**Description**
The repository must be structured as a pnpm workspace with clear separation of concerns across apps, packages, and infrastructure code.

**Acceptance Criteria**
- Given a fresh clone of the repository, when running `pnpm install`, then all dependencies install without errors
- Given the workspace configuration, when adding a new package, then it automatically participates in workspace hoisting
- Given the workspace structure, when running `pnpm -r <command>`, then the command executes across all packages

---

### FR-2: TypeScript Configuration Inheritance

**Description**
All TypeScript packages must inherit from a shared base configuration that enforces strict type safety and modern JavaScript features.

**Acceptance Criteria**
- Given a new TypeScript file in any package, when running `tsc --noEmit`, then strict mode violations are caught
- Given the base tsconfig, when a package extends it, then it inherits all compiler options unless explicitly overridden
- Given TypeScript code across the workspace, when running type-check, then all packages are validated

---

### FR-3: Automated Code Quality Enforcement

**Description**
Linting and formatting must be automated and enforceable, preventing inconsistent code from being committed.

**Acceptance Criteria**
- Given any TypeScript file, when running `pnpm lint`, then ESLint validates the code against configured rules
- Given any code file, when running `pnpm format`, then Prettier reformats it according to style guide
- Given code with lint errors, when attempting to run CI, then the pipeline fails
- Given improperly formatted code, when running format check in CI, then the pipeline fails

---

### FR-4: Continuous Integration on Pull Requests

**Description**
A GitHub Actions workflow must run automated checks on every pull request to prevent broken code from merging.

**Acceptance Criteria**
- Given a pull request, when opened or updated, then CI automatically runs lint and type-check
- Given CI checks that fail, when reviewing the PR, then merge is blocked until checks pass
- Given CI checks that pass, when reviewing the PR, then the status is clearly visible
- Given a commit pushed to main, when CI runs, then the same checks execute as on PRs

---

### FR-5: Developer Documentation

**Description**
Clear documentation must exist for onboarding new developers and explaining the repository structure.

**Acceptance Criteria**
- Given a new developer, when reading the README, then they understand how to set up their environment
- Given the workspace structure, when viewing documentation, then the purpose of each directory is clear
- Given development scripts, when referencing documentation, then usage is explained with examples

---

## Non-Functional Requirements

List only the non-functional requirements that are relevant *for this sprint*.

### Security
- No secrets or credentials stored in repository
- .gitignore configured to prevent accidental commits of sensitive files
- Node.js version constrained to LTS for security updates

### Performance
- `pnpm install` completes in under 60 seconds on first run
- CI pipeline (lint + type-check) completes in under 3 minutes
- Workspace commands (pnpm -r) execute efficiently across packages

### Reliability & Error Handling
- Missing dependencies result in clear error messages
- Invalid TypeScript configuration produces actionable errors
- CI failures provide specific file and line information

### Developer Experience
- One-command setup: `pnpm install`
- VS Code recommended extensions auto-prompt on workspace open
- Scripts use consistent naming (lint, format, type-check, test)
- Error messages guide toward resolution
- No manual configuration steps required

---

## Data & State Changes

Describe any changes to persisted data or system state.

**File System Structure Created:**
```
/
├── .github/
│   └── workflows/
│       └── ci.yml
├── apps/
│   └── web/
│       ├── package.json
│       └── tsconfig.json
├── infra/
│   └── cdk/
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   └── shared/
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           └── index.ts
├── docs/
│   └── (existing documentation)
├── .gitignore
├── .prettierrc
├── .eslintrc.js
├── package.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── tsconfig.base.json
├── README.md
└── .vscode/
    ├── extensions.json
    └── settings.json
```

**No database or persistent state** — this sprint is purely about repository setup.

---

## API & Integration Touchpoints

Include this section only if APIs or integrations are affected.

**Not applicable for Sprint 0** — no APIs or external integrations.

---

## Testing Strategy

Describe how correctness will be validated for this sprint.

### Manual Verification
- Clone repository to fresh directory
- Run `pnpm install` and verify clean completion
- Run `pnpm lint` and verify it executes
- Run `pnpm type-check` and verify all TypeScript compiles
- Run `pnpm format` and verify code is reformatted
- Create a test PR and verify CI runs automatically

### CI Pipeline Tests
- Lint check must pass on valid code
- Lint check must fail on code with violations
- Type-check must pass on valid TypeScript
- Type-check must fail on type errors
- Format check must detect unformatted code

### Edge Cases
- Empty package added to workspace
- Package with no TypeScript files
- Circular dependency between workspace packages (should error)
- Missing peer dependencies (should error with clear message)

### Definition of Done
- All FR acceptance criteria pass
- Documentation is complete and accurate
- CI runs successfully on a test PR
- Another developer can clone and set up the repo in under 5 minutes

---

## Observability & Diagnostics

If relevant, describe expectations for visibility into system behavior.

### Logging
- pnpm commands show progress for multi-package operations
- ESLint outputs file paths and line numbers for violations
- TypeScript compiler shows clear error locations

### CI Visibility
- GitHub Actions workflow logs are accessible for all checks
- Failed checks show specific errors, not just "failed"
- Job summaries indicate which package or file caused failure

---

## Open Questions & Decisions

Capture known uncertainties without blocking progress.

### Q1: ESLint Rule Strictness
**Question**: Should we enforce zero warnings in CI, or only errors?
**Decision**: Start with errors-only enforcement. Warnings allowed but visible. Can be tightened in future sprints.
**Owner**: Team decision during sprint
**Status**: Recommend errors-only for v1

### Q2: Pre-commit Hooks
**Question**: Should we use Husky/lint-staged for pre-commit validation?
**Decision**: Defer to Sprint 1. CI enforcement is sufficient for Sprint 0.
**Owner**: Deferred
**Status**: Out of scope for Sprint 0

### Q3: Package Versioning Strategy
**Question**: How do we version workspace packages?
**Decision**: All packages start at 0.1.0. No publishing in v1. Defer to post-launch.
**Owner**: Deferred
**Status**: Not needed for Sprint 0

---

## Exit Criteria

Restate the conditions under which this sprint is considered complete.

- ✅ `pnpm install` runs cleanly on a fresh clone
- ✅ `pnpm lint` executes across all packages without crashing
- ✅ `pnpm type-check` validates all TypeScript code
- ✅ `pnpm format` reformats code consistently
- ✅ CI pipeline runs on pull requests and validates lint + type-check
- ✅ Failed CI checks block PR merge
- ✅ README documents repository setup and structure
- ✅ Workspace structure follows monorepo best practices (apps/, packages/, infra/)
- ✅ Repository is "vibe-safe" — Copilot can generate code that passes checks

> If all exit criteria are met, the sprint is done.

---

## Notes

### Reference Documentation
- TypeScript standards: [docs/standards/code/typescript.md](../standards/code/typescript.md)
- CI/CD standards: [docs/standards/process/cicd.md](../standards/process/cicd.md)
- Git workflow: [docs/standards/process/git-workflow.md](../standards/process/git-workflow.md)

### Related Decisions
- Monorepo chosen over polyrepo for simpler dependency management
- pnpm chosen over npm/yarn for workspace performance and disk efficiency
- GitHub Actions chosen as CI platform (free for public repos, integrated with GitHub)

### Technical Debt Accepted
- No test framework yet (added in Sprint 1+)
- No build tooling yet (added when needed for apps)
- VS Code specific settings (other editors not supported initially)

### Future Enhancements (Post-Sprint 0)
- Pre-commit hooks with Husky
- Automated dependency updates with Renovate/Dependabot
- Code coverage reporting
- Bundle size monitoring
- Performance budgets
