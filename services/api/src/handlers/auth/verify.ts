import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { success, error } from '../../utils/response';

/**
 * Extended request context with JWT authorizer.
 */
interface AuthorizerContext {
  jwt?: {
    claims: {
      sub: string;
      email?: string;
      [key: string]: unknown;
    };
  };
}

/**
 * API Gateway event with JWT authorizer context.
 */
interface AuthorizedEvent extends APIGatewayProxyEventV2 {
  requestContext: APIGatewayProxyEventV2['requestContext'] & {
    authorizer?: AuthorizerContext;
  };
}

/**
 * Verifies authentication by returning the authenticated user's identity.
 * This endpoint validates that the Cognito authorizer is working correctly.
 *
 * @param event - API Gateway event with Cognito authorizer context
 * @returns User identity information (sub and email)
 */
export async function handler(event: AuthorizedEvent): Promise<APIGatewayProxyResultV2> {
  try {
    // Extract user ID (sub) from Cognito authorizer JWT claims
    const claims = event.requestContext.authorizer?.jwt?.claims;
    const userId = claims?.sub;
    const email = claims?.email as string | undefined;

    if (!userId) {
      return error('Unauthorized - missing user identity', 401);
    }

    // Return user identity for verification
    return success({
      userId,
      email,
      message: 'Authentication verified successfully',
    });
  } catch (err) {
    console.error('Auth verification failed:', err);
    return error('Internal server error', 500);
  }
}
