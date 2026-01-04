import { Construct } from 'constructs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as cdk from 'aws-cdk-lib';

export interface SecretsConstructProps {
  /**
   * Name prefix for the secrets
   */
  readonly secretNamePrefix: string;
}

/**
 * AWS Secrets Manager construct for securely storing application secrets.
 *
 * This construct creates an example secret to demonstrate the pattern.
 * In production, secrets should be populated through the AWS Console or CLI.
 */
export class SecretsConstruct extends Construct {
  /**
   * The application secrets object
   */
  public readonly appSecrets: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props: SecretsConstructProps) {
    super(scope, id);

    // Create a secret for application configuration
    // In production, populate this with actual values via AWS Console or CLI
    this.appSecrets = new secretsmanager.Secret(this, 'AppSecrets', {
      secretName: `${props.secretNamePrefix}/app-secrets`,
      description: 'Application secrets for time management system',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          // Example placeholder values - replace in AWS Console
          externalApiKey: 'placeholder-value',
          encryptionKey: 'placeholder-value',
        }),
        generateStringKey: 'auto-generated-password',
      },
    });

    // Output
    new cdk.CfnOutput(this, 'SecretsArn', {
      value: this.appSecrets.secretArn,
      description: 'ARN of application secrets in Secrets Manager',
    });
  }
}
