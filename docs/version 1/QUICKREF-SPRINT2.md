# Sprint 2 Quick Reference

## Stack Information

- **Stack Name**: TimeManagementStack-Dev
- **Region**: us-east-2 (Ohio)
- **Profile**: dev-time-management
- **Status**: UPDATE_COMPLETE ✅

## Key URLs

- **CloudFront**: https://daorbxffmzmwd.cloudfront.net
- **API Gateway**: https://eenvfnrxaf.execute-api.us-east-2.amazonaws.com
- **Cognito Hosted UI**: https://timemanagementstack-dev-users.auth.us-east-2.amazoncognito.com

## Key Resource Names

- **DynamoDB Table**: TimeManagementStack-Dev-data
- **S3 Bucket**: timemanagementstack-dev-frontend
- **CloudFront Distribution**: E1WT33LOKG2MYI
- **Secrets**: TimeManagementStack-Dev/app-secrets
- **User Pool**: us-east-2_1gfhK8wz1
- **User Pool Client**: 66icsi28j2ggmrd1ac9ti3a5sn

## Common Commands

### Deploy Infrastructure

```bash
cd infra/cdk
AWS_PROFILE=dev-time-management npx cdk deploy
```

### Deploy Frontend

```bash
cd apps/web
pnpm run build
aws s3 sync dist/ s3://timemanagementstack-dev-frontend/ --profile dev-time-management --delete
aws cloudfront create-invalidation --distribution-id E1WT33LOKG2MYI --paths "/*" --profile dev-time-management
```

### Verify Resources

```bash
# Check stack status
aws cloudformation describe-stacks --stack-name TimeManagementStack-Dev --profile dev-time-management

# List DynamoDB tables
aws dynamodb list-tables --profile dev-time-management

# List S3 bucket contents
aws s3 ls s3://timemanagementstack-dev-frontend/ --profile dev-time-management

# Get CloudFront distribution
aws cloudfront get-distribution --id E1WT33LOKG2MYI --profile dev-time-management
```

### View Secrets

```bash
aws secretsmanager get-secret-value \
  --secret-id TimeManagementStack-Dev/app-secrets \
  --profile dev-time-management
```

### Update Secrets

```bash
aws secretsmanager update-secret \
  --secret-id TimeManagementStack-Dev/app-secrets \
  --secret-string '{"externalApiKey":"new-value","encryptionKey":"new-value"}' \
  --profile dev-time-management
```

## DynamoDB Access Patterns

### User Profile

```
PK: USER#<cognito-sub>
SK: PROFILE
```

### Time Entry

```
PK: USER#<cognito-sub>
SK: ENTRY#<timestamp>
GSI1PK: PROJECT#<projectId>
GSI1SK: <timestamp>
```

## Environment Variables (.env)

```env
VITE_AWS_REGION=us-east-2
VITE_USER_POOL_ID=us-east-2_1gfhK8wz1
VITE_USER_POOL_CLIENT_ID=66icsi28j2ggmrd1ac9ti3a5sn
VITE_USER_POOL_DOMAIN=timemanagementstack-dev-users
VITE_API_URL=https://eenvfnrxaf.execute-api.us-east-2.amazonaws.com
VITE_CLOUDFRONT_URL=https://daorbxffmzmwd.cloudfront.net
```

## Deployment to Other Environments

### QA

```bash
ENVIRONMENT=qa AWS_PROFILE=qa-time-management npx cdk deploy
```

### Production

```bash
ENVIRONMENT=prod AWS_PROFILE=prod-time-management npx cdk deploy
```

## Documentation Links

- [Deployment Guide](./sprint-2-deployment.md)
- [Verification Report](./sprint-2-verification.md)
- [Sprint Summary](./sprint-2-summary.md)
- [Technical Spec](./sprint-2-techspec.md)

## Cost Estimate

**Development**: $1-12/month

## Sprint 2 Status

✅ **COMPLETE** - All 12 exit criteria met
