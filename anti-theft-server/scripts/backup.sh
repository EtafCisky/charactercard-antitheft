#!/bin/bash

# 数据库备份脚本
# 用途：自动备份 MySQL 数据库，压缩备份文件，并清理旧备份
# 使用方法：./backup.sh 或通过 cron 定时执行

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# 加载环境变量
ENV_FILE="$PROJECT_ROOT/.env"
if [ ! -f "$ENV_FILE" ]; then
    ENV_FILE="$PROJECT_ROOT/.env.production"
fi

if [ ! -f "$ENV_FILE" ]; then
    log_error "环境变量文件不存在: $ENV_FILE"
    exit 1
fi

# 读取环境变量
export $(grep -v '^#' "$ENV_FILE" | xargs)

# 配置变量
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-3306}"
DB_USER="${DB_USER}"
DB_PASSWORD="${DB_PASSWORD}"
DB_NAME="${DB_NAME}"

# 备份目录
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"

# 验证必需的环境变量
if [ -z "$DB_USER" ] || [ -z "$DB_PASSWORD" ] || [ -z "$DB_NAME" ]; then
    log_error "缺少必需的数据库配置: DB_USER, DB_PASSWORD, DB_NAME"
    exit 1
fi

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 生成备份文件名（包含时间戳）
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_backup_${TIMESTAMP}.sql"
COMPRESSED_FILE="${BACKUP_FILE}.gz"

log_info "开始备份数据库: $DB_NAME"
log_info "备份目录: $BACKUP_DIR"

# 执行 MySQL dump
log_info "正在导出数据库..."
if mysqldump \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --user="$DB_USER" \
    --password="$DB_PASSWORD" \
    --single-transaction \
    --routines \
    --triggers \
    --events \
    --add-drop-database \
    --databases "$DB_NAME" \
    > "$BACKUP_FILE" 2>/dev/null; then
    log_info "数据库导出成功: $BACKUP_FILE"
else
    log_error "数据库导出失败"
    rm -f "$BACKUP_FILE"
    exit 1
fi

# 压缩备份文件
log_info "正在压缩备份文件..."
if gzip -f "$BACKUP_FILE"; then
    log_info "备份文件压缩成功: $COMPRESSED_FILE"
    BACKUP_SIZE=$(du -h "$COMPRESSED_FILE" | cut -f1)
    log_info "备份文件大小: $BACKUP_SIZE"
else
    log_error "备份文件压缩失败"
    exit 1
fi

# 清理旧备份
log_info "正在清理 ${BACKUP_RETENTION_DAYS} 天前的旧备份..."
DELETED_COUNT=0
while IFS= read -r old_backup; do
    if [ -f "$old_backup" ]; then
        rm -f "$old_backup"
        log_info "已删除旧备份: $(basename "$old_backup")"
        ((DELETED_COUNT++))
    fi
done < <(find "$BACKUP_DIR" -name "${DB_NAME}_backup_*.sql.gz" -type f -mtime +${BACKUP_RETENTION_DAYS})

if [ $DELETED_COUNT -eq 0 ]; then
    log_info "没有需要清理的旧备份"
else
    log_info "已清理 $DELETED_COUNT 个旧备份文件"
fi

# 显示当前备份列表
log_info "当前备份文件列表:"
ls -lh "$BACKUP_DIR"/${DB_NAME}_backup_*.sql.gz 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'

log_info "备份完成！"
exit 0
