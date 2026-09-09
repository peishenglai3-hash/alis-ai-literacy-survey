"""建立账号 CLI —— 首个管理员引导（鸡生蛋），亦可复用为通用建号工具。

    cd backend
    python -m alis.create_admin <username>                 # 建 admin
    python -m alis.create_admin <username> --role facilitator

密码经 getpass 两次确认输入：**不回显、不进 shell 历史、不进环境变量/命令行参数**。
必须先加载 .env 再 import alis.db（db.py 导入即读 DATABASE_URL 并建 engine，
否则会误往默认 ./alis_local.db 建号而非生产库）。
"""
from __future__ import annotations

import getpass
import os
import sys
from pathlib import Path


def _load_env() -> None:
    """极简 .env 读取（与 main.py 同款），只在未设置时注入 os.environ。"""
    env = Path(__file__).resolve().parents[1] / ".env"
    if not env.exists():
        return
    for line in env.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip())


def main(argv: list[str]) -> int:
    role = "admin"
    positional: list[str] = []
    i = 0
    while i < len(argv):
        if argv[i] == "--role" and i + 1 < len(argv):
            role = argv[i + 1]
            i += 2
        else:
            positional.append(argv[i])
            i += 1

    if not positional:
        print("用法: python -m alis.create_admin <username> [--role admin|facilitator]")
        return 2
    username = positional[0]
    if role not in ("admin", "facilitator"):
        print(f"非法角色: {role}（仅 admin / facilitator）")
        return 2

    # 顺序陷阱：务必先加载 .env 再 import alis.db（db.py 导入时即读 DATABASE_URL）。
    _load_env()
    from datetime import datetime

    from argon2 import PasswordHasher

    from alis.db import SessionLocal
    from alis.models import User

    pw1 = getpass.getpass("设置密码（输入不回显）: ")
    pw2 = getpass.getpass("再次确认密码: ")
    if pw1 != pw2:
        print("两次输入不一致，已取消。")
        return 1
    if len(pw1) < 12:
        print("密码至少 12 位，已取消。")
        return 1
    # 字符类别检查（至少两类：大写/小写/数字/特殊符号）
    classes = 0
    import re
    if re.search(r"[A-Z]", pw1):
        classes += 1
    if re.search(r"[a-z]", pw1):
        classes += 1
    if re.search(r"[0-9]", pw1):
        classes += 1
    if re.search(r"[^A-Za-z0-9]", pw1):
        classes += 1
    if classes < 2:
        print("密码太弱：需包含至少两类字符（大写字母/小写字母/数字/特殊符号），已取消。")
        return 1

    db = SessionLocal()
    try:
        if db.query(User).filter(User.username == username).one_or_none() is not None:
            print(f"用户名已存在: {username}")
            return 1
        db.add(
            User(
                username=username,
                password_hash=PasswordHasher().hash(pw1),
                role=role,
                display_name=username,
                is_active=True,
                created_at=datetime.now(),
            )
        )
        db.commit()
    finally:
        db.close()
    print(f"已创建 {role} 账号: {username}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
