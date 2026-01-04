/**
 * Environment-specific configuration for the Time Management application.
 */

export interface EnvironmentConfig {
  /**
   * Environment name (dev, qa, prod)
   */
  readonly environmentName: string;

  /**
   * AWS region for deployment
   */
  readonly region: string;

  /**
   * Cognito callback URLs for OAuth flow
   */
  readonly callbackUrls: string[];

  /**
   * Cognito logout URLs
   */
  readonly logoutUrls: string[];

  /**
   * Enable DynamoDB point-in-time recovery
   */
  readonly enableDynamoDbPitr: boolean;

  /**
   * Enable CloudFront access logging
   */
  readonly enableCloudFrontLogging: boolean;

  /**
   * Resource tags
   */
  readonly tags: Record<string, string>;
}

/**
 * Development environment configuration
 */
export const devConfig: EnvironmentConfig = {
  environmentName: 'dev',
  region: 'us-east-2',
  callbackUrls: ['http://localhost:5173/callback'],
  logoutUrls: ['http://localhost:5173'],
  enableDynamoDbPitr: false,
  enableCloudFrontLogging: false,
  tags: {
    'project-name': 'time-management',
    environment: 'dev',
    'managed-by': 'cdk',
  },
};

/**
 * QA environment configuration
 */
export const qaConfig: EnvironmentConfig = {
  environmentName: 'qa',
  region: 'us-east-2',
  callbackUrls: ['https://qa.example.com/callback'], // Update with actual QA domain when available
  logoutUrls: ['https://qa.example.com'],
  enableDynamoDbPitr: false,
  enableCloudFrontLogging: true,
  tags: {
    'project-name': 'time-management',
    environment: 'qa',
    'managed-by': 'cdk',
  },
};

/**
 * Production environment configuration
 */
export const prodConfig: EnvironmentConfig = {
  environmentName: 'prod',
  region: 'us-east-2',
  callbackUrls: ['https://app.example.com/callback'], // Update with actual production domain
  logoutUrls: ['https://app.example.com'],
  enableDynamoDbPitr: true,
  enableCloudFrontLogging: true,
  tags: {
    'project-name': 'time-management',
    environment: 'prod',
    'managed-by': 'cdk',
  },
};

/**
 * Get configuration for the specified environment
 */
export function getConfig(environment: string): EnvironmentConfig {
  switch (environment.toLowerCase()) {
    case 'dev':
      return devConfig;
    case 'qa':
      return qaConfig;
    case 'prod':
      return prodConfig;
    default:
      throw new Error(`Unknown environment: ${environment}`);
  }
}
