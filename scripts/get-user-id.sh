#!/bin/bash
# Helper script to find your Cognito User ID

set -e

PROFILE="${AWS_PROFILE:-dev-time-management}"
REGION="${AWS_REGION:-us-east-2}"

echo "🔍 Finding Cognito User Pool ID..."

# Get user pool ID from CDK outputs
USER_POOL_ID=$(aws cloudformation describe-stacks \
  --stack-name TimeManagementApp-Dev \
  --region $REGION \
  --profile $PROFILE \
  --query 'Stacks[0].Outputs[?OutputKey==`AuthUserPoolIdC0605E59`].OutputValue' \
  --output text)

if [ -z "$USER_POOL_ID" ]; then
  echo "❌ Could not find User Pool ID in CloudFormation outputs"
  exit 1
fi

echo "✓ User Pool ID: $USER_POOL_ID"
echo ""
echo "📋 Listing users in the pool..."
echo ""

aws cognito-idp list-users \
  --user-pool-id $USER_POOL_ID \
  --region $REGION \
  --profile $PROFILE \
  --query 'Users[*].[Username,Attributes[?Name==`email`].Value|[0]]' \
  --output table

echo ""
echo "💡 To get the full user ID (sub), run:"
echo ""
echo "aws cognito-idp list-users \\"
echo "  --user-pool-id $USER_POOL_ID \\"
echo "  --region $REGION \\"
echo "  --profile $PROFILE \\"
echo "  --query 'Users[*].[Attributes[?Name==\`sub\`].Value|[0],Attributes[?Name==\`email\`].Value|[0]]' \\"
echo "  --output table"
echo ""
