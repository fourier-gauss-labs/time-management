# Git Workflow Standards

This document defines version control practices, branching strategy, and collaboration workflows for the time-management platform.

## Core Principles

1. **Commit often** - Small, atomic commits are easier to review and revert
2. **Clear messages** - Commit messages should explain why, not what
3. **Review everything** - All code goes through pull request review
4. **Keep main stable** - Main branch should always be deployable
5. **Branch from latest** - Always branch from up-to-date main/develop
6. **Clean history** - Use rebase to maintain linear history
7. **No secrets** - Never commit credentials or sensitive data
8. **Sign commits** - Use GPG signing for verified commits (recommended)

## Branching Strategy

### Branch Types

We use a simplified Git Flow with these branch types:

```
main              → Production-ready code (protected)
develop           → Integration branch (protected)
feature/*         → New features
fix/*             → Bug fixes
hotfix/*          → Urgent production fixes
chore/*           → Maintenance tasks (deps, docs, etc.)
```

### Branch Naming Convention

**Pattern:** `<type>/<ticket-number>-<short-description>`

**✅ Good:**

```bash
feature/TM-123-add-task-filtering
fix/TM-456-date-picker-bug
hotfix/TM-789-security-patch
chore/TM-012-update-dependencies
```

**❌ Avoid:**

```bash
new-feature          # No type or ticket
fix                  # Not descriptive
johns-branch         # Not task-oriented
```

### Branch Lifecycle

```bash
# 1. Create feature branch from develop
git checkout develop
git pull origin develop
git checkout -b feature/TM-123-add-task-filtering

# 2. Work on feature
git add .
git commit -m "feat: add task filtering by priority"

# 3. Keep branch updated (rebase)
git fetch origin
git rebase origin/develop

# 4. Push to remote
git push origin feature/TM-123-add-task-filtering

# 5. Create pull request (via GitHub UI)

# 6. After PR approval and merge, delete branch
git checkout develop
git pull origin develop
git branch -d feature/TM-123-add-task-filtering
```

## Commit Message Format

### Conventional Commits

Use the [Conventional Commits](https://www.conventionalcommits.org/) specification:

**Format:**

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Commit Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, no logic change)
- `refactor` - Code refactoring (no feature change)
- `perf` - Performance improvements
- `test` - Adding or updating tests
- `chore` - Maintenance tasks, dependency updates
- `ci` - CI/CD configuration changes
- `build` - Build system changes

### Commit Scope (Optional)

Indicates the area of the codebase:

- `api` - Backend API changes
- `web` - Frontend changes
- `db` - Database changes
- `auth` - Authentication/authorization
- `infra` - Infrastructure/CDK changes
- `shared` - Shared package changes

### Examples

**✅ Good commit messages:**

```bash
# Simple feature
git commit -m "feat(api): add task filtering endpoint"

# Bug fix with description
git commit -m "fix(web): correct date picker timezone handling

The date picker was not accounting for user timezone, causing
tasks to be created with incorrect due dates. Now using user's
local timezone for date selection.

Fixes #456"

# Breaking change
git commit -m "feat(api): change task API response format

BREAKING CHANGE: Task API now returns ISO 8601 dates instead
of Unix timestamps. Update all clients accordingly."

# Chore
git commit -m "chore(deps): update aws-cdk to v2.100.0"

# Documentation
git commit -m "docs(readme): add deployment instructions"
```

**❌ Avoid:**

```bash
git commit -m "fixed bug"                    # Not descriptive
git commit -m "WIP"                          # Work in progress
git commit -m "Updated files"                # Too vague
git commit -m "asdfasdf"                     # Not meaningful
git commit -m "Fixed the thing John mentioned" # No context
```

## Pull Request Process

### Creating a Pull Request

**PR Title:** Should match commit message format

```
feat(api): add task filtering endpoint
fix(web): correct date picker timezone handling
```

**PR Description Template:**

```markdown
## Description

Brief description of what this PR does and why.

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Related Issue

Fixes #123
Relates to #456

## Changes Made

- Added task filtering by priority
- Updated API documentation
- Added unit tests for filtering logic

## Testing

- [ ] Unit tests pass locally
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] No console errors or warnings

## Screenshots (if applicable)

[Add screenshots here]

## Checklist

- [ ] My code follows the project's coding standards
- [ ] I have performed a self-review of my code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have updated the documentation accordingly
- [ ] My changes generate no new warnings
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes
```

### PR Review Guidelines

**As a PR author:**

- Keep PRs small (< 400 lines of code changes)
- Provide clear description and context
- Self-review before requesting review
- Respond to feedback promptly
- Keep PR up-to-date with base branch

**As a reviewer:**

- Review within 24 hours
- Be constructive and respectful
- Ask questions, don't demand changes
- Approve only if you would deploy this code
- Check for:
  - Code correctness and logic
  - Adherence to standards
  - Test coverage
  - Security implications
  - Performance considerations

### Review Checklist

```markdown
- [ ] Code is clear and maintainable
- [ ] Follows TypeScript/React standards
- [ ] Adequate test coverage (80%+)
- [ ] No security vulnerabilities
- [ ] No performance regressions
- [ ] Documentation updated if needed
- [ ] No TODO comments without tickets
- [ ] No console.log or debugging code
- [ ] Error handling is appropriate
- [ ] TypeScript types are specific (no `any`)
```

### Merge Requirements

Before merging, ensure:

- [ ] All CI checks pass (lint, tests, build)
- [ ] At least 1 approval from code owner
- [ ] All conversations resolved
- [ ] Branch is up-to-date with base branch
- [ ] No merge conflicts

### Merge Strategy

**Use Squash and Merge** for feature branches:

```bash
# GitHub will automatically squash all commits into one
# Ensures clean, linear history on main/develop
```

**Benefits:**

- Clean commit history
- Each PR = one commit on main
- Easy to revert entire features

**Don't use:**

- ❌ Merge commit (creates merge bubbles)
- ❌ Rebase and merge (loses PR association)

## Protected Branches

### Main Branch Protection

Settings for `main` branch:

- ✅ Require pull request before merging
- ✅ Require 1 approval
- ✅ Require status checks to pass
  - Lint & Type Check
  - Unit Tests
  - Build
  - Security Scan
- ✅ Require branches to be up to date
- ✅ Require conversation resolution
- ✅ Do not allow bypassing settings
- ✅ Restrict pushes (no direct commits)
- ✅ Require signed commits (recommended)

### Develop Branch Protection

Settings for `develop` branch:

- ✅ Require pull request before merging
- ✅ Require status checks to pass
- ✅ Require branches to be up to date
- ✅ Restrict pushes

## Handling Common Scenarios

### Syncing Feature Branch with Develop

**Use rebase to keep feature branch updated:**

```bash
# While on feature branch
git fetch origin
git rebase origin/develop

# If conflicts occur
# 1. Resolve conflicts in files
# 2. Stage resolved files
git add .
# 3. Continue rebase
git rebase --continue

# Force push to update remote feature branch
git push --force-with-lease origin feature/TM-123-add-task-filtering
```

### Hotfix for Production

**Urgent fix to production:**

```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/TM-789-security-patch

# 2. Make the fix
git add .
git commit -m "fix: patch security vulnerability in auth"

# 3. Create PR to main (expedited review)
git push origin hotfix/TM-789-security-patch

# 4. After merge to main, also merge to develop
git checkout develop
git pull origin develop
git merge main
git push origin develop
```

### Undoing Commits

**Undo last commit (before push):**

```bash
# Keep changes staged
git reset --soft HEAD~1

# Discard changes
git reset --hard HEAD~1
```

**Undo pushed commit:**

```bash
# Create a new commit that undoes changes
git revert <commit-hash>
git push origin <branch>
```

### Cherry-Pick Commit

**Apply specific commit to another branch:**

```bash
git checkout target-branch
git cherry-pick <commit-hash>
git push origin target-branch
```

## Git Configuration

### Required Configuration

```bash
# Set your identity
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Set default branch name
git config --global init.defaultBranch main

# Use rebase for pulls
git config --global pull.rebase true

# Use SSH for GitHub
git config --global url."git@github.com:".insteadOf "https://github.com/"

# Enable auto-correct
git config --global help.autocorrect 1

# Colorful output
git config --global color.ui auto
```

### Recommended Aliases

```bash
# Status shorthand
git config --global alias.st status

# Prettier log
git config --global alias.lg "log --graph --pretty=format:'%Cred%h%Creset -%C(yellow)%d%Creset %s %Cgreen(%cr) %C(bold blue)<%an>%Creset' --abbrev-commit"

# Amend last commit
git config --global alias.amend "commit --amend --no-edit"

# Undo last commit
git config --global alias.undo "reset --soft HEAD~1"

# Show changed files
git config --global alias.changed "diff --name-only"
```

### GPG Commit Signing (Recommended)

```bash
# Generate GPG key
gpg --full-generate-key

# List keys
gpg --list-secret-keys --keyid-format=long

# Add to GitHub (copy public key)
gpg --armor --export <KEY_ID>

# Configure git
git config --global user.signingkey <KEY_ID>
git config --global commit.gpgsign true
```

## .gitignore Best Practices

**Project .gitignore:**

```gitignore
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
*.lcov
.nyc_output/

# Build outputs
dist/
build/
*.tsbuildinfo
.vite/
cdk.out/

# Environment variables
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log
npm-debug.log*
pnpm-debug.log*

# Temporary files
tmp/
temp/
*.tmp

# AWS
.aws-sam/

# Secrets (double-check!)
*.pem
*.key
secrets.json
credentials.json
```

## Commit Hooks

### Pre-commit Hook (Husky)

**Setup:**

```bash
pnpm add -D husky lint-staged

# Initialize husky
pnpm exec husky init
```

**Configure:**

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

```bash
# .husky/pre-commit
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm lint-staged
```

### Commit-msg Hook

**Enforce conventional commits:**

```bash
# .husky/commit-msg
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm exec commitlint --edit $1
```

```javascript
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'chore', 'ci', 'build'],
    ],
    'subject-case': [2, 'never', ['upper-case']],
  },
};
```

## Release Management

### Semantic Versioning

Use [Semantic Versioning](https://semver.org/):

```
MAJOR.MINOR.PATCH

1.0.0 → Initial release
1.0.1 → Bug fix (patch)
1.1.0 → New feature (minor)
2.0.0 → Breaking change (major)
```

### Creating a Release

```bash
# 1. Update version
pnpm version patch  # or minor, major

# 2. Create git tag
git tag -a v1.0.1 -m "Release v1.0.1"
git push origin v1.0.1

# 3. Create GitHub release (via UI or CLI)
gh release create v1.0.1 --title "v1.0.1" --notes "Bug fixes"
```

## Emergency Procedures

### Reverting a Bad Deployment

**If main branch has bad commit:**

```bash
# 1. Identify bad commit
git log --oneline

# 2. Revert the commit
git revert <bad-commit-hash>

# 3. Create PR with revert
git push origin revert-bad-change

# 4. Fast-track review and merge

# This triggers CI/CD and deploys the fix
```

### Force Push Guidelines

**⚠️ Only force push to:**

- Your own feature branches
- After rebasing to update with develop

**❌ NEVER force push to:**

- `main` branch
- `develop` branch
- Someone else's branch
- After PR is approved (before merge)

**Safe force push:**

```bash
# Use --force-with-lease (safer than --force)
git push --force-with-lease origin feature/TM-123
```

## Collaboration Best Practices

### Daily Workflow

```bash
# Morning: Update your branches
git checkout develop
git pull origin develop

# Start work on feature
git checkout -b feature/TM-123-new-feature

# Throughout the day: Commit often
git add .
git commit -m "feat: add component structure"

# End of day: Push your work
git push origin feature/TM-123-new-feature
```

### Team Communication

- 💬 Use PR comments for code-related discussion
- 📝 Link PRs to issues/tickets
- 🏷️ Use labels (bug, feature, needs-review, etc.)
- 👀 Request specific reviewers when needed
- ✅ Mark conversations as resolved when addressed

## Git Workflow Checklist

- [ ] Feature branch created from up-to-date develop
- [ ] Commits follow conventional commit format
- [ ] Branch name follows naming convention
- [ ] Code is self-reviewed before PR
- [ ] PR description is complete
- [ ] All CI checks pass
- [ ] At least 1 approval received
- [ ] Branch is up-to-date with base
- [ ] All conversations resolved
- [ ] Squash and merge used
- [ ] Feature branch deleted after merge
- [ ] No secrets or credentials committed
