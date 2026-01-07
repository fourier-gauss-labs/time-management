# GitHub Configuration Setup

This file explains the VS Code warnings you're seeing and provides a checklist for configuring GitHub Actions.

## 🟡 About VS Code Warnings

If you see warnings in VS Code about:
- ❌ "Value 'development' is not valid"
- ❌ "Context access might be invalid: AWS_ACCESS_KEY_ID"

**These warnings are expected and normal** until you complete the GitHub configuration below. They indicate that:
1. GitHub Environments haven't been created yet
2. GitHub Secrets haven't been configured yet

The workflows are correctly written - they just reference resources that need to be created in GitHub's UI.

---

## ✅ Configuration Checklist

Complete these steps in GitHub to resolve all warnings and activate CI/CD:

### Step 1: Create GitHub Environments

Navigate to: **Repository Settings → Environments → New environment**

Create these three environments:

#### 1. Development Environment
- **Name**: `development`
- **Protection rules**: None (auto-deploy on merge to main)
- **Deployment branches**: Any branch

#### 2. QA Environment
- **Name**: `qa`
- **Protection rules**: Optional (can add reviewers if desired)
- **Deployment branches**: Any branch

#### 3. Production Environment ⚠️ CRITICAL
- **Name**: `production`
- **Protection rules**:
  - ✅ **Required reviewers**: Add 1-2 team members
  - ✅ **Wait timer**: Set to 5 minutes minimum
  - ✅ **Deployment branches**: Selected branches (main only)
- This prevents accidental production deployments and requires approval

---

### Step 2: Configure GitHub Secrets

Navigate to: **Repository Settings → Secrets and variables → Actions → New repository secret**

Add each secret below. Get values from AWS and CDK deployment outputs.

#### Development Secrets (6 required)
```
AWS_ACCESS_KEY_ID=<your-dev-aws-access-key>
AWS_SECRET_ACCESS_KEY=<your-dev-aws-secret-key>
AWS_REGION=us-east-2

DEV_CDK_STACK_NAME=TimeManagementStack-Dev
DEV_BUCKET_NAME=<from CDK output after first deploy>
DEV_DISTRIBUTION_ID=<from CDK output after first deploy>
DEV_USER_POOL_ID=<from CDK output after first deploy>
DEV_USER_POOL_CLIENT_ID=<from CDK output after first deploy>
DEV_USER_POOL_DOMAIN=<from CDK output after first deploy>
```

#### QA Secrets (9 required, with _QA suffix)
```
AWS_ACCESS_KEY_ID_QA=<your-qa-aws-access-key>
AWS_SECRET_ACCESS_KEY_QA=<your-qa-aws-secret-key>
AWS_REGION_QA=us-east-1

QA_CDK_STACK_NAME=TimeManagementStack-QA
QA_BUCKET_NAME=<from CDK output after first deploy>
QA_DISTRIBUTION_ID=<from CDK output after first deploy>
QA_USER_POOL_ID=<from CDK output after first deploy>
QA_USER_POOL_CLIENT_ID=<from CDK output after first deploy>
QA_USER_POOL_DOMAIN=<from CDK output after first deploy>
```

#### Production Secrets (9 required, with _PROD suffix)
```
AWS_ACCESS_KEY_ID_PROD=<your-prod-aws-access-key>
AWS_SECRET_ACCESS_KEY_PROD=<your-prod-aws-secret-key>
AWS_REGION_PROD=us-east-1

PROD_CDK_STACK_NAME=TimeManagementStack-Prod
PROD_BUCKET_NAME=<from CDK output after first deploy>
PROD_DISTRIBUTION_ID=<from CDK output after first deploy>
PROD_USER_POOL_ID=<from CDK output after first deploy>
PROD_USER_POOL_CLIENT_ID=<from CDK output after first deploy>
PROD_USER_POOL_DOMAIN=<from CDK output after first deploy>
```

---

### Step 3: Enable Branch Protection (Required for CI enforcement)

Navigate to: **Repository Settings → Branches → Add branch protection rule**

**Branch name pattern**: `main`

**Protection rules to enable**:
- ✅ Require a pull request before merging
  - Require approvals: 1 (recommended)
- ✅ Require status checks to pass before merging
  - ✅ Require branches to be up to date before merging
  - **Add required check**: `ci` (the CI workflow)
- ✅ Do not allow bypassing the above settings
- ⚠️ Include administrators (recommended for consistency)

This ensures:
- All code goes through PR review
- CI tests must pass before merge
- Failed tests block deployment
- No direct commits to main

---

### Step 4: Bootstrap CDK (First Time Only)

Before first deployment, bootstrap CDK in each AWS account/region:

```bash
# Development (us-east-2)
npx aws-cdk bootstrap aws://ACCOUNT-ID/us-east-2

# QA (us-east-1)
npx aws-cdk bootstrap aws://ACCOUNT-ID/us-east-1

# Production (us-east-1)
npx aws-cdk bootstrap aws://ACCOUNT-ID/us-east-1
```

Replace `ACCOUNT-ID` with your AWS account ID.

---

## 🚀 Testing the Setup

### 1. Test CI Workflow
```bash
# Create a test branch
git checkout -b test/ci-check

# Make a small change
echo "# Test" >> README.md
git add README.md
git commit -m "test: verify CI runs"
git push origin test/ci-check

# Create PR and verify:
# ✅ CI workflow runs automatically
# ✅ All checks pass (lint, type-check, format, tests)
# ✅ PR shows "All checks have passed"
```

### 2. Test CI Enforcement (Optional)
```bash
# Uncomment the failing test
# Edit: apps/web/src/test/ci-validation.test.ts (lines 8-10)

# Create PR with failing test
# Verify:
# ❌ CI fails
# ❌ PR cannot be merged (if branch protection enabled)

# Recomment the test before merging
```

### 3. Test Development Auto-Deploy
```bash
# After configuring dev secrets
git checkout main
git pull
# Merge a PR or push directly (if branch protection not enabled)

# Verify in Actions tab:
# ✅ CI workflow passes
# ✅ Deploy to Dev workflow triggers automatically
# ✅ Infrastructure deploys
# ✅ Frontend uploads to S3
# ✅ CloudFront invalidates cache
```

### 4. Test QA Deployment
```bash
# Option 1: Tag-based
git tag v1.0.0-qa.1
git push origin v1.0.0-qa.1

# Option 2: Manual
# Go to: Actions → Deploy to QA → Run workflow

# Verify deployment completes successfully
```

### 5. Test Production Approval
```bash
# Go to: Actions → Deploy to Production → Run workflow

# Verify:
# ⏳ Workflow waits for approval
# 👤 Reviewers receive notification
# ✅ After approval, deployment proceeds
# ✅ Health check passes
```

---

## 📊 Verification

When setup is complete, you should see:
- ✅ No warnings in VS Code Problems panel (or only unrelated warnings)
- ✅ GitHub Actions badge shows passing
- ✅ Pull requests show required CI check
- ✅ Environments show in repository settings
- ✅ Secrets show in repository settings (values hidden)
- ✅ Branch protection rules active on main

---

## 🆘 Troubleshooting

### VS Code Still Shows Warnings After Configuration
- Close and reopen VS Code
- Reload window: Cmd/Ctrl + Shift + P → "Reload Window"
- Restart GitHub Actions extension

### CI Workflow Doesn't Run on PR
- Check branch protection is enabled
- Verify `.github/workflows/ci.yml` exists
- Check PR is targeting `main` branch
- Look in Actions tab for error messages

### Deployment Fails with "Secret not found"
- Verify secret name matches exactly (case-sensitive)
- Check secret is set at repository level (not environment level for AWS creds)
- Confirm you're using the correct environment (dev/qa/prod)

### Production Deployment Runs Without Approval
- Verify production environment has "Required reviewers" enabled
- Check environment protection rules are saved
- Ensure workflow references `environment: production`

### CDK Deploy Fails
- Verify CDK is bootstrapped: `npx aws-cdk bootstrap`
- Check AWS credentials are valid: `aws sts get-caller-identity`
- Verify region matches secret: `AWS_REGION` vs workflow region
- Check IAM permissions for deploying resources

---

## 📚 Additional Resources

- **Detailed Deployment Guide**: [docs/version 1/sprint-3-deployment.md](../docs/version%201/sprint-3-deployment.md)
- **CI/CD Standards**: [docs/standards/process/cicd.md](../docs/standards/process/cicd.md)
- **Sprint 3 TechSpec**: [docs/version 1/sprint-3-techspec.md](../docs/version%201/sprint-3-techspec.md)
- **GitHub Environments Docs**: https://docs.github.com/en/actions/deployment/targeting-different-environments
- **GitHub Secrets Docs**: https://docs.github.com/en/actions/security-guides/encrypted-secrets

---

## 🎯 Quick Reference

**To silence all warnings**: Complete Steps 1-3 above

**Minimum to test CI**: Enable branch protection (Step 3)

**Minimum to test deployment**: Create environment + add secrets (Steps 1-2 for one environment)

**Full production setup**: Complete all steps + bootstrap CDK

---

**Questions?** See the troubleshooting section above or check the deployment guide.
