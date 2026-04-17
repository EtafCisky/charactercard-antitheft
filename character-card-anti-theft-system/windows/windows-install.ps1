# ============================================================================
# Windows 原生一键安装脚本
# Character Card Anti-Theft System - Windows Native Deployment
# ============================================================================
#
# 功能：
# - 自动检测 Node.js 和 MySQL
# - 交互式配置收集
# - 自动生成 .env 文件
# - 自动安装 npm 依赖
# - 自动初始化数据库
# - 自动启动服务（使用 PM2）
# - 服务健康检查
# - 失败回滚机制
#
# 使用方法：
# .\windows-install.ps1
#
# 要求：
# - Windows 10/11
# - PowerShell 5.1 或更高
# - 管理员权限（可选，用于配置防火墙）
#
# ============================================================================

# 要求管理员权限（可选）
# Uncomment the following lines if you want to require admin privileges
# if (-NOT ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
#     Write-Warning "建议以管理员身份运行此脚本以配置防火墙规则"
#     $continue = Read-Host "是否继续？(Y/N)"
#     if ($continue -ne "Y" -and $continue -ne "y") {
#         exit
#     }
# }

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
$BACKUP_DIR = Join-Path $PROJECT_ROOT "backup"
$LOG_FILE = Join-Path $PROJECT_ROOT "install.log"

# 安装状态跟踪
$INSTALL_STATE = @{
    NodeJsInstalled = $false
    MySQLInstalled = $false
    DependenciesInstalled = $false
    DatabaseInitialized = $false
    PM2Installed = $false
    ServiceStarted = $false
}

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
# 前置条件检查
# ============================================================================

function Test-NodeJs {
    Write-Info "正在检测 Node.js..."
    try {
        $nodeVersion = node --version 2>$null
        if ($nodeVersion) {
            Write-Success "检测到 Node.js 版本: $nodeVersion"
            Write-Log "Node.js version: $nodeVersion"
            
            # 检查版本是否满足要求 (>= 18.0.0)
            $versionNumber = $nodeVersion -replace 'v', ''
            $majorVersion = [int]($versionNumber.Split('.')[0])
            
            if ($majorVersion -ge 18) {
                return $true
            } else {
                Write-Warning-Message "Node.js 版本过低，需要 18.0.0 或更高版本"
                return $false
            }
        }
    } catch {
        Write-Warning-Message "未检测到 Node.js"
        return $false
    }
    return $false
}

function Test-MySQL {
    Write-Info "正在检测 MySQL..."
    try {
        # 尝试检测 MySQL 服务
        $mysqlService = Get-Service -Name "MySQL*" -ErrorAction SilentlyContinue
        if ($mysqlService) {
            Write-Success "检测到 MySQL 服务: $($mysqlService.Name)"
            Write-Log "MySQL service: $($mysqlService.Name), Status: $($mysqlService.Status)"
            
            if ($mysqlService.Status -ne "Running") {
                Write-Warning-Message "MySQL 服务未运行，正在尝试启动..."
                try {
                    Start-Service $mysqlService.Name
                    Write-Success "MySQL 服务已启动"
                } catch {
                    Write-Warning-Message "无法启动 MySQL 服务: $_"
                    return $false
                }
            }
            return $true
        }
        
        # 尝试检测 mysql 命令
        $mysqlCmd = mysql --version 2>$null
        if ($mysqlCmd) {
            Write-Success "检测到 MySQL 命令行工具"
            Write-Log "MySQL CLI: $mysqlCmd"
            return $true
        }
    } catch {
        Write-Warning-Message "未检测到 MySQL"
        return $false
    }
    return $false
}

function Show-InstallInstructions {
    param(
        [string]$Software,
        [string]$DownloadUrl
    )
    
    Write-Host ""
    Write-ColorOutput "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" "Yellow"
    Write-Warning-Message "$Software 未安装或版本不符合要求"
    Write-ColorOutput "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" "Yellow"
    Write-Host ""
    Write-Info "请按照以下步骤安装 $Software :"
    Write-Host ""
    Write-ColorOutput "  1. 访问下载页面:" "White"
    Write-ColorOutput "     $DownloadUrl" "Cyan"
    Write-Host ""
    
    if ($Software -eq "Node.js") {
        Write-ColorOutput "  2. 下载 Windows 安装程序 (推荐 LTS 版本 18.x 或更高)" "White"
        Write-ColorOutput "  3. 运行安装程序，使用默认设置" "White"
        Write-ColorOutput "  4. 安装完成后，重新打开 PowerShell 窗口" "White"
        Write-ColorOutput "  5. 重新运行此安装脚本" "White"
    } elseif ($Software -eq "MySQL") {
        Write-ColorOutput "  2. 下载 MySQL Community Server (推荐 8.0 或更高)" "White"
        Write-ColorOutput "  3. 运行安装程序，选择 'Developer Default' 或 'Server only'" "White"
        Write-ColorOutput "  4. 设置 root 密码（请记住此密码）" "White"
        Write-ColorOutput "  5. 完成安装并启动 MySQL 服务" "White"
        Write-ColorOutput "  6. 重新运行此安装脚本" "White"
    }
    
    Write-Host ""
    Write-ColorOutput "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" "Yellow"
    Write-Host ""
}

# ============================================================================
# 配置收集函数
# ============================================================================

function Get-UserInput {
    param(
        [string]$Prompt,
        [string]$Default = "",
        [bool]$IsPassword = $false
    )
    
    if ($Default) {
        $promptText = "$Prompt [$Default]: "
    } else {
        $promptText = "$Prompt : "
    }
    
    if ($IsPassword) {
        $secureInput = Read-Host $promptText -AsSecureString
        $BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureInput)
        $input = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
        [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)
    } else {
        $input = Read-Host $promptText
    }
    
    if ([string]::IsNullOrWhiteSpace($input) -and $Default) {
        return $Default
    }
    
    return $input
}

function Collect-Configuration {
    Write-Step 3 "收集配置信息"
    
    Write-Info "请输入以下配置信息（按 Enter 使用默认值）"
    Write-Host ""
    
    $config = @{}
    
    # 服务器配置
    Write-ColorOutput "【服务器配置】" "Cyan"
    $config.NODE_ENV = Get-UserInput "运行环境 (development/production)" "production"
    $config.SERVER_PORT = Get-UserInput "服务器端口" "3000"
    Write-Host ""
    
    # 数据库配置
    Write-ColorOutput "【数据库配置】" "Cyan"
    $config.DB_HOST = Get-UserInput "数据库主机地址" "localhost"
    $config.DB_PORT = Get-UserInput "数据库端口" "3306"
    $config.DB_USER = Get-UserInput "数据库用户名" "root"
    $config.DB_PASSWORD = Get-UserInput "数据库密码" "" $true
    $config.DB_NAME = Get-UserInput "数据库名称" "character_card_anti_theft"
    Write-Host ""
    
    # JWT 配置
    Write-ColorOutput "【JWT 配置】" "Cyan"
    Write-Info "正在生成随机 JWT 密钥..."
    $config.JWT_SECRET = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
    Write-Success "JWT 密钥已生成"
    $config.JWT_EXPIRES_IN = Get-UserInput "JWT 过期时间" "7d"
    Write-Host ""
    
    # CORS 配置
    Write-ColorOutput "【CORS 配置】" "Cyan"
    $defaultCors = "http://localhost:8000,http://127.0.0.1:8000"
    $config.CORS_ORIGINS = Get-UserInput "允许的来源（逗号分隔）" $defaultCors
    Write-Host ""
    
    # 速率限制配置
    Write-ColorOutput "【速率限制配置】" "Cyan"
    $config.RATE_LIMIT_WINDOW_MS = Get-UserInput "速率限制时间窗口（毫秒）" "60000"
    $config.RATE_LIMIT_MAX_REQUESTS_PER_IP = Get-UserInput "每个IP最大请求数" "10"
    $config.RATE_LIMIT_MAX_REQUESTS_PER_CARD = Get-UserInput "每个卡片最大请求数" "5"
    Write-Host ""
    
    # 其他配置
    Write-ColorOutput "【其他配置】" "Cyan"
    $config.LOG_LEVEL = Get-UserInput "日志级别 (error/warn/info/debug)" "info"
    $config.BCRYPT_SALT_ROUNDS = Get-UserInput "Bcrypt 加密轮数" "12"
    Write-Host ""
    
    Write-Success "配置信息收集完成"
    Write-Log "Configuration collected"
    
    return $config
}

# ============================================================================
# .env 文件生成
# ============================================================================

function Generate-EnvFile {
    param([hashtable]$Config)
    
    Write-Step 4 "生成 .env 配置文件"
    
    # 备份现有 .env 文件
    if (Test-Path $ENV_FILE) {
        $backupFile = Join-Path $BACKUP_DIR ".env.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
        Write-Info "备份现有 .env 文件到: $backupFile"
        
        if (-not (Test-Path $BACKUP_DIR)) {
            New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null
        }
        
        Copy-Item $ENV_FILE $backupFile
        Write-Success "备份完成"
    }
    
    # 生成 .env 文件内容
    $envContent = @"
# 服务器配置
NODE_ENV=$($Config.NODE_ENV)
SERVER_PORT=$($Config.SERVER_PORT)

# 数据库配置
DB_HOST=$($Config.DB_HOST)
DB_PORT=$($Config.DB_PORT)
DB_USER=$($Config.DB_USER)
DB_PASSWORD=$($Config.DB_PASSWORD)
DB_NAME=$($Config.DB_NAME)

# JWT 配置
JWT_SECRET=$($Config.JWT_SECRET)
JWT_EXPIRES_IN=$($Config.JWT_EXPIRES_IN)

# CORS 配置
CORS_ORIGINS=$($Config.CORS_ORIGINS)

# 速率限制配置
RATE_LIMIT_WINDOW_MS=$($Config.RATE_LIMIT_WINDOW_MS)
RATE_LIMIT_MAX_REQUESTS_PER_IP=$($Config.RATE_LIMIT_MAX_REQUESTS_PER_IP)
RATE_LIMIT_MAX_REQUESTS_PER_CARD=$($Config.RATE_LIMIT_MAX_REQUESTS_PER_CARD)

# 日志配置
LOG_LEVEL=$($Config.LOG_LEVEL)

# Bcrypt 配置
BCRYPT_SALT_ROUNDS=$($Config.BCRYPT_SALT_ROUNDS)
"@
    
    # 写入文件
    try {
        $envContent | Out-File -FilePath $ENV_FILE -Encoding UTF8 -NoNewline
        Write-Success ".env 文件已生成: $ENV_FILE"
        Write-Log ".env file generated"
        return $true
    } catch {
        Write-Error-Message "生成 .env 文件失败: $_"
        Write-Log "Failed to generate .env file: $_"
        return $false
    }
}

# ============================================================================
# 依赖安装
# ============================================================================

function Install-Dependencies {
    Write-Step 5 "安装 npm 依赖"
    
    Write-Info "正在安装项目依赖..."
    Write-Info "这可能需要几分钟时间，请耐心等待..."
    
    try {
        Push-Location $PROJECT_ROOT
        
        # 检查 package.json 是否存在
        if (-not (Test-Path "package.json")) {
            throw "package.json 文件不存在"
        }
        
        # 安装依赖
        Write-Info "执行: npm install --production"
        $output = npm install --production 2>&1
        
        if ($LASTEXITCODE -ne 0) {
            throw "npm install 失败: $output"
        }
        
        Write-Success "依赖安装完成"
        Write-Log "Dependencies installed successfully"
        $INSTALL_STATE.DependenciesInstalled = $true
        
        Pop-Location
        return $true
    } catch {
        Write-Error-Message "安装依赖失败: $_"
        Write-Log "Failed to install dependencies: $_"
        Pop-Location
        return $false
    }
}

# ============================================================================
# 数据库初始化
# ============================================================================

function Initialize-Database {
    Write-Step 6 "初始化数据库"
    
    Write-Info "正在初始化数据库..."
    Write-Info "这将创建数据库和表结构..."
    
    try {
        Push-Location $PROJECT_ROOT
        
        # 运行数据库初始化脚本
        Write-Info "执行: npm run db:init"
        $output = npm run db:init 2>&1
        
        if ($LASTEXITCODE -ne 0) {
            throw "数据库初始化失败: $output"
        }
        
        Write-Success "数据库初始化完成"
        Write-Log "Database initialized successfully"
        $INSTALL_STATE.DatabaseInitialized = $true
        
        Pop-Location
        return $true
    } catch {
        Write-Error-Message "数据库初始化失败: $_"
        Write-Log "Failed to initialize database: $_"
        Write-Host ""
        Write-Warning-Message "可能的原因："
        Write-Host "  1. 数据库连接信息不正确"
        Write-Host "  2. 数据库用户权限不足"
        Write-Host "  3. MySQL 服务未运行"
        Write-Host ""
        Pop-Location
        return $false
    }
}

# ============================================================================
# PM2 安装和配置
# ============================================================================

function Install-PM2 {
    Write-Info "正在检查 PM2..."
    
    try {
        $pm2Version = pm2 --version 2>$null
        if ($pm2Version) {
            Write-Success "检测到 PM2 版本: $pm2Version"
            Write-Log "PM2 version: $pm2Version"
            return $true
        }
    } catch {
        # PM2 未安装
    }
    
    Write-Info "PM2 未安装，正在安装..."
    
    try {
        $output = npm install -g pm2 2>&1
        
        if ($LASTEXITCODE -ne 0) {
            throw "PM2 安装失败: $output"
        }
        
        Write-Success "PM2 安装完成"
        Write-Log "PM2 installed successfully"
        $INSTALL_STATE.PM2Installed = $true
        return $true
    } catch {
        Write-Error-Message "PM2 安装失败: $_"
        Write-Log "Failed to install PM2: $_"
        return $false
    }
}

function Start-Service {
    Write-Step 7 "启动服务"
    
    Write-Info "正在使用 PM2 启动服务..."
    
    try {
        Push-Location $PROJECT_ROOT
        
        # 停止现有进程（如果存在）
        Write-Info "检查现有进程..."
        pm2 delete anti-theft-api 2>$null | Out-Null
        
        # 启动服务
        Write-Info "启动服务: pm2 start src/server.js --name anti-theft-api"
        $output = pm2 start src/server.js --name anti-theft-api 2>&1
        
        if ($LASTEXITCODE -ne 0) {
            throw "服务启动失败: $output"
        }
        
        # 保存 PM2 进程列表
        pm2 save 2>&1 | Out-Null
        
        Write-Success "服务已启动"
        Write-Log "Service started successfully"
        $INSTALL_STATE.ServiceStarted = $true
        
        # 显示服务状态
        Write-Host ""
        Write-Info "服务状态："
        pm2 list
        
        Pop-Location
        return $true
    } catch {
        Write-Error-Message "启动服务失败: $_"
        Write-Log "Failed to start service: $_"
        Pop-Location
        return $false
    }
}

# ============================================================================
# 健康检查
# ============================================================================

function Test-ServiceHealth {
    Write-Step 8 "服务健康检查"
    
    Write-Info "等待服务启动..."
    Start-Sleep -Seconds 3
    
    $maxRetries = 5
    $retryCount = 0
    $port = $config.SERVER_PORT
    
    while ($retryCount -lt $maxRetries) {
        try {
            Write-Info "尝试连接到 http://localhost:$port/health (尝试 $($retryCount + 1)/$maxRetries)"
            
            $response = Invoke-WebRequest -Uri "http://localhost:$port/health" -TimeoutSec 5 -UseBasicParsing
            
            if ($response.StatusCode -eq 200) {
                Write-Success "服务健康检查通过"
                Write-Log "Service health check passed"
                
                # 显示响应内容
                Write-Host ""
                Write-Info "服务响应："
                Write-ColorOutput $response.Content "Cyan"
                Write-Host ""
                
                return $true
            }
        } catch {
            $retryCount++
            if ($retryCount -lt $maxRetries) {
                Write-Warning-Message "连接失败，等待 2 秒后重试..."
                Start-Sleep -Seconds 2
            }
        }
    }
    
    Write-Error-Message "服务健康检查失败"
    Write-Log "Service health check failed"
    
    Write-Host ""
    Write-Warning-Message "请检查："
    Write-Host "  1. 端口 $port 是否被其他程序占用"
    Write-Host "  2. 防火墙是否阻止了连接"
    Write-Host "  3. 查看日志文件: $PROJECT_ROOT\logs\"
    Write-Host ""
    
    return $false
}

# ============================================================================
# 防火墙配置（可选）
# ============================================================================

function Configure-Firewall {
    param([string]$Port)
    
    Write-Info "配置 Windows 防火墙规则..."
    
    try {
        # 检查是否有管理员权限
        $isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")
        
        if (-not $isAdmin) {
            Write-Warning-Message "需要管理员权限才能配置防火墙"
            Write-Info "跳过防火墙配置"
            return $false
        }
        
        # 删除现有规则（如果存在）
        Remove-NetFirewallRule -DisplayName "Character Card Anti-Theft API" -ErrorAction SilentlyContinue
        
        # 添加新规则
        New-NetFirewallRule -DisplayName "Character Card Anti-Theft API" `
                            -Direction Inbound `
                            -Protocol TCP `
                            -LocalPort $Port `
                            -Action Allow `
                            -Profile Any | Out-Null
        
        Write-Success "防火墙规则已配置"
        Write-Log "Firewall rule configured for port $Port"
        return $true
    } catch {
        Write-Warning-Message "配置防火墙失败: $_"
        Write-Log "Failed to configure firewall: $_"
        return $false
    }
}

# ============================================================================
# 回滚机制
# ============================================================================

function Invoke-Rollback {
    Write-Host ""
    Write-ColorOutput "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" "Red"
    Write-Error-Message "安装失败，正在执行回滚..."
    Write-ColorOutput "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" "Red"
    Write-Host ""
    
    Write-Log "Starting rollback"
    
    # 停止服务
    if ($INSTALL_STATE.ServiceStarted) {
        Write-Info "停止服务..."
        try {
            pm2 delete anti-theft-api 2>$null | Out-Null
            Write-Success "服务已停止"
        } catch {
            Write-Warning-Message "停止服务失败: $_"
        }
    }
    
    # 恢复 .env 文件
    if (Test-Path $ENV_FILE) {
        Write-Info "删除生成的 .env 文件..."
        try {
            Remove-Item $ENV_FILE -Force
            Write-Success ".env 文件已删除"
        } catch {
            Write-Warning-Message "删除 .env 文件失败: $_"
        }
    }
    
    # 清理数据库（可选）
    if ($INSTALL_STATE.DatabaseInitialized) {
        Write-Warning-Message "数据库已初始化，如需清理请手动删除数据库"
    }
    
    Write-Host ""
    Write-Info "回滚完成"
    Write-Log "Rollback completed"
}

# ============================================================================
# 显示安装结果
# ============================================================================

function Show-InstallationSummary {
    param([bool]$Success)
    
    Write-Host ""
    Write-Host ""
    Write-ColorOutput "═══════════════════════════════════════════════════════════" "Magenta"
    
    if ($Success) {
        Write-ColorOutput "           🎉 安装成功！" "Green"
    } else {
        Write-ColorOutput "           ❌ 安装失败" "Red"
    }
    
    Write-ColorOutput "═══════════════════════════════════════════════════════════" "Magenta"
    Write-Host ""
    
    if ($Success) {
        Write-Info "服务信息："
        Write-ColorOutput "  • 服务名称: anti-theft-api" "White"
        Write-ColorOutput "  • 运行端口: $($config.SERVER_PORT)" "White"
        Write-ColorOutput "  • API 地址: http://localhost:$($config.SERVER_PORT)" "White"
        Write-ColorOutput "  • 健康检查: http://localhost:$($config.SERVER_PORT)/health" "White"
        Write-Host ""
        
        Write-Info "常用命令："
        Write-ColorOutput "  • 查看服务状态: pm2 status" "Cyan"
        Write-ColorOutput "  • 查看日志: pm2 logs anti-theft-api" "Cyan"
        Write-ColorOutput "  • 重启服务: pm2 restart anti-theft-api" "Cyan"
        Write-ColorOutput "  • 停止服务: pm2 stop anti-theft-api" "Cyan"
        Write-ColorOutput "  • 删除服务: pm2 delete anti-theft-api" "Cyan"
        Write-Host ""
        
        Write-Info "日志文件位置："
        Write-ColorOutput "  • 应用日志: $PROJECT_ROOT\logs\" "White"
        Write-ColorOutput "  • PM2 日志: $env:USERPROFILE\.pm2\logs\" "White"
        Write-ColorOutput "  • 安装日志: $LOG_FILE" "White"
        Write-Host ""
        
        Write-Info "下一步："
        Write-ColorOutput "  1. 访问 API 文档了解接口使用方法" "White"
        Write-ColorOutput "  2. 部署 Web 管理界面（如需要）" "White"
        Write-ColorOutput "  3. 配置反向代理（如 Nginx）用于生产环境" "White"
        Write-Host ""
        
        Write-Success "感谢使用 Character Card Anti-Theft System！"
    } else {
        Write-Info "故障排查："
        Write-ColorOutput "  1. 查看安装日志: $LOG_FILE" "White"
        Write-ColorOutput "  2. 检查 Node.js 和 MySQL 是否正确安装" "White"
        Write-ColorOutput "  3. 验证数据库连接信息是否正确" "White"
        Write-ColorOutput "  4. 确保端口未被占用" "White"
        Write-Host ""
        
        Write-Info "获取帮助："
        Write-ColorOutput "  • 查看文档: $PROJECT_ROOT\README.md" "White"
        Write-ColorOutput "  • 提交问题: https://github.com/your-repo/issues" "White"
        Write-Host ""
    }
    
    Write-ColorOutput "═══════════════════════════════════════════════════════════" "Magenta"
    Write-Host ""
}

# ============================================================================
# 主安装流程
# ============================================================================

function Start-Installation {
    # 显示欢迎信息
    Clear-Host
    Write-Host ""
    Write-ColorOutput "═══════════════════════════════════════════════════════════" "Magenta"
    Write-ColorOutput "     Character Card Anti-Theft System" "Magenta"
    Write-ColorOutput "     Windows 原生一键安装程序" "Magenta"
    Write-ColorOutput "═══════════════════════════════════════════════════════════" "Magenta"
    Write-Host ""
    
    Write-Log "Installation started"
    Write-Log "PowerShell version: $($PSVersionTable.PSVersion)"
    Write-Log "OS: $([System.Environment]::OSVersion.VersionString)"
    
    try {
        # 步骤 1: 检查 Node.js
        Write-Step 1 "检查 Node.js"
        $hasNodeJs = Test-NodeJs
        
        if (-not $hasNodeJs) {
            Show-InstallInstructions "Node.js" "https://nodejs.org/"
            throw "Node.js 未安装或版本不符合要求"
        }
        
        $INSTALL_STATE.NodeJsInstalled = $true
        
        # 步骤 2: 检查 MySQL
        Write-Step 2 "检查 MySQL"
        $hasMySQL = Test-MySQL
        
        if (-not $hasMySQL) {
            Show-InstallInstructions "MySQL" "https://dev.mysql.com/downloads/mysql/"
            throw "MySQL 未安装或未运行"
        }
        
        $INSTALL_STATE.MySQLInstalled = $true
        
        # 步骤 3-4: 收集配置并生成 .env
        $script:config = Collect-Configuration
        
        if (-not (Generate-EnvFile -Config $config)) {
            throw "生成 .env 文件失败"
        }
        
        # 步骤 5: 安装依赖
        if (-not (Install-Dependencies)) {
            throw "安装依赖失败"
        }
        
        # 步骤 6: 初始化数据库
        if (-not (Initialize-Database)) {
            throw "数据库初始化失败"
        }
        
        # 安装 PM2
        if (-not (Install-PM2)) {
            throw "PM2 安装失败"
        }
        
        # 步骤 7: 启动服务
        if (-not (Start-Service)) {
            throw "启动服务失败"
        }
        
        # 步骤 8: 健康检查
        if (-not (Test-ServiceHealth)) {
            throw "服务健康检查失败"
        }
        
        # 配置防火墙（可选）
        Write-Host ""
        $configureFw = Read-Host "是否配置 Windows 防火墙规则？(Y/N)"
        if ($configureFw -eq "Y" -or $configureFw -eq "y") {
            Configure-Firewall -Port $config.SERVER_PORT
        }
        
        # 显示成功信息
        Show-InstallationSummary -Success $true
        Write-Log "Installation completed successfully"
        
    } catch {
        Write-Host ""
        Write-Error-Message "安装过程中发生错误: $_"
        Write-Log "Installation failed: $_"
        
        # 询问是否回滚
        Write-Host ""
        $rollback = Read-Host "是否执行回滚？(Y/N)"
        if ($rollback -eq "Y" -or $rollback -eq "y") {
            Invoke-Rollback
        }
        
        Show-InstallationSummary -Success $false
        exit 1
    }
}

# ============================================================================
# 脚本入口
# ============================================================================

# 执行安装
Start-Installation
