import type { APIGatewayProxyResultV2 } from 'aws-lambda';

/**
 * Creates a successful API response with JSON body.
 *
 * @param data - Response data to serialize
 * @param statusCode - HTTP status code (default: 200)
 * @returns API Gateway response object
 */
export function success<T>(data: T, statusCode = 200): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(data),
  };
}

/**
 * Creates an error API response with message.
 *
 * @param message - Error message
 * @param statusCode - HTTP status code (default: 500)
 * @returns API Gateway response object
 */
export function error(message: string, statusCode = 500): APIGatewayProxyResultV2 {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      error: message,
      statusCode,
    }),
  };
}

/**
 * Creates a bad request (400) response with optional field errors.
 *
 * @param message - Error message
 * @param fields - Optional field-level errors
 * @returns API Gateway response object
 */
export function badRequest(
  message: string,
  fields?: Record<string, string>
): APIGatewayProxyResultV2 {
  return {
    statusCode: 400,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify({
      error: message,
      fields,
      statusCode: 400,
    }),
  };
}
