# GitHub Configuration Checklist

Use this file to track your GitHub configuration progress. Check off items as you complete them.

## 🔐 GitHub Environments

### Development Environment
- [x] Created environment named `development`
- [x] No protection rules configured (allows auto-deploy)
- [x] ✅ Ready for deployment

### QA Environment
- [X] Created environment named `qa`
- [ ] Optional: Added reviewers if desired
- [x] ✅ Ready for deployment

### Production Environment ⚠️ CRITICAL
- [X] Created environment named `production`
- [ ] ✅ Added required reviewers (1-2 people)
- [ ] ✅ Set wait timer to 5 minutes minimum
- [ ] ✅ Configured deployment branches (main only)
- [ ] ✅ Ready for deployment with approval

---

## 🔑 GitHub Secrets - Development

### AWS Credentials
- [x] `AWS_ACCESS_KEY_ID`
- [x] `AWS_SECRET_ACCESS_KEY`
- [x] `AWS_REGION` (set to: us-east-2)

### CDK Deployment Values (from CDK outputs)
- [x] `DEV_CDK_STACK_NAME` (TimeManagementApp-Dev) - Added as environment variable
- [x] `DEV_BUCKET_NAME` (timemanagementapp-dev-frontend)
- [x] `DEV_DISTRIBUTION_ID` (E24P1MPW9XQSH)

### Cognito Values (from CDK outputs)
- [x] `DEV_USER_POOL_ID` (us-east-2_m6TMWRMLF)
- [x] `DEV_USER_POOL_CLIENT_ID` (20pdod03r4pq2n7odhidhfk6cq)
- [x] `DEV_USER_POOL_DOMAIN` (tm-dev-c8cc45ee)

**Dev Secrets Complete**: ✅ (9/9 configured)

---

## 🔑 GitHub Secrets - QA

### AWS Credentials
- [x] `AWS_ACCESS_KEY_ID`
- [x] `AWS_SECRET_ACCESS_KEY`
- [x] `AWS_REGION` (set to: us-east-1)

### CDK Deployment Values (from CDK outputs)
- [x] `QA_CDK_STACK_NAME` (TimeManagementApp-Qa) - Added as environment variable
- [x] `QA_BUCKET_NAME` (timemanagementapp-qa-frontend)
- [x] `QA_DISTRIBUTION_ID` (E2VB4YESXTRJM6)

### Cognito Values (from CDK outputs)
- [x] `QA_USER_POOL_ID` (us-east-1_hwNW5KQlY)
- [x] `QA_USER_POOL_CLIENT_ID` (5neks8kjdl09qn4gkhfcg1mnjt)
- [x] `QA_USER_POOL_DOMAIN` (tm-qa-c84e1a96)

**QA Secrets Complete**: ✅ (9/9 configured)

---

## 🔑 GitHub Secrets - Production

### AWS Credentials
- [ ] `AWS_ACCESS_KEY_ID_PROD`
- [ ] `AWS_SECRET_ACCESS_KEY_PROD`
- [ ] `AWS_REGION_PROD` (set to: us-east-1)

### CDK Deployment Values (from CDK outputs)
- [ ] `PROD_CDK_STACK_NAME` (TimeManagementStack-Prod)
- [ ] `PROD_BUCKET_NAME` (get after first CDK deploy)
- [ ] `PROD_DISTRIBUTION_ID` (get after first CDK deploy)

### Cognito Values (from CDK outputs)
- [ ] `PROD_USER_POOL_ID` (get after first CDK deploy)
- [ ] `PROD_USER_POOL_CLIENT_ID` (get after first CDK deploy)
- [ ] `PROD_USER_POOL_DOMAIN` (get after first CDK deploy)

**Prod Secrets Complete**: ⬜ (9/9 configured)

---

## 🛡️ Branch Protection Rules

### Main Branch Protection
- [x] Created branch protection rule for `main`
- [x] ✅ Require pull request before merging
- [x] ✅ Require approvals: 1
- [x] ✅ Require status checks to pass before merging
- [x] ✅ Require branches to be up to date
- [x] ✅ Added required check: `ci`
- [x] ✅ Do not allow bypassing settings
- [ ] Optional: Include administrators

**⚠️ Note**: Rules configured but **not enforced** on private repos with GitHub Free. Rules will auto-enforce when upgraded to GitHub Team or repo made public.

---

## 🚀 AWS CDK Bootstrap

### Development Region (us-east-2)
- [x] Bootstrapped CDK: `npx aws-cdk bootstrap aws://098295335350/us-east-2`
- [x] Verified bootstrap: `aws cloudformation describe-stacks --stack-name CDKToolkit`

### QA Region (us-east-1)
- [x] Bootstrapped CDK: `npx aws-cdk bootstrap aws://098295335350/us-east-1`
- [x] Verified bootstrap: `aws cloudformation describe-stacks --stack-name CDKToolkit`

### Production Region (us-east-1)
- [ ] Bootstrapped CDK: `npx aws-cdk bootstrap aws://ACCOUNT-ID/us-east-1`
- [ ] Verified bootstrap: `aws cloudformation describe-stacks --stack-name CDKToolkit`

---

## ✅ Verification Tests

### CI Workflow
- [ ] Created test PR
- [ ] CI workflow ran automatically
- [ ] All checks passed (lint, type-check, format, tests, cdk synth)
- [ ] PR showed "All checks have passed"

### Dev Deployment
- [x] Merged PR to main (Sprint 3 completed)
- [x] Deploy to Dev workflow triggered automatically
- [x] Infrastructure deployed successfully via GitHub Actions
- [x] Frontend uploaded to S3
- [x] CloudFront cache invalidated
- [x] Got CDK outputs (bucket, distribution, user pool values)
- [x] Updated dev secrets with CDK output values
- [x] Cleaned up orphaned resources (S3, DynamoDB)

### QA Deployment
- [x] Created version tag: `v1.0.0-qa.5`
- [x] Deploy to QA workflow triggered
- [x] Deployment completed successfully
- [x] Got CDK outputs
- [x] Updated QA secrets with CDK output values
- [x] Verified CloudFront URL: https://d192gxr116io77.cloudfront.net
- [x] Frontend successfully deployed to S3
- [x] Fixed workflow stack name extraction issue

### Production Deployment
- [ ] Triggered manual workflow dispatch
- [ ] Approval request sent to reviewers
- [ ] Waited minimum 5 minutes
- [ ] Approved deployment
- [ ] Infrastructure deployed
- [ ] Health check passed
- [ ] Got CDK outputs
- [ ] Updated prod secrets with CDK output values

### CI Enforcement (Optional)
- [ ] Uncommented failing test in `ci-validation.test.ts`
- [ ] Created PR with failing test
- [ ] CI failed as expected
- [ ] PR blocked from merging
- [ ] Recommented failing test
- [ ] CI passed
- [ ] Merged PR

---

## 📊 Completion Status

**Overall Progress**: � Dev & QA Complete ✅

- **Environments**: 🟢 (3/3 created - dev & qa complete, prod pending)
- **Dev Secrets**: ✅ (9/9 configured)
- **QA Secrets**: ✅ (9/9 configured)
- **Prod Secrets**: ⬜ (0/9 configured)
- **Branch Protection**: 🟡 (configured but not enforced - private repo)
- **CDK Bootstrap**: 🟢 (2/2 regions - dev & qa complete)
- **Verification Tests**: 🟢 (Dev & QA complete - GitHub Actions deployment successful)
- **AWS Account**: ✅ (098295335350 - fouriergauss)
- **Account Protection**: ✅ (direnv configured with .envrc)

---

## 🎯 Next Steps

1. ✅ ~~Create the three GitHub Environments~~
2. ✅ ~~Add AWS credentials for dev environment (3 secrets)~~
3. ✅ ~~Bootstrap CDK in dev region~~
4. ✅ ~~Deploy to dev to get CDK outputs~~
5. ✅ ~~Add remaining dev secrets from CDK outputs~~
6. ✅ ~~Clean up orphaned resources~~
7. ✅ ~~Configure branch protection rules (not enforced - private repo)~~
8. ✅ ~~Bootstrap CDK in QA region~~
9. ✅ ~~Deploy to QA and configure secrets~~
10. ✅ ~~Configure direnv for AWS account protection~~
11. **Next**: Test CI/CD workflow with code changes
12. **Then**: Configure Production environment

---

## 💡 Tips

- **Do dev first**: Get it working before QA/Prod
- **Use same AWS account**: Easier to manage initially
- **Save CDK outputs**: You'll need them for secrets
- **Test incrementally**: Don't configure everything at once
- **Document values**: Keep a secure note of deployment values

---

## 📚 Need Help?

- **Setup Guide**: [SETUP.md](./SETUP.md)
- **Troubleshooting**: [SETUP.md#troubleshooting](./SETUP.md#-troubleshooting)
- **Deployment Guide**: [../docs/version 1/sprint-3-deployment.md](../docs/version%201/sprint-3-deployment.md)

---

**Ready?** Start with creating the three GitHub Environments! 🚀
