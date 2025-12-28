# Development Standards

This directory contains coding and project standards for the time-management platform.

## 📚 Documentation Structure

### Overview
- **[overview.md](./overview.md)** - High-level principles and philosophy

### Code Standards
- **[typescript.md](./code/typescript.md)** - TypeScript conventions, types, and modules
- **[react-frontend.md](./code/react-frontend.md)** - React components, hooks, and state management
- **[api-lambda.md](./code/api-lambda.md)** - Lambda handlers, API patterns, and backend logic

### Infrastructure
- **[cdk-patterns.md](./infrastructure/cdk-patterns.md)** - CDK constructs, stacks, and AWS best practices
- **[security.md](./infrastructure/security.md)** - Authentication, IAM, secrets management, and security principles

### Process
- **[testing.md](./process/testing.md)** - Unit, integration, and E2E testing standards
- **[cicd.md](./process/cicd.md)** - Pipeline standards and deployment practices
- **[git-workflow.md](./process/git-workflow.md)** - Branch strategy, commit messages, and PR process

## 🎯 How to Use These Standards

When working on different parts of the codebase, reference the relevant standards:

- **Building React components?** → Read `overview.md` + `code/typescript.md` + `code/react-frontend.md`
- **Writing Lambda functions?** → Read `overview.md` + `code/typescript.md` + `code/api-lambda.md`
- **Creating CDK stacks?** → Read `overview.md` + `infrastructure/cdk-patterns.md` + `infrastructure/security.md`
- **Setting up CI/CD?** → Read `process/cicd.md` + `process/git-workflow.md`
- **Writing tests?** → Read `process/testing.md`

## ✅ Documentation Status

All documentation is now complete and ready for use:

- ✅ Core Principles (overview.md)
- ✅ Code Standards (typescript.md, react-frontend.md, api-lambda.md)
- ✅ Infrastructure Standards (cdk-patterns.md, security.md)
- ✅ Process Standards (testing.md, cicd.md, git-workflow.md)

These are living documents that evolve with the project. Contributions and improvements are welcome through the standard pull request process.

---

**Last Updated:** December 28, 2025
