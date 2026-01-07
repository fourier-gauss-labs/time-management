# Sprint 3 - CI/CD & Deployment Guide

## Overview

Sprint 3 establishes automated continuous integration and deployment pipelines using GitHub Actions. All deployments are automated, requiring no manual AWS Console interaction.

## Table of Contents

1. [CI/CD Pipeline Overview](#cicd-pipeline-overview)
2. [GitHub Actions Workflows](#github-actions-workflows)
3. [Required GitHub Secrets](#required-github-secrets)
4. [Environment Configuration](#environment-configuration)
5. [Deployment Process](#deployment-process)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

---

## CI/CD Pipeline Overview

### Workflows

**1. CI Pipeline** (`.github/workflows/ci.yml`)

- Triggers: All branch pushes and pull requests
- Actions: Lint, type check, format check, tests, CDK synth validation
- Purpose: Quality gates before merge

**2. Dev Deployment** (`.github/workflows/deploy-dev.yml`)

- Triggers: Push to `main` branch
- Actions: Deploy infrastructure and frontend to dev environment
- Purpose: Automatic deployment for development testing

**3. QA Deployment** (`.github/workflows/deploy-qa.yml`)

- Triggers: Version tags matching `v*-qa.*` or manual dispatch
- Actions: Deploy infrastructure and frontend to QA environment
- Purpose: Staging environment for pre-production testing

**4. Production Deployment** (`.github/workflows/deploy-prod.yml`)

- Triggers: Version tags matching `v[0-9]+.[0-9]+.[0-9]+` or manual dispatch
- Actions: Deploy infrastructure and frontend to production
- Purpose: Production releases with manual approval

---

## GitHub Actions Workflows

### CI Workflow

Runs on every push and pull request:

```yaml
Lint → Type Check → Format Check → Tests → CDK Synth
```

**Required to pass before merge.**

### Dev Deployment Workflow

Automatically deploys to development environment on `main` branch:

```yaml
Install → Lint → Type Check → Tests → Build → Deploy CDK → Build Frontend → Deploy to S3 → Invalidate CloudFront
```

### QA Deployment Workflow

Deploy to QA via tag or manual trigger:

```bash
# Create QA tag
git tag v1.0.0-qa.1
git push origin v1.0.0-qa.1
```

Or trigger manually via GitHub Actions UI.

### Production Deployment Workflow

Deploy to production with manual approval:

```bash
# Create production tag
git tag v1.0.0
git push origin v1.0.0
```

**Important**: GitHub environment `production` must have approval rules configured.

---

## Required GitHub Secrets

Navigate to: **Repository Settings → Secrets and variables → Actions**

### Development Environment

| Secret Name               | Description            | Example Value                   |
| ------------------------- | ---------------------- | ------------------------------- |
| `AWS_ACCESS_KEY_ID`       | AWS access key for dev | `AKIAIOSFODNN7EXAMPLE`          |
| `AWS_SECRET_ACCESS_KEY`   | AWS secret key for dev | `wJalrXUtnFEMI/K7MDENG/...`     |
| `DEV_USER_POOL_ID`        | Cognito User Pool ID   | `us-east-2_1gfhK8wz1`           |
| `DEV_USER_POOL_CLIENT_ID` | Cognito Client ID      | `66icsi28j2ggmrd1ac9ti3a5sn`    |
| `DEV_USER_POOL_DOMAIN`    | Cognito Domain         | `timemanagementstack-dev-users` |

### QA Environment

| Secret Name                | Description           |
| -------------------------- | --------------------- |
| `AWS_ACCESS_KEY_ID_QA`     | AWS access key for QA |
| `AWS_SECRET_ACCESS_KEY_QA` | AWS secret key for QA |
| `QA_USER_POOL_ID`          | Cognito User Pool ID  |
| `QA_USER_POOL_CLIENT_ID`   | Cognito Client ID     |
| `QA_USER_POOL_DOMAIN`      | Cognito Domain        |

### Production Environment

| Secret Name                  | Description                   |
| ---------------------------- | ----------------------------- |
| `AWS_ACCESS_KEY_ID_PROD`     | AWS access key for production |
| `AWS_SECRET_ACCESS_KEY_PROD` | AWS secret key for production |
| `PROD_USER_POOL_ID`          | Cognito User Pool ID          |
| `PROD_USER_POOL_CLIENT_ID`   | Cognito Client ID             |
| `PROD_USER_POOL_DOMAIN`      | Cognito Domain                |

---

## Environment Configuration

### GitHub Environments

Configure environments in **Repository Settings → Environments**.

#### Development Environment

- **Name**: `development`
- **Protection rules**: None (auto-deploy from main)
- **Secrets**: Dev-specific secrets
- **URL**: Automatically set from CloudFront deployment

#### QA Environment

- **Name**: `qa`
- **Protection rules**: Optional (recommended: require approval)
- **Secrets**: QA-specific secrets
- **Deployment branches**: All branches or tags only

#### Production Environment

- **Name**: `production`
- **Protection rules**:
  - ✅ Required reviewers: At least 1
  - ✅ Wait timer: 5 minutes
  - ✅ Deployment branches: Tags only (or main)
- **Secrets**: Production-specific secrets

**To configure protection rules:**

1. Navigate to Settings → Environments → production
2. Click "Add protection rule"
3. Enable "Required reviewers" and add yourself
4. Enable "Wait timer" (optional, recommended 5 minutes)
5. Save

---

## Deployment Process

### Development Deployment

**Automatic on `main` branch push:**

```bash
# Make changes
git add .
git commit -m "feat: add new feature"
git push origin main

# GitHub Actions automatically deploys to dev
```

**Manual deployment:**

Use GitHub Actions UI:

1. Go to Actions → Deploy to Dev
2. Click "Run workflow"
3. Select branch
4. Click "Run workflow"

### QA Deployment

**Via tag:**

```bash
# Create QA tag
git tag v1.0.0-qa.1
git push origin v1.0.0-qa.1

# GitHub Actions deploys to QA
```

**Manual deployment:**

1. Go to Actions → Deploy to QA
2. Click "Run workflow"
3. Select branch or tag
4. Click "Run workflow"

### Production Deployment

**Via tag (requires approval):**

```bash
# Create production tag
git tag v1.0.0
git push origin v1.0.0

# GitHub Actions starts deployment
# Wait for manual approval
# Review changes
# Approve deployment
```

**Manual deployment:**

1. Go to Actions → Deploy to Production
2. Click "Run workflow"
3. Select branch or tag
4. Click "Run workflow"
5. **Wait for approval request**
6. Review deployment plan
7. Approve or reject

---

## Testing

### Running Tests Locally

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:ci
```

### CI Validation Test

A special test file exists to verify CI enforcement:

**File**: `apps/web/src/test/ci-validation.test.ts`

**To test CI enforcement:**

1. Uncomment the failing test in `ci-validation.test.ts`
2. Commit and push to a feature branch
3. Open a pull request
4. Verify CI fails and blocks merge
5. Comment the test back out
6. Verify CI passes and allows merge

### Test Coverage

Tests are located in:

- `apps/web/src/**/*.test.{ts,tsx}` - Frontend tests
- `services/api/src/**/*.test.ts` - Backend tests

**Current test suite includes:**

- React component tests (App.tsx)
- Service tests (auth.test.ts)
- Lambda handler tests (verify.test.ts)
- Utility function tests (response.test.ts)
- CI validation test

---

## Troubleshooting

### CI Failures

**Linting errors:**

```bash
# Fix automatically
pnpm lint:fix
```

**Type errors:**

```bash
# Check types locally
pnpm type-check
```

**Test failures:**

```bash
# Run tests locally
pnpm test

# Run specific test file
pnpm --filter @time-management/web test src/App.test.tsx
```

**CDK synth errors:**

```bash
# Test CDK synth locally
cd infra/cdk
npx cdk synth
```

### Deployment Failures

**AWS credential errors:**

- Verify GitHub secrets are set correctly
- Check IAM user has necessary permissions
- Ensure AWS region is correct

**CDK deployment errors:**

- Check CloudFormation console for detailed error
- Review CDK diff before deployment
- Verify all required resources exist

**Frontend build errors:**

- Ensure all environment variables are set
- Check for TypeScript errors
- Verify Vite configuration

**S3 upload errors:**

- Verify S3 bucket exists
- Check IAM permissions for S3 operations
- Ensure bucket name is correct

**CloudFront invalidation errors:**

- Verify CloudFront distribution ID
- Check IAM permissions for CloudFront operations
- Ensure distribution is in "Deployed" state

### Common Issues

**Issue**: "Failed to extract CDK outputs"
**Solution**: CDK outputs file format may have changed. Verify the jq commands match the actual output structure.

**Issue**: "CloudFront invalidation takes too long"
**Solution**: This is normal. CloudFront invalidations can take 10-15 minutes. The workflow doesn't wait for completion.

**Issue**: "Production deployment not requesting approval"
**Solution**: Ensure the production environment has "Required reviewers" protection rule enabled in GitHub settings.

**Issue**: "Tests pass locally but fail in CI"
**Solution**: Ensure all test dependencies are in package.json (not just devDependencies). Check for environment-specific issues.

---

## Workflow Maintenance

### Adding New Secrets

1. Deploy infrastructure to get new values
2. Add secrets in GitHub: Settings → Secrets → Actions → New repository secret
3. Update workflow files to use the new secrets
4. Test in dev first, then promote to QA/prod

### Updating Node Version

Update `NODE_VERSION` in all workflow files:

```yaml
env:
  NODE_VERSION: '20.x' # Update this
```

### Changing AWS Region

Update `AWS_REGION` in workflow files and ensure infrastructure is deployed to the new region.

---

## Best Practices

1. **Always test in dev first** - Never skip straight to production
2. **Use semantic versioning** for tags - `v1.0.0`, `v1.0.1`, etc.
3. **Write meaningful commit messages** - They appear in deployment logs
4. **Monitor CloudWatch after deployments** - Check for errors
5. **Keep secrets up to date** - Rotate credentials regularly
6. **Review CDK diffs before production** - Understand what's changing
7. **Test CI enforcement regularly** - Use the validation test
8. **Use feature branches** - Keep main stable

---

## Quick Reference

### Deploy to Dev

```bash
git push origin main
# Automatic deployment
```

### Deploy to QA

```bash
git tag v1.0.0-qa.1
git push origin v1.0.0-qa.1
```

### Deploy to Production

```bash
git tag v1.0.0
git push origin v1.0.0
# Approve via GitHub UI
```

### Run Tests

```bash
pnpm test
```

### Check CI Locally

```bash
pnpm lint
pnpm type-check
pnpm format:check
pnpm test
cd infra/cdk && npx cdk synth
```

---

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS CDK Documentation](https://docs.aws.amazon.com/cdk/)
- [Vitest Documentation](https://vitest.dev/)
- [Sprint 3 TechSpec](./sprint-3-techspec.md)
