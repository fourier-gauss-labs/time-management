# Sprint 1 Development Guide

This guide explains how to work with the authentication infrastructure deployed in Sprint 1.

## Prerequisites

- Node.js 20.x LTS
- pnpm 8.x or later
- AWS CLI configured with appropriate credentials
- AWS CDK CLI (installed automatically via pnpm)

## Initial Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Deploy Infrastructure to AWS

Sprint 1 includes AWS Cognito User Pool, API Gateway, and Lambda function infrastructure.

```bash
# Navigate to CDK directory
cd infra/cdk

# Deploy to AWS (dev environment)
pnpm run deploy
```

The deployment will output several values that you'll need for the frontend configuration:

- `UserPoolId` - The Cognito User Pool ID
- `UserPoolClientId` - The application client ID
- `UserPoolDomain` - The Cognito domain prefix
- `ApiUrl` - The API Gateway endpoint URL

### 3. Configure Frontend Environment

Create a `.env` file in `apps/web/`:

```bash
cd apps/web
cp .env.example .env
```

Edit `.env` and add the values from the CDK deployment output:

```bash
VITE_USER_POOL_ID=us-east-1_xxxxxxxxx
VITE_USER_POOL_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
VITE_USER_POOL_DOMAIN=timemanagementstack-dev-users-xxxxx
VITE_AWS_REGION=us-east-1
VITE_REDIRECT_URI=http://localhost:5173/callback
VITE_LOGOUT_URI=http://localhost:5173
VITE_API_URL=https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com
```

### 4. Start the Development Server

```bash
cd apps/web
pnpm dev
```

The application will be available at http://localhost:5173

## Testing Authentication

### Manual Testing

1. Open http://localhost:5173
2. Click "Log In" button
3. You'll be redirected to Cognito Hosted UI
4. Create a new account or sign in
5. After authentication, you'll be redirected back to the app
6. Your user info (email and sub) will be displayed
7. Click "Log Out" to sign out

### Testing the API

Once authenticated, you can test the `/api/auth/verify` endpoint:

```bash
# Get your ID token from browser localStorage
# In browser console:
# JSON.parse(localStorage.getItem('auth_tokens')).idToken

# Then make a request:
curl -H "Authorization: Bearer YOUR_ID_TOKEN" \
  https://YOUR_API_URL/api/auth/verify
```

Expected response:

```json
{
  "userId": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "email": "user@example.com",
  "message": "Authentication verified successfully"
}
```

## Development Workflow

### Making Changes

1. **Infrastructure Changes** (CDK)

   ```bash
   cd infra/cdk
   # Edit files in lib/
   pnpm run synth  # Verify changes
   pnpm run deploy # Deploy to AWS
   ```

2. **Backend Changes** (Lambda)

   ```bash
   cd services/api
   # Edit handlers in src/handlers/
   pnpm run lint
   pnpm run type-check
   # Re-deploy CDK to update Lambda
   cd ../../infra/cdk
   pnpm run deploy
   ```

3. **Frontend Changes**
   ```bash
   cd apps/web
   # Edit components
   pnpm dev  # Hot reload active
   pnpm run lint
   pnpm run type-check
   ```

### Running Quality Checks

From the repository root:

```bash
# Run all checks (lint, type-check, format)
pnpm lint
pnpm type-check
pnpm format:check

# Auto-fix formatting
pnpm format

# Test CDK synthesis
pnpm --filter @time-management/infra-cdk run synth
```

## Architecture

### Authentication Flow

1. User clicks "Log In"
2. Frontend redirects to Cognito Hosted UI
3. User authenticates with Cognito
4. Cognito redirects back with authorization code
5. Frontend exchanges code for JWT tokens
6. Tokens stored in localStorage
7. Frontend includes ID token in API requests
8. API Gateway validates JWT with Cognito
9. Lambda receives authenticated user context

### Data Flow

```
Browser → Cognito Hosted UI → Browser (with tokens)
  ↓
Browser → API Gateway → Lambda
           (JWT validation)
```

### IAM Permissions

- Lambda functions have least-privilege IAM roles
- No database access yet (added in Sprint 2)
- Functions only log to CloudWatch

## Troubleshooting

### "Auth configuration not set" Error

- Verify `.env` file exists in `apps/web/`
- Verify all environment variables are set
- Restart the dev server after changing `.env`

### CDK Deployment Fails

```bash
# Bootstrap CDK (first time only)
cd infra/cdk
pnpm cdk bootstrap

# Try deployment again
pnpm run deploy
```

### Cannot Access API

- Verify you're using the correct API URL from CDK outputs
- Check that your ID token is valid (not expired)
- Verify CORS settings in API Gateway allow localhost:5173

### Cognito Hosted UI Redirect Issues

- Verify callback URLs in `infra/cdk/lib/constructs/auth-construct.ts`
- Ensure they match your `.env` configuration
- Re-deploy CDK after changing callback URLs

## Clean Up

To remove all AWS resources:

```bash
cd infra/cdk
pnpm cdk destroy
```

## Next Steps

Sprint 2 will add:

- DynamoDB table for user data
- Full environment parameterization (dev, QA, prod)
- Frontend hosting infrastructure
