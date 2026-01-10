#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TimeManagementStack } from '../lib/time-management-stack';

const app = new cdk.App();

// Get environment from context or default to 'dev'
const environment = app.node.tryGetContext('environment') || process.env.ENVIRONMENT || 'dev';

// Define region per environment
const regionMap: Record<string, string> = {
  dev: 'us-east-2',
  qa: 'us-east-1',
  prod: 'us-east-1',
};

const region = regionMap[environment] || 'us-east-2';

new TimeManagementStack(
  app,
  `TimeManagementApp-${environment.charAt(0).toUpperCase() + environment.slice(1)}`,
  {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: region,
    },
    tags: {
      'project-name': 'time-management',
      environment: environment,
    },
  }
);
