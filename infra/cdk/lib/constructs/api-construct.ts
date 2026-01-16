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
  readonly allowedOrigins?: string[];
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
        allowOrigins: props.allowedOrigins || ['http://localhost:5173'],
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
    // Note: Cognito ID tokens use 'client_id' claim, not 'aud', so we don't specify jwtAudience
    this.authorizer = new apigatewayAuthorizers.HttpJwtAuthorizer(
      'CognitoAuthorizer',
      `https://cognito-idp.${cdk.Stack.of(this).region}.amazonaws.com/${props.userPool.userPoolId}`,
      {
        identitySource: ['$request.header.Authorization'],
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

    // Create onboarding initialize Lambda function
    const onboardingInitializeHandler = new lambdaNodejs.NodejsFunction(
      this,
      'OnboardingInitializeHandler',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'handler',
        entry: path.join(
          __dirname,
          '../../../../services/api/src/handlers/onboarding/initialize.ts'
        ),
        environment: {
          NODE_ENV: process.env.NODE_ENV || 'development',
          TABLE_NAME: props.dataTable?.tableName || '',
        },
        timeout: cdk.Duration.seconds(30),
        memorySize: 512,
        bundling: {
          externalModules: ['@aws-sdk/*'],
        },
      }
    );

    // Create onboarding status Lambda function
    const onboardingStatusHandler = new lambdaNodejs.NodejsFunction(
      this,
      'OnboardingStatusHandler',
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'handler',
        entry: path.join(__dirname, '../../../../services/api/src/handlers/onboarding/status.ts'),
        environment: {
          NODE_ENV: process.env.NODE_ENV || 'development',
          TABLE_NAME: props.dataTable?.tableName || '',
        },
        timeout: cdk.Duration.seconds(10),
        memorySize: 256,
        bundling: {
          externalModules: ['@aws-sdk/*'],
        },
      }
    );

    // Grant DynamoDB permissions to onboarding handlers
    if (props.dataTable) {
      props.dataTable.grantReadWriteData(onboardingInitializeHandler);
      props.dataTable.grantReadData(onboardingStatusHandler);
    }

    // Create Lambda integrations for onboarding
    const onboardingInitializeIntegration = new apigatewayIntegrations.HttpLambdaIntegration(
      'OnboardingInitializeIntegration',
      onboardingInitializeHandler
    );

    const onboardingStatusIntegration = new apigatewayIntegrations.HttpLambdaIntegration(
      'OnboardingStatusIntegration',
      onboardingStatusHandler
    );

    // Add onboarding routes with Cognito authorizer
    this.httpApi.addRoutes({
      path: '/api/user/onboarding/initialize',
      methods: [apigateway.HttpMethod.POST],
      integration: onboardingInitializeIntegration,
      authorizer: this.authorizer,
    });

    this.httpApi.addRoutes({
      path: '/api/user/onboarding/status',
      methods: [apigateway.HttpMethod.GET],
      integration: onboardingStatusIntegration,
      authorizer: this.authorizer,
    });

    // ========== Settings Handlers ==========
    const getSettingsHandler = this.createLambdaFunction(
      'GetSettingsHandler',
      'settings/get-settings.ts',
      props.dataTable
    );

    const updateSettingsHandler = this.createLambdaFunction(
      'UpdateSettingsHandler',
      'settings/update-settings.ts',
      props.dataTable
    );

    this.httpApi.addRoutes({
      path: '/api/user/settings',
      methods: [apigateway.HttpMethod.GET],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        'GetSettingsIntegration',
        getSettingsHandler
      ),
      authorizer: this.authorizer,
    });

    this.httpApi.addRoutes({
      path: '/api/user/settings',
      methods: [apigateway.HttpMethod.PUT],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        'UpdateSettingsIntegration',
        updateSettingsHandler
      ),
      authorizer: this.authorizer,
    });

    // ========== Review Handlers ==========
    const getReviewStatusHandler = this.createLambdaFunction(
      'GetReviewStatusHandler',
      'review/get-status.ts',
      props.dataTable
    );

    const completeReviewHandler = this.createLambdaFunction(
      'CompleteReviewHandler',
      'review/complete.ts',
      props.dataTable
    );

    this.httpApi.addRoutes({
      path: '/api/review/status',
      methods: [apigateway.HttpMethod.GET],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        'GetReviewStatusIntegration',
        getReviewStatusHandler
      ),
      authorizer: this.authorizer,
    });

    this.httpApi.addRoutes({
      path: '/api/review/complete',
      methods: [apigateway.HttpMethod.POST],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        'CompleteReviewIntegration',
        completeReviewHandler
      ),
      authorizer: this.authorizer,
    });

    // ========== Driver Handlers ==========
    const listDriversHandler = this.createLambdaFunction(
      'ListDriversHandler',
      'drivers/list-drivers.ts',
      props.dataTable
    );

    const createDriverHandler = this.createLambdaFunction(
      'CreateDriverHandler',
      'drivers/create-driver.ts',
      props.dataTable
    );

    const getDriverHandler = this.createLambdaFunction(
      'GetDriverHandler',
      'drivers/get-driver.ts',
      props.dataTable
    );

    const updateDriverHandler = this.createLambdaFunction(
      'UpdateDriverHandler',
      'drivers/update-driver.ts',
      props.dataTable
    );

    const deleteDriverHandler = this.createLambdaFunction(
      'DeleteDriverHandler',
      'drivers/delete-driver.ts',
      props.dataTable
    );

    this.httpApi.addRoutes({
      path: '/api/drivers',
      methods: [apigateway.HttpMethod.GET],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        'ListDriversIntegration',
        listDriversHandler
      ),
      authorizer: this.authorizer,
    });

    this.httpApi.addRoutes({
      path: '/api/drivers',
      methods: [apigateway.HttpMethod.POST],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        'CreateDriverIntegration',
        createDriverHandler
      ),
      authorizer: this.authorizer,
    });

    this.httpApi.addRoutes({
      path: '/api/drivers/{driverId}',
      methods: [apigateway.HttpMethod.GET],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        'GetDriverIntegration',
        getDriverHandler
      ),
      authorizer: this.authorizer,
    });

    this.httpApi.addRoutes({
      path: '/api/drivers/{driverId}',
      methods: [apigateway.HttpMethod.PUT],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        'UpdateDriverIntegration',
        updateDriverHandler
      ),
      authorizer: this.authorizer,
    });

    this.httpApi.addRoutes({
      path: '/api/drivers/{driverId}',
      methods: [apigateway.HttpMethod.DELETE],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        'DeleteDriverIntegration',
        deleteDriverHandler
      ),
      authorizer: this.authorizer,
    });

    // ========== Milestone Handlers ==========
    const createMilestoneHandler = this.createLambdaFunction(
      'CreateMilestoneHandler',
      'milestones/create-milestone.ts',
      props.dataTable
    );

    this.httpApi.addRoutes({
      path: '/api/drivers/{driverId}/milestones',
      methods: [apigateway.HttpMethod.POST],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        'CreateMilestoneIntegration',
        createMilestoneHandler
      ),
      authorizer: this.authorizer,
    });

    // ========== Action Handlers ==========
    const createActionHandler = this.createLambdaFunction(
      'CreateActionHandler',
      'actions/create-action.ts',
      props.dataTable
    );

    this.httpApi.addRoutes({
      path: '/api/milestones/{milestoneId}/actions',
      methods: [apigateway.HttpMethod.POST],
      integration: new apigatewayIntegrations.HttpLambdaIntegration(
        'CreateActionIntegration',
        createActionHandler
      ),
      authorizer: this.authorizer,
    });

    // Outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.httpApi.apiEndpoint,
      description: 'API Gateway URL',
    });
  }

  /**
   * Helper method to create Lambda functions with consistent configuration
   */
  private createLambdaFunction(
    id: string,
    handlerPath: string,
    dataTable?: dynamodb.Table
  ): lambdaNodejs.NodejsFunction {
    const fn = new lambdaNodejs.NodejsFunction(this, id, {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'handler',
      entry: path.join(__dirname, `../../../../services/api/src/handlers/${handlerPath}`),
      environment: {
        NODE_ENV: process.env.NODE_ENV || 'development',
        TABLE_NAME: dataTable?.tableName || '',
      },
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
      bundling: {
        externalModules: ['@aws-sdk/*'],
      },
    });

    if (dataTable) {
      dataTable.grantReadWriteData(fn);
    }

    return fn;
  }
}
