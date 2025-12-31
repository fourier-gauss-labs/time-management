# **A Time-Management & Focus Platform**

This is a modern, privacy-respecting **personal time-management application** designed to help users organize tasks, schedule focused work, and integrate with their existing calendars. The project is built from the ground up with best-practice cloud architecture, low-cost serverless infrastructure, strong security, and a clean DX suitable for vibe-coding with Copilot Agents.

This repository contains the **frontend PWA**, **backend serverless API**, **infrastructure-as-code**, and **shared TypeScript packages** that make up the system.

---

## 🚀 **Tech Stack**

### **Frontend**

- **React + Vite** (TypeScript)
- **Progressive Web App (PWA)** via `vite-plugin-pwa`
- **Responsive design** across desktop & mobile
- **Auth integration** with Cognito Hosted UI
- Built for **fast local iteration** and **offline-first capabilities**

### **Backend**

- **AWS Lambda (Node.js 20)**
- **AWS API Gateway HTTP API**
- **TypeScript** handlers deployed as serverless microfunctions
- Built for:
  - Low cost
  - Strong testability
  - Easy local development
  - Zero-maintenance scaling

### **Database**

- **Amazon DynamoDB (On-Demand Mode)**
- Single-table design keyed by Cognito User ID:
  - `PK = USER#<sub>`
  - `SK = TASK#...`, `CALENDAR_EVENT#...`, etc.

- Provides strict **data isolation** per user for privacy and security

### **Identity & Security**

- **Amazon Cognito User Pool**
- OAuth federation planned for:
  - **Google Calendar**
  - **Microsoft Outlook / Office 365**

- Tokens + secrets stored securely using:
  - **AWS Secrets Manager**, **SSM Parameter Store**

- API Gateway protected via **Cognito Authorizer**
- IAM least-privilege for all Lambdas

### **Infrastructure as Code**

- **AWS CDK (TypeScript)**
- Full reproducible cloud architecture, from:
  - Cognito
  - API Gateway
  - Lambda
  - DynamoDB
  - S3 + CloudFront hosting

- Multi-stack, multi-environment deployment

### **CI/CD**

- **GitHub Actions**
  - Linting
  - TypeScript checks
  - Unit tests (Vitest)
  - CDK synth validation

- Environment-specific deploy pipelines:
  - `dev` → auto-deploy from `main`
  - `qa` → deploy from release branch/tag
  - `prod` → manual approval or tagged release

---

## 🔧 **Repository Structure**

```plaintext
time-manager/
  apps/
    web/          # React + Vite + PWA frontend
  services/
    api/          # Lambda functions + domain logic (TS)
  infra/
    cdk/          # AWS CDK stacks and IaC (TS)
  packages/
    shared/       # Shared types, utilities, domain code
  .github/
    workflows/
      ci.yml
      deploy-dev.yml
      deploy-qa.yml
      deploy-prod.yml
  package.json
  tsconfig.base.json
  README.md
```

---

## 🌐 **Environments**

This project supports multiple environments end-to-end:

| Environment    | Purpose                        | Deployment Trigger                      |
| -------------- | ------------------------------ | --------------------------------------- |
| **Local**      | Development on your machine    | `pnpm dev` / `vite dev` / local Lambdas |
| **Dev**        | Hosted development environment | Push to `main`                          |
| **QA**         | Pre-production, stable testing | Release branch or tagged build          |
| **Production** | Live users                     | Approved release/tag                    |

Environment variables are passed through CDK and consumed by both web and API services.

---

## 🧪 **Testing**

This project uses **Vitest** as a unified testing framework across all packages:

- Component tests for React
- Unit tests for Lambda handlers
- Domain logic tests in `packages/shared`
- Future E2E testing with **Playwright**

Tests run in CI on every PR and every push to `main`.

---

## 🔒 **Security**

From day one, This project aligns to modern best practices:

- Cognito-managed authentication & password policy
- Strict IAM permissions for each Lambda
- No client-secret exposure in frontend
- HTTPS enforced via CloudFront
- Optional MFA for production users
- Per-user partitioning at the data layer
- OAuth tokens stored only in secure backend storage

Security improvements and audits will be continuous as the app evolves.

---

## 📅 **Calendar Integrations (Roadmap)**

This project will synchronize with users’ external calendars:

- **Google Calendar (OAuth 2 + Calendar API)**
- **Microsoft Outlook Calendar (OAuth 2 + Graph API)**

This will allow:

- Two-way visibility of tasks ↔ calendar events
- Automated focused-time scheduling
- Conflict detection
- Optional fully automated time-blocking

OAuth tokens will never be stored in the frontend.

---

## 🧭 **Project Goals**

This project is designed to explore and teach modern software engineering practices:

- Serverless microservices architecture
- Zero-maintenance, low-cost cloud deployment
- Multi-environment pipelines
- Secure identity federation
- PWA experience with offline support
- Strong test culture from day one
- Automated IaC with AWS CDK
- Vibe coding with AI copilots and agents

---

## 📦 **Getting Started**

### Prerequisites

- Node.js 20.x LTS
- pnpm 8.x or later
- AWS CLI configured (for deploying infrastructure)

### Quick Start

1. **Clone the repository**

   ```bash
   git clone https://github.com/fourier-gauss-labs/time-management.git
   cd time-management
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Run quality checks**

   ```bash
   pnpm lint
   pnpm type-check
   pnpm format:check
   ```

### Sprint 1: Authentication Setup

Sprint 1 implements authentication with AWS Cognito. To use the application:

1. **Deploy infrastructure to AWS**

   ```bash
   cd infra/cdk
   pnpm run deploy
   ```

   Save the output values (UserPoolId, UserPoolClientId, UserPoolDomain, ApiUrl)

2. **Configure the frontend**

   Create `apps/web/.env` with your deployment values:

   ```bash
   cd apps/web
   cp .env.example .env
   # Edit .env with values from CDK deployment
   ```

3. **Start the development server**

   ```bash
   pnpm --filter @time-management/web dev
   ```

   Open [http://localhost:5173](http://localhost:5173)

For detailed setup and troubleshooting, see [Sprint 1 Development Guide](docs/version%201/sprint-1-dev-guide.md).

### Development Workflow

```bash
# Run all quality checks
pnpm lint          # ESLint
pnpm type-check    # TypeScript
pnpm format        # Prettier auto-fix
pnpm format:check  # Prettier check only

# Test infrastructure changes
pnpm --filter @time-management/infra-cdk run synth

# Deploy infrastructure changes
pnpm --filter @time-management/infra-cdk run deploy
```
