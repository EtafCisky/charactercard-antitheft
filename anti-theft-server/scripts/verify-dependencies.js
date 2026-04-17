#!/usr/bin/env node

/**
 * Dependency Verification Script
 *
 * This script verifies that:
 * 1. package-lock.json exists and is in sync with package.json
 * 2. No dependencies have known security vulnerabilities
 * 3. All dependencies are using exact versions (no ^ or ~)
 * 4. Node.js version meets requirements
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// ANSI color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ERROR: ${message}`, "red");
}

function success(message) {
  log(`✅ ${message}`, "green");
}

function warning(message) {
  log(`⚠️  WARNING: ${message}`, "yellow");
}

function info(message) {
  log(`ℹ️  ${message}`, "cyan");
}

// Check if package.json exists
function checkPackageJson() {
  info("Checking package.json...");

  const packageJsonPath = path.join(__dirname, "..", "package.json");

  if (!fs.existsSync(packageJsonPath)) {
    error("package.json not found");
    return false;
  }

  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    success("package.json found and valid");
    return packageJson;
  } catch (err) {
    error(`Failed to parse package.json: ${err.message}`);
    return false;
  }
}

// Check if package-lock.json exists
function checkPackageLock() {
  info("Checking package-lock.json...");

  const lockPath = path.join(__dirname, "..", "package-lock.json");

  if (!fs.existsSync(lockPath)) {
    error('package-lock.json not found. Run "npm install" to generate it.');
    return false;
  }

  try {
    const lockJson = JSON.parse(fs.readFileSync(lockPath, "utf8"));
    success("package-lock.json found and valid");
    return lockJson;
  } catch (err) {
    error(`Failed to parse package-lock.json: ${err.message}`);
    return false;
  }
}

// Check for exact versions in package.json
function checkExactVersions(packageJson) {
  info("Checking for exact version specifications...");

  let hasNonExact = false;
  const nonExactDeps = [];

  const checkDeps = (deps, type) => {
    if (!deps) return;

    for (const [name, version] of Object.entries(deps)) {
      if (
        version.startsWith("^") ||
        version.startsWith("~") ||
        version.startsWith(">") ||
        version.startsWith("<")
      ) {
        hasNonExact = true;
        nonExactDeps.push({ name, version, type });
      }
    }
  };

  checkDeps(packageJson.dependencies, "dependencies");
  checkDeps(packageJson.devDependencies, "devDependencies");

  if (hasNonExact) {
    warning("Found dependencies with non-exact versions:");
    nonExactDeps.forEach(({ name, version, type }) => {
      console.log(`  - ${name}@${version} (${type})`);
    });
    warning("Consider using exact versions for better reproducibility");
    warning("Run: npm config set save-exact true");
    return false;
  }

  success("All dependencies use exact versions");
  return true;
}

// Check Node.js version
function checkNodeVersion(packageJson) {
  info("Checking Node.js version...");

  if (!packageJson.engines || !packageJson.engines.node) {
    warning("No Node.js version specified in package.json engines field");
    return true;
  }

  const requiredVersion = packageJson.engines.node;
  const currentVersion = process.version;

  info(`Required: ${requiredVersion}, Current: ${currentVersion}`);

  // Simple version check (can be enhanced with semver library)
  const requiredMajor = parseInt(requiredVersion.replace(/[^\d]/g, ""));
  const currentMajor = parseInt(currentVersion.replace(/[^\d]/g, ""));

  if (currentMajor < requiredMajor) {
    error(
      `Node.js version ${currentVersion} does not meet requirement ${requiredVersion}`,
    );
    return false;
  }

  success(`Node.js version ${currentVersion} meets requirements`);
  return true;
}

// Run npm audit
function runAudit() {
  info("Running npm audit...");

  try {
    execSync("npm audit --audit-level=moderate", {
      cwd: path.join(__dirname, ".."),
      stdio: "inherit",
    });
    success("No security vulnerabilities found");
    return true;
  } catch (err) {
    error("Security vulnerabilities detected");
    warning('Run "npm audit fix" to attempt automatic fixes');
    return false;
  }
}

// Check if package-lock.json is in sync
function checkLockSync() {
  info("Checking if package-lock.json is in sync...");

  try {
    // This will fail if package-lock.json is out of sync
    execSync("npm ls --depth=0", {
      cwd: path.join(__dirname, ".."),
      stdio: "pipe",
    });
    success("package-lock.json is in sync with package.json");
    return true;
  } catch (err) {
    error("package-lock.json is out of sync with package.json");
    warning('Run "npm install" to update package-lock.json');
    return false;
  }
}

// Main verification function
function main() {
  log("\n=== Dependency Verification ===\n", "blue");

  const packageJson = checkPackageJson();
  if (!packageJson) {
    process.exit(1);
  }

  const packageLock = checkPackageLock();
  if (!packageLock) {
    process.exit(1);
  }

  console.log("");
  const nodeVersionOk = checkNodeVersion(packageJson);

  console.log("");
  const exactVersionsOk = checkExactVersions(packageJson);

  console.log("");
  const lockSyncOk = checkLockSync();

  console.log("");
  const auditOk = runAudit();

  console.log("");
  log("=== Verification Summary ===\n", "blue");

  const allChecks = [
    { name: "Node.js version", passed: nodeVersionOk },
    { name: "Exact versions", passed: exactVersionsOk },
    { name: "Lock file sync", passed: lockSyncOk },
    { name: "Security audit", passed: auditOk },
  ];

  allChecks.forEach(({ name, passed }) => {
    if (passed) {
      success(name);
    } else {
      error(name);
    }
  });

  const allPassed = allChecks.every((check) => check.passed);

  console.log("");
  if (allPassed) {
    log("✨ All dependency checks passed!", "green");
    process.exit(0);
  } else {
    log(
      "❌ Some dependency checks failed. Please review the output above.",
      "red",
    );
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  checkPackageJson,
  checkPackageLock,
  checkExactVersions,
  checkNodeVersion,
};
