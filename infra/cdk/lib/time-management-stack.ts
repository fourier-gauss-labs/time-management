import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AuthConstruct } from './constructs/auth-construct';
import { ApiConstruct } from './constructs/api-construct';
import { DatabaseConstruct } from './constructs/database-construct';
import { FrontendConstruct } from './constructs/frontend-construct';
import { SecretsConstruct } from './constructs/secrets-construct';
import { getConfig } from './config/environment-config';

export class TimeManagementStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Get environment configuration
    const environment = process.env.ENVIRONMENT || 'dev';
    const config = getConfig(environment);

    // Apply resource tags
    Object.entries(config.tags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    // DynamoDB table for application data
    const database = new DatabaseConstruct(this, 'Database', {
      tableName: `${id}-data`,
      enablePointInTimeRecovery: config.enableDynamoDbPitr,
    });

    // Secrets Manager for application secrets
    const secrets = new SecretsConstruct(this, 'Secrets', {
      secretNamePrefix: id,
    });

    // Frontend hosting with S3 and CloudFront
    const frontend = new FrontendConstruct(this, 'Frontend', {
      bucketName: `${id.toLowerCase()}-frontend`,
      enableAccessLogging: config.enableCloudFrontLogging,
    });

    // Authentication with Cognito
    const auth = new AuthConstruct(this, 'Auth', {
      userPoolName: `${id}-users`,
      callbackUrls: [
        'http://localhost:5173/callback',
        `https://${frontend.distribution.distributionDomainName}/callback`,
      ],
      logoutUrls: [
        'http://localhost:5173',
        `https://${frontend.distribution.distributionDomainName}`,
      ],
    });

    // API Gateway with Lambda and Cognito authorizer
    new ApiConstruct(this, 'Api', {
      userPool: auth.userPool,
      userPoolClient: auth.userPoolClient,
      dataTable: database.table,
      appSecrets: secrets.appSecrets,
    });

    // Additional outputs
    new cdk.CfnOutput(this, 'CloudFrontUrl', {
      value: `https://${frontend.distribution.distributionDomainName}`,
      description: 'CloudFront Distribution URL',
    });

    new cdk.CfnOutput(this, 'FrontendBucket', {
      value: frontend.bucket.bucketName,
      description: 'S3 Bucket for Frontend',
    });

    new cdk.CfnOutput(this, 'DynamoDBTableName', {
      value: database.table.tableName,
      description: 'DynamoDB Table Name',
    });

    new cdk.CfnOutput(this, 'Environment', {
      value: environment,
      description: 'Deployment Environment',
    });
  }
}
