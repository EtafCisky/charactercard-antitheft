# Dependency Security Guide

This document outlines the dependency security practices and tools used in the Character Card Anti-Theft Server project.

## Table of Contents

- [Overview](#overview)
- [Version Locking](#version-locking)
- [Security Auditing](#security-auditing)
- [Automated Updates](#automated-updates)
- [Manual Verification](#manual-verification)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Overview

The project implements multiple layers of dependency security:

1. **Version Locking** - Exact version specifications for reproducible builds
2. **Security Auditing** - Regular vulnerability scanning with npm audit
3. **Automated Updates** - Dependabot for automatic dependency updates
4. **Manual Verification** - Scripts to verify dependency integrity

## Version Locking

### Why Version Locking?

Version locking ensures that:
- Builds are reproducible across different environments
- Unexpected breaking changes don't affect production
- Security vulnerabilities can be tracked and addressed systematically

### Implementation

#### 1. `.npmrc` Configuration

The project uses `.npmrc` to enforce exact version specifications:

```ini
# Save exact versions (no ^ or ~ prefixes)
save-exact=true

# Use package-lock.json for reproducible builds
package-lock=true

# Engine strict - enforce Node.js version
engine-strict=true
```

#### 2. `package-lock.json`

**IMPORTANT**: Always commit `package-lock.json` to version control.

```bash
# Install dependencies (generates/updates package-lock.json)
npm install

# Install from package-lock.json (CI/CD)
npm ci
```

#### 3. Exact Versions in `package.json`

Dependencies should use exact versions without range operators:

```json
{
  "dependencies": {
    "express": "5.2.1",      // ✅ Good - exact version
    "bcrypt": "^6.0.0"       // ❌ Bad - allows minor updates
  }
}
```

To convert existing dependencies to exact versions:

```bash
# Set npm to save exact versions
npm config set save-exact true

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

## Security Auditing

### npm audit

The project includes several npm audit commands:

```bash
# Run security audit (fails on moderate+ vulnerabilities)
npm run audit

# Automatically fix vulnerabilities
npm run audit:fix

# Generate JSON report
npm run audit:report
```

### Audit Levels

- **low**: Informational, no action required
- **moderate**: Should be fixed soon
- **high**: Should be fixed immediately
- **critical**: Must be fixed immediately

### Automated Auditing

#### GitHub Actions Workflow

The project includes a weekly security audit workflow (`.github/workflows/security-audit.yml`):

- Runs on push to main/master
- Runs on pull requests
- Runs weekly on Monday at 9:00 AM UTC
- Can be triggered manually

```yaml
# Trigger manual audit
gh workflow run security-audit.yml
```

#### Audit Reports

Audit reports are automatically uploaded as artifacts and retained for 30 days.

To download a report:

```bash
# List workflow runs
gh run list --workflow=security-audit.yml

# Download artifacts from a specific run
gh run download <run-id>
```

## Automated Updates

### Dependabot Configuration

Dependabot is configured to automatically create pull requests for dependency updates.

#### Configuration (`.github/dependabot.yml`)

```yaml
updates:
  - package-ecosystem: "npm"
    directory: "/anti-theft-server"
    schedule:
      interval: "weekly"
      day: "monday"
    open-pull-requests-limit: 10
```

#### Update Strategy

- **Patch updates** (1.0.0 → 1.0.1): Auto-approved and merged for dev dependencies
- **Minor updates** (1.0.0 → 1.1.0): Auto-approved and merged for dev dependencies
- **Major updates** (1.0.0 → 2.0.0): Requires manual review

#### Auto-Merge Workflow

The project includes an auto-merge workflow (`.github/workflows/dependabot-auto-merge.yml`) that:

1. Runs tests on Dependabot PRs
2. Runs security audit
3. Auto-approves safe updates (patch/minor for dev dependencies)
4. Enables auto-merge for approved PRs
5. Comments on major updates requiring manual review

### Managing Dependabot

```bash
# View Dependabot PRs
gh pr list --author "dependabot[bot]"

# Approve a Dependabot PR
gh pr review <pr-number> --approve

# Merge a Dependabot PR
gh pr merge <pr-number> --squash

# Close a Dependabot PR (will be recreated next week)
gh pr close <pr-number>
```

## Manual Verification

### Dependency Verification Script

Run the comprehensive verification script:

```bash
npm run verify:deps
```

This script checks:

1. ✅ `package.json` exists and is valid
2. ✅ `package-lock.json` exists and is valid
3. ✅ All dependencies use exact versions
4. ✅ Node.js version meets requirements
5. ✅ `package-lock.json` is in sync with `package.json`
6. ✅ No security vulnerabilities (moderate+)

### Pre-Deployment Checklist

Before deploying to production:

```bash
# 1. Verify dependencies
npm run verify:deps

# 2. Run tests
npm test

# 3. Check for outdated dependencies
npm outdated

# 4. Review security audit
npm audit

# 5. Verify environment configuration
npm run validate:env
```

## Best Practices

### For Developers

1. **Always use `npm ci` in CI/CD pipelines**
   ```bash
   # CI/CD
   npm ci
   
   # Local development
   npm install
   ```

2. **Review dependency updates carefully**
   - Check changelogs for breaking changes
   - Test thoroughly before merging
   - Pay special attention to major version updates

3. **Keep dependencies up to date**
   ```bash
   # Check for outdated dependencies
   npm outdated
   
   # Update a specific dependency
   npm install <package>@<version> --save-exact
   ```

4. **Avoid installing unnecessary dependencies**
   - Review dependencies before adding
   - Remove unused dependencies regularly
   - Prefer well-maintained packages

5. **Use exact versions for production dependencies**
   ```bash
   # Install with exact version
   npm install express@5.2.1 --save-exact
   ```

### For Security

1. **Never ignore security warnings**
   - Address vulnerabilities promptly
   - Understand the impact before applying fixes
   - Test after applying security updates

2. **Monitor security advisories**
   - Subscribe to GitHub security advisories
   - Follow npm security blog
   - Join security mailing lists

3. **Use security tools**
   ```bash
   # npm audit
   npm audit
   
   # Snyk (optional)
   npx snyk test
   
   # OWASP Dependency Check (optional)
   npx dependency-check
   ```

4. **Implement defense in depth**
   - Use multiple security layers
   - Don't rely solely on automated tools
   - Conduct regular security reviews

### For Production

1. **Lock down production dependencies**
   - Use exact versions
   - Commit `package-lock.json`
   - Use `npm ci` for installations

2. **Implement change control**
   - Review all dependency updates
   - Test in staging before production
   - Have rollback procedures

3. **Monitor production dependencies**
   - Set up alerts for security advisories
   - Regular security audits
   - Track dependency versions

## Troubleshooting

### Common Issues

#### Issue: `package-lock.json` is out of sync

**Symptoms:**
```
npm ERR! code EINTEGRITY
npm ERR! Verification failed while extracting...
```

**Solution:**
```bash
# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall dependencies
npm install
```

#### Issue: Conflicting dependency versions

**Symptoms:**
```
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Solution:**
```bash
# Check for conflicts
npm ls

# Update conflicting dependencies
npm update <package>

# Or use legacy peer deps (not recommended)
npm install --legacy-peer-deps
```

#### Issue: Security vulnerabilities cannot be fixed

**Symptoms:**
```
npm audit fix
# Some vulnerabilities require manual review
```

**Solution:**
1. Check if the vulnerability affects your usage
2. Look for alternative packages
3. Wait for upstream fix
4. Consider forking and patching (last resort)

#### Issue: Dependabot PRs failing tests

**Symptoms:**
- Dependabot PR created
- Tests fail in CI

**Solution:**
1. Review the changelog for breaking changes
2. Update code to accommodate changes
3. Push fixes to the Dependabot branch:
   ```bash
   gh pr checkout <pr-number>
   # Make fixes
   git commit -am "fix: update for dependency changes"
   git push
   ```

### Getting Help

If you encounter issues:

1. Check the [npm documentation](https://docs.npmjs.com/)
2. Search [GitHub issues](https://github.com/npm/cli/issues)
3. Ask in the project's issue tracker
4. Consult the team's security contact

## Additional Resources

- [npm Security Best Practices](https://docs.npmjs.com/security-best-practices)
- [GitHub Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [OWASP Dependency Check](https://owasp.org/www-project-dependency-check/)
- [Snyk Vulnerability Database](https://snyk.io/vuln/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

## Maintenance Schedule

| Task                  | Frequency          | Responsibility   |
| --------------------- | ------------------ | ---------------- |
| Review Dependabot PRs | Weekly             | Development Team |
| Run security audit    | Weekly (automated) | CI/CD            |
| Update dependencies   | Monthly            | Development Team |
| Security review       | Quarterly          | Security Team    |
| Dependency cleanup    | Quarterly          | Development Team |

---

**Last Updated:** 2024-01-20  
**Maintained By:** Development Team
