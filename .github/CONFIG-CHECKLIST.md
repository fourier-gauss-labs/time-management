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
- [ ] ✅ Ready for deployment

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
- [x] `DEV_CDK_STACK_NAME` (TimeManagementStack-Dev) - Added as environment variable
- [ ] `DEV_BUCKET_NAME` (timemanagementstack-dev-frontend)
- [ ] `DEV_DISTRIBUTION_ID` (E3O4ZMRC3YCCEY)

### Cognito Values (from CDK outputs)
- [ ] `DEV_USER_POOL_ID` (us-east-2_0mK6NTNlr)
- [ ] `DEV_USER_POOL_CLIENT_ID` (60pvscd3rbdejmqu2aq39b3q1q)
- [ ] `DEV_USER_POOL_DOMAIN` (timemanagementstack-dev-users-991843)

**Dev Secrets Complete**: 🟡 (4/9 configured - 5 values ready to add)

---

## 🔑 GitHub Secrets - QA

### AWS Credentials
- [ ] `AWS_ACCESS_KEY_ID_QA`
- [ ] `AWS_SECRET_ACCESS_KEY_QA`
- [ ] `AWS_REGION_QA` (set to: us-east-1)

### CDK Deployment Values (from CDK outputs)
- [ ] `QA_CDK_STACK_NAME` (TimeManagementStack-QA)
- [ ] `QA_BUCKET_NAME` (get after first CDK deploy)
- [ ] `QA_DISTRIBUTION_ID` (get after first CDK deploy)

### Cognito Values (from CDK outputs)
- [ ] `QA_USER_POOL_ID` (get after first CDK deploy)
- [ ] `QA_USER_POOL_CLIENT_ID` (get after first CDK deploy)
- [ ] `QA_USER_POOL_DOMAIN` (get after first CDK deploy)

**QA Secrets Complete**: ⬜ (9/9 configured)

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
- [ ] Created branch protection rule for `main`
- [ ] ✅ Require pull request before merging
- [ ] ✅ Require approvals: 1
- [ ] ✅ Require status checks to pass before merging
- [ ] ✅ Require branches to be up to date
- [ ] ✅ Added required check: `ci`
- [ ] ✅ Do not allow bypassing settings
- [ ] Optional: Include administrators

---

## 🚀 AWS CDK Bootstrap

### Development Region (us-east-2)
- [x] Bootstrapped CDK: `npx aws-cdk bootstrap aws://798128976501/us-east-2`
- [x] Verified bootstrap: `aws cloudformation describe-stacks --stack-name CDKToolkit`

### QA Region (us-east-1)
- [ ] Bootstrapped CDK: `npx aws-cdk bootstrap aws://ACCOUNT-ID/us-east-1`
- [ ] Verified bootstrap: `aws cloudformation describe-stacks --stack-name CDKToolkit`

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
- [ ] Deploy to Dev workflow triggered automatically
- [x] Infrastructure deployed successfully (manual CDK deploy)
- [x] Frontend uploaded to S3
- [x] CloudFront cache invalidated
- [x] Got CDK outputs (bucket, distribution, user pool values)
- [ ] Updated dev secrets with CDK output values

### QA Deployment
- [ ] Created version tag: `v1.0.0-qa.1`
- [ ] Deploy to QA workflow triggered
- [ ] Deployment completed successfully
- [ ] Got CDK outputs
- [ ] Updated QA secrets with CDK output values

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

**Overall Progress**: 🟡 In Progress

- **Environments**: 🟡 (3/3 created - dev ready, qa/prod pending config)
- **Dev Secrets**: 🟡 (4/9 configured - 5 values ready to add to GitHub)
- **QA Secrets**: ⬜ (0/9 configured)
- **Prod Secrets**: ⬜ (0/9 configured)
- **Branch Protection**: ⬜ (not configured)
- **CDK Bootstrap**: 🟡 (1/3 regions - dev complete)
- **Verification Tests**: 🟡 (1/5 completed - manual dev deployment successful)

---

## 🎯 Next Steps

1. **Start here**: Create the three GitHub Environments
2. **Then**: Add AWS credentials for dev environment (3 secrets)
3. **Then**: Bootstrap CDK in dev region
4. **Then**: Deploy to dev to get CDK outputs
5. **Then**: Add remaining dev secrets from CDK outputs
6. **Then**: Enable branch protection
7. **Then**: Test CI workflow
8. **Finally**: Repeat for QA and Production

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
