# 数据库备份说明

本目录包含数据库自动备份相关的脚本和工具。

## 文件说明

- `backup.sh` - 数据库备份主脚本
- `setup-backup-cron.sh` - Cron 定时任务配置脚本
- `BACKUP_README.md` - 本说明文档

## 快速开始

### 1. 手动执行备份

```bash
# 进入脚本目录
cd scripts

# 执行备份脚本
./backup.sh
```

### 2. 配置自动备份（推荐）

```bash
# 进入脚本目录
cd scripts

# 运行 cron 配置脚本
./setup-backup-cron.sh
```

这将配置一个 cron 定时任务，每天凌晨 2:00 自动执行数据库备份。

## 备份功能

### 备份内容

- 完整的数据库结构（表、索引、外键等）
- 所有数据记录
- 存储过程、触发器、事件（如果有）

### 备份特性

1. **自动压缩**: 备份文件自动使用 gzip 压缩，节省存储空间
2. **时间戳命名**: 备份文件名包含时间戳，便于识别和管理
3. **自动清理**: 自动删除 7 天前的旧备份文件
4. **错误处理**: 备份失败时会显示错误信息并退出

### 备份文件位置

默认备份目录: `anti-theft-server/backups/`

备份文件命名格式: `{数据库名}_backup_{时间戳}.sql.gz`

示例: `character_card_anti_theft_backup_20240115_020000.sql.gz`

## 配置选项

可以通过环境变量自定义备份行为：

### 在 .env 文件中添加（可选）

```bash
# 备份目录（默认: ./backups）
BACKUP_DIR=/path/to/custom/backup/directory

# 备份保留天数（默认: 7 天）
BACKUP_RETENTION_DAYS=14
```

## Cron 定时任务管理

### 查看当前 cron 任务

```bash
crontab -l
```

### 手动编辑 cron 任务

```bash
crontab -e
```

### 删除所有 cron 任务

```bash
crontab -r
```

### 自定义备份时间

如果需要修改备份时间，编辑 cron 任务：

```bash
crontab -e
```

Cron 时间格式说明:
```
* * * * * 命令
│ │ │ │ │
│ │ │ │ └─── 星期几 (0-7, 0 和 7 都表示星期日)
│ │ │ └───── 月份 (1-12)
│ │ └─────── 日期 (1-31)
│ └───────── 小时 (0-23)
└─────────── 分钟 (0-59)
```

示例:
- `0 2 * * *` - 每天凌晨 2:00
- `0 */6 * * *` - 每 6 小时执行一次
- `0 3 * * 0` - 每周日凌晨 3:00
- `0 1 1 * *` - 每月 1 号凌晨 1:00

## 恢复数据库

### 从备份恢复

```bash
# 解压备份文件
gunzip character_card_anti_theft_backup_20240115_020000.sql.gz

# 恢复数据库
mysql -u your_user -p < character_card_anti_theft_backup_20240115_020000.sql
```

### 恢复到新数据库

```bash
# 解压备份文件
gunzip character_card_anti_theft_backup_20240115_020000.sql.gz

# 创建新数据库
mysql -u your_user -p -e "CREATE DATABASE new_database_name CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 恢复到新数据库
mysql -u your_user -p new_database_name < character_card_anti_theft_backup_20240115_020000.sql
```

## 查看备份日志

如果配置了 cron 定时任务，备份日志会保存在:

```bash
tail -f ../logs/backup.log
```

## 故障排查

### 问题: 备份脚本执行失败

**可能原因**:
1. 数据库连接失败
2. 权限不足
3. 磁盘空间不足

**解决方法**:
1. 检查 .env 文件中的数据库配置
2. 确保数据库用户有足够的权限
3. 检查磁盘空间: `df -h`

### 问题: Cron 任务未执行

**可能原因**:
1. Cron 服务未运行
2. 脚本路径错误
3. 权限问题

**解决方法**:
1. 检查 cron 服务状态: `systemctl status cron` 或 `service cron status`
2. 查看 cron 日志: `grep CRON /var/log/syslog`
3. 确保脚本有执行权限: `chmod +x backup.sh`

### 问题: 备份文件过大

**解决方法**:
1. 备份文件已经使用 gzip 压缩
2. 如果数据库很大，考虑增量备份（需要自定义实现）
3. 调整备份保留天数，减少旧备份数量

## 最佳实践

1. **定期测试恢复**: 定期测试备份文件是否可以成功恢复
2. **异地备份**: 将备份文件复制到其他服务器或云存储
3. **监控备份**: 设置监控告警，确保备份任务正常执行
4. **文档记录**: 记录备份和恢复流程，便于紧急情况下快速操作

## 安全建议

1. **保护备份文件**: 备份文件包含敏感数据，确保适当的文件权限
   ```bash
   chmod 600 backups/*.sql.gz
   ```

2. **加密备份**: 对于敏感数据，考虑加密备份文件
   ```bash
   # 加密备份
   gpg -c backup_file.sql.gz
   
   # 解密备份
   gpg backup_file.sql.gz.gpg
   ```

3. **限制访问**: 只允许必要的用户访问备份目录

## 支持

如有问题或建议，请联系系统管理员或查看项目文档。
