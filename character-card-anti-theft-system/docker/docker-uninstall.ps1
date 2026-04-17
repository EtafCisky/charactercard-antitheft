# SillyTavern 角色卡防盗系统 - Docker 卸载脚本 (Windows PowerShell)
# 此脚本将停止并删除所有 Docker 容器、镜像、数据卷和网络

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
    Write-Host "================================================" -ForegroundColor Red
    Write-Host "  SillyTavern 角色卡防盗系统 - Docker 卸载" -ForegroundColor Red
    Write-Host "================================================" -ForegroundColor Red
    Write-Host ""
}

# 确认卸载
function Confirm-Uninstall {
    Write-ColorOutput "此操作将删除所有容器、镜像、数据卷和网络" "Warning"
    Write-ColorOutput "所有数据将被永久删除，无法恢复！" "Warning"
    Write-Host ""
    
    $confirmation = Read-Host "是否继续卸载？(yes/no)"
    
    if ($confirmation -ne "yes") {
        Write-ColorOutput "卸载已取消" "Info"
        exit 0
    }
}

# 备份提醒
function Invoke-BackupReminder {
    Write-ColorOutput "是否需要备份数据库？" "Warning"
    $backup = Read-Host "备份数据库？(y/n)"
    
    if ($backup -eq 'y' -or $backup -eq 'Y') {
        Write-ColorOutput "开始备份数据库..." "Info"
        
        # 检查 .env 文件
        if (Test-Path .env) {
            $envContent = Get-Content .env
            $dbRootPassword = ($envContent | Select-String "DB_ROOT_PASSWORD=(.+)").Matches.Groups[1].Value
            $dbName = ($envContent | Select-String "DB_NAME=(.+)").Matches.Groups[1].Value
            
            $backupFile = "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
            
            try {
                docker compose exec -T db sh -c "mysqladmin ping -h localhost -u root -p`$MYSQL_ROOT_PASSWORD" 2>$null | Out-Null
                docker compose exec -T db sh -c "mysqldump -u root -p`$MYSQL_ROOT_PASSWORD `$MYSQL_DATABASE" | Out-File -FilePath $backupFile -Encoding UTF8
                Write-ColorOutput "数据库已备份到: $backupFile" "Success"
            }
            catch {
                Write-ColorOutput "数据库连接失败，跳过备份" "Warning"
            }
        }
        else {
            Write-ColorOutput ".env 文件不存在，跳过备份" "Warning"
        }
    }
}

# 停止服务
function Stop-Services {
    Write-ColorOutput "停止所有服务..." "Info"
    
    try {
        docker compose ps 2>$null | Out-Null
        docker compose stop
        Write-ColorOutput "服务已停止" "Success"
    }
    catch {
        Write-ColorOutput "未找到运行中的服务" "Warning"
    }
}

# 删除容器
function Remove-Containers {
    Write-ColorOutput "删除所有容器..." "Info"
    
    try {
        docker compose down
        Write-ColorOutput "容器已删除" "Success"
    }
    catch {
        Write-ColorOutput "未找到容器" "Warning"
    }
}

# 删除镜像
function Remove-Images {
    Write-ColorOutput "删除所有镜像..." "Info"
    
    try {
        # 删除项目相关镜像
        $images = docker images | Select-String -Pattern "anti-theft|character-card" | ForEach-Object {
            ($_ -split '\s+')[2]
        }
        
        if ($images) {
            $images | ForEach-Object {
                docker rmi -f $_
            }
            Write-ColorOutput "镜像已删除" "Success"
        }
        else {
            Write-ColorOutput "未找到相关镜像" "Warning"
        }
    }
    catch {
        Write-ColorOutput "删除镜像时出错: $_" "Warning"
    }
}

# 删除数据卷
function Remove-Volumes {
    Write-ColorOutput "是否删除数据卷（包含所有数据库数据）？" "Warning"
    $removeVolumes = Read-Host "删除数据卷？(y/n)"
    
    if ($removeVolumes -eq 'y' -or $removeVolumes -eq 'Y') {
        Write-ColorOutput "删除所有数据卷..." "Info"
        
        try {
            docker compose down -v
            
            # 删除可能残留的数据卷
            $volumes = docker volume ls | Select-String -Pattern "anti-theft|character-card" | ForEach-Object {
                ($_ -split '\s+')[-1]
            }
            
            if ($volumes) {
                $volumes | ForEach-Object {
                    docker volume rm -f $_
                }
                Write-ColorOutput "数据卷已删除" "Success"
            }
            else {
                Write-ColorOutput "未找到相关数据卷" "Warning"
            }
        }
        catch {
            Write-ColorOutput "删除数据卷时出错: $_" "Warning"
        }
    }
    else {
        Write-ColorOutput "保留数据卷" "Info"
    }
}

# 删除网络
function Remove-Networks {
    Write-ColorOutput "删除网络..." "Info"
    
    try {
        $networks = docker network ls | Select-String -Pattern "anti-theft|character-card" | ForEach-Object {
            ($_ -split '\s+')[1]
        }
        
        if ($networks) {
            $networks | ForEach-Object {
                docker network rm $_
            }
            Write-ColorOutput "网络已删除" "Success"
        }
        else {
            Write-ColorOutput "未找到相关网络" "Warning"
        }
    }
    catch {
        Write-ColorOutput "删除网络时出错: $_" "Warning"
    }
}

# 清理配置文件
function Remove-ConfigFiles {
    Write-ColorOutput "是否删除配置文件（.env）？" "Warning"
    $removeConfig = Read-Host "删除配置文件？(y/n)"
    
    if ($removeConfig -eq 'y' -or $removeConfig -eq 'Y') {
        if (Test-Path .env) {
            Remove-Item .env -Force
            Write-ColorOutput "配置文件已删除" "Success"
        }
        else {
            Write-ColorOutput "配置文件不存在" "Warning"
        }
    }
    else {
        Write-ColorOutput "保留配置文件" "Info"
    }
}

# 显示卸载完成信息
function Show-Completion {
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Green
    Write-Host "  卸载完成！" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    Write-Host ""
    Write-ColorOutput "所有 Docker 资源已清理" "Info"
    
    if (Test-Path .env) {
        Write-ColorOutput "配置文件已保留: .env" "Info"
    }
    
    Write-Host ""
    Write-ColorOutput "如需重新安装，请运行: .\docker-install.ps1" "Info"
    Write-Host ""
}

# 主函数
function Main {
    try {
        Show-Header
        
        # 确认卸载
        Confirm-Uninstall
        
        # 备份提醒
        Invoke-BackupReminder
        
        # 停止服务
        Stop-Services
        
        # 删除容器
        Remove-Containers
        
        # 删除镜像
        Remove-Images
        
        # 删除数据卷
        Remove-Volumes
        
        # 删除网络
        Remove-Networks
        
        # 清理配置文件
        Remove-ConfigFiles
        
        # 显示完成信息
        Show-Completion
    }
    catch {
        Write-ColorOutput "卸载过程中发生错误: $_" "Error"
        exit 1
    }
}

# 运行主函数
Main
