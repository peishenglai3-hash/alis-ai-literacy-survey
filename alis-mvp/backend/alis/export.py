"""跨会话汇聚导出（S5 汇聚管线核心）—— 供师门量化分析。

产出两张分析友好表：
  · 宽表（wide）：一行一会话，列含元数据 + Q1..Q15 原始分 + D1..D7 维度分 + D1..D7 相对位置
    + 追问目标 + 暴露反应 —— SPSS/Stata/R 直接读入即可回归/建模。
  · 长表（long）：一行一作答（session×item），便于多层模型/长格式分析。
另附 build_stats：给促进者控制台一个"暴露 A/B 方向性信号"（按条件的 express_len 均值）。

铁律无涉：本模块只读库聚合，不产内容、不评分。CSV 用 utf-8-sig（Excel 中文不乱码）。
列顺序由 Question Pack 决定（内容驱动，师门改题/维不需改本代码逻辑）。
"""
from __future__ import annotations

import csv
import io
import json
import os
import zipfile
from typing import Any

from .ab import assign_condition
from .db import get_session
from .models import (
    DimensionScore,
    InterviewRecord,
    LikertResponse,
    NarrativeSegment,
    PersonalityProfile,
    ProbeEvent,
    QuestionReaction,
    Session,
)


# ----------------------------- 列顺序（内容驱动） -----------------------------
def item_ids(pack: dict[str, Any]) -> list[str]:
    return [it["id"] for it in pack["items"]]


def dim_ids(pack: dict[str, Any]) -> list[str]:
    return [d["id"] for d in pack["dimensions"]]


def wide_columns(pack: dict[str, Any]) -> list[str]:
    cols = [
        "session_id",
        "facilitator_id",
        "scale_version",
        "condition",
        "age_screen_pass",
        "consent_ref",
        "started_at",
    ]
    cols += [f"{q}_raw" for q in item_ids(pack)]
    cols += [f"{d}_score" for d in dim_ids(pack)]
    cols += [f"{d}_pct" for d in dim_ids(pack)]
    cols += [
        "probe_target_item",
        "probe_fallback_text",
        "reaction_item",
        "reaction_exposed",
        "reaction_express_len",
        "reaction_emotion",
        "n_narratives",
        "interview_style",
        "interview_n_records",
        "interview_stages_completed",
    ]
    return cols


def long_columns() -> list[str]:
    return [
        "session_id",
        "condition",
        "facilitator_id",
        "item_id",
        "dimension_id",
        "raw_score",
        "answered_at",
        "locked_at",
    ]


# ----------------------------- 汇聚 -----------------------------
def _group(rows: list[Any], key) -> dict[str, list[Any]]:
    out: dict[str, list[Any]] = {}
    for r in rows:
        out.setdefault(key(r), []).append(r)
    return out


def build_wide_rows(db, pack: dict[str, Any]) -> list[dict[str, Any]]:
    """一行一会话的宽表。缺失单元格留空（如未提交作答的会话）。"""
    item_dim = {it["id"]: it["dimension"] for it in pack["items"]}  # noqa: F841 保留语义
    sessions = db.query(Session).order_by(Session.started_at).all()
    resp_by = _group(db.query(LikertResponse).all(), lambda r: r.session_id)
    dscore_by = _group(db.query(DimensionScore).all(), lambda r: r.session_id)
    prof_by = _group(db.query(PersonalityProfile).all(), lambda r: r.session_id)
    probe_by = _group(db.query(ProbeEvent).all(), lambda r: r.session_id)
    react_by = _group(db.query(QuestionReaction).all(), lambda r: r.session_id)
    narr_by = _group(db.query(NarrativeSegment).all(), lambda r: r.session_id)
    intv_by = _group(db.query(InterviewRecord).order_by(InterviewRecord.recorded_at).all(), lambda r: r.session_id)

    rows: list[dict[str, Any]] = []
    for s in sessions:
        sid = s.session_id
        raw = {r.item_id: r.raw_score for r in resp_by.get(sid, [])}
        dsc = {r.dimension_id: r.score for r in dscore_by.get(sid, [])}
        pct = {r.dimension_id: r.percentile for r in prof_by.get(sid, [])}
        probe = probe_by.get(sid, [])
        react = react_by.get(sid, [])
        row: dict[str, Any] = {
            "session_id": sid,
            "facilitator_id": s.facilitator_id,
            "scale_version": s.scale_version,
            "condition": assign_condition(sid),
            "age_screen_pass": int(bool(s.age_screen_pass)),
            "consent_ref": s.consent_ref or "",
            "started_at": s.started_at.isoformat() if s.started_at else "",
        }
        for q in item_ids(pack):
            row[f"{q}_raw"] = raw.get(q, "")
        for d in dim_ids(pack):
            row[f"{d}_score"] = dsc.get(d, "")
            row[f"{d}_pct"] = pct.get(d, "")
        row["probe_target_item"] = probe[-1].target_item_id if probe else ""
        row["probe_fallback_text"] = probe[-1].probe_text if probe else ""
        if react:
            r0 = react[-1]
            row["reaction_item"] = r0.item_id
            row["reaction_exposed"] = int(bool(r0.exposed))
            row["reaction_express_len"] = r0.express_len if r0.express_len is not None else ""
            row["reaction_emotion"] = r0.emotion_intensity if r0.emotion_intensity is not None else ""
        else:
            row["reaction_item"] = ""
            row["reaction_exposed"] = ""
            row["reaction_express_len"] = ""
            row["reaction_emotion"] = ""
        row["n_narratives"] = len(narr_by.get(sid, []))
        # v2.0 访谈数据
        intv_records = intv_by.get(sid, [])
        if intv_records:
            r0 = intv_records[0]
            row["interview_style"] = r0.style_id
            row["interview_n_records"] = len(intv_records)
            row["interview_stages_completed"] = len({r.stage_id for r in intv_records})
        else:
            row["interview_style"] = ""
            row["interview_n_records"] = ""
            row["interview_stages_completed"] = ""
        rows.append(row)
    return rows


def build_long_rows(db, pack: dict[str, Any]) -> list[dict[str, Any]]:
    """一行一作答的长表。"""
    item_dim = {it["id"]: it["dimension"] for it in pack["items"]}
    sessions = {s.session_id: s for s in db.query(Session).all()}
    rows: list[dict[str, Any]] = []
    for r in db.query(LikertResponse).order_by(LikertResponse.session_id, LikertResponse.item_id).all():
        s = sessions.get(r.session_id)
        rows.append(
            {
                "session_id": r.session_id,
                "condition": assign_condition(r.session_id),
                "facilitator_id": s.facilitator_id if s else "",
                "item_id": r.item_id,
                "dimension_id": item_dim.get(r.item_id, ""),
                "raw_score": r.raw_score,
                "answered_at": r.answered_at.isoformat() if r.answered_at else "",
                "locked_at": r.locked_at.isoformat() if r.locked_at else "",
            }
        )
    return rows


def interview_columns() -> list[str]:
    return [
        "session_id",
        "condition",
        "facilitator_id",
        "style_id",
        "style_confidence",
        "feedback_choice",
        "reflection_text",
        "stage_id",
        "stage_order",
        "question_id",
        "follow_up_id",
        "contradiction_id",
        "interviewer_note",
        "respondent_reply",
        "recorded_at",
    ]


def build_interview_rows(db) -> list[dict[str, Any]]:
    """一行一条访谈记录（v2.0 6 阶段认知旅程）。"""
    sessions = {s.session_id: s for s in db.query(Session).all()}
    records = db.query(InterviewRecord).order_by(
        InterviewRecord.session_id, InterviewRecord.recorded_at
    ).all()
    # stage_order: 按 recorded_at 在每个 session 内的出现序号
    stage_order: dict[str, dict[int, int]] = {}
    rows: list[dict[str, Any]] = []
    for r in records:
        s = sessions.get(r.session_id)
        sid = r.session_id
        if sid not in stage_order:
            stage_order[sid] = {}
        stage_order[sid][r.stage_id] = stage_order[sid].get(r.stage_id, 0) + 1
        rows.append({
            "session_id": sid,
            "condition": assign_condition(sid),
            "facilitator_id": s.facilitator_id if s else "",
            "style_id": r.style_id,
            "style_confidence": r.style_confidence,
            "feedback_choice": r.feedback_choice or "",
            "reflection_text": r.reflection_text or "",
            "stage_id": r.stage_id,
            "stage_order": stage_order[sid][r.stage_id],
            "question_id": r.question_id or "",
            "follow_up_id": r.follow_up_id or "",
            "contradiction_id": r.contradiction_id or "",
            "interviewer_note": r.interviewer_note,
            "respondent_reply": r.respondent_reply,
            "recorded_at": r.recorded_at.isoformat() if r.recorded_at else "",
        })
    return rows


def build_stats(db, facilitator_id: str | None = None) -> dict[str, Any]:
    """给控制台的聚合信号：会话计数、按条件计数、按条件的 express_len 均值（暴露 A/B 方向）。

    facilitator_id 非 None 时只统计该促进者的会话（促进者控制台数据范围隔离）；
    None（默认）=全量（admin 或 CLI 导出），向后兼容原签名。
    """
    sq = db.query(Session)
    if facilitator_id is not None:
        sq = sq.filter(Session.facilitator_id == facilitator_id)
    sessions = sq.all()
    n = len(sessions)
    by_cond = {"exposed": 0, "control": 0}
    for s in sessions:
        by_cond[assign_condition(s.session_id)] += 1

    sid_set = {s.session_id for s in sessions}
    reacts_all = db.query(QuestionReaction).all()
    reacts = [r for r in reacts_all if facilitator_id is None or r.session_id in sid_set]
    lens: dict[str, list[int]] = {"exposed": [], "control": []}
    for r in reacts:
        cond = assign_condition(r.session_id)
        if r.express_len is not None:
            lens[cond].append(r.express_len)

    def _mean(xs: list[int]):
        return round(sum(xs) / len(xs), 1) if xs else None

    return {
        "n_sessions": n,
        "by_condition": by_cond,
        "n_reactions": len(reacts),
        "express_len_mean": {"exposed": _mean(lens["exposed"]), "control": _mean(lens["control"])},
        "express_len_n": {"exposed": len(lens["exposed"]), "control": len(lens["control"])},
    }


# ----------------------------- CSV -----------------------------
def rows_to_csv(rows: list[dict[str, Any]], columns: list[str]) -> str:
    buf = io.StringIO()
    w = csv.DictWriter(buf, fieldnames=columns, extrasaction="ignore")
    w.writeheader()
    for r in rows:
        w.writerow(r)
    return buf.getvalue()


# ----------------------------- 数据字典（codebook） -----------------------------
# 师门量化分析的"读表说明书"：每个变量→中文标签→类型→维度归属→备注。
# 内容驱动：题干/维度名直接取自 Question Pack（师门改题/改维不需改本代码）。
def codebook_columns() -> list[str]:
    return ["table", "variable", "label_zh", "type", "dimension_id", "note"]


def _clip(text: str, n: int = 60) -> str:
    text = (text or "").replace("\n", " ").strip()
    return text if len(text) <= n else text[: n - 1] + "…"


def codebook_rows(pack: dict[str, Any]) -> list[dict[str, Any]]:
    item_stem = {it["id"]: it.get("stem_zh", "") for it in pack["items"]}
    item_dim = {it["id"]: it["dimension"] for it in pack["items"]}
    dim_name = {d["id"]: d.get("name_zh", "") for d in pack["dimensions"]}
    lk = pack.get("likert", {})
    lo, hi = lk.get("min", 1), lk.get("max", 7)

    rows: list[dict[str, Any]] = []

    def add(table, var, label, typ, dim="", note=""):
        rows.append(
            {"table": table, "variable": var, "label_zh": label, "type": typ, "dimension_id": dim, "note": note}
        )

    # --- 宽表元数据 ---
    add("wide", "session_id", "会话唯一标识", "id", note="主键，可与长表/叙事表联结")
    add("wide", "facilitator_id", "促进者/调查员编号", "str")
    add("wide", "scale_version", "量表版本", "str")
    add("wide", "condition", "暴露 A/B 条件", "factor", note="exposed=先看剖面再追问 / control=先追问")
    add("wide", "age_screen_pass", "年龄筛查通过", "int(0/1)", note="1=成年或已监护同意")
    add("wide", "consent_ref", "知情同意凭证", "str")
    add("wide", "started_at", "会话开始时间", "datetime(ISO8601)")
    # --- 宽表 Q 原始分 ---
    for q in item_ids(pack):
        add("wide", f"{q}_raw", f"[{q}] {_clip(item_stem.get(q, ''))}", f"int({lo}-{hi})", item_dim.get(q, ""))
    # --- 宽表维度分 / 相对位置 ---
    for d in dim_ids(pack):
        add("wide", f"{d}_score", f"{dim_name.get(d, d)}·维度均分", "float", d, note=f"{lo}-{hi} 均分")
        add(
            "wide", f"{d}_pct", f"{dim_name.get(d, d)}·量表内相对位置", "float", d,
            note="0-100，量表内相对位置，非人群百分位（无常模）",
        )
    # --- 宽表追问 / 反应 ---
    add("wide", "probe_target_item", "追问目标题（偏离最大题）", "str")
    add("wide", "probe_fallback_text", "追问文本（LLM 语言层产物）", "str", note="仅语言，不含逻辑判断")
    add("wide", "reaction_item", "暴露反应所属题", "str")
    add("wide", "reaction_exposed", "该题是否暴露评分过程", "int(0/1)")
    add("wide", "reaction_express_len", "表达文本长度（字符）", "int", note="暴露 A/B 主结果代理量")
    add("wide", "reaction_emotion", "情绪强度自评", "float", note="1-7")
    add("wide", "n_narratives", "叙事片段数", "count")
    add("wide", "interview_style", "v2.0 AI 协作风格类型", "str", note="ai_explorer / ai_practitioner / ai_collaborator 等 8 种")
    add("wide", "interview_n_records", "v2.0 访谈记录条数", "count")
    add("wide", "interview_stages_completed", "v2.0 已完成访谈阶段数", "int(0-6)")
    # --- 长表 ---
    add("long", "session_id", "会话唯一标识", "id")
    add("long", "condition", "暴露 A/B 条件", "factor")
    add("long", "facilitator_id", "促进者/调查员编号", "str")
    add("long", "item_id", "题目编号", "str")
    add("long", "dimension_id", "题目所属维度", "str")
    add("long", "raw_score", "Likert 原始分", f"int({lo}-{hi})")
    add("long", "answered_at", "作答时间", "datetime(ISO8601)")
    add("long", "locked_at", "锁定时间（阶段隔离）", "datetime(ISO8601)")
    # --- 访谈记录表（v2.0）---
    add("interview", "session_id", "会话唯一标识", "id", note="可与宽表/长表通过 session_id 联结")
    add("interview", "condition", "暴露 A/B 条件", "factor")
    add("interview", "facilitator_id", "促进者编号", "str")
    add("interview", "style_id", "AI 协作风格类型", "str", note="ai_explorer / ai_practitioner / ai_collaborator 等 8 种")
    add("interview", "style_confidence", "风格分类置信度", "float(0-1)")
    add("interview", "feedback_choice", "受访者反馈（符合/部分符合/不符合）", "str")
    add("interview", "reflection_text", "受访者反思文本", "str")
    add("interview", "stage_id", "认知旅程阶段编号", "int(1-6)", note="1=认识AI 2=使用AI 3=信任AI 4=与AI相处 5=理解AI 6=重新定义AI")
    add("interview", "stage_order", "阶段内记录序号", "int")
    add("interview", "question_id", "关联题目编号", "str", note="Q1-Q15，可能为空")
    add("interview", "follow_up_id", "追问模板编号", "str")
    add("interview", "contradiction_id", "矛盾检测模式编号", "str", note="C01-C08，可能为空")
    add("interview", "interviewer_note", "促进者追问/引导语", "str")
    add("interview", "respondent_reply", "受访者回复", "str")
    add("interview", "recorded_at", "记录时间", "datetime(ISO8601)")
    return rows


# ----------------------------- README（交付说明） -----------------------------
def build_readme(pack: dict[str, Any], stats: dict[str, Any], generated_at: str | None = None) -> str:
    ver = pack.get("scale_version", "unknown")
    stamp = f"生成时间：{generated_at}\n" if generated_at else ""
    return (
        "ALIS 数据交付包（AI 素养访谈量表）\n"
        "====================================\n"
        f"量表版本：{ver}\n"
        f"{stamp}"
        f"会话数：{stats.get('n_sessions', 0)}"
        f"（exposed={stats.get('by_condition', {}).get('exposed', 0)}, "
        f"control={stats.get('by_condition', {}).get('control', 0)}）\n"
        "\n"
        "【文件清单】\n"
        "  alis_wide.csv      宽表：一行一会话，含原始分/维度分/相对位置/暴露条件/反应。回归·AB 比较用。\n"
        "  alis_long.csv      长表：一行一作答（会话×题），含维度归属。多层模型/长格式分析用。\n"
        "  alis_interviews.csv 访谈记录：一行一条追问-回复（v2.0 6 阶段认知旅程）。质性分析用。\n"
        "  alis_codebook.csv  数据字典：每个变量的中文标签/类型/维度归属/备注（读表说明书）。\n"
        "  alis_stats.json    快照统计：会话计数、暴露 A/B 计数与表达长度均值（非正式统计，仅方向信号）。\n"
        "\n"
        "【编码】所有 CSV 为 UTF-8-SIG（带 BOM）——Excel 直接双击中文表头不乱码。\n"
        "\n"
        "【导入提示】\n"
        "  · SPSS：文件→导入数据→CSV，编码选 UTF-8，首行为变量名。\n"
        "  · Stata：import delimited using \"alis_wide.csv\", varnames(1) encoding(utf-8)\n"
        "  · R：read.csv(\"alis_wide.csv\", fileEncoding=\"UTF-8-BOM\")  或 readr::read_csv()\n"
        "  · 变量含义一律查 alis_codebook.csv。\n"
        "\n"
        "【隐私红线（务必遵守）】\n"
        "  · 本包含个人数据，仅限内网 / U 盘 / 加密邮件附件传输，禁止上传外部网盘或跨境。\n"
        "  · 原始音频绝不入包（叙事仅存转写文本 + 时长 + 本地路径指针）。\n"
        "  · 用于分析后按师门数据管理规定留存/销毁。\n"
    )


# ----------------------------- ZIP 交付包（一般性传输单元） -----------------------------
def build_bundle(db, pack: dict[str, Any], generated_at: str | None = None) -> bytes:
    """把宽表/长表/数据字典/统计/README 打成单个 ZIP —— 便于 U 盘/内网/邮件一次性传输。

    返回 ZIP 字节流；CSV 以 utf-8-sig 编码写入成员，JSON 以 utf-8。只读聚合，不产内容。
    """
    wide = rows_to_csv(build_wide_rows(db, pack), wide_columns(pack))
    long = rows_to_csv(build_long_rows(db, pack), long_columns())
    intv = rows_to_csv(build_interview_rows(db), interview_columns())
    codebook = rows_to_csv(codebook_rows(pack), codebook_columns())
    stats = build_stats(db)
    readme = build_readme(pack, stats, generated_at)

    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("alis_wide.csv", wide.encode("utf-8-sig"))
        z.writestr("alis_long.csv", long.encode("utf-8-sig"))
        z.writestr("alis_interviews.csv", intv.encode("utf-8-sig"))
        z.writestr("alis_codebook.csv", codebook.encode("utf-8-sig"))
        z.writestr("alis_stats.json", json.dumps(stats, ensure_ascii=False, indent=2).encode("utf-8"))
        z.writestr("README.txt", readme.encode("utf-8"))
    return buf.getvalue()


# ----------------------------- CLI -----------------------------
def main() -> int:
    """命令行导出：python -m alis.export [out_dir]。

    产出（全部 utf-8-sig / utf-8）：alis_wide.csv + alis_long.csv + alis_codebook.csv
    + alis_stats.json + 单文件交付包 alis_export.zip（便于 U 盘/内网/邮件一次性传输）。
    """
    import sys
    from datetime import datetime

    from .content import load_question_pack

    out_dir = sys.argv[1] if len(sys.argv) > 1 else "."
    os.makedirs(out_dir, exist_ok=True)
    pack = load_question_pack()
    generated_at = datetime.now().isoformat(timespec="seconds")
    db = get_session()
    try:
        wide = rows_to_csv(build_wide_rows(db, pack), wide_columns(pack))
        long = rows_to_csv(build_long_rows(db, pack), long_columns())
        intv = rows_to_csv(build_interview_rows(db), interview_columns())
        codebook = rows_to_csv(codebook_rows(pack), codebook_columns())
        stats = build_stats(db)
        bundle = build_bundle(db, pack, generated_at)
    finally:
        db.close()

    def _write(name: str, text: str, enc: str = "utf-8-sig") -> str:
        path = os.path.join(out_dir, name)
        with open(path, "w", encoding=enc, newline="") as f:
            f.write(text)
        return path

    wide_path = _write("alis_wide.csv", wide)
    long_path = _write("alis_long.csv", long)
    intv_path = _write("alis_interviews.csv", intv)
    codebook_path = _write("alis_codebook.csv", codebook)
    stats_path = _write("alis_stats.json", json.dumps(stats, ensure_ascii=False, indent=2), enc="utf-8")
    zip_path = os.path.join(out_dir, "alis_export.zip")
    with open(zip_path, "wb") as f:
        f.write(bundle)

    print(f"[导出] 宽表     → {wide_path}")
    print(f"[导出] 长表     → {long_path}")
    print(f"[导出] 访谈记录 → {intv_path}")
    print(f"[导出] 数据字典 → {codebook_path}")
    print(f"[导出] 统计     → {stats_path}")
    print(f"[交付包] ZIP    → {zip_path}（含以上四项 + README，单文件可传输）")
    print(f"[统计] {stats}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
