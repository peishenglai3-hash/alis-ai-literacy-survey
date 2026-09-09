#!/usr/bin/env bash
# ============================================================
# ALIS 数据库自动备份脚本（v3.12）
# ECS Linux (Alibaba Cloud) 每日 cron 调用
# 备份方式：sqlite3 VACUUM INTO（事务一致、不阻塞写、WAL 安全）
# 滚动保留 14 天
# ============================================================
set -euo pipefail

DB_PATH="/opt/alis/backend/alis_local.db"
BACKUP_DIR="/opt/alis/backups"
RETENTION_DAYS=14

if [ ! -f "$DB_PATH" ]; then
  echo "[$(date)] [跳过] 数据库文件不存在：$DB_PATH"
  exit 0
fi

mkdir -p "$BACKUP_DIR"

TS=$(date +%F_%H%M)
BACKUP_FILE="$BACKUP_DIR/alis_$TS.sqlite"

echo "[$(date)] ALIS 数据库备份中..."
echo "  源: $DB_PATH"
echo "  目标: $BACKUP_FILE"

sqlite3 -readonly "$DB_PATH" "VACUUM INTO '$BACKUP_FILE'"

if [ $? -eq 0 ]; then
  echo "[$(date)] [完成] 备份已保存：$BACKUP_FILE ($(du -h "$BACKUP_FILE" | cut -f1))"
else
  echo "[$(date)] [失败] 备份出错"
  exit 1
fi

# 清理旧备份
DELETED=$(find "$BACKUP_DIR" -name "alis_*.sqlite" -mtime +$RETENTION_DAYS -delete -print | wc -l)
if [ "$DELETED" -gt 0 ]; then
  echo "[$(date)] [清理] 已删除 $DELETED 个 $RETENTION_DAYS 天前的旧备份"
fi
