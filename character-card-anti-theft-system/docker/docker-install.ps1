# SillyTavern 角色卡防盗系统 - Docker 一键安装脚本 (Windows PowerShell)
# 此脚本将自动安装 Docker Desktop、配置环境变量并启动所有服务

# 要求管理员权限
#Requires -RunAsAdministrator

# 设置错误处理
$ErrorActionPreference = "Stop"

# 颜色函数
function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Type = "Info"
    )
    
    switch ($Type) {
        "Info"    { Write-Host "[INFO] $Message" -ForegroundColor Blue }
        "Success" { Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
        "Warning" { Write-Host "[WARNING] $Message" -ForegroundColor Yellow }
        "Error"   { Write-Host "[ERROR] $Message" -ForegroundColor Red }
    }
}

# 打印标题
function Show-Header {
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Blue
    Write-Host "  SillyTavern 角色卡防盗系统 - Docker 安装" -ForegroundColor Blue
    Write-Host "================================================" -ForegroundColor Blue
    Write-Host ""
}

# 检查 Docker Desktop 是否已安装
function Test-DockerInstalled {
    try {
        $dockerVersion = docker --version 2>$null
        if ($dockerVersion) {
            Write-ColorOutput "Docker 已安装: $dockerVersion" "Success"
            return $true
        }
    }
    catch {
        Write-ColorOutput "Docker 未安装" "Warning"
        return $false
    }
    return $false
}

# 检查 Docker Compose 是否可用
function Test-DockerComposeInstalled {
    try {
        $composeVersion = docker compose version 2>$null
        if ($composeVersion) {
            Write-ColorOutput "Docker Compose 已安装: $composeVersion" "Success"
            return $true
        }
    }
    catch {
        Write-ColorOutput "Docker Compose 未安装" "Warning"
        return $false
    }
    return $false
}

# 检查 Docker Desktop 是否正在运行
function Test-DockerRunning {
    try {
        docker ps 2>$null | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# 下载并安装 Docker Desktop
function Install-DockerDesktop {
    Write-ColorOutput "开始下载 Docker Desktop..." "Info"
    
    $dockerInstallerUrl = "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe"
    $installerPath = "$env:TEMP\DockerDesktopInstaller.exe"
    
    try {
        # 下载安装程序
        Write-ColorOutput "正在下载 Docker Desktop 安装程序..." "Info"
        Invoke-WebRequest -Uri $dockerInstallerUrl -OutFile $installerPath -UseBasicParsing
        
        # 运行安装程序
        Write-ColorOutput "正在安装 Docker Desktop..." "Info"
        Write-ColorOutput "请按照安装向导完成安装" "Warning"
        Start-Process -FilePath $installerPath -Wait
        
        # 清理安装程序
        Remove-Item $installerPath -Force
        
        Write-ColorOutput "Docker Desktop 安装完成" "Success"
        Write-ColorOutput "请启动 Docker Desktop 并等待其完全启动" "Warning"
        Write-Host ""
        Read-Host "启动完成后按 Enter 继续"
        
    }
    catch {
        Write-ColorOutput "Docker Desktop 安装失败: $_" "Error"
        Write-ColorOutput "请手动下载并安装: https://www.docker.com/products/docker-desktop" "Info"
        exit 1
    }
}

# 生成随机密码
function New-RandomPassword {
    param([int]$Length = 32)
    
    $chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*"
    $password = -join ((1..$Length) | ForEach-Object { $chars[(Get-Random -Maximum $chars.Length)] })
    return $password
}

# 生成 JWT Secret
function New-JWTSecret {
    $bytes = New-Object byte[] 64
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $rng.GetBytes($bytes)
    return [System.BitConverter]::ToString($bytes).Replace("-", "").ToLower()
}

# 交互式配置收集
function Get-Configuration {
    Write-ColorOutput "开始配置收集..." "Info"
    Write-Host ""
    
    # 数据库 root 密码
    $dbRootPassword = Read-Host "请输入 MySQL root 密码 (留空自动生成)"
    if ([string]::IsNullOrWhiteSpace($dbRootPassword)) {
        $dbRootPassword = New-RandomPassword -Length 24
        Write-ColorOutput "已自动生成 MySQL root 密码" "Info"
    }
    
    # 数据库用户密码
    $dbPassword = Read-Host "请输入数据库用户密码 (留空自动生成)"
    if ([string]::IsNullOrWhiteSpace($dbPassword)) {
        $dbPassword = New-RandomPassword -Length 24
        Write-ColorOutput "已自动生成数据库用户密码" "Info"
    }
    
    # JWT Secret
    $jwtSecret = Read-Host "请输入 JWT Secret (留空自动生成)"
    if ([string]::IsNullOrWhiteSpace($jwtSecret)) {
        $jwtSecret = New-JWTSecret
        Write-ColorOutput "已自动生成 JWT Secret" "Info"
    }
    
    # API 基础 URL
    $apiBaseUrl = Read-Host "请输入 API 基础 URL (默认: http://localhost:3000)"
    if ([string]::IsNullOrWhiteSpace($apiBaseUrl)) {
        $apiBaseUrl = "http://localhost:3000"
    }
    
    # CORS 来源
    $corsOrigins = Read-Host "请输入 CORS 允许的来源 (默认: http://localhost,http://localhost:80)"
    if ([string]::IsNullOrWhiteSpace($corsOrigins)) {
        $corsOrigins = "http://localhost,http://localhost:80,http://127.0.0.1"
    }
    
    # 数据库配置
    $dbName = "character_card_anti_theft"
    $dbUser = "anti_theft_user"
    
    Write-ColorOutput "配置收集完成" "Success"
    
    return @{
        DB_ROOT_PASSWORD = $dbRootPassword
        DB_NAME = $dbName
        DB_USER = $dbUser
        DB_PASSWORD = $dbPassword
        JWT_SECRET = $jwtSecret
        API_BASE_URL = $apiBaseUrl
        CORS_ORIGINS = $corsOrigins
    }
}

# 生成 .env 文件
function New-EnvFile {
    param([hashtable]$Config)
    
    Write-ColorOutput "生成 .env 文件..." "Info"
    
    $envContent = @"
# Docker Compose 环境变量配置
# 由 docker-install.ps1 自动生成于 $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

# 数据库配置
DB_ROOT_PASSWORD=$($Config.DB_ROOT_PASSWORD)
DB_NAME=$($Config.DB_NAME)
DB_USER=$($Config.DB_USER)
DB_PASSWORD=$($Config.DB_PASSWORD)

# JWT 配置
JWT_SECRET=$($Config.JWT_SECRET)

# API 基础 URL
API_BASE_URL=$($Config.API_BASE_URL)

# CORS 允许的来源
CORS_ORIGINS=$($Config.CORS_ORIGINS)
"@
    
    $envContent | Out-File -FilePath ".env" -Encoding UTF8 -NoNewline
    
    Write-ColorOutput ".env 文件已生成" "Success"
}

# 启动 Docker Compose
function Start-DockerCompose {
    Write-ColorOutput "启动 Docker Compose 服务..." "Info"
    
    try {
        docker compose up -d
        Write-ColorOutput "Docker Compose 服务已启动" "Success"
    }
    catch {
        Write-ColorOutput "启动服务失败: $_" "Error"
        throw
    }
}

# 等待服务就绪
function Wait-ForServices {
    Write-ColorOutput "等待服务启动..." "Info"
    
    $maxAttempts = 60
    $attempt = 0
    
    while ($attempt -lt $maxAttempts) {
        try {
            $status = docker compose ps --format json | ConvertFrom-Json
            $healthyCount = ($status | Where-Object { $_.Health -eq "healthy" }).Count
            
            if ($healthyCount -gt 0) {
                Write-ColorOutput "服务已就绪" "Success"
                return $true
            }
        }
        catch {
            # 继续等待
        }
        
        $attempt++
        Write-Host "." -NoNewline
        Start-Sleep -Seconds 2
    }
    
    Write-Host ""
    Write-ColorOutput "服务启动超时，请检查日志" "Warning"
    return $false
}

# 健康检查
function Test-ServicesHealth {
    Write-ColorOutput "执行健康检查..." "Info"
    
    $allHealthy = $true
    
    # 检查数据库
    try {
        docker compose exec -T db mysqladmin ping -h localhost -u root -p"$($Config.DB_ROOT_PASSWORD)" 2>$null | Out-Null
        Write-ColorOutput "✓ 数据库连接正常" "Success"
    }
    catch {
        Write-ColorOutput "✗ 数据库连接失败" "Error"
        $allHealthy = $false
    }
    
    # 等待 API 服务启动
    Start-Sleep -Seconds 5
    
    # 检查 API 服务
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-ColorOutput "✓ API 服务正常" "Success"
        }
        else {
            Write-ColorOutput "✗ API 服务异常" "Error"
            $allHealthy = $false
        }
    }
    catch {
        Write-ColorOutput "✗ API 服务异常: $_" "Error"
        $allHealthy = $false
    }
    
    # 检查 Web 服务
    try {
        $response = Invoke-WebRequest -Uri "http://localhost/" -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-ColorOutput "✓ Web 服务正常" "Success"
        }
        else {
            Write-ColorOutput "✗ Web 服务异常" "Error"
            $allHealthy = $false
        }
    }
    catch {
        Write-ColorOutput "✗ Web 服务异常: $_" "Error"
        $allHealthy = $false
    }
    
    if ($allHealthy) {
        Write-ColorOutput "所有服务健康检查通过" "Success"
    }
    
    return $allHealthy
}

# 显示访问信息
function Show-AccessInfo {
    param([hashtable]$Config)
    
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Green
    Write-Host "  安装完成！" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "访问信息：" -ForegroundColor Blue
    Write-Host "  Web 管理界面: " -NoNewline
    Write-Host "http://localhost" -ForegroundColor Green
    Write-Host "  API 服务器:   " -NoNewline
    Write-Host "http://localhost:3000" -ForegroundColor Green
    Write-Host ""
    Write-Host "数据库信息：" -ForegroundColor Blue
    Write-Host "  主机: localhost:3306"
    Write-Host "  数据库: $($Config.DB_NAME)"
    Write-Host "  用户: $($Config.DB_USER)"
    Write-Host "  密码: $($Config.DB_PASSWORD)"
    Write-Host ""
    Write-Host "常用命令：" -ForegroundColor Blue
    Write-Host "  查看服务状态: " -NoNewline -ForegroundColor White
    Write-Host "docker compose ps" -ForegroundColor Yellow
    Write-Host "  查看日志:     " -NoNewline -ForegroundColor White
    Write-Host "docker compose logs -f" -ForegroundColor Yellow
    Write-Host "  停止服务:     " -NoNewline -ForegroundColor White
    Write-Host "docker compose stop" -ForegroundColor Yellow
    Write-Host "  启动服务:     " -NoNewline -ForegroundColor White
    Write-Host "docker compose start" -ForegroundColor Yellow
    Write-Host "  重启服务:     " -NoNewline -ForegroundColor White
    Write-Host "docker compose restart" -ForegroundColor Yellow
    Write-Host "  卸载服务:     " -NoNewline -ForegroundColor White
    Write-Host ".\docker-uninstall.ps1" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "重要提示：" -ForegroundColor Yellow
    Write-Host "  - 请妥善保管 .env 文件中的密码信息"
    Write-Host "  - 生产环境请修改默认密码并启用 HTTPS"
    Write-Host ""
}

# 主函数
function Main {
    try {
        Show-Header
        
        # 检查并安装 Docker
        if (-not (Test-DockerInstalled)) {
            $install = Read-Host "是否安装 Docker Desktop？(y/n)"
            if ($install -eq 'y' -or $install -eq 'Y') {
                Install-DockerDesktop
            }
            else {
                Write-ColorOutput "Docker 是必需的，安装已取消" "Error"
                exit 1
            }
        }
        
        # 检查 Docker 是否正在运行
        if (-not (Test-DockerRunning)) {
            Write-ColorOutput "Docker Desktop 未运行，请启动 Docker Desktop" "Warning"
            Read-Host "启动完成后按 Enter 继续"
            
            if (-not (Test-DockerRunning)) {
                Write-ColorOutput "Docker Desktop 仍未运行，安装已取消" "Error"
                exit 1
            }
        }
        
        # 检查 Docker Compose
        if (-not (Test-DockerComposeInstalled)) {
            Write-ColorOutput "Docker Compose 未安装，请更新 Docker Desktop" "Error"
            exit 1
        }
        
        # 收集配置
        $script:Config = Get-Configuration
        
        # 生成 .env 文件
        New-EnvFile -Config $Config
        
        # 启动服务
        Start-DockerCompose
        
        # 等待服务就绪
        Wait-ForServices | Out-Null
        
        # 健康检查
        if (Test-ServicesHealth) {
            Show-AccessInfo -Config $Config
        }
        else {
            Write-ColorOutput "健康检查失败，请查看日志: docker compose logs" "Error"
            exit 1
        }
    }
    catch {
        Write-ColorOutput "安装过程中发生错误: $_" "Error"
        Write-ColorOutput "请查看错误信息并重试" "Error"
        exit 1
    }
}

# 运行主函数
Main
