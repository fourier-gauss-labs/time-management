# Sprint 2 — Infrastructure & Environments

**Primary Epic:** EPIC 2 — Infrastructure as Code & Environments

**Sprint Intent**
Establish production-ready infrastructure patterns and multi-environment support before building application features. This sprint creates a fully parameterized, reproducible infrastructure foundation that supports dev, QA, and production environments with proper data storage, frontend hosting, and cost controls.

---

## Goals

Define what success looks like for this sprint.

- Complete infrastructure-as-code coverage for all application components
- Multi-environment support (dev, QA, prod) with proper parameterization
- DynamoDB table for per-user data storage
- Frontend hosting infrastructure (S3 + CloudFront)
- Automated deployment for dev environment
- Production-ready infrastructure patterns established

---

## In Scope

Explicitly list what this sprint will cover.

- DynamoDB table with single-table design for user data
- S3 bucket and CloudFront distribution for frontend hosting
- Environment-specific configuration (dev, QA, prod)
- Environment parameter file structure
- AWS Secrets Manager integration for sensitive configuration
- Cost control guardrails (budget alerts, resource tagging)
- Dev environment auto-deployment pipeline
- QA and Prod deployment pipeline scaffolding
- Infrastructure documentation and deployment guides
- CDK context and environment variable handling

---

## Out of Scope

Explicitly list what this sprint will _not_ attempt to do.

- Actual QA or Production environment deployments (scaffolded only)
- Domain name and Route 53 configuration (future enhancement)
- WAF (Web Application Firewall) rules (deferred to security hardening)
- Multi-region deployment (single region for v1)
- Database backup and disaster recovery automation (manual for v1)
- Custom CloudFront SSL certificates (using CloudFront default for now)
- CI/CD pipeline automation (Sprint 3)
- Monitoring and alerting beyond cost alerts (Sprint 3+)

> This section exists to prevent scope creep and over-eager AI assistance.

---

## System Context & Assumptions

Describe the system-level truths and constraints that apply during this sprint.

- **Dependency on Sprint 1:** Cognito User Pool and API Gateway with authentication already exist
- **Single-table design:** DynamoDB will use one table with composite keys for all entity types
- **Per-user isolation:** All data partitioned by Cognito `sub` claim
- **Serverless-first:** No EC2, no containers - Lambda, API Gateway, S3, CloudFront, DynamoDB only
- **Cost-consciousness:** On-demand billing for DynamoDB, CloudFront free tier usage
- **Region strategy:** Single region deployment (us-east-1 default, parameterized)
- **Environment separation:** Separate stacks per environment, no resource sharing
- **CDK version:** Using AWS CDK v2 with TypeScript
- **Frontend deployment:** Static React build hosted on S3/CloudFront
- **No custom domain yet:** Using CloudFront default domain and API Gateway default URLs

---

## Functional Requirements

Describe the business-level behaviors the system must support as a result of this sprint.
Each requirement should be independently testable.

### FR-1: DynamoDB Table for User Data

**Description**
Create a DynamoDB table using single-table design to store all user data (tasks, milestones, drivers, etc.) with per-user partitioning based on Cognito `sub`.

**Acceptance Criteria**

- Given a deployed stack, when inspecting AWS resources, then a DynamoDB table exists with the correct naming convention
- Given the table schema, when examining partition and sort keys, then PK is structured as `USER#<sub>` and SK supports multiple entity types
- Given DynamoDB table settings, when checking billing mode, then it uses on-demand capacity (no provisioned throughput)
- Given IAM policies, when Lambda functions are deployed, then they have read/write permissions to the DynamoDB table scoped to authenticated user's partition

---

### FR-2: Frontend Hosting Infrastructure

**Description**
Create S3 bucket and CloudFront distribution to host the React frontend application with proper caching and HTTPS support.

**Acceptance Criteria**

- Given a deployed stack, when inspecting AWS resources, then an S3 bucket exists for frontend hosting
- Given the S3 bucket, when checking configuration, then it is private (not public) and accessed only via CloudFront
- Given a CloudFront distribution, when accessing the distribution URL, then it serves the frontend with HTTPS
- Given CloudFront caching, when deploying new frontend builds, then cache invalidation can be triggered
- Given error handling, when accessing non-existent routes, then CloudFront returns index.html for client-side routing (SPA support)

---

### FR-3: Environment Parameterization

**Description**
Support multiple environments (dev, QA, prod) with environment-specific configuration and resource naming.

**Acceptance Criteria**

- Given environment configuration files, when deploying, then each environment uses its own parameter set (region, domain prefix, table names)
- Given a dev deployment, when inspecting resources, then all resources are tagged with `environment: dev`
- Given separate environments, when deploying QA or prod, then resources are isolated (no cross-environment resource sharing)
- Given CDK stack naming, when deploying to different environments, then stack names include environment identifier (e.g., `TimeManagement-dev`, `TimeManagement-qa`)

---

### FR-4: Secrets Management

**Description**
Integrate AWS Secrets Manager for storing and retrieving sensitive configuration values that should not be in code or environment files.

**Acceptance Criteria**

- Given sensitive configuration (API keys, client secrets), when deploying infrastructure, then secrets are stored in AWS Secrets Manager, not in code
- Given Lambda functions, when they need secrets, then they retrieve values from Secrets Manager at runtime
- Given IAM policies, when examining Lambda roles, then they have least-privilege access to specific secrets only
- Given environment separation, when deploying to different environments, then each environment uses its own set of secrets

---

### FR-5: Cost Control Guardrails

**Description**
Implement cost monitoring and controls to prevent unexpected AWS billing.

**Acceptance Criteria**

- Given all deployed resources, when inspecting tags, then every resource has required tags: `project-name`, `environment`, `managed-by: cdk`
- Given AWS Budgets, when monthly spend exceeds threshold, then budget alerts are triggered (scaffolded, not necessarily implemented)
- Given resource configuration, when reviewing settings, then cost-optimized defaults are used (on-demand DynamoDB, CloudFront free tier alignment)

---

### FR-6: Infrastructure Reproducibility

**Description**
Infrastructure can be deployed from scratch using only code and configuration files, with no manual AWS Console steps required.

**Acceptance Criteria**

- Given a fresh AWS account, when running CDK bootstrap and deploy, then the entire infrastructure is created without manual intervention
- Given infrastructure documentation, when following deployment steps, then any developer can deploy to a new environment
- Given CDK code, when running `cdk synth`, then CloudFormation templates are deterministic and version-controllable
- Given infrastructure destruction, when running `cdk destroy`, then all resources are cleanly removed (except bootstrapped CDK resources)

---

## Non-Functional Requirements

List only the non-functional requirements that are relevant _for this sprint_.

### Security

- All S3 buckets must block public access
- CloudFront must enforce HTTPS (redirect HTTP to HTTPS)
- DynamoDB encryption at rest enabled by default
- Secrets Manager must use AWS-managed encryption keys
- IAM policies must follow least-privilege principle (no wildcard actions on resources)
- Lambda functions must not have overly permissive IAM roles

### Performance

- CloudFront edge caching enabled for static assets
- DynamoDB on-demand mode for unpredictable workloads
- Lambda environment variables cached (no Secrets Manager call on every invocation)
- Frontend build optimized with gzip/brotli compression

### Reliability & Error Handling

- DynamoDB point-in-time recovery (PITR) enabled for production environment
- CloudFront configured with custom error pages for 404/500 errors
- CDK deployment should handle failures gracefully (rollback on error)
- Stack outputs must include all necessary resource identifiers for troubleshooting

### Developer Experience

- Environment switching via simple parameter (e.g., `ENVIRONMENT=qa cdk deploy`)
- Clear documentation for adding new environments
- CDK constructs organized for reusability
- Deployment time under 5 minutes for incremental changes
- Stack outputs formatted for easy copy-paste into frontend .env files

---

## Data & State Changes

Describe any changes to persisted data or system state.

- **New DynamoDB Table:** Single table for all application data
  - Table name: `${StackName}-data`
  - Partition key (PK): String - Format: `USER#<cognito-sub>` or `USER#<sub>#TASK#<id>`
  - Sort key (SK): String - Format: `TASK#<timestamp>` or `MILESTONE#<id>` or `DRIVER#<id>`
  - Attributes: Flexible schema, entity-specific attributes
  - Billing mode: PAY_PER_REQUEST (on-demand)
  - Encryption: AWS-managed keys
  - Point-in-time recovery: Enabled for prod only

- **S3 Bucket for Frontend:** Stores built React application
  - Bucket name: `${StackName}-frontend-${accountId}-${region}`
  - Versioning: Enabled
  - Public access: Blocked
  - Lifecycle: Delete old versions after 30 days

- **Secrets in AWS Secrets Manager:**
  - Secret name pattern: `${StackName}/<secret-key>`
  - Rotation: Manual for v1 (automated rotation in future)

> Do not include implementation code here—describe intent.

---

## API & Integration Touchpoints

Include this section only if APIs or integrations are affected.

- **Lambda Environment Variables:** Updated to include DynamoDB table name and region
- **Lambda IAM Roles:** Updated to include DynamoDB read/write permissions
- **API Gateway Outputs:** Updated to export API URL for frontend configuration
- **CloudFront Distribution:** Points to S3 bucket origin for static assets
- **Frontend Environment Variables:** Updated to include CloudFront URL and API URL from stack outputs

---

## Testing Strategy

Describe how correctness will be validated for this sprint.

- **Unit tests:**
  - DynamoDB construct creates table with correct schema
  - CloudFront construct configures proper caching behaviors
  - Environment configuration loading works correctly
  - Secret retrieval logic functions as expected

- **Integration tests:**
  - Deploy full stack to dev environment
  - Verify DynamoDB table exists and is accessible
  - Upload frontend build to S3 and access via CloudFront
  - Verify Lambda can read/write to DynamoDB
  - Verify secrets can be retrieved from Secrets Manager

- **Manual testing:**
  - Deploy to dev using `cdk deploy`
  - Verify all stack outputs are present
  - Test frontend access via CloudFront URL
  - Verify API Gateway URL works with authentication
  - Test resource tagging is applied correctly

- **Edge cases:**
  - Deploy to completely fresh AWS account
  - Deploy same stack to multiple environments simultaneously
  - Handle deployment failures and rollback scenarios
  - Verify stack destruction removes all resources properly

---

## Observability & Diagnostics

If relevant, describe expectations for visibility into system behavior.

- **Logging:**
  - CDK deployment logs captured in CloudFormation events
  - DynamoDB table metrics available in CloudWatch
  - CloudFront access logs (optional, can be enabled later)

- **Metrics:**
  - DynamoDB read/write capacity units consumed
  - CloudFront request count and data transfer
  - Lambda execution count and duration (already available from Sprint 1)

- **Tagging:**
  - All resources tagged with: `project-name`, `environment`, `managed-by: cdk`
  - Tags enable cost allocation reports and resource grouping

---

## Open Questions & Decisions

Capture known uncertainties without blocking progress.

- **Decision:** Use CloudFront default domain or custom domain?
  - **Resolution:** Use CloudFront default for Sprint 2; custom domain can be added in future sprint
  
- **Decision:** Enable DynamoDB point-in-time recovery for all environments?
  - **Resolution:** Enable for prod only to reduce costs; dev/QA can be recreated

- **Decision:** Use separate AWS accounts per environment or separate stacks in same account?
  - **Resolution:** Use separate stacks in same account for Sprint 2; separate accounts is best practice but adds complexity

- **Question:** Should we implement DynamoDB backup automation?
  - **Owner:** Infrastructure review in Sprint 12
  - **Target timing:** Before production launch

- **Question:** What should the dev deployment pipeline trigger be?
  - **Owner:** Sprint 3 (CI/CD focus)
  - **Target timing:** Sprint 3 implementation

---

## Exit Criteria

Restate the conditions under which this sprint is considered complete.

- ✅ DynamoDB table deployed with single-table design and per-user partitioning
- ✅ S3 bucket and CloudFront distribution created for frontend hosting
- ✅ Frontend React build can be deployed to S3 and accessed via CloudFront HTTPS URL
- ✅ Lambda functions have IAM permissions to read/write DynamoDB scoped to authenticated user
- ✅ Environment configuration supports dev, QA, and prod with parameterized settings
- ✅ All resources properly tagged with environment, project-name, and managed-by tags
- ✅ Dev environment deploys automatically (or can be deployed with single command)
- ✅ Infrastructure is fully reproducible from code (no manual AWS Console steps required)
- ✅ CDK synth generates valid CloudFormation templates for all environments
- ✅ Documentation updated with deployment instructions for all environments
- ✅ Stack outputs include all necessary values for frontend configuration
- ✅ Secrets Manager integration tested and working for sensitive configuration

> If all exit criteria are met, the sprint is done.

---

## Notes

- Sprint 2 establishes the infrastructure foundation for all future application features
- DynamoDB single-table design chosen for simplicity and cost efficiency in early stages
- Multi-environment support is critical before building features to ensure dev/prod parity
- CloudFront distribution enables global edge caching and HTTPS by default
- Cost controls are implemented proactively to prevent billing surprises
- This sprint does NOT include actual CI/CD automation - that's Sprint 3
- Frontend deployment is manual for Sprint 2 (upload build to S3) - Sprint 3 automates this
- Consider migrating to separate AWS accounts per environment in future for stronger isolation
- DynamoDB access patterns should be designed in Sprint 4 when domain model is implemented
