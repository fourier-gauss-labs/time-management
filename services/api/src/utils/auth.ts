import { APIGatewayProxyEvent } from 'aws-lambda';
import { UserId } from '@time-management/shared/domain';

/**
 * Extract user ID from API Gateway event context
 * Handles both Lambda authorizer and JWT authorizer claim structures
 */
export function getUserId(event: APIGatewayProxyEvent): UserId | null {
  // Try JWT authorizer path first (HTTP API with JWT authorizer)
  const jwtSub = event.requestContext.authorizer?.jwt?.claims?.sub;
  if (jwtSub) {
    return jwtSub as UserId;
  }

  // Fall back to Lambda authorizer path (REST API or custom authorizer)
  const claimsSub = event.requestContext.authorizer?.claims?.sub;
  if (claimsSub) {
    return claimsSub as UserId;
  }

  return null;
}
