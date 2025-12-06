import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class TimeManagementStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        // Stack resources will be added here in future iterations
        // For now, this is a minimal valid CDK stack
    }
}
