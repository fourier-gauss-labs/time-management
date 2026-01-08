# CDK Deployment Guide & Troubleshooting

This guide documents the deployment process and solutions to common issues encountered when deploying the Time Management infrastructure to AWS using CDK.

## 📋 Table of Contents

- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Deployment Steps](#deployment-steps)
- [Common Issues & Solutions](#common-issues--solutions)
- [Post-Deployment Tasks](#post-deployment-tasks)
- [Multi-Environment Deployment](#multi-environment-deployment)

---

## Pre-Deployment Checklist

Before deploying to any environment, ensure:

### 1. AWS Account Setup
- [ ] AWS credentials configured for target environment
- [ ] IAM user/role has sufficient permissions (see [Required IAM Permissions](#required-iam-permissions))
- [ ] AWS region selected (dev: us-east-2, qa/prod: us-east-1)

### 2. CDK Bootstrap
- [ ] CDK toolkit bootstrapped in target region
  ```bash
  # Example for dev (us-east-2)
  pnpm --filter @time-management/infra-cdk cdk bootstrap aws://ACCOUNT-ID/us-east-2
  ```
- [ ] Verify bootstrap:
  ```bash
  aws cloudformation describe-stacks --stack-name CDKToolkit --region us-east-2
  ```

### 3. Clean Deployment Environment
- [ ] No orphaned CloudFormation stacks from previous failed deployments
- [ ] No orphaned resources (S3 buckets, DynamoDB tables, Cognito domains)
- [ ] Check for existing resources:
  ```bash
  # Check CloudFormation stacks
  aws cloudformation list-stacks --region us-east-2 --query 'StackSummaries[?StackName==`TimeManagementStack-Dev`]'
  
  # Check S3 buckets
  aws s3 ls | grep timemanagementstack
  
  # Check DynamoDB tables
  aws dynamodb list-tables --region us-east-2 | grep TimeManagementStack
  
  # Check Cognito user pools
  aws cognito-idp list-user-pools --max-results 60 --region us-east-2
  ```

---

## Deployment Steps

### Standard Deployment Process

1. **Navigate to CDK directory**
   ```bash
   cd infra/cdk
   ```

2. **Synthesize the stack** (optional but recommended)
   ```bash
   pnpm cdk synth
   ```
   This validates your CDK code without deploying.

3. **Deploy the stack**
   ```bash
   pnpm cdk deploy --outputs-file cdk-outputs.json --require-approval never
   ```
   
   **Note**: For production, remove `--require-approval never` to review changes.

4. **Wait for deployment** (5-10 minutes)
   - CloudFront distribution takes the longest (~4-6 minutes)
   - Watch for any errors in the terminal output
   - Exit code 0 = success, exit code 1 = failure

5. **Verify outputs**
   ```bash
   # Check that outputs file was created
   ls -la cdk-outputs.json
   
   # View outputs
   cat cdk-outputs.json
   ```

---

## Common Issues & Solutions

### Issue 1: Orphaned Cognito Domain

**Symptom:**
```
CREATE_FAILED | AWS::Cognito::UserPoolDomain
Resource handler returned message: "Domain already associated with another user pool."
```

**Root Cause:**
Failed deployments can leave Cognito domains orphaned. Even after deleting the user pool, the domain remains registered for up to 7 days.

**Solution A - Implemented (Automatic Domain Suffix):**
The CDK code now adds a timestamp suffix to domain names to avoid conflicts:

```typescript
// In auth-construct.ts
const uniqueSuffix = Date.now().toString().slice(-6);
this.userPoolDomain = this.userPool.addDomain('Domain', {
  cognitoDomain: {
    domainPrefix: `${props.userPoolName.toLowerCase().replace(/[^a-z0-9-]/g, '-')}-${uniqueSuffix}`,
  },
});
```

This ensures each deployment attempt gets a unique domain name.

**Solution B - Manual Cleanup (if needed):**
If you need to use a specific domain name:

1. Try to describe the domain:
   ```bash
   aws cognito-idp describe-user-pool-domain --domain YOUR-DOMAIN --region us-east-2
   ```

2. If it exists with a user pool ID, delete the user pool:
   ```bash
   aws cognito-idp delete-user-pool --user-pool-id POOL-ID --region us-east-2
   ```

3. Wait 7 days for AWS to release the domain, OR use a different domain name

### Issue 2: Orphaned DynamoDB Table

**Symptom:**
```
Resource of type 'AWS::DynamoDB::Table' with identifier 'TimeManagementStack-Dev-data' already exists.
```

**Solution:**
Delete the table and wait for deletion to complete:

```bash
# Delete the table
aws dynamodb delete-table --table-name TimeManagementStack-Dev-data --region us-east-2

# Wait for deletion (important!)
aws dynamodb wait table-not-exists --table-name TimeManagementStack-Dev-data --region us-east-2
```

### Issue 3: Orphaned S3 Bucket

**Symptom:**
```
Resource of type 'AWS::S3::Bucket' with identifier 'timemanagementstack-dev-frontend' already exists.
```

**Solution:**
Force delete the bucket and its contents:

```bash
aws s3 rb s3://timemanagementstack-dev-frontend --force --region us-east-2
```

**Note**: If you get "Access Denied" errors, you may need to:
1. Use the AWS Console to empty and delete the bucket, OR
2. Use the root AWS account credentials, OR
3. Grant the IAM user `s3:DeleteBucket` and `s3:DeleteObject` permissions

### Issue 4: Failed Stack in ROLLBACK_COMPLETE

**Symptom:**
Stack exists but cannot be updated:
```
Stack named TimeManagementStack-Dev exists and cannot be updated
```

**Solution:**
Delete the failed stack completely:

```bash
# Delete the stack
aws cloudformation delete-stack --stack-name TimeManagementStack-Dev --region us-east-2

# Wait for deletion
aws cloudformation wait stack-delete-complete --stack-name TimeManagementStack-Dev --region us-east-2

# Verify deletion
aws cloudformation describe-stacks --stack-name TimeManagementStack-Dev --region us-east-2 2>&1 | grep "does not exist"
```

### Issue 5: Multiple Orphaned Resources

**Symptom:**
Deployment fails with multiple resource conflicts.

**Complete Cleanup Script:**
```bash
#!/bin/bash
REGION="us-east-2"
STACK_NAME="TimeManagementStack-Dev"
TABLE_NAME="${STACK_NAME}-data"
BUCKET_NAME="timemanagementstack-dev-frontend"

echo "Starting cleanup for $STACK_NAME in $REGION..."

# 1. Delete CloudFormation stack (if exists)
echo "Deleting CloudFormation stack..."
aws cloudformation delete-stack --stack-name $STACK_NAME --region $REGION 2>/dev/null
aws cloudformation wait stack-delete-complete --stack-name $STACK_NAME --region $REGION 2>/dev/null
echo "Stack deleted"

# 2. Delete DynamoDB table (if exists)
echo "Deleting DynamoDB table..."
aws dynamodb delete-table --table-name $TABLE_NAME --region $REGION 2>/dev/null
aws dynamodb wait table-not-exists --table-name $TABLE_NAME --region $REGION 2>/dev/null
echo "DynamoDB table deleted"

# 3. Delete S3 bucket (if exists)
echo "Deleting S3 bucket..."
aws s3 rb s3://$BUCKET_NAME --force --region $REGION 2>/dev/null
echo "S3 bucket deleted"

# 4. List and delete any orphaned user pools
echo "Checking for orphaned Cognito user pools..."
USER_POOLS=$(aws cognito-idp list-user-pools --max-results 60 --region $REGION --query "UserPools[?contains(Name, '$STACK_NAME')].Id" --output text)
for POOL_ID in $USER_POOLS; do
  echo "Deleting user pool: $POOL_ID"
  aws cognito-idp delete-user-pool --user-pool-id $POOL_ID --region $REGION
done

echo "Cleanup complete! Ready for deployment."
```

Save as `cleanup-deployment.sh`, make executable, and run:
```bash
chmod +x cleanup-deployment.sh
./cleanup-deployment.sh
```

---

## Post-Deployment Tasks

### 1. Extract CDK Outputs

After successful deployment, the `cdk-outputs.json` file contains all the values needed for GitHub secrets:

```bash
# View outputs
cat infra/cdk/cdk-outputs.json

# Or use jq for pretty printing
cat infra/cdk/cdk-outputs.json | jq '.'
```

### 2. Update GitHub Secrets

For the **development** environment, add these 5 secrets:

| Secret Name | CDK Output Key | Example Value |
|------------|----------------|---------------|
| `DEV_BUCKET_NAME` | `FrontendBucket` | `timemanagementstack-dev-frontend` |
| `DEV_DISTRIBUTION_ID` | `FrontendDistributionId6CBC2EDF` | `E3O4ZMRC3YCCEY` |
| `DEV_USER_POOL_ID` | `AuthUserPoolIdC0605E59` | `us-east-2_0mK6NTNlr` |
| `DEV_USER_POOL_CLIENT_ID` | `AuthUserPoolClientId8216BF9A` | `60pvscd3rbdejmqu2aq39b3q1q` |
| `DEV_USER_POOL_DOMAIN` | `AuthUserPoolDomainCE038363` | `timemanagementstack-dev-users-991843` |

**Steps:**
1. Go to: `https://github.com/OWNER/REPO/settings/environments`
2. Click on the `development` environment
3. Add each secret with its value from `cdk-outputs.json`

### 3. Test the Deployment

```bash
# Get the CloudFront URL from outputs
CLOUDFRONT_URL=$(cat infra/cdk/cdk-outputs.json | jq -r '.["TimeManagementStack-Dev"].CloudFrontUrl')

# Open in browser or curl
echo "Application URL: $CLOUDFRONT_URL"
curl -I $CLOUDFRONT_URL
```

---

## Multi-Environment Deployment

### QA Environment (us-east-1)

1. **Bootstrap CDK in us-east-1** (if not already done):
   ```bash
   pnpm --filter @time-management/infra-cdk cdk bootstrap aws://ACCOUNT-ID/us-east-1
   ```

2. **Set environment context**:
   ```bash
   cd infra/cdk
   pnpm cdk deploy \
     --context environment=qa \
     --outputs-file cdk-outputs-qa.json \
     --require-approval never
   ```

3. **Extract QA outputs** and add to GitHub `qa` environment secrets:
   - `QA_BUCKET_NAME`
   - `QA_DISTRIBUTION_ID`
   - `QA_USER_POOL_ID`
   - `QA_USER_POOL_CLIENT_ID`
   - `QA_USER_POOL_DOMAIN`

### Production Environment (us-east-1)

**⚠️ IMPORTANT**: Production deployments should be carefully reviewed.

1. **Bootstrap CDK in us-east-1** (same region as QA, reuses bootstrap stack)

2. **Deploy with manual approval** (recommended):
   ```bash
   cd infra/cdk
   pnpm cdk deploy \
     --context environment=prod \
     --outputs-file cdk-outputs-prod.json
   # Review changes before confirming!
   ```

3. **Extract Prod outputs** and add to GitHub `production` environment secrets:
   - `PROD_BUCKET_NAME`
   - `PROD_DISTRIBUTION_ID`
   - `PROD_USER_POOL_ID`
   - `PROD_USER_POOL_CLIENT_ID`
   - `PROD_USER_POOL_DOMAIN`

---

## Required IAM Permissions

The IAM user/role deploying the stack needs these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudformation:*",
        "s3:*",
        "dynamodb:*",
        "cognito-idp:*",
        "cloudfront:*",
        "apigateway:*",
        "lambda:*",
        "iam:CreateRole",
        "iam:AttachRolePolicy",
        "iam:PutRolePolicy",
        "iam:PassRole",
        "iam:GetRole",
        "iam:DeleteRole",
        "iam:DeleteRolePolicy",
        "iam:DetachRolePolicy",
        "secretsmanager:*",
        "logs:*"
      ],
      "Resource": "*"
    }
  ]
}
```

**Note**: For production, restrict these permissions to specific resources using ARN patterns.

---

## Lessons Learned from Dev Deployment

1. **Orphaned Resources Are Common**
   - Failed deployments leave behind resources
   - Always clean up before retrying deployment
   - Use the cleanup script above

2. **Cognito Domain Conflicts Are Persistent**
   - Domains can take 7 days to release after deletion
   - Using timestamp suffixes avoids this issue
   - The code now handles this automatically

3. **Delete Operations Must Complete**
   - Always use `wait` commands after deletes
   - Don't start new deployment until resources are fully deleted
   - DynamoDB and CloudFormation deletions can take 1-2 minutes

4. **Exit Codes Matter**
   - Exit code 0 = success
   - Exit code 1 = failure
   - Check terminal output for error details

5. **CloudFront Is Slow**
   - Deployment takes 5-10 minutes
   - Most time is spent on CloudFront distribution creation
   - Be patient!

---

## Quick Reference

### View Stack Status
```bash
aws cloudformation describe-stacks \
  --stack-name TimeManagementStack-Dev \
  --region us-east-2 \
  --query 'Stacks[0].StackStatus' \
  --output text
```

### View Stack Outputs
```bash
aws cloudformation describe-stacks \
  --stack-name TimeManagementStack-Dev \
  --region us-east-2 \
  --query 'Stacks[0].Outputs' \
  --output table
```

### Check CloudFormation Events
```bash
aws cloudformation describe-stack-events \
  --stack-name TimeManagementStack-Dev \
  --region us-east-2 \
  --max-items 20
```

---

## Next Steps After Deployment

1. **Update GitHub Secrets**: Add the 5 CDK output values to GitHub development environment
2. **Test GitHub Actions**: Push a change to trigger the deploy-dev workflow
3. **Deploy to QA**: Repeat the process for QA environment
4. **Deploy to Production**: Final deployment with approvals
5. **Enable Branch Protection**: Require PR reviews and CI checks

---

**Need More Help?**
- [Setup Guide](./SETUP.md)
- [Configuration Checklist](./CONFIG-CHECKLIST.md)
- [GitHub Actions README](./README.md)
