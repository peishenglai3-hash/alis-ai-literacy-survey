from __future__ import annotations

import hashlib
import re
from collections import Counter
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Cm, Pt, RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

from build_alis_ethnography import add_page_number, add_table, configure_section, set_cell_shading, setup_styles, style_run


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "交互记录" / "ALIS开发交互全记录_人机协作原始档案.docx"
OUT = Path(__file__).with_name("ALIS原生人机交互记录_完整可读研究版.docx")

LABEL_RE = re.compile(r"^【([^】]+)】")
DATE_RE = re.compile(r"^\s*──\s*\d{4}年\d{1,2}月\d{1,2}日\s*──\s*$")
SECRET_RE = re.compile(r"sk-[A-Za-z0-9_-]{8,}")
BEARER_RE = re.compile(r"(?i)(Bearer\s+)[^\s,，;；\"'}]+")
ASSIGN_SECRET_RE = re.compile(r"(?i)((?:api[_ -]?key|secret|password|密钥)\s*[:=]\s*)[^\s,，;；\"'}]+")
PRIVATE_KEY_RE = re.compile(r"-----BEGIN [^-]+ PRIVATE KEY-----.*?-----END [^-]+ PRIVATE KEY-----", re.S)
IP_RE = re.compile(r"(?<![\d.])(?!(?:127\.0\.0\.1|0\.0\.0\.0))\d{1,3}(?:\.\d{1,3}){3}(?![\d.])")
CONTROL_RE = re.compile(r"[\x00-\x08\x0B\x0C\x0E-\x1F]")
MIXED_RE = re.compile(r"[ -~]+|[^ -~]+")

ROLE_COLORS = {
    "用户": "234E70",
    "Claude": "2F6B4F",
    "思考": "687681",
    "工具调用": "9A6415",
    "工具结果": "4B5963",
    "系统/命令": "714B8E",
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def redact(text: str, stats: Counter[str]) -> str:
    original = text

    def replace_private(match: re.Match[str]) -> str:
        stats["private_key_block"] += 1
        return "[已脱敏：私钥块]"

    def replace_secret(match: re.Match[str]) -> str:
        stats["api_key"] += 1
        return "[已脱敏：API 密钥]"

    def replace_bearer(match: re.Match[str]) -> str:
        stats["bearer_token"] += 1
        return match.group(1) + "[已脱敏：Bearer 凭据]"

    def replace_assignment(match: re.Match[str]) -> str:
        stats["secret_assignment"] += 1
        return match.group(1) + "[已脱敏：敏感值]"

    def replace_ip(match: re.Match[str]) -> str:
        stats["ip_address"] += 1
        return "[已脱敏：IP 地址]"

    text = PRIVATE_KEY_RE.sub(replace_private, text)
    text = SECRET_RE.sub(replace_secret, text)
    text = BEARER_RE.sub(replace_bearer, text)
    text = ASSIGN_SECRET_RE.sub(replace_assignment, text)
    text = IP_RE.sub(replace_ip, text)
    cleaned = CONTROL_RE.sub("", text)
    if cleaned != original and CONTROL_RE.search(text):
        stats["control_character"] += 1
    return cleaned


def role_key(label: str | None) -> str | None:
    if label is None:
        return None
    for key in ("用户", "Claude", "思考", "工具调用", "工具结果", "系统/命令"):
        if label.startswith(key):
            return key
    return label


def set_run_font(run, *, ascii_font: bool, size: float, color: str, bold: bool = False, italic: bool = False) -> None:
    run.font.name = "Consolas" if ascii_font else "Microsoft YaHei"
    east_asia = "等线" if ascii_font else "微软雅黑"
    run._element.get_or_add_rPr().rFonts.set(qn("w:eastAsia"), east_asia)
    run.font.size = Pt(size)
    run.font.color.rgb = RGBColor.from_string(color)
    run.bold = bold
    run.italic = italic


def add_mixed_text(paragraph, text: str, *, size: float, color: str, bold: bool = False, italic: bool = False) -> None:
    for match in MIXED_RE.finditer(text):
        chunk = match.group(0)
        ascii_font = all(ord(char) < 128 for char in chunk)
        run = paragraph.add_run(chunk)
        set_run_font(run, ascii_font=ascii_font, size=size, color=color, bold=bold, italic=italic)


def set_paragraph_left_border(paragraph, color: str = "B7C3D0", size: str = "10") -> None:
    p_pr = paragraph._p.get_or_add_pPr()
    borders = p_pr.find(qn("w:pBdr"))
    if borders is None:
        borders = OxmlElement("w:pBdr")
        p_pr.append(borders)
    left = borders.find(qn("w:left"))
    if left is None:
        left = OxmlElement("w:left")
        borders.append(left)
    left.set(qn("w:val"), "single")
    left.set(qn("w:sz"), size)
    left.set(qn("w:space"), "5")
    left.set(qn("w:color"), color)


def add_title_page(doc: Document, source_hash: str, paragraph_count: int) -> None:
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(58)
    run = p.add_run("ALIS")
    style_run(run, bold=True, color="234E70", size=33)
    p2 = doc.add_paragraph()
    p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p2.paragraph_format.space_after = Pt(12)
    run = p2.add_run("原生人机交互记录")
    style_run(run, bold=True, color="111111", size=21)
    p3 = doc.add_paragraph()
    p3.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p3.paragraph_format.space_after = Pt(24)
    run = p3.add_run("完整可读研究版 · 脱敏审阅副本")
    style_run(run, bold=True, color="355C7D", size=14)
    table = doc.add_table(rows=1, cols=1)
    table.alignment = 1
    cell = table.cell(0, 0)
    set_cell_shading(cell, "EDF5F8")
    cell.text = ""
    paragraph = cell.paragraphs[0]
    paragraph.paragraph_format.line_spacing = 1.2
    add_mixed_text(
        paragraph,
        "完整性声明：正文按保留档案的原段落顺序重排；用户消息、Claude 回复、Claude 思考及工具调用/结果文本均保留到现有档案所提供的范围。仅对密钥、Bearer 凭据、私钥块和 IP 地址做显式脱敏；原始 DOCX 不被改写。工具 I/O 若在原档案中已被截断，本副本不虚构缺失内容。",
        size=9.5,
        color="24445B",
    )
    p4 = doc.add_paragraph()
    p4.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p4.paragraph_format.space_before = Pt(55)
    run = p4.add_run(
        "源档案：ALIS开发交互全记录_人机协作原始档案.docx\n"
        f"源档案段落：{paragraph_count:,} · 源档案 SHA-256：{source_hash}\n"
        "生成：2026-09-09 · 用途：作者审阅、研究索引与人机民族志分析"
    )
    style_run(run, color="536878", size=9)
    doc.add_page_break()


def add_front_matter(doc: Document, paragraphs, counts: Counter[str], redactions: Counter[str], source_hash: str) -> None:
    add_heading = doc.add_paragraph
    p = add_heading(style="Heading 1")
    p.paragraph_format.keep_with_next = True
    style_run(p.add_run("文档说明与证据边界"), bold=True, color="111111", size=15)
    for text in [
        "这是从本地仍保留的原始协作 DOCX 制作的可读研究副本。它不声称重新找回 Claude Code 平台上的完整 JSONL；当前项目中未找到原档案元数据所指向的 session 源日志，因此工具调用和工具结果的完整性以原 DOCX 已保存的文本为准。",
        "为保护项目和第三方，副本只遮蔽高风险值，不删除事件、不去重、不重写用户 Prompt 或 Claude 输出。脱敏标记是正文中的可见文本，便于研究者知道此处存在原值但不应在研究副本中传播。",
        "原档案仍保留在交互记录目录，未被覆盖；本副本与原档案均不进入 GitHub。外部反馈文件、合规材料和源代码也不因本次排版而发生变化。",
    ]:
        p = doc.add_paragraph()
        p.paragraph_format.line_spacing = 1.2
        p.paragraph_format.space_after = Pt(5)
        p.paragraph_format.first_line_indent = Cm(0.7)
        add_mixed_text(p, text, size=9.5, color="27343B")
    p = doc.add_paragraph(style="Heading 2")
    p.paragraph_format.keep_with_next = True
    style_run(p.add_run("源档案与统计"), bold=True, color="111111", size=11.5)
    rows = [
        ("源文件", SOURCE.name),
        ("会话 ID", "46c669f2-bec3-4e41-b671-6632afb6a774"),
        ("对话时间", "2026-07-10 01:12:33 CST 至 2026-07-11 22:48:45 CST"),
        ("原始记录数", "17,364 条（源档案元数据记录）"),
        ("源 DOCX 段落", f"{len(paragraphs):,}"),
        ("源 JSONL", "元数据路径指向的文件未在当前项目或 C:\\Users\\35636\\.claude 中找到"),
        ("源档案 SHA-256", source_hash),
        ("本副本生成规则", "保序、保留角色与正文；高风险凭据显式脱敏；不对事件做去重"),
    ]
    add_table(doc, ["字段", "值"], rows, widths=[3.1, 13.2], font_size=8)
    p = doc.add_paragraph(style="Heading 2")
    p.paragraph_format.keep_with_next = True
    style_run(p.add_run("角色统计"), bold=True, color="111111", size=11.5)
    count_rows = [(key, f"{value:,}") for key, value in counts.most_common()]
    add_table(doc, ["源档案标签", "段落数"], count_rows, widths=[7.5, 8.8], font_size=8)
    p = doc.add_paragraph(style="Heading 2")
    p.paragraph_format.keep_with_next = True
    style_run(p.add_run("脱敏统计"), bold=True, color="111111", size=11.5)
    redact_rows = [
        ("API key", str(redactions.get("api_key", 0))),
        ("Bearer 凭据", str(redactions.get("bearer_token", 0))),
        ("敏感赋值", str(redactions.get("secret_assignment", 0))),
        ("私钥块", str(redactions.get("private_key_block", 0))),
        ("IP 地址", str(redactions.get("ip_address", 0))),
        ("不可见控制字符", str(redactions.get("control_character", 0))),
    ]
    add_table(doc, ["类型", "替换次数"], redact_rows, widths=[7.5, 8.8], font_size=8)
    p = doc.add_paragraph(style="Heading 2")
    p.paragraph_format.keep_with_next = True
    style_run(p.add_run("阅读索引"), bold=True, color="111111", size=11.5)
    for item in [
        "日期线使用 Heading 1；角色标签使用带颜色的事件标题。事件标题前的“事件号/源段号”是本副本新增索引，不是原档案正文。",
        "用户和 Claude 正文使用 Microsoft YaHei；英文、路径、命令和 JSON 片段使用 Consolas；混合段落按字符类别拆分字体，便于可视化阅读。",
        "思考、工具调用、工具结果仍然可见，因为它们是本次人机民族志的研究对象；但它们不能自动被当作作者意图、事实证据或运行成功的证明。",
        "研究引用时建议同时记录日期线、事件号和源段号，并注明内容来自“脱敏审阅副本”，避免把重排标记误当成原始文字。",
    ]:
        p = doc.add_paragraph(style="List Bullet")
        p.paragraph_format.left_indent = Cm(0.75)
        p.paragraph_format.first_line_indent = Cm(-0.35)
        p.paragraph_format.line_spacing = 1.15
        add_mixed_text(p, item, size=9.2, color="27343B")
    doc.add_page_break()


def add_source_paragraph(doc: Document, source_index: int, text: str, current_role: str | None, event_number: int, label: str | None) -> None:
    paragraph = doc.add_paragraph()
    paragraph.paragraph_format.widow_control = True
    if text == "":
        paragraph.paragraph_format.space_after = Pt(1)
        paragraph.paragraph_format.line_spacing = 0.55
        return
    if DATE_RE.match(text):
        paragraph.style = "Heading 1"
        paragraph.paragraph_format.keep_with_next = True
        paragraph.paragraph_format.space_before = Pt(12)
        paragraph.paragraph_format.space_after = Pt(4)
        add_mixed_text(paragraph, f"源段 {source_index:05d}  ", size=8, color="6B7C89", bold=False)
        add_mixed_text(paragraph, text, size=13, color="234E70", bold=True)
        return
    if label is not None:
        key = role_key(label) or ""
        color = ROLE_COLORS.get(key, "355C7D")
        paragraph.paragraph_format.keep_with_next = True
        paragraph.paragraph_format.space_before = Pt(7)
        paragraph.paragraph_format.space_after = Pt(2)
        paragraph.paragraph_format.line_spacing = 1.05
        paragraph.paragraph_format.left_indent = Cm(0.1)
        set_paragraph_left_border(paragraph, color=color, size="12")
        add_mixed_text(paragraph, f"事件 {event_number:04d} · 源段 {source_index:05d}  ", size=7.2, color="7A8790")
        add_mixed_text(paragraph, text, size=10, color=color, bold=True)
        return
    key = current_role or ""
    if key in ("工具调用", "工具结果"):
        size = 8.15
        color = "46545D"
        paragraph.paragraph_format.left_indent = Cm(0.5)
        paragraph.paragraph_format.right_indent = Cm(0.25)
        paragraph.paragraph_format.line_spacing = 0.98
        paragraph.paragraph_format.space_after = Pt(1)
    elif key == "思考":
        size = 9.0
        color = "687681"
        paragraph.paragraph_format.left_indent = Cm(0.3)
        paragraph.paragraph_format.line_spacing = 1.08
        paragraph.paragraph_format.space_after = Pt(2)
    elif key == "用户":
        size = 9.6
        color = "243E52"
        paragraph.paragraph_format.left_indent = Cm(0.22)
        paragraph.paragraph_format.line_spacing = 1.16
        paragraph.paragraph_format.space_after = Pt(3)
    elif key == "Claude":
        size = 9.6
        color = "273F35"
        paragraph.paragraph_format.left_indent = Cm(0.22)
        paragraph.paragraph_format.line_spacing = 1.16
        paragraph.paragraph_format.space_after = Pt(3)
    else:
        size = 9.2
        color = "27343B"
        paragraph.paragraph_format.left_indent = Cm(0.1)
        paragraph.paragraph_format.line_spacing = 1.12
        paragraph.paragraph_format.space_after = Pt(3)
    add_mixed_text(paragraph, text, size=size, color=color)


def add_archive_body(doc: Document, source_paragraphs, redactions: Counter[str]) -> Counter[str]:
    add_heading = doc.add_paragraph
    p = add_heading(style="Heading 1")
    p.paragraph_format.keep_with_next = True
    style_run(p.add_run("原档案正文：保序重排"), bold=True, color="111111", size=15)
    p = doc.add_paragraph()
    p.paragraph_format.line_spacing = 1.15
    p.paragraph_format.space_after = Pt(8)
    add_mixed_text(
        p,
        "以下段落依照源 DOCX 的段落顺序逐段进入。标签原文保留；“事件 0001 · 源段 00016”等索引是本副本新增的阅读标记。内容中的脱敏标记代表原档案存在对应高风险值，原始档案未被本次操作覆盖。",
        size=9.3,
        color="37474F",
    )
    current_role: str | None = None
    event_number = 0
    counts: Counter[str] = Counter()
    for source_index, paragraph in enumerate(source_paragraphs):
        raw = paragraph.text
        safe = redact(raw, redactions)
        match = LABEL_RE.match(raw.strip())
        label = match.group(0) if match else None
        if label is not None:
            event_number += 1
            counts[label] += 1
            current_role = role_key(label)
        add_source_paragraph(doc, source_index, safe, current_role, event_number, label)
        if (source_index + 1) % 1000 == 0:
            print(f"processed source paragraphs: {source_index + 1}")
    print(f"events: {event_number}")
    return counts


def scan_redactions(source_paragraphs) -> Counter[str]:
    stats: Counter[str] = Counter()
    for paragraph in source_paragraphs:
        redact(paragraph.text, stats)
    return stats

def main() -> None:
    if not SOURCE.exists():
        raise FileNotFoundError(SOURCE)
    source_hash = sha256(SOURCE)
    source_doc = Document(SOURCE)
    source_paragraphs = list(source_doc.paragraphs)
    redactions = scan_redactions(source_paragraphs)

    doc = Document()
    setup_styles(doc)
    for section in doc.sections:
        configure_section(section)
    section = doc.sections[0]
    header = section.header.paragraphs[0]
    header.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    style_run(header.add_run("ALIS · 原生交互记录 / 脱敏研究副本"), color="6B7C89", size=8)
    footer = section.footer.paragraphs[0]
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    style_run(footer.add_run("完整保序重排 · 2026-09-09 · 第 "), color="6B7C89", size=8)
    add_page_number(footer)

    add_title_page(doc, source_hash, len(source_paragraphs))
    # First pass over the source is intentionally read-only and only computes labels.
    counts: Counter[str] = Counter()
    for paragraph in source_paragraphs:
        match = LABEL_RE.match(paragraph.text.strip())
        if match:
            counts[match.group(0)] += 1
    add_front_matter(doc, source_paragraphs, counts, redactions, source_hash)
    body_counts = add_archive_body(doc, source_paragraphs, Counter())

    # Store both raw-label and normalized counts in core properties for quick machine inspection.
    doc.core_properties.title = "ALIS 原生人机交互记录：完整可读研究版"
    doc.core_properties.subject = "保序的人类 Prompt、Claude 输出、思考与工具 I/O 脱敏审阅副本"
    doc.core_properties.author = "ALIS contributors"
    doc.core_properties.comments = "The source DOCX remains unchanged. High-risk credentials are visibly redacted in this derivative copy."
    OUT.parent.mkdir(parents=True, exist_ok=True)
    doc.save(OUT)
    print(OUT)
    print(f"source_sha256={source_hash}")
    print(f"redactions={dict(redactions)}")
    print(f"body_label_counts={dict(body_counts)}")


if __name__ == "__main__":
    main()
