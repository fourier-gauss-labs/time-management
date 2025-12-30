# CI/CD Standards

This document defines continuous integration and continuous deployment practices for the time-management platform.

## Core Principles

1. **Automate everything** - Manual deployments are error-prone
2. **Test before deploy** - Never deploy untested code
3. **Deploy frequently** - Small, incremental changes reduce risk
4. **Rollback capability** - Every deployment must be reversible
5. **Environment parity** - Dev, staging, and prod should be identical
6. **Infrastructure as code** - All infrastructure changes through CDK
7. **Security first** - Scan for vulnerabilities in every pipeline
8. **Fast feedback** - Pipelines should complete in minutes, not hours

## Pipeline Architecture

### GitHub Actions Workflow

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  NODE_VERSION: '20.x'
  PNPM_VERSION: '8.x'

jobs:
  # Job 1: Lint and Type Check
  lint:
    name: Lint & Type Check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint code
        run: pnpm lint

      - name: Type check
        run: pnpm type-check

  # Job 2: Unit Tests
  test:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run tests
        run: pnpm test:ci

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  # Job 3: Build
  build:
    name: Build Application
    runs-on: ubuntu-latest
    needs: [lint, test]
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build packages
        run: pnpm build

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: build-artifacts
          path: |
            apps/web/dist
            services/api/dist
            infra/cdk/cdk.out

  # Job 4: Security Scan
  security:
    name: Security Scan
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Run security audit
        run: pnpm audit --audit-level=high

      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
        with:
          args: --severity-threshold=high

  # Job 5: Deploy to Dev
  deploy-dev:
    name: Deploy to Dev
    runs-on: ubuntu-latest
    needs: [build, security]
    if: github.ref == 'refs/heads/develop' && github.event_name == 'push'
    environment:
      name: development
      url: https://dev.timemanagement.example.com
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build application
        run: pnpm build

      - name: Deploy infrastructure
        run: |
          cd infra/cdk
          ENVIRONMENT=dev pnpm cdk deploy --require-approval never

      - name: Run smoke tests
        run: pnpm test:smoke
        env:
          API_URL: ${{ secrets.DEV_API_URL }}

  # Job 6: Deploy to Production
  deploy-prod:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [build, security]
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    environment:
      name: production
      url: https://timemanagement.example.com
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: ${{ env.PNPM_VERSION }}

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'pnpm'

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID_PROD }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY_PROD }}
          aws-region: us-east-1

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Build application
        run: pnpm build

      - name: Deploy infrastructure
        run: |
          cd infra/cdk
          ENVIRONMENT=prod pnpm cdk deploy --require-approval never

      - name: Run smoke tests
        run: pnpm test:smoke
        env:
          API_URL: ${{ secrets.PROD_API_URL }}

      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        if: always()
        with:
          status: ${{ job.status }}
          text: 'Production deployment completed'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## Package.json Scripts

### Required CI/CD Scripts

```json
{
  "scripts": {
    "lint": "eslint . --ext .ts,.tsx --max-warnings 0",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:ci": "vitest run --coverage",
    "test:smoke": "node scripts/smoke-test.js",
    "build": "pnpm --filter './packages/**' --filter './apps/**' build",
    "deploy:dev": "cd infra/cdk && ENVIRONMENT=dev pnpm cdk deploy",
    "deploy:prod": "cd infra/cdk && ENVIRONMENT=prod pnpm cdk deploy",
    "cdk:synth": "cd infra/cdk && pnpm cdk synth",
    "cdk:diff": "cd infra/cdk && pnpm cdk diff"
  }
}
```

## Environment Configuration

### GitHub Secrets

**Required secrets for CI/CD:**

- `AWS_ACCESS_KEY_ID` - AWS access key for dev/staging
- `AWS_SECRET_ACCESS_KEY` - AWS secret key for dev/staging
- `AWS_ACCESS_KEY_ID_PROD` - AWS access key for production
- `AWS_SECRET_ACCESS_KEY_PROD` - AWS secret key for production
- `SNYK_TOKEN` - Snyk API token for security scanning
- `SLACK_WEBHOOK` - Slack webhook for notifications (optional)
- `CODECOV_TOKEN` - Codecov token for coverage reports (optional)

### GitHub Environments

Configure environments in GitHub repository settings:

**Development Environment:**

- Name: `development`
- URL: `https://dev.timemanagement.example.com`
- Protection rules: None
- Secrets: Dev-specific secrets

**Production Environment:**

- Name: `production`
- URL: `https://timemanagement.example.com`
- Protection rules:
  - Required reviewers: 1
  - Wait timer: 5 minutes
  - Deployment branch: `main` only
- Secrets: Production-specific secrets

## Deployment Strategies

### Blue-Green Deployment (Future)

For zero-downtime deployments:

```typescript
// CDK: Lambda alias for blue-green
const version = lambdaFunction.currentVersion;

const alias = new lambda.Alias(this, 'ProdAlias', {
  aliasName: 'prod',
  version,
});

// Use CodeDeploy for gradual rollout
new codedeploy.LambdaDeploymentGroup(this, 'DeploymentGroup', {
  alias,
  deploymentConfig: codedeploy.LambdaDeploymentConfig.LINEAR_10PERCENT_EVERY_1MINUTE,
  alarms: [cloudwatchAlarm],
});
```

### Canary Deployment (Future)

For testing with subset of users:

```typescript
api.deploymentStage = new apigateway.Stage(this, 'ProdStage', {
  deployment: api.latestDeployment,
  stageName: 'prod',
  canarySettings: {
    percentTraffic: 10,
    useStageCache: false,
  },
});
```

## Rollback Strategy

### Automated Rollback

**CloudWatch alarm-based rollback:**

```typescript
const errorAlarm = new cloudwatch.Alarm(this, 'ErrorAlarm', {
  metric: lambdaFunction.metricErrors(),
  threshold: 10,
  evaluationPeriods: 1,
});

// Use in CodeDeploy deployment group
new codedeploy.LambdaDeploymentGroup(this, 'DeploymentGroup', {
  alias: lambdaAlias,
  alarms: [errorAlarm], // Automatic rollback on alarm
  autoRollback: {
    failedDeployment: true,
    deploymentInAlarm: true,
  },
});
```

### Manual Rollback

**Rollback to previous CDK deployment:**

```bash
# List previous stacks
aws cloudformation list-stacks --stack-status-filter UPDATE_COMPLETE

# Rollback to previous version (re-deploy previous commit)
git revert HEAD
git push origin main  # Triggers CI/CD with previous code
```

**Rollback Lambda function:**

```bash
# Update alias to previous version
aws lambda update-alias \
  --function-name TimeManagement-prod-ApiHandler \
  --name prod \
  --function-version 42  # Previous version number
```

## Testing in CI/CD

### Unit Tests

**Run on every commit:**

```bash
# Vitest with coverage
pnpm test:ci

# Requirements:
# - Minimum 80% code coverage
# - All tests must pass
# - No skipped tests in main branch
```

### Integration Tests

**Test API endpoints:**

```typescript
// tests/integration/api.test.ts
import { describe, it, expect } from 'vitest';

describe('API Integration Tests', () => {
  it('should create a task', async () => {
    const response = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${testToken}`,
      },
      body: JSON.stringify({
        title: 'Test task',
        priority: 'high',
      }),
    });

    expect(response.status).toBe(201);
    const task = await response.json();
    expect(task).toHaveProperty('id');
    expect(task.title).toBe('Test task');
  });
});
```

### Smoke Tests

**Verify deployment health:**

```typescript
// scripts/smoke-test.js
const API_URL = process.env.API_URL;

async function runSmokeTests() {
  // Test 1: API is responding
  const healthResponse = await fetch(`${API_URL}/health`);
  if (healthResponse.status !== 200) {
    throw new Error('Health check failed');
  }

  // Test 2: Authentication endpoint works
  const authResponse = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@example.com', password: 'test' }),
  });
  if (authResponse.status !== 401) {
    // Expected for invalid creds
    throw new Error('Auth endpoint check failed');
  }

  console.log('✅ All smoke tests passed');
}

runSmokeTests().catch(error => {
  console.error('❌ Smoke tests failed:', error);
  process.exit(1);
});
```

## Code Quality Gates

### ESLint Configuration

```javascript
// .eslintrc.js
module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
  ],
  rules: {
    '@typescript-eslint/no-explicit-any': 'error', // Strict!
    '@typescript-eslint/no-unused-vars': 'error',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
};
```

### Pipeline Quality Gates

**Fail pipeline if:**

- ESLint errors > 0
- TypeScript errors > 0
- Test coverage < 80%
- Security vulnerabilities (high/critical) found
- Build fails
- Smoke tests fail

## Performance Monitoring

### CloudWatch Metrics

**Monitor after deployment:**

```typescript
// CDK: Custom metrics
const apiErrorsMetric = new cloudwatch.Metric({
  namespace: 'TimeManagement/API',
  metricName: 'Errors',
  statistic: 'Sum',
});

const apiLatencyMetric = new cloudwatch.Metric({
  namespace: 'TimeManagement/API',
  metricName: 'Latency',
  statistic: 'Average',
});

// Alarms
new cloudwatch.Alarm(this, 'HighErrorRate', {
  metric: apiErrorsMetric,
  threshold: 10,
  evaluationPeriods: 2,
  alarmDescription: 'Alert when error rate is high',
});

new cloudwatch.Alarm(this, 'HighLatency', {
  metric: apiLatencyMetric,
  threshold: 1000, // 1 second
  evaluationPeriods: 3,
  alarmDescription: 'Alert when API latency is high',
});
```

### X-Ray Tracing

**Enable distributed tracing:**

```typescript
// CDK: Enable X-Ray
const handler = new lambda.Function(this, 'Handler', {
  tracing: lambda.Tracing.ACTIVE,
  // ...
});

const api = new apigateway.RestApi(this, 'Api', {
  deployOptions: {
    tracingEnabled: true,
  },
  // ...
});
```

## Notifications

### Slack Integration

**Notify on deployment events:**

```yaml
# In GitHub Actions workflow
- name: Notify Slack
  uses: 8398a7/action-slack@v3
  if: always()
  with:
    status: ${{ job.status }}
    fields: repo,message,commit,author
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Email Notifications

**CloudWatch alarms to SNS:**

```typescript
// CDK: Email notifications
const topic = new sns.Topic(this, 'AlertTopic', {
  displayName: 'TimeManagement Alerts',
});

topic.addSubscription(new sns_subscriptions.EmailSubscription('team@example.com'));

// Attach to alarms
alarm.addAlarmAction(new cloudwatch_actions.SnsAction(topic));
```

## Infrastructure Drift Detection

### CDK Diff in Pipeline

**Detect infrastructure changes:**

```yaml
- name: CDK Diff
  run: |
    cd infra/cdk
    pnpm cdk diff
  # This shows what will change before deployment
```

### Prevent Manual Changes

**Use CloudWatch Events to detect drift:**

```typescript
// CDK: Alert on manual changes
const rule = new events.Rule(this, 'ManualChangeAlert', {
  eventPattern: {
    source: ['aws.cloudformation'],
    detailType: ['CloudFormation Stack Status Change'],
  },
});

rule.addTarget(new targets.SnsTopic(alertTopic));
```

## Best Practices

### 1. Fast Feedback

- Lint and type check should complete in < 1 minute
- Unit tests should complete in < 2 minutes
- Total pipeline should complete in < 10 minutes

### 2. Parallel Jobs

- Run lint, tests, and security scans in parallel
- Only build once, reuse artifacts

### 3. Cache Dependencies

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: ${{ env.NODE_VERSION }}
    cache: 'pnpm' # Cache pnpm dependencies
```

### 4. Fail Fast

- Run quick checks (lint, type) before slow checks (tests)
- Exit on first failure

### 5. Immutable Artifacts

- Build once, deploy many times
- Tag Docker images with git SHA
- Use CDK asset hashing

### 6. Environment Promotion

```
Developer → Pull Request → Merge to develop → Deploy to Dev →
Merge to main → Deploy to Prod
```

### 7. Feature Flags (Future)

For gradual rollouts:

```typescript
// Use AWS AppConfig for feature flags
if (featureFlags.isEnabled('new-feature')) {
  // New code path
} else {
  // Old code path
}
```

## CI/CD Checklist

- [ ] GitHub Actions workflows configured
- [ ] All secrets stored in GitHub Secrets
- [ ] GitHub Environments configured (dev, prod)
- [ ] Lint and type checks run on every PR
- [ ] Unit tests run on every PR with coverage requirements
- [ ] Security scanning runs on every PR
- [ ] Deployments only from protected branches
- [ ] Production requires approval
- [ ] Smoke tests run after deployment
- [ ] CloudWatch alarms configured
- [ ] Rollback strategy documented
- [ ] Team notifications configured
- [ ] Infrastructure as code (no manual changes)
- [ ] CDK diffs reviewed before deployment
