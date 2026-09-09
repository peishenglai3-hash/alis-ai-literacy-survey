"""会话包（session bundle）打包器。

把一场访谈从数据库导出成标准化、可携带、可校验的目录，供 S5 汇聚管线入库到
私有中心分析库。这是"本地采集 → 中心分析"两层架构的连接件——断裂点的解法。

设计约束：
- 时间戳由 DB 已有值或 exported_at 参数传入，**不在核心逻辑里现取系统时间**（可复现）。
- 音频不入 JSON；audio_file_id 指向本地文件，若存在则复制进 audio/ 子目录。
- checksums.sha256 + manifest 指纹让入库端能反向校验完整性。
"""
from __future__ import annotations

import hashlib
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session as OrmSession

from .models import (
    DimensionScore,
    LikertResponse,
    NarrativeSegment,
    PersonalityProfile,
    ProbeEvent,
    QuestionReaction,
    Session,
)

BUNDLE_SCHEMA_VERSION = "1.0"


def _iso(dt: Optional[datetime]) -> Optional[str]:
    return dt.isoformat() if dt is not None else None


def _dump_json(path: Path, obj: Any) -> None:
    path.write_text(json.dumps(obj, ensure_ascii=False, indent=2, sort_keys=True), encoding="utf-8")


def _sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


def export_session(
    session_id: str,
    out_dir: str | Path,
    db_session: OrmSession,
    exported_at: Optional[datetime] = None,
) -> Path:
    """导出一场访谈为会话包目录，返回该目录路径。

    exported_at 若为 None，仅在导出边界取一次 UTC 时间（非核心逻辑），
    测试应显式传入以保可复现。
    """
    sess = db_session.get(Session, session_id)
    if sess is None:
        raise ValueError(f"session 不存在：{session_id}")

    exported_at = exported_at or datetime.now(timezone.utc)
    root = Path(out_dir) / f"session_{session_id}"
    audio_dir = root / "audio"
    transcripts_dir = root / "transcripts"
    for d in (root, audio_dir, transcripts_dir):
        d.mkdir(parents=True, exist_ok=True)

    def _all(model, order_col):
        return db_session.execute(
            select(model).where(model.session_id == session_id).order_by(order_col)
        ).scalars().all()

    likerts = _all(LikertResponse, LikertResponse.answered_at)
    dims = _all(DimensionScore, DimensionScore.dimension_id)
    profiles = _all(PersonalityProfile, PersonalityProfile.dimension_id)
    probes = _all(ProbeEvent, ProbeEvent.asked_at)
    narratives = _all(NarrativeSegment, NarrativeSegment.t_start)
    reactions = _all(QuestionReaction, QuestionReaction.item_id)

    scale_responses = {
        "likert_responses": [
            {
                "item_id": r.item_id,
                "raw_score": r.raw_score,
                "answered_at": _iso(r.answered_at),
                "locked_at": _iso(r.locked_at),
            }
            for r in likerts
        ],
        "dimension_scores": [
            {"dimension_id": d.dimension_id, "score": d.score, "computed_at": _iso(d.computed_at)}
            for d in dims
        ],
        "personality_profiles": [
            {
                "dimension_id": p.dimension_id,
                "percentile": p.percentile,
                "ci_low": p.ci_low,
                "ci_high": p.ci_high,
                "self_named_label": p.self_named_label,
            }
            for p in profiles
        ],
    }
    narrative_json = [
        {
            "segment_id": n.segment_id,
            "ref_item_id": n.ref_item_id,
            "transcript": n.transcript,
            "t_start": n.t_start,
            "t_end": n.t_end,
            "audio_file_id": n.audio_file_id,  # 仅指针，音频本体不在此
        }
        for n in narratives
    ]
    probe_json = [
        {"target_item_id": p.target_item_id, "probe_text": p.probe_text, "asked_at": _iso(p.asked_at)}
        for p in probes
    ]
    reaction_json = [
        {
            "item_id": r.item_id,
            "exposed": r.exposed,
            "express_len": r.express_len,
            "emotion_intensity": r.emotion_intensity,
        }
        for r in reactions
    ]

    files = {
        "scale_responses.json": scale_responses,
        "narrative_segments.json": narrative_json,
        "probe_events.json": probe_json,
        "question_reactions.json": reaction_json,
    }
    for name, obj in files.items():
        _dump_json(root / name, obj)

    # 复制音频（若 audio_file_id 指向存在的本地文件）
    copied_audio: list[str] = []
    for n in narratives:
        if n.audio_file_id:
            src = Path(n.audio_file_id)
            if src.is_file():
                dst = audio_dir / src.name
                shutil.copy2(src, dst)
                copied_audio.append(dst.name)

    # 校验和：json + 已复制音频
    checksum_targets = [root / name for name in files]
    checksum_targets += [audio_dir / a for a in copied_audio]
    checksum_lines = []
    file_index: dict[str, dict[str, str]] = {}
    for target in checksum_targets:
        rel = target.relative_to(root).as_posix()
        digest = _sha256(target)
        checksum_lines.append(f"{digest}  {rel}")
        file_index[rel] = {"sha256": digest}
    (root / "checksums.sha256").write_text("\n".join(checksum_lines) + "\n", encoding="utf-8")

    manifest = {
        "bundle_schema_version": BUNDLE_SCHEMA_VERSION,
        "scale_version": sess.scale_version,
        "session_id": sess.session_id,
        "facilitator_id": sess.facilitator_id,
        "started_at": _iso(sess.started_at),
        "age_screen_pass": sess.age_screen_pass,
        "exported_at": _iso(exported_at),
        "files": file_index,
        "counts": {
            "likert_responses": len(likerts),
            "dimension_scores": len(dims),
            "personality_profiles": len(profiles),
            "probe_events": len(probes),
            "narrative_segments": len(narratives),
            "question_reactions": len(reactions),
            "audio_files": len(copied_audio),
        },
    }
    _dump_json(root / "manifest.json", manifest)
    return root


def verify_bundle(bundle_dir: str | Path) -> bool:
    """入库端反向校验：逐一比对 checksums.sha256。缺文件或指纹不符抛 ValueError。"""
    root = Path(bundle_dir)
    checksum_file = root / "checksums.sha256"
    if not checksum_file.is_file():
        raise ValueError("缺 checksums.sha256")
    for line in checksum_file.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        digest, rel = line.split("  ", 1)
        target = root / rel
        if not target.is_file():
            raise ValueError(f"会话包缺文件：{rel}")
        if _sha256(target) != digest:
            raise ValueError(f"校验和不符：{rel}")
    return True
