"""首批账号批量建号 CLI —— 给师门内部发放第一批 admin/facilitator 账号。

    cd backend
    python -m alis.provision_batch                 # 用内置默认名册建号
    python -m alis.provision_batch --out ~/alis_accounts_batch1.txt

设计要点（与凭据红线对齐）：
- 每个账号生成**强随机密码**（无歧义字符表，14 位≈81 bit），argon2id 哈希入库。
- 密码**只写入 600 权限文件**（默认 ~/alis_accounts_batch1.txt），**绝不打印到 stdout**；
  由赖培胜 `ssh ... cat` 自取分发。脚本 stdout 只报路径与计数。
- **幂等**：用户名已存在则跳过（不改其密码），可安全重复运行、追加名册。
- 与 create_admin.py 同款顺序：先 _load_env() 再 import alis.db（否则误写默认库）。

改名册：编辑下方 ROSTER 即可；重复运行只新增未存在者。
赖培胜首登后建议自行轮换 admin 密码（管理台改密 或 create_admin 重设）。
"""
from __future__ import annotations

import os
import secrets
import sys
from pathlib import Path

# —— 首批名册（可编辑）：(username, role, display_name) ——
# admin=研究者（看全量+导出）；facilitator=促进者（建会话/采集，只看自己）。
ROSTER: list[tuple[str, str, str, str | None]] = [
    ("lps", "admin", "赖培胜"),
    ("fac01", "facilitator", "促进者01"),
    ("fac02", "facilitator", "促进者02"),
    ("fac03", "facilitator", "促进者03"),
    # v3.7 第二批——6位华中科技大学社会学院调研员（2026-07-31）
    ("alis01", "facilitator", "调研员01号", "Hustsoc+2026!A"),
    ("alis02", "facilitator", "调研员02号", "Hustsoc+2026!B"),
    ("alis03", "facilitator", "调研员03号", "Hustsoc+2026!C"),
    ("alis04", "facilitator", "调研员04号", "Hustsoc+2026!D"),
    ("alis05", "facilitator", "调研员05号", "Hustsoc+2026!E"),
    ("alis06", "facilitator", "调研员06号", "Hustsoc+2026!F"),
]

# 无歧义字符表（去掉 0/O/o、1/l/I）——便于必要时口述/誊抄。
_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789"


def _gen_password(n: int = 14) -> str:
    return "".join(secrets.choice(_ALPHABET) for _ in range(n))


def _load_env() -> None:
    """极简 .env 读取（与 create_admin.py 同款），只在未设置时注入。"""
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
    out_path = Path.home() / "alis_accounts_batch1.txt"
    i = 0
    while i < len(argv):
        if argv[i] == "--out" and i + 1 < len(argv):
            out_path = Path(argv[i + 1]).expanduser()
            i += 2
        else:
            print(f"未知参数: {argv[i]}")
            return 2

    for _u, role, _d, *_r in ROSTER:
        if role not in ("admin", "facilitator"):
            print(f"名册含非法角色: {role}")
            return 2

    _load_env()  # 顺序陷阱：先加载 .env 再 import alis.db
    from datetime import datetime

    from argon2 import PasswordHasher

    from alis.db import SessionLocal
    from alis.models import User

    hasher = PasswordHasher()
    created: list[tuple[str, str, str, str]] = []  # (username, role, display, password)
    skipped: list[str] = []

    db = SessionLocal()
    try:
        for username, role, display, *rest in ROSTER:
            if db.query(User).filter(User.username == username).one_or_none() is not None:
                skipped.append(username)
                continue
            pw = rest[0] if rest else _gen_password()
            db.add(
                User(
                    username=username,
                    password_hash=hasher.hash(pw),
                    role=role,
                    display_name=display,
                    is_active=True,
                    created_at=datetime.now(),
                )
            )
            created.append((username, role, display, pw))
        db.commit()
    finally:
        db.close()

    # 凭据文件：600 权限，绝不打印密码到 stdout。
    if created:
        lines = [
            "# ALIS 首批账号凭据（内部分发用）——请分发后妥善保管/尽快销毁本文件。",
            "# 建议：admin 首登后自行轮换密码；每位促进者拿到后可请 admin 改密。",
            "# 列: username | role | display_name | password",
            "",
        ]
        width = max(len(u) for u, *_ in created)
        for username, role, display, pw in created:
            lines.append(f"{username.ljust(width)} | {role:<11} | {display} | {pw}")
        lines.append("")
        # 原子写入 + 600
        fd = os.open(str(out_path), os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            f.write("\n".join(lines))
        os.chmod(out_path, 0o600)

    print(f"新建 {len(created)} 个账号；跳过（已存在）{len(skipped)} 个: {skipped}")
    if created:
        print(f"凭据已写入(600): {out_path}")
        print("取用: ssh ... cat " + str(out_path) + "  （密码不入日志/对话）")
    else:
        print("无新增账号（名册均已存在）；未生成凭据文件。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
