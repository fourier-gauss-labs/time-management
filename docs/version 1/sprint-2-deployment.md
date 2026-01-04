# Sprint 2 Deployment Guide

## Overview

Sprint 2 adds multi-environment infrastructure support, DynamoDB for data persistence, S3/CloudFront for frontend hosting, and AWS Secrets Manager for secure configuration.

## Deployment Summary

### Deployment Date

Sprint 2 deployed successfully on $(date)

### Environment

- **Environment**: dev
- **AWS Region**: us-east-2 (Ohio)
- **AWS Profile**: dev-time-management

## Infrastructure Components

### 1. DynamoDB Table

- **Table Name**: `TimeManagementStack-Dev-data`
- **Billing Mode**: PAY_PER_REQUEST (on-demand)
- **Primary Key**:
  - PK (Partition Key): String
  - SK (Sort Key): String
- **Global Secondary Index (GSI1)**:
  - GSI1PK (Partition Key): String
  - GSI1SK (Sort Key): String
- **Point-in-Time Recovery**: Disabled (dev environment)
- **Encryption**: SSE enabled

**Key Patterns**:

```
User Records:
  PK: USER#<sub>
  SK: PROFILE

Time Entries:
  PK: USER#<sub>
  SK: ENTRY#<timestamp>
  GSI1PK: PROJECT#<projectId>
  GSI1SK: <timestamp>
```

### 2. Frontend Hosting (S3 + CloudFront)

- **S3 Bucket**: `timemanagementstack-dev-frontend`
- **CloudFront Distribution**: E1WT33LOKG2MYI
- **CloudFront URL**: https://daorbxffmzmwd.cloudfront.net
- **Features**:
  - HTTPS redirect
  - SPA support (404/403 → index.html)
  - Gzip compression
  - HTTP/2 and HTTP/3 enabled
  - Bucket versioning enabled
  - Noncurrent version cleanup (30 days)

### 3. AWS Secrets Manager

- **Secret ARN**: `arn:aws:secretsmanager:us-east-2:098295335350:secret:TimeManagementStack-Dev/app-secrets-dnbExz`
- **Purpose**: Store application secrets (API keys, encryption keys, etc.)
- **Lambda Access**: Granted via IAM role

### 4. Cognito Authentication

- **User Pool ID**: us-east-2_1gfhK8wz1
- **Client ID**: 66icsi28j2ggmrd1ac9ti3a5sn
- **Domain**: timemanagementstack-dev-users
- **Hosted UI**: https://timemanagementstack-dev-users.auth.us-east-2.amazoncognito.com
- **Callback URLs**:
  - http://localhost:5173/callback
  - https://daorbxffmzmwd.cloudfront.net/callback
- **Logout URLs**:
  - http://localhost:5173
  - https://daorbxffmzmwd.cloudfront.net

### 5. API Gateway

- **API URL**: https://eenvfnrxaf.execute-api.us-east-2.amazonaws.com
- **Authorizer**: JWT (Cognito)
- **Endpoints**:
  - `GET /api/auth/verify` - Verify authenticated user
- **Lambda Permissions**:
  - DynamoDB read/write access
  - Secrets Manager read access

## Deployment Steps

### Prerequisites

1. AWS CLI v2 configured with profile `dev-time-management`
2. Node.js 20.x
3. pnpm package manager
4. AWS account with appropriate permissions

### Deploy Infrastructure

```bash
# Navigate to CDK directory
cd infra/cdk

# Install dependencies
pnpm install

# Build TypeScript
pnpm run build

# Synthesize CloudFormation template
AWS_PROFILE=dev-time-management npx cdk synth

# Deploy to AWS
AWS_PROFILE=dev-time-management npx cdk deploy --require-approval never
```

### Deploy to Different Environments

The infrastructure supports three environments: `dev`, `qa`, and `prod`.

```bash
# Deploy to QA
ENVIRONMENT=qa AWS_PROFILE=qa-time-management npx cdk deploy

# Deploy to Production
ENVIRONMENT=prod AWS_PROFILE=prod-time-management npx cdk deploy
```

**Environment Differences**:

- **Dev**: PITR disabled, CloudFront logging disabled, relaxed CORS
- **QA**: PITR enabled, CloudFront logging enabled, stricter CORS
- **Prod**: PITR enabled, CloudFront logging enabled, production CORS only

### Build and Deploy Frontend

```bash
# Navigate to web app
cd apps/web

# Build production bundle
pnpm run build

# Upload to S3
aws s3 sync dist/ s3://timemanagementstack-dev-frontend/ \
  --profile dev-time-management \
  --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id E1WT33LOKG2MYI \
  --paths "/*" \
  --profile dev-time-management
```

### Update Frontend Environment Variables

Update `apps/web/.env` with the new CloudFront URL:

```env
VITE_AWS_REGION=us-east-2
VITE_USER_POOL_ID=us-east-2_1gfhK8wz1
VITE_USER_POOL_CLIENT_ID=66icsi28j2ggmrd1ac9ti3a5sn
VITE_USER_POOL_DOMAIN=timemanagementstack-dev-users
VITE_API_URL=https://eenvfnrxaf.execute-api.us-east-2.amazonaws.com
VITE_CLOUDFRONT_URL=https://daorbxffmzmwd.cloudfront.net
```

## Resource Tagging

All resources are tagged with:

- `project-name`: time-management
- `environment`: dev (or qa/prod)
- `managed-by`: cdk

These tags enable:

- Cost tracking by environment
- Resource organization
- Automated cost reporting
- Security compliance

## Secrets Management

### Updating Secrets

Secrets should be updated via AWS Console or CLI (not in code):

```bash
# Update secret value
aws secretsmanager update-secret \
  --secret-id TimeManagementStack-Dev/app-secrets \
  --secret-string '{"externalApiKey":"real-value","encryptionKey":"real-value"}' \
  --profile dev-time-management

# Retrieve secret in Lambda (example)
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const client = new SecretsManagerClient({ region: "us-east-2" });
const response = await client.send(
  new GetSecretValueCommand({ SecretId: process.env.SECRETS_ARN })
);
const secrets = JSON.parse(response.SecretString);
```

## Verification Steps

### 1. Verify DynamoDB Table

```bash
aws dynamodb describe-table \
  --table-name TimeManagementStack-Dev-data \
  --profile dev-time-management
```

### 2. Verify S3 Bucket

```bash
aws s3 ls s3://timemanagementstack-dev-frontend/ \
  --profile dev-time-management
```

### 3. Verify CloudFront Distribution

```bash
aws cloudfront get-distribution \
  --id E1WT33LOKG2MYI \
  --profile dev-time-management
```

### 4. Verify Secrets Manager

```bash
aws secretsmanager describe-secret \
  --secret-id TimeManagementStack-Dev/app-secrets \
  --profile dev-time-management
```

### 5. Test API Endpoint

```bash
# Get access token from Cognito (via login)
# Then test API
curl -H "Authorization: Bearer <ACCESS_TOKEN>" \
  https://eenvfnrxaf.execute-api.us-east-2.amazonaws.com/api/auth/verify
```

### 6. Test Frontend

Visit https://daorbxffmzmwd.cloudfront.net and verify:

- Application loads correctly
- Authentication redirects to Cognito Hosted UI
- After login, redirects back to CloudFront URL
- API calls work from CloudFront domain

## Troubleshooting

### Issue: CloudFront shows 403 Access Denied

**Solution**: Deploy frontend build to S3:

```bash
cd apps/web && pnpm run build
aws s3 sync dist/ s3://timemanagementstack-dev-frontend/ --profile dev-time-management
```

### Issue: CORS errors from CloudFront

**Solution**: Update API construct to include CloudFront domain in CORS allow list.
Note: Currently only localhost is allowed. After frontend deployment, the CloudFront domain will be added automatically on next CDK deploy.

### Issue: Lambda can't access DynamoDB

**Solution**: Verify IAM permissions were granted via CDK:

```bash
aws iam get-role-policy \
  --role-name TimeManagementStack-Dev-ApiAuthVerifyHandlerServiceRole... \
  --policy-name ...DefaultPolicy \
  --profile dev-time-management
```

### Issue: Secrets not accessible

**Solution**: Check Lambda environment variable `SECRETS_ARN` is set and IAM role has secretsmanager:GetSecretValue permission.

## Cost Estimates (Development)

Based on low-traffic development usage:

- **DynamoDB**: $0-5/month (on-demand, low usage)
- **Lambda**: $0-1/month (free tier covers development)
- **CloudFront**: $0-5/month (free tier covers development)
- **S3**: <$1/month (minimal storage)
- **Cognito**: Free tier (up to 50,000 MAU)
- **Secrets Manager**: $0.40/month per secret
- **API Gateway**: $1/million requests (free tier covers development)

**Estimated Total**: $1-12/month for development environment

## Rollback Procedure

If deployment fails or issues arise:

```bash
# Rollback to previous version
AWS_PROFILE=dev-time-management npx cdk deploy --rollback

# Or destroy and redeploy
AWS_PROFILE=dev-time-management npx cdk destroy
AWS_PROFILE=dev-time-management npx cdk deploy
```

**Note**: Destroying the stack will delete all data in DynamoDB and S3 (except retained resources). Use with caution.

## Next Steps

1. **Deploy Frontend Build**: Build and upload React app to S3
2. **Configure Custom Domain**: Add Route 53 and ACM certificate for custom domain
3. **Enable Monitoring**: Set up CloudWatch dashboards and alarms
4. **Implement CI/CD**: Automate deployments via GitHub Actions
5. **Add API Endpoints**: Implement CRUD operations for time entries
6. **Set up DynamoDB Streams**: For audit logging and notifications

## Stack Outputs Reference

```
ApiApiUrlF2D81078 = https://eenvfnrxaf.execute-api.us-east-2.amazonaws.com
AuthHostedUIUrlD130ED3C = https://timemanagementstack-dev-users.auth.us-east-2.amazoncognito.com
AuthUserPoolClientId8216BF9A = 66icsi28j2ggmrd1ac9ti3a5sn
AuthUserPoolDomainCE038363 = timemanagementstack-dev-users
AuthUserPoolIdC0605E59 = us-east-2_1gfhK8wz1
CloudFrontUrl = https://daorbxffmzmwd.cloudfront.net
DatabaseTableArn3F8FD890 = arn:aws:dynamodb:us-east-2:098295335350:table/TimeManagementStack-Dev-data
DatabaseTableName64177828 = TimeManagementStack-Dev-data
DynamoDBTableName = TimeManagementStack-Dev-data
Environment = dev
FrontendBucket = timemanagementstack-dev-frontend
FrontendBucketName47F7E0AE = timemanagementstack-dev-frontend
FrontendDistributionDomainName8B9BA5CB = daorbxffmzmwd.cloudfront.net
FrontendDistributionId6CBC2EDF = E1WT33LOKG2MYI
FrontendDistributionUrlD92A0E31 = https://daorbxffmzmwd.cloudfront.net
SecretsSecretsArn719B982A = arn:aws:secretsmanager:us-east-2:098295335350:secret:TimeManagementStack-Dev/app-secrets-dnbExz
```
