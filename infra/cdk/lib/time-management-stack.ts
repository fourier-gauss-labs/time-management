import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AuthConstruct } from './constructs/auth-construct';
import { ApiConstruct } from './constructs/api-construct';

export class TimeManagementStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Authentication with Cognito
    const auth = new AuthConstruct(this, 'Auth', {
      userPoolName: `${id}-users`,
      callbackUrls: ['http://localhost:5173/callback'],
      logoutUrls: ['http://localhost:5173'],
    });

    // API Gateway with Lambda and Cognito authorizer
    new ApiConstruct(this, 'Api', {
      userPool: auth.userPool,
      userPoolClient: auth.userPoolClient,
    });
  }
}
