#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TimeManagementStack } from '../lib/time-management-stack';

const app = new cdk.App();

new TimeManagementStack(app, 'TimeManagementStack-Dev', {
    tags: {
        'project-name': 'time-management',
        'environment': 'dev'
    }
});
