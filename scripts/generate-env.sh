#!/bin/bash

# Generate .env.production from CDK outputs
# Usage: ./scripts/generate-env.sh

set -e

CDK_OUTPUTS_FILE="infra/cdk/cdk-outputs.json"

if [ ! -f "$CDK_OUTPUTS_FILE" ]; then
  echo "Error: CDK outputs file not found at $CDK_OUTPUTS_FILE"
  echo "Please deploy the CDK stack first: cd infra/cdk && pnpm cdk deploy"
  exit 1
fi

# Extract values from CDK outputs using node
USER_POOL_ID=$(node -e "console.log(require('./$CDK_OUTPUTS_FILE')['TimeManagementApp-Dev'].AuthUserPoolIdC0605E59)")
USER_POOL_CLIENT_ID=$(node -e "console.log(require('./$CDK_OUTPUTS_FILE')['TimeManagementApp-Dev'].AuthUserPoolClientId8216BF9A)")
USER_POOL_DOMAIN=$(node -e "console.log(require('./$CDK_OUTPUTS_FILE')['TimeManagementApp-Dev'].AuthUserPoolDomainCE038363)")
API_URL=$(node -e "console.log(require('./$CDK_OUTPUTS_FILE')['TimeManagementApp-Dev'].ApiApiUrlF2D81078)")
CLOUDFRONT_URL=$(node -e "console.log(require('./$CDK_OUTPUTS_FILE')['TimeManagementApp-Dev'].CloudFrontUrl)")

# Generate .env.production
cat > apps/web/.env.production <<EOF
VITE_USER_POOL_ID=$USER_POOL_ID
VITE_USER_POOL_CLIENT_ID=$USER_POOL_CLIENT_ID
VITE_USER_POOL_DOMAIN=$USER_POOL_DOMAIN
VITE_AWS_REGION=us-east-2
VITE_REDIRECT_URI=$CLOUDFRONT_URL/callback
VITE_LOGOUT_URI=$CLOUDFRONT_URL
VITE_API_URL=$API_URL
EOF

echo "✅ Generated apps/web/.env.production with CDK outputs"
cat apps/web/.env.production
