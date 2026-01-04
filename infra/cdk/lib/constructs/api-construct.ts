import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayAuthorizers from 'aws-cdk-lib/aws-apigatewayv2-authorizers';
import * as apigatewayIntegrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as cdk from 'aws-cdk-lib';
import * as path from 'path';

export interface ApiConstructProps {
  readonly userPool: cognito.UserPool;
  readonly userPoolClient: cognito.UserPoolClient;
  readonly dataTable?: dynamodb.Table;
  readonly appSecrets?: secretsmanager.Secret;
}

/**
 * API Gateway construct with Lambda integrations and Cognito authorization.
 */
export class ApiConstruct extends Construct {
  public readonly httpApi: apigateway.HttpApi;
  public readonly authorizer: apigatewayAuthorizers.HttpJwtAuthorizer;

  constructor(scope: Construct, id: string, props: ApiConstructProps) {
    super(scope, id);

    // Create HTTP API
    this.httpApi = new apigateway.HttpApi(this, 'HttpApi', {
      apiName: `${cdk.Stack.of(this).stackName}-api`,
      corsPreflight: {
        allowOrigins: ['http://localhost:5173'],
        allowMethods: [
          apigateway.CorsHttpMethod.GET,
          apigateway.CorsHttpMethod.POST,
          apigateway.CorsHttpMethod.PUT,
          apigateway.CorsHttpMethod.DELETE,
          apigateway.CorsHttpMethod.OPTIONS,
        ],
        allowHeaders: ['Content-Type', 'Authorization'],
        maxAge: cdk.Duration.days(1),
      },
    });

    // Create JWT Authorizer
    this.authorizer = new apigatewayAuthorizers.HttpJwtAuthorizer(
      'CognitoAuthorizer',
      `https://cognito-idp.${cdk.Stack.of(this).region}.amazonaws.com/${props.userPool.userPoolId}`,
      {
        jwtAudience: [props.userPoolClient.userPoolClientId],
      }
    );

    // Create auth verify Lambda function
    const authVerifyHandler = new lambdaNodejs.NodejsFunction(this, 'AuthVerifyHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, '../../../../services/api/src/handlers/auth/verify.ts'),
      environment: {
        NODE_ENV: process.env.NODE_ENV || 'development',
        TABLE_NAME: props.dataTable?.tableName || '',
        SECRETS_ARN: props.appSecrets?.secretArn || '',
      },
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
    });

    // Grant DynamoDB permissions if table provided
    if (props.dataTable) {
      props.dataTable.grantReadWriteData(authVerifyHandler);
    }

    // Grant Secrets Manager permissions if secrets provided
    if (props.appSecrets) {
      props.appSecrets.grantRead(authVerifyHandler);
    }

    // Create Lambda integration
    const authVerifyIntegration = new apigatewayIntegrations.HttpLambdaIntegration(
      'AuthVerifyIntegration',
      authVerifyHandler
    );

    // Add route with Cognito authorizer
    this.httpApi.addRoutes({
      path: '/api/auth/verify',
      methods: [apigateway.HttpMethod.GET],
      integration: authVerifyIntegration,
      authorizer: this.authorizer,
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.httpApi.apiEndpoint,
      description: 'API Gateway URL',
    });
  }
}
