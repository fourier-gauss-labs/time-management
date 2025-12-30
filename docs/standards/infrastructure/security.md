# Security Standards

This document defines security principles, authentication patterns, and secure coding practices for the time-management platform.

## Core Security Principles

1. **Defense in depth** - Multiple layers of security controls
2. **Least privilege** - Grant minimal permissions necessary
3. **Zero trust** - Never trust, always verify
4. **Secure by default** - Security must be built-in, not added later
5. **Encryption everywhere** - Encrypt data at rest and in transit
6. **Audit everything** - Log all security-relevant events
7. **Regular updates** - Keep dependencies and runtimes updated
8. **Fail securely** - Errors should not expose sensitive information

## Authentication & Authorization

### Cognito User Authentication

**Use AWS Cognito for user management:**

```typescript
// Frontend: Login flow
import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
} from '@aws-sdk/client-cognito-identity-provider';

async function login(username: string, password: string): Promise<AuthTokens> {
  const client = new CognitoIdentityProviderClient({ region: 'us-east-1' });

  const command = new InitiateAuthCommand({
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: process.env.VITE_USER_POOL_CLIENT_ID,
    AuthParameters: {
      USERNAME: username,
      PASSWORD: password,
    },
  });

  const response = await client.send(command);

  return {
    accessToken: response.AuthenticationResult?.AccessToken!,
    idToken: response.AuthenticationResult?.IdToken!,
    refreshToken: response.AuthenticationResult?.RefreshToken!,
  };
}
```

### JWT Token Validation

**Backend: Validate JWT tokens in Lambda:**

```typescript
import { APIGatewayProxyEvent } from 'aws-lambda';
import { CognitoJwtVerifier } from 'aws-jwt-verify';

// Create verifier instance (reuse across invocations)
const verifier = CognitoJwtVerifier.create({
  userPoolId: process.env.USER_POOL_ID!,
  tokenUse: 'access',
  clientId: process.env.USER_POOL_CLIENT_ID,
});

export async function validateToken(event: APIGatewayProxyEvent): Promise<string> {
  const token = event.headers.Authorization?.replace('Bearer ', '');

  if (!token) {
    throw new Error('No authorization token provided');
  }

  try {
    const payload = await verifier.verify(token);
    return payload.sub; // User ID
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}
```

### API Gateway Authorization

**Use Cognito User Pool Authorizer:**

```typescript
// In CDK
const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'Authorizer', {
  cognitoUserPools: [userPool],
});

api.root.addMethod('GET', lambdaIntegration, {
  authorizer,
  authorizationType: apigateway.AuthorizationType.COGNITO,
});
```

### Authorization Patterns

**Resource-based authorization:**

```typescript
export async function getTask(userId: string, taskId: string): Promise<Task> {
  const task = await taskRepository.findById(taskId);

  // Verify user owns the task
  if (task.userId !== userId) {
    throw new UnauthorizedError('You do not have permission to access this task');
  }

  return task;
}
```

**Role-based authorization (if needed):**

```typescript
interface User {
  id: string;
  email: string;
  roles: Role[];
}

type Role = 'user' | 'admin';

function requireRole(role: Role) {
  return (user: User) => {
    if (!user.roles.includes(role)) {
      throw new ForbiddenError(`Requires ${role} role`);
    }
  };
}

// Usage
export async function deleteUser(currentUser: User, targetUserId: string) {
  requireRole('admin')(currentUser);
  await userRepository.delete(targetUserId);
}
```

## IAM Permissions

### Least Privilege IAM Policies

**✅ Good - Specific permissions:**

```typescript
// CDK: Grant specific permissions
table.grantReadWriteData(lambdaFunction);
bucket.grantRead(lambdaFunction);
secretsManager.grantRead(lambdaFunction);
```

**❌ Avoid - Overly broad permissions:**

```typescript
// Don't grant admin access
lambdaFunction.addToRolePolicy(
  new iam.PolicyStatement({
    actions: ['*'],
    resources: ['*'],
  })
);
```

### Lambda Execution Roles

**✅ Good:**

```typescript
const lambdaRole = new iam.Role(this, 'LambdaRole', {
  assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
  managedPolicies: [
    iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
  ],
});

// Grant specific permissions
table.grantReadWriteData(lambdaRole);

const handler = new lambda.Function(this, 'Handler', {
  role: lambdaRole,
  // ... other props
});
```

### Cross-Account Access (if needed)

**Use IAM roles, not access keys:**

```typescript
const crossAccountRole = new iam.Role(this, 'CrossAccountRole', {
  assumedBy: new iam.AccountPrincipal('123456789012'),
  externalIds: ['unique-external-id'],
});

bucket.grantRead(crossAccountRole);
```

## Secrets Management

### AWS Secrets Manager

**Store sensitive configuration in Secrets Manager:**

```typescript
// CDK: Create secret
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

const apiKeySecret = new secretsmanager.Secret(this, 'ApiKey', {
  secretName: `${stackName}/third-party-api-key`,
  description: 'API key for third-party service',
  generateSecretString: {
    secretStringTemplate: JSON.stringify({ username: 'admin' }),
    generateStringKey: 'password',
  },
});

// Grant Lambda read access
apiKeySecret.grantRead(lambdaFunction);

// Pass secret ARN as environment variable
const handler = new lambda.Function(this, 'Handler', {
  environment: {
    API_KEY_SECRET_ARN: apiKeySecret.secretArn,
  },
});
```

**Retrieve secrets in Lambda:**

```typescript
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({ region: 'us-east-1' });

async function getSecret(secretArn: string): Promise<any> {
  const command = new GetSecretValueCommand({ SecretId: secretArn });
  const response = await client.send(command);
  return JSON.parse(response.SecretString!);
}

// Cache secrets (Lambda execution context reuse)
let cachedApiKey: string | null = null;

export async function handler(event: any) {
  if (!cachedApiKey) {
    const secret = await getSecret(process.env.API_KEY_SECRET_ARN!);
    cachedApiKey = secret.apiKey;
  }

  // Use cachedApiKey
}
```

### Environment Variables

**✅ Good - Non-sensitive config:**

```typescript
environment: {
  TABLE_NAME: tasksTable.tableName,
  LOG_LEVEL: 'INFO',
  REGION: 'us-east-1',
}
```

**❌ Avoid - Sensitive data in env vars:**

```typescript
environment: {
  DATABASE_PASSWORD: 'plain-text-password', // Never do this!
  API_KEY: 'secret-key', // Use Secrets Manager instead
}
```

## Data Encryption

### Encryption at Rest

**DynamoDB:**

```typescript
new dynamodb.Table(this, 'Table', {
  encryption: dynamodb.TableEncryption.AWS_MANAGED, // Or CUSTOMER_MANAGED with KMS
  pointInTimeRecovery: true,
});
```

**S3:**

```typescript
new s3.Bucket(this, 'Bucket', {
  encryption: s3.BucketEncryption.S3_MANAGED, // Or KMS_MANAGED
  enforceSSL: true, // Require HTTPS
});
```

**Secrets Manager:**

```typescript
new secretsmanager.Secret(this, 'Secret', {
  encryptionKey: kmsKey, // Optional: Use custom KMS key
});
```

### Encryption in Transit

**API Gateway - Enforce HTTPS:**

```typescript
// HTTPS is enforced by default in API Gateway
const api = new apigateway.RestApi(this, 'Api', {
  // No HTTP access, HTTPS only
});
```

**Frontend - Use HTTPS only:**

```typescript
// In production, ensure all API calls use HTTPS
const API_URL = 'https://api.example.com'; // Never http://

// Content Security Policy
<meta
  http-equiv="Content-Security-Policy"
  content="upgrade-insecure-requests"
/>
```

## Input Validation & Sanitization

### Validate All User Input

**✅ Good:**

```typescript
import { z } from 'zod';

const CreateTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  dueDate: z.string().datetime().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
});

export async function createTask(input: unknown): Promise<Task> {
  // Validate and sanitize input
  const validated = CreateTaskSchema.parse(input);

  // Now safe to use
  return await taskRepository.create(validated);
}
```

**❌ Avoid - No validation:**

```typescript
export async function createTask(input: any): Promise<Task> {
  // Dangerous: No validation of input
  return await taskRepository.create(input);
}
```

### Prevent Injection Attacks

**SQL Injection (if using RDS):**

```typescript
// ✅ Good: Use parameterized queries
const result = await db.query('SELECT * FROM tasks WHERE user_id = ? AND task_id = ?', [
  userId,
  taskId,
]);

// ❌ Avoid: String concatenation
const result = await db.query(
  `SELECT * FROM tasks WHERE user_id = '${userId}'` // Vulnerable!
);
```

**NoSQL Injection (DynamoDB):**

```typescript
// ✅ Good: Use AWS SDK with proper types
const result = await dynamodb.send(
  new GetItemCommand({
    TableName: 'Tasks',
    Key: {
      userId: { S: userId },
      taskId: { S: taskId },
    },
  })
);

// Type safety prevents injection
```

## CORS Configuration

### Environment-Specific CORS

**✅ Good:**

```typescript
// Development
defaultCorsPreflightOptions: {
  allowOrigins: ['http://localhost:5173'],
  allowMethods: apigateway.Cors.ALL_METHODS,
  allowHeaders: ['Content-Type', 'Authorization'],
  allowCredentials: true,
}

// Production
defaultCorsPreflightOptions: {
  allowOrigins: ['https://timemanagement.example.com'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowCredentials: true,
}
```

**❌ Avoid - Wildcard in production:**

```typescript
allowOrigins: apigateway.Cors.ALL_ORIGINS, // Only use in development
```

## Error Handling

### Secure Error Messages

**✅ Good:**

```typescript
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public isOperational: boolean = true
  ) {
    super(message);
  }
}

// Return safe error messages to clients
try {
  await processPayment(amount);
} catch (error) {
  // Log full error server-side
  console.error('Payment processing failed:', error);

  // Return generic message to client
  throw new AppError('Payment processing failed', 500);
}
```

**❌ Avoid - Exposing internal details:**

```typescript
catch (error) {
  // Don't expose stack traces or internal paths
  return {
    statusCode: 500,
    body: JSON.stringify({ error: error.message, stack: error.stack }),
  };
}
```

### Lambda Error Handler

**✅ Good:**

```typescript
export const handler = async (event: APIGatewayProxyEvent) => {
  try {
    // Business logic
    const result = await processRequest(event);
    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('Error processing request:', error);

    if (error instanceof AppError) {
      return {
        statusCode: error.statusCode,
        body: JSON.stringify({ message: error.message }),
      };
    }

    // Generic error for unexpected errors
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};
```

## Logging & Monitoring

### CloudWatch Logs

**✅ Good - Structured logging:**

```typescript
interface LogEntry {
  timestamp: string;
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
  message: string;
  userId?: string;
  requestId?: string;
  error?: any;
}

function log(entry: LogEntry): void {
  const logEntry = {
    ...entry,
    timestamp: new Date().toISOString(),
  };

  // Don't log sensitive data
  console.log(JSON.stringify(logEntry));
}

// Usage
log({
  level: 'INFO',
  message: 'Task created',
  userId: 'user-123',
  requestId: context.requestId,
});
```

**❌ Avoid - Logging sensitive data:**

```typescript
console.log('User login:', { email, password }); // Never log passwords!
console.log('API key:', apiKey); // Never log secrets!
console.log('JWT token:', token); // Never log tokens!
```

### CloudWatch Alarms

**Monitor for security events:**

```typescript
// CDK: Create alarm for unauthorized access attempts
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

const unauthorizedMetric = new cloudwatch.Metric({
  namespace: 'TimeManagement/API',
  metricName: 'UnauthorizedAttempts',
  statistic: 'Sum',
});

const alarm = new cloudwatch.Alarm(this, 'UnauthorizedAlarm', {
  metric: unauthorizedMetric,
  threshold: 100,
  evaluationPeriods: 1,
  alarmDescription: 'Alert on high number of unauthorized access attempts',
});
```

## Security Headers

### API Responses

**✅ Good:**

```typescript
return {
  statusCode: 200,
  headers: {
    'Content-Type': 'application/json',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Content-Security-Policy': "default-src 'self'",
  },
  body: JSON.stringify(data),
};
```

## Dependency Security

### Keep Dependencies Updated

**Regular security updates:**

```bash
# Check for vulnerabilities
pnpm audit

# Update dependencies
pnpm update

# Fix vulnerabilities automatically
pnpm audit fix
```

**Use Dependabot or Renovate:**

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: 'npm'
    directory: '/'
    schedule:
      interval: 'weekly'
    open-pull-requests-limit: 10
```

### Pin Dependency Versions

**✅ Good:**

```json
{
  "dependencies": {
    "aws-sdk": "2.1234.0", // Exact version
    "react": "18.2.0"
  }
}
```

## Security Checklist

- [ ] Authentication uses Cognito or another managed service
- [ ] JWT tokens are validated on every API request
- [ ] All IAM roles follow least privilege principle
- [ ] Secrets are stored in Secrets Manager, not environment variables
- [ ] All data is encrypted at rest and in transit
- [ ] All user input is validated and sanitized
- [ ] Error messages don't expose internal details
- [ ] CORS is configured for specific origins in production
- [ ] Security headers are included in all API responses
- [ ] CloudWatch logs don't contain sensitive data
- [ ] Dependencies are regularly updated
- [ ] CloudWatch alarms monitor for security events
- [ ] API Gateway has rate limiting enabled
- [ ] Lambda functions have timeout and memory limits configured
- [ ] DynamoDB has point-in-time recovery enabled
