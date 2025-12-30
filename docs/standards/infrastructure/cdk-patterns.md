# CDK Patterns & Infrastructure Standards

This document defines AWS CDK patterns and infrastructure-as-code best practices for the time-management platform.

## Core Principles

1. **Type-safe infrastructure** - Use TypeScript for all CDK code
2. **Reusable constructs** - Create custom constructs for common patterns
3. **Environment separation** - Clear separation between dev, staging, and prod
4. **Least privilege** - Grant minimal necessary permissions
5. **Immutable infrastructure** - Resources should be replaceable, not modified
6. **Cost awareness** - Use serverless and pay-per-use services where possible
7. **Observability first** - Build in logging, metrics, and tracing from day one

## Project Structure

```
infra/
  cdk/
    bin/
      time-management.ts        # App entry point
    lib/
      time-management-stack.ts  # Main stack
      constructs/               # Reusable constructs
        api-construct.ts
        database-construct.ts
        auth-construct.ts
      config/                   # Environment configs
        dev.ts
        staging.ts
        prod.ts
```

## Stack Organization

### Single Stack for Simplicity

For this application, use a single stack that contains all resources:

```typescript
// lib/time-management-stack.ts
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ApiConstruct } from './constructs/api-construct';
import { DatabaseConstruct } from './constructs/database-construct';
import { AuthConstruct } from './constructs/auth-construct';

export class TimeManagementStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Authentication
    const auth = new AuthConstruct(this, 'Auth', {
      userPoolName: `${id}-users`,
    });

    // Database
    const database = new DatabaseConstruct(this, 'Database', {
      tableName: `${id}-tasks`,
    });

    // API
    const api = new ApiConstruct(this, 'Api', {
      userPool: auth.userPool,
      tasksTable: database.table,
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL',
    });

    new cdk.CfnOutput(this, 'UserPoolId', {
      value: auth.userPool.userPoolId,
      description: 'Cognito User Pool ID',
    });
  }
}
```

### Stack Naming Convention

Use environment-based naming:

```typescript
// bin/time-management.ts
import * as cdk from 'aws-cdk-lib';
import { TimeManagementStack } from '../lib/time-management-stack';

const app = new cdk.App();

const env = process.env.ENVIRONMENT || 'dev';

new TimeManagementStack(app, `TimeManagement-${env}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  tags: {
    Environment: env,
    Project: 'TimeManagement',
    ManagedBy: 'CDK',
  },
});
```

## Construct Patterns

### API Gateway + Lambda Pattern

**✅ Good:**

```typescript
// lib/constructs/api-construct.ts
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface ApiConstructProps {
  userPool: cognito.UserPool;
  tasksTable: dynamodb.Table;
}

export class ApiConstruct extends Construct {
  public readonly api: apigateway.RestApi;
  public readonly url: string;

  constructor(scope: Construct, id: string, props: ApiConstructProps) {
    super(scope, id);

    // Lambda function
    const handler = new lambda.Function(this, 'Handler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('../../services/api/dist'),
      environment: {
        TASKS_TABLE: props.tasksTable.tableName,
        USER_POOL_ID: props.userPool.userPoolId,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      logRetention: logs.RetentionDays.ONE_WEEK,
      tracing: lambda.Tracing.ACTIVE, // X-Ray tracing
    });

    // Grant permissions
    props.tasksTable.grantReadWriteData(handler);

    // API Gateway
    this.api = new apigateway.RestApi(this, 'Api', {
      restApiName: 'TimeManagement API',
      description: 'API for time management platform',
      deployOptions: {
        stageName: 'v1',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        tracingEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS, // Restrict in production
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    // Authorizer
    const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, 'Authorizer', {
      cognitoUserPools: [props.userPool],
    });

    // Routes
    const tasks = this.api.root.addResource('tasks');
    tasks.addMethod('GET', new apigateway.LambdaIntegration(handler), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    tasks.addMethod('POST', new apigateway.LambdaIntegration(handler), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    const task = tasks.addResource('{taskId}');
    task.addMethod('GET', new apigateway.LambdaIntegration(handler), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    task.addMethod('PUT', new apigateway.LambdaIntegration(handler), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });
    task.addMethod('DELETE', new apigateway.LambdaIntegration(handler), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.COGNITO,
    });

    this.url = this.api.url;
  }
}
```

### DynamoDB Pattern

**✅ Good:**

```typescript
// lib/constructs/database-construct.ts
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export interface DatabaseConstructProps {
  tableName: string;
}

export class DatabaseConstruct extends Construct {
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string, props: DatabaseConstructProps) {
    super(scope, id);

    this.table = new dynamodb.Table(this, 'TasksTable', {
      tableName: props.tableName,
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'taskId',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // On-demand
      pointInTimeRecovery: true, // Enable backups
      removalPolicy: cdk.RemovalPolicy.RETAIN, // Don't delete on stack deletion
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    // GSI for querying tasks by status
    this.table.addGlobalSecondaryIndex({
      indexName: 'StatusIndex',
      partitionKey: {
        name: 'userId',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'status',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });
  }
}
```

### Cognito Authentication Pattern

**✅ Good:**

```typescript
// lib/constructs/auth-construct.ts
import * as cdk from 'aws-cdk-lib';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';

export interface AuthConstructProps {
  userPoolName: string;
}

export class AuthConstruct extends Construct {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;

  constructor(scope: Construct, id: string, props: AuthConstructProps) {
    super(scope, id);

    this.userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: props.userPoolName,
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
      },
      autoVerify: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: false,
        },
        givenName: {
          required: true,
          mutable: true,
        },
        familyName: {
          required: true,
          mutable: true,
        },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    this.userPoolClient = this.userPool.addClient('WebClient', {
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [cognito.OAuthScope.EMAIL, cognito.OAuthScope.OPENID],
      },
    });
  }
}
```

## Resource Naming

### Use Consistent Naming Patterns

**✅ Good:**

```typescript
// Pattern: {Project}-{Environment}-{Resource}
const tableName = `TimeManagement-${env}-Tasks`;
const functionName = `TimeManagement-${env}-ApiHandler`;
const bucketName = `timemanagement-${env}-assets-${accountId}`;
```

### Use Logical IDs for CDK Constructs

**✅ Good:**

```typescript
new lambda.Function(this, 'ApiHandler', { ... });
new dynamodb.Table(this, 'TasksTable', { ... });
new s3.Bucket(this, 'AssetsBucket', { ... });
```

## Environment Configuration

### Use Environment-Specific Configs

**✅ Good:**

```typescript
// lib/config/dev.ts
export const devConfig = {
  environment: 'dev',
  logLevel: 'DEBUG',
  corsOrigins: ['http://localhost:5173'],
  retention: logs.RetentionDays.THREE_DAYS,
};

// lib/config/prod.ts
export const prodConfig = {
  environment: 'prod',
  logLevel: 'INFO',
  corsOrigins: ['https://timemanagement.example.com'],
  retention: logs.RetentionDays.ONE_MONTH,
};
```

## Outputs and Exports

### Define Stack Outputs for Frontend

**✅ Good:**

```typescript
new cdk.CfnOutput(this, 'ApiUrl', {
  value: api.url,
  exportName: `${this.stackName}-ApiUrl`,
});

new cdk.CfnOutput(this, 'UserPoolId', {
  value: auth.userPool.userPoolId,
  exportName: `${this.stackName}-UserPoolId`,
});

new cdk.CfnOutput(this, 'UserPoolClientId', {
  value: auth.userPoolClient.userPoolClientId,
  exportName: `${this.stackName}-UserPoolClientId`,
});
```

## Best Practices

### 1. Use L2 Constructs When Available

Prefer high-level (L2) constructs over low-level (L1) CloudFormation resources:

**✅ Good:**

```typescript
import * as s3 from 'aws-cdk-lib/aws-s3';

new s3.Bucket(this, 'MyBucket', {
  versioned: true,
  encryption: s3.BucketEncryption.S3_MANAGED,
});
```

**❌ Avoid:**

```typescript
import * as s3 from 'aws-cdk-lib/aws-s3';

new s3.CfnBucket(this, 'MyBucket', {
  versioningConfiguration: { status: 'Enabled' },
});
```

### 2. Grant Permissions, Don't Create Policies

**✅ Good:**

```typescript
table.grantReadWriteData(lambdaFunction);
bucket.grantRead(lambdaFunction);
```

**❌ Avoid (manual policies):**

```typescript
lambdaFunction.addToRolePolicy(
  new iam.PolicyStatement({
    actions: ['dynamodb:GetItem', 'dynamodb:PutItem'],
    resources: [table.tableArn],
  })
);
```

### 3. Enable Removal Policies Carefully

**✅ Good:**

```typescript
// Stateful resources - retain on deletion
new dynamodb.Table(this, 'Table', {
  removalPolicy: cdk.RemovalPolicy.RETAIN,
});

// Stateless resources - destroy on deletion
new lambda.Function(this, 'Function', {
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});
```

### 4. Use Aspects for Cross-Cutting Concerns

**✅ Good:**

```typescript
import { IAspect, Aspects, Tags } from 'aws-cdk-lib';

// Add tags to all resources
Tags.of(app).add('Project', 'TimeManagement');
Tags.of(app).add('ManagedBy', 'CDK');

// Custom aspect for encryption
class EnforceEncryptionAspect implements IAspect {
  visit(node: IConstruct): void {
    if (node instanceof s3.Bucket) {
      if (!node.encryption) {
        throw new Error('All S3 buckets must be encrypted');
      }
    }
  }
}

Aspects.of(stack).add(new EnforceEncryptionAspect());
```

### 5. Use Context for Environment Values

**✅ Good:**

```typescript
// cdk.json
{
  "context": {
    "dev": {
      "corsOrigins": ["http://localhost:5173"],
      "logLevel": "DEBUG"
    },
    "prod": {
      "corsOrigins": ["https://timemanagement.example.com"],
      "logLevel": "INFO"
    }
  }
}

// In stack
const config = this.node.tryGetContext(env);
```

## Testing CDK Code

### Snapshot Tests

**✅ Good:**

```typescript
import { App } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TimeManagementStack } from '../lib/time-management-stack';

test('Stack creates expected resources', () => {
  const app = new App();
  const stack = new TimeManagementStack(app, 'TestStack');
  const template = Template.fromStack(stack);

  template.resourceCountIs('AWS::Lambda::Function', 1);
  template.resourceCountIs('AWS::DynamoDB::Table', 1);
  template.hasResourceProperties('AWS::Lambda::Function', {
    Runtime: 'nodejs20.x',
  });
});
```

### Fine-Grained Assertions

**✅ Good:**

```typescript
test('Lambda has correct environment variables', () => {
  const app = new App();
  const stack = new TimeManagementStack(app, 'TestStack');
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::Lambda::Function', {
    Environment: {
      Variables: {
        TASKS_TABLE: { Ref: Match.anyValue() },
      },
    },
  });
});
```

## Deployment Commands

```bash
# Install dependencies
cd infra/cdk
pnpm install

# Synthesize CloudFormation template
pnpm cdk synth

# Diff against deployed stack
pnpm cdk diff

# Deploy to dev
ENVIRONMENT=dev pnpm cdk deploy

# Deploy to prod
ENVIRONMENT=prod pnpm cdk deploy

# Destroy stack
pnpm cdk destroy
```

## Common Patterns Checklist

- [ ] All resources have removal policies defined
- [ ] All Lambda functions have log retention configured
- [ ] All stateful resources are encrypted
- [ ] IAM permissions follow least privilege
- [ ] CloudWatch alarms are configured for critical resources
- [ ] All outputs needed by frontend are exported
- [ ] Tags are applied to all resources
- [ ] X-Ray tracing is enabled for Lambda and API Gateway
- [ ] CORS is configured appropriately for environment
- [ ] Environment-specific configurations are externalized
