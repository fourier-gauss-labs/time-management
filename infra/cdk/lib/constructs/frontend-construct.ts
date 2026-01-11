import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as cloudfrontOrigins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cdk from 'aws-cdk-lib';

export interface FrontendConstructProps {
  readonly bucketName: string;
  readonly enableAccessLogging: boolean;
}

/**
 * Frontend hosting construct using S3 and CloudFront.
 * Provides HTTPS, edge caching, and SPA support.
 */
export class FrontendConstruct extends Construct {
  public readonly bucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: FrontendConstructProps) {
    super(scope, id);

    // Create S3 bucket for frontend hosting
    this.bucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: props.bucketName,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
    });

    // Create CloudFront distribution
    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new cloudfrontOrigins.S3Origin(this.bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
      },
      defaultRootObject: 'index.html',
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.minutes(5),
        },
      ],
      enableLogging: props.enableAccessLogging,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    });

    // Allow GitHub Actions IAM user to deploy to S3
    // Bucket policy is needed in addition to user policy for cross-service access
    const githubActionsUserArn = `arn:aws:iam::${cdk.Stack.of(this).account}:user/bill.mccann@fouriergauss.com`;
    
    // ListBucket permission on the bucket itself
    this.bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowGitHubActionsListBucket',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ArnPrincipal(githubActionsUserArn)],
        actions: ['s3:ListBucket'],
        resources: [this.bucket.bucketArn],
      })
    );
    
    // Object permissions on bucket contents
    this.bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowGitHubActionsObjectOperations',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ArnPrincipal(githubActionsUserArn)],
        actions: ['s3:PutObject', 's3:GetObject', 's3:DeleteObject'],
        resources: [`${this.bucket.bucketArn}/*`],
      })
    );

    // Outputs
    new cdk.CfnOutput(this, 'BucketName', {
      value: this.bucket.bucketName,
      description: 'Frontend S3 bucket name',
    });

    new cdk.CfnOutput(this, 'DistributionDomainName', {
      value: this.distribution.distributionDomainName,
      description: 'CloudFront distribution domain name',
    });

    new cdk.CfnOutput(this, 'DistributionUrl', {
      value: `https://${this.distribution.distributionDomainName}`,
      description: 'Frontend URL (CloudFront)',
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: this.distribution.distributionId,
      description: 'CloudFront distribution ID (for cache invalidation)',
    });
  }
}
