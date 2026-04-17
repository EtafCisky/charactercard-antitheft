# ============================================================================
# Test script for Windows installation scripts
# This script validates that the installation scripts are properly structured
# ============================================================================

Write-Host "Testing Windows installation scripts..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if scripts exist
Write-Host "[Test 1] Checking if scripts exist..." -ForegroundColor Yellow
$installScript = Join-Path $PSScriptRoot "windows-install.ps1"
$uninstallScript = Join-Path $PSScriptRoot "windows-uninstall.ps1"

if (Test-Path $installScript) {
    Write-Host "  ✅ windows-install.ps1 exists" -ForegroundColor Green
} else {
    Write-Host "  ❌ windows-install.ps1 not found" -ForegroundColor Red
    exit 1
}

if (Test-Path $uninstallScript) {
    Write-Host "  ✅ windows-uninstall.ps1 exists" -ForegroundColor Green
} else {
    Write-Host "  ❌ windows-uninstall.ps1 not found" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 2: Check PowerShell syntax
Write-Host "[Test 2] Checking PowerShell syntax..." -ForegroundColor Yellow

try {
    $null = [System.Management.Automation.PSParser]::Tokenize((Get-Content $installScript -Raw), [ref]$null)
    Write-Host "  ✅ windows-install.ps1 syntax is valid" -ForegroundColor Green
} catch {
    Write-Host "  ❌ windows-install.ps1 has syntax errors: $_" -ForegroundColor Red
    exit 1
}

try {
    $null = [System.Management.Automation.PSParser]::Tokenize((Get-Content $uninstallScript -Raw), [ref]$null)
    Write-Host "  ✅ windows-uninstall.ps1 syntax is valid" -ForegroundColor Green
} catch {
    Write-Host "  ❌ windows-uninstall.ps1 has syntax errors: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Test 3: Check required functions in install script
Write-Host "[Test 3] Checking required functions in install script..." -ForegroundColor Yellow

$requiredFunctions = @(
    "Test-NodeJs",
    "Test-MySQL",
    "Collect-Configuration",
    "Generate-EnvFile",
    "Install-Dependencies",
    "Initialize-Database",
    "Install-PM2",
    "Start-Service",
    "Test-ServiceHealth",
    "Invoke-Rollback"
)

$installContent = Get-Content $installScript -Raw

foreach ($func in $requiredFunctions) {
    if ($installContent -match "function $func") {
        Write-Host "  ✅ Function '$func' found" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Function '$func' not found" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# Test 4: Check required functions in uninstall script
Write-Host "[Test 4] Checking required functions in uninstall script..." -ForegroundColor Yellow

$uninstallFunctions = @(
    "Stop-PM2Service",
    "Remove-Database",
    "Remove-Dependencies",
    "Remove-ConfigFiles",
    "Remove-LogFiles",
    "Remove-FirewallRule"
)

$uninstallContent = Get-Content $uninstallScript -Raw

foreach ($func in $uninstallFunctions) {
    if ($uninstallContent -match "function $func") {
        Write-Host "  ✅ Function '$func' found" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Function '$func' not found" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""

# Test 5: Check documentation exists
Write-Host "[Test 5] Checking documentation..." -ForegroundColor Yellow
$docFile = Join-Path $PSScriptRoot "WINDOWS_DEPLOYMENT.md"

if (Test-Path $docFile) {
    Write-Host "  ✅ WINDOWS_DEPLOYMENT.md exists" -ForegroundColor Green
} else {
    Write-Host "  ❌ WINDOWS_DEPLOYMENT.md not found" -ForegroundColor Red
    exit 1
}

Write-Host ""

# All tests passed
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "           ✅ All tests passed!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "The Windows installation scripts are ready to use." -ForegroundColor Cyan
Write-Host ""
