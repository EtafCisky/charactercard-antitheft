# ============================================================================
# Windows 原生卸载脚本
# Character Card Anti-Theft System - Windows Native Uninstallation
# ============================================================================
#
# 功能：
# - 停止并删除 PM2 服务
# - 可选删除数据库
# - 可选删除 node_modules
# - 删除防火墙规则
# - 清理日志文件
#
# 使用方法：
# .\windows-uninstall.ps1
#
# ============================================================================

# 设置错误处理
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# ============================================================================
# 全局变量
# ============================================================================

$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$DEPLOY_ROOT = Split-Path -Parent $SCRIPT_DIR  # character-card-anti-theft-system
$PROJECT_ROOT = Join-Path (Split-Path -Parent $DEPLOY_ROOT) "anti-theft-server"  # 实际项目目录
$ENV_FILE = Join-Path $PROJECT_ROOT ".env"
$LOG_FILE = Join-Path $PROJECT_ROOT "uninstall.log"

# ============================================================================
# 颜色输出函数
# ============================================================================

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White"
    )
    Write-Host $Message -ForegroundColor $Color
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "✅ $Message" "Green"
}

function Write-Error-Message {
    param([string]$Message)
    Write-ColorOutput "❌ $Message" "Red"
}

function Write-Warning-Message {
    param([string]$Message)
    Write-ColorOutput "⚠️  $Message" "Yellow"
}

function Write-Info {
    param([string]$Message)
    Write-ColorOutput "ℹ️  $Message" "Cyan"
}

function Write-Step {
    param(
        [int]$Step,
        [string]$Message
    )
    Write-Host ""
    Write-ColorOutput "═══════════════════════════════════════════════════════════" "Blue"
    Write-ColorOutput "[步骤 $Step] $Message" "Blue"
    Write-ColorOutput "═══════════════════════════════════════════════════════════" "Blue"
}

# ============================================================================
# 日志函数
# ============================================================================

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "$timestamp - $Message" | Out-File -FilePath $LOG_FILE -Append -Encoding UTF8
}

# ============================================================================
# 确认函数
# ============================================================================

function Get-Confirmation {
    param(
        [string]$Message,
        [bool]$DefaultYes = $false
    )
    
    if ($DefaultYes) {
        $prompt = "$Message (Y/n): "
        $default = "Y"
    } else {
        $prompt = "$Message (y/N): "
        $default = "N"
    }
    
    $response = Read-Host $prompt
    
    if ([string]::IsNullOrWhiteSpace($response)) {
        $response = $default
    }
    
    return ($response -eq "Y" -or $response -eq "y")
}

# ============================================================================
# 卸载函数
# ============================================================================

function Stop-PM2Service {
    Write-Step 1 "停止 PM2 服务"
    
    try {
        # 检查 PM2 是否安装
        $pm2Version = pm2 --version 2>$null
        if (-not $pm2Version) {
            Write-Info "PM2 未安装，跳过"
            return $true
        }
        
        Write-Info "正在停止服务..."
        
        # 停止并删除服务
        pm2 delete anti-theft-api 2>$null | Out-Null
        
        # 保存 PM2 进程列表
        pm2 save --force 2>$null | Out-Null
        
        Write-Success "PM2 服务已停止并删除"
        Write-Log "PM2 service stopped and deleted"
        return $true
    } catch {
        Write-Warning-Message "停止 PM2 服务失败: $_"
        Write-Log "Failed to stop PM2 service: $_"
        return $false
    }
}

function Remove-Database {
    Write-Step 2 "删除数据库"
    
    # 读取 .env 文件获取数据库信息
    if (-not (Test-Path $ENV_FILE)) {
        Write-Warning-Message ".env 文件不存在，跳过数据库删除"
        return $true
    }
    
    try {
        # 解析 .env 文件
        $envContent = Get-Content $ENV_FILE
        $dbName = ($envContent | Where-Object { $_ -match "^DB_NAME=" }) -replace "DB_NAME=", ""
        $dbHost = ($envContent | Where-Object { $_ -match "^DB_HOST=" }) -replace "DB_HOST=", ""
        $dbUser = ($envContent | Where-Object { $_ -match "^DB_USER=" }) -replace "DB_USER=", ""
        $dbPassword = ($envContent | Where-Object { $_ -match "^DB_PASSWORD=" }) -replace "DB_PASSWORD=", ""
        
        if ([string]::IsNullOrWhiteSpace($dbName)) {
            Write-Warning-Message "无法从 .env 文件读取数据库名称"
            return $false
        }
        
        Write-Info "数据库名称: $dbName"
        Write-Info "数据库主机: $dbHost"
        
        Write-Host ""
        Write-Warning-Message "此操作将永久删除数据库及其所有数据！"
        $confirm = Get-Confirmation "确定要删除数据库 '$dbName' 吗？" $false
        
        if (-not $confirm) {
            Write-Info "跳过数据库删除"
            return $true
        }
        
        Write-Info "正在删除数据库..."
        
        # 构建 MySQL 命令
        $mysqlCmd = "mysql -h $dbHost -u $dbUser"
        if (-not [string]::IsNullOrWhiteSpace($dbPassword)) {
            $mysqlCmd += " -p$dbPassword"
        }
        $mysqlCmd += " -e `"DROP DATABASE IF EXISTS \``$dbName\``;`""
        
        # 执行删除命令
        Invoke-Expression $mysqlCmd 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "数据库已删除"
            Write-Log "Database '$dbName' deleted"
        } else {
            throw "MySQL 命令执行失败"
        }
        
        return $true
    } catch {
        Write-Error-Message "删除数据库失败: $_"
        Write-Log "Failed to delete database: $_"
        Write-Host ""
        Write-Info "您可以手动删除数据库："
        Write-ColorOutput "  mysql -u root -p -e `"DROP DATABASE IF EXISTS \``$dbName\``;`"" "Cyan"
        Write-Host ""
        return $false
    }
}

function Remove-Dependencies {
    Write-Step 3 "删除 node_modules"
    
    $nodeModulesPath = Join-Path $PROJECT_ROOT "node_modules"
    
    if (-not (Test-Path $nodeModulesPath)) {
        Write-Info "node_modules 不存在，跳过"
        return $true
    }
    
    Write-Host ""
    $confirm = Get-Confirmation "是否删除 node_modules 目录？" $true
    
    if (-not $confirm) {
        Write-Info "跳过 node_modules 删除"
        return $true
    }
    
    try {
        Write-Info "正在删除 node_modules..."
        Write-Warning-Message "这可能需要几分钟时间..."
        
        Remove-Item -Path $nodeModulesPath -Recurse -Force
        
        Write-Success "node_modules 已删除"
        Write-Log "node_modules deleted"
        return $true
    } catch {
        Write-Error-Message "删除 node_modules 失败: $_"
        Write-Log "Failed to delete node_modules: $_"
        return $false
    }
}

function Remove-ConfigFiles {
    Write-Step 4 "删除配置文件"
    
    Write-Host ""
    $confirm = Get-Confirmation "是否删除 .env 配置文件？" $true
    
    if (-not $confirm) {
        Write-Info "跳过 .env 文件删除"
        return $true
    }
    
    try {
        if (Test-Path $ENV_FILE) {
            Remove-Item -Path $ENV_FILE -Force
            Write-Success ".env 文件已删除"
            Write-Log ".env file deleted"
        } else {
            Write-Info ".env 文件不存在"
        }
        return $true
    } catch {
        Write-Error-Message "删除 .env 文件失败: $_"
        Write-Log "Failed to delete .env file: $_"
        return $false
    }
}

function Remove-LogFiles {
    Write-Step 5 "清理日志文件"
    
    $logsPath = Join-Path $PROJECT_ROOT "logs"
    
    if (-not (Test-Path $logsPath)) {
        Write-Info "logs 目录不存在，跳过"
        return $true
    }
    
    Write-Host ""
    $confirm = Get-Confirmation "是否删除日志文件？" $true
    
    if (-not $confirm) {
        Write-Info "跳过日志文件删除"
        return $true
    }
    
    try {
        Write-Info "正在删除日志文件..."
        
        Remove-Item -Path $logsPath -Recurse -Force
        
        Write-Success "日志文件已删除"
        Write-Log "Log files deleted"
        return $true
    } catch {
        Write-Error-Message "删除日志文件失败: $_"
        Write-Log "Failed to delete log files: $_"
        return $false
    }
}

function Remove-FirewallRule {
    Write-Step 6 "删除防火墙规则"
    
    try {
        # 检查是否有管理员权限
        $isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
        
        if (-not $isAdmin) {
            Write-Warning-Message "需要管理员权限才能删除防火墙规则"
            Write-Info "跳过防火墙规则删除"
            return $true
        }
        
        Write-Info "正在删除防火墙规则..."
        
        # 删除防火墙规则
        Remove-NetFirewallRule -DisplayName "Character Card Anti-Theft API" -ErrorAction SilentlyContinue
        
        Write-Success "防火墙规则已删除"
        Write-Log "Firewall rule deleted"
        return $true
    } catch {
        Write-Warning-Message "删除防火墙规则失败: $_"
        Write-Log "Failed to delete firewall rule: $_"
        return $true
    }
}

# ============================================================================
# 显示卸载结果
# ============================================================================

function Show-UninstallSummary {
    Write-Host ""
    Write-Host ""
    Write-ColorOutput "═══════════════════════════════════════════════════════════" "Magenta"
    Write-ColorOutput "           卸载完成" "Green"
    Write-ColorOutput "═══════════════════════════════════════════════════════════" "Magenta"
    Write-Host ""
    
    Write-Info "已完成的操作："
    Write-ColorOutput "  ✅ PM2 服务已停止并删除" "White"
    Write-ColorOutput "  ✅ 配置文件已清理" "White"
    Write-ColorOutput "  ✅ 日志文件已清理" "White"
    Write-ColorOutput "  ✅ 防火墙规则已删除" "White"
    Write-Host ""
    
    Write-Info "保留的内容："
    Write-ColorOutput "  • 项目源代码" "White"
    Write-ColorOutput "  • package.json 和 package-lock.json" "White"
    Write-Host ""
    
    Write-Info "如需完全删除："
    Write-ColorOutput "  1. 手动删除项目目录: $PROJECT_ROOT" "White"
    Write-ColorOutput "  2. 卸载 PM2: npm uninstall -g pm2" "White"
    Write-Host ""
    
    Write-Success "感谢使用 Character Card Anti-Theft System！"
    Write-Host ""
    Write-ColorOutput "═══════════════════════════════════════════════════════════" "Magenta"
    Write-Host ""
}

# ============================================================================
# 主卸载流程
# ============================================================================

function Start-Uninstallation {
    # 显示欢迎信息
    Clear-Host
    Write-Host ""
    Write-ColorOutput "═══════════════════════════════════════════════════════════" "Magenta"
    Write-ColorOutput "     Character Card Anti-Theft System" "Magenta"
    Write-ColorOutput "     Windows 原生卸载程序" "Magenta"
    Write-ColorOutput "═══════════════════════════════════════════════════════════" "Magenta"
    Write-Host ""
    
    Write-Log "Uninstallation started"
    
    Write-Warning-Message "此操作将卸载 Character Card Anti-Theft System"
    Write-Host ""
    
    $confirm = Get-Confirmation "确定要继续吗？" $false
    
    if (-not $confirm) {
        Write-Info "卸载已取消"
        exit 0
    }
    
    try {
        # 停止服务
        Stop-PM2Service
        
        # 删除数据库（可选）
        Write-Host ""
        $deleteDb = Get-Confirmation "是否删除数据库？" $false
        if ($deleteDb) {
            Remove-Database
        }
        
        # 删除依赖
        Remove-Dependencies
        
        # 删除配置文件
        Remove-ConfigFiles
        
        # 清理日志
        Remove-LogFiles
        
        # 删除防火墙规则
        Remove-FirewallRule
        
        # 显示结果
        Show-UninstallSummary
        Write-Log "Uninstallation completed successfully"
        
    } catch {
        Write-Host ""
        Write-Error-Message "卸载过程中发生错误: $_"
        Write-Log "Uninstallation failed: $_"
        exit 1
    }
}

# ============================================================================
# 脚本入口
# ============================================================================

# 执行卸载
Start-Uninstallation
