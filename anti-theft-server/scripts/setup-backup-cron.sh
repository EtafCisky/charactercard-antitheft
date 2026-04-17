#!/bin/bash

# Cron 定时任务设置脚本
# 用途：自动配置数据库备份的 cron 定时任务
# 使用方法：sudo ./setup-backup-cron.sh

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_SCRIPT="$SCRIPT_DIR/backup.sh"

# 检查备份脚本是否存在
if [ ! -f "$BACKUP_SCRIPT" ]; then
    log_error "备份脚本不存在: $BACKUP_SCRIPT"
    exit 1
fi

# 确保备份脚本可执行
chmod +x "$BACKUP_SCRIPT"

# 获取当前用户
CURRENT_USER=$(whoami)

log_info "正在为用户 $CURRENT_USER 配置 cron 定时任务..."

# 检查是否已存在相同的 cron 任务
CRON_PATTERN="backup.sh"
if crontab -l 2>/dev/null | grep -q "$CRON_PATTERN"; then
    log_warn "检测到已存在的备份 cron 任务"
    echo ""
    echo "当前的 cron 任务:"
    crontab -l | grep "$CRON_PATTERN"
    echo ""
    read -p "是否要替换现有的 cron 任务? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "取消操作"
        exit 0
    fi
    
    # 删除旧的 cron 任务
    crontab -l | grep -v "$CRON_PATTERN" | crontab -
    log_info "已删除旧的 cron 任务"
fi

# 添加新的 cron 任务（每天凌晨 2 点执行）
CRON_JOB="0 2 * * * $BACKUP_SCRIPT >> $SCRIPT_DIR/../logs/backup.log 2>&1"

# 将新任务添加到 crontab
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

log_info "Cron 定时任务配置成功！"
echo ""
echo "任务详情:"
echo "  执行时间: 每天凌晨 2:00"
echo "  执行脚本: $BACKUP_SCRIPT"
echo "  日志文件: $SCRIPT_DIR/../logs/backup.log"
echo ""
echo "当前所有 cron 任务:"
crontab -l
echo ""
log_info "提示: 可以使用 'crontab -e' 手动编辑 cron 任务"
log_info "提示: 可以使用 'crontab -l' 查看所有 cron 任务"
log_info "提示: 可以使用 'crontab -r' 删除所有 cron 任务"

exit 0
