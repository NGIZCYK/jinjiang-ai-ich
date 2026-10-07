"""把 ENT207 报告 Markdown 转成可提交的 DOCX。

用法：
    python build_report_docx.py <input.md> <output.docx> [--title "封面标题"] [--drop-internal]

设计要点：
- 只读取 Markdown，绝不写回，保证原 .md 文件不被覆盖。
- frontmatter 自动跳过（转成 DOCX 时不需要 YAML）。
- 支持：标题层级、表格、引用块、有序/无序列表、分隔线、粗体/斜体/行内代码。
- 中日韩文本显式设置 w:eastAsia 字体，避免 Word 里中文字形回退。
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

BODY_FONT = "Segoe UI"
EA_FONT = "Microsoft YaHei"
MONO_FONT = "Consolas"

ACCENT = RGBColor(0x1F, 0x4E, 0x5F)
MUTED = RGBColor(0x55, 0x55, 0x55)

# 这些段落属于「给团队看的提交说明」，正式 DOCX 里降级为脚注式小字。
INTERNAL_MARKERS = (
    "提交前请删除本节",
    "PLACEHOLDER",
    "禁止倒填",
    "不建议在提交稿中保留",
)


def set_run_fonts(run, *, east_asian: str = EA_FONT, latin: str = BODY_FONT, size=None) -> None:
    run.font.name = latin
    rpr = run._element.get_or_add_rPr()
    rfonts = rpr.find(qn("w:rFonts"))
    if rfonts is None:
        rfonts = OxmlElement("w:rFonts")
        rpr.append(rfonts)
    rfonts.set(qn("w:ascii"), latin)
    rfonts.set(qn("w:hAnsi"), latin)
    rfonts.set(qn("w:eastAsia"), east_asian)
    if size is not None:
        run.font.size = size


INLINE_RE = re.compile(
    r"(\*\*.+?\*\*|__.+?__|`[^`]+?`|\*[^*\n]+?\*|_[^_\n]+?_)"
)


def add_inline(paragraph, text: str, *, size=None, base_bold=False, base_italic=False,
               color=None) -> None:
    """把 markdown 行内标记渲染成 run，保留粗体/斜体/等宽。"""
    text = text.replace("\\|", "|")
    # 去掉 markdown 链接，只保留显示文字（DOCX 外部链接对评分无必要）
    text = re.sub(r"\[([^\]]+)\]\(([^)]+)\)", r"\1", text)
    for token in INLINE_RE.split(text):
        if not token:
            continue
        bold, italic, mono = base_bold, base_italic, False
        body = token
        if token.startswith("**") and token.endswith("**") and len(token) > 4:
            bold, body = True, token[2:-2]
        elif token.startswith("__") and token.endswith("__") and len(token) > 4:
            bold, body = True, token[2:-2]
        elif token.startswith("`") and token.endswith("`") and len(token) > 2:
            mono, body = True, token[1:-1]
        elif token.startswith("*") and token.endswith("*") and len(token) > 2:
            italic, body = True, token[1:-1]
        elif token.startswith("_") and token.endswith("_") and len(token) > 2:
            italic, body = True, token[1:-1]
        run = paragraph.add_run(body)
        run.bold = bold
        run.italic = italic
        if mono:
            set_run_fonts(run, latin=MONO_FONT, east_asian=EA_FONT, size=size)
            run.font.size = Pt(9.5) if size is None else size
        else:
            set_run_fonts(run, size=size)
        if color is not None:
            run.font.color.rgb = color


def shade(cell, hex_fill: str) -> None:
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), hex_fill)
    tc_pr.append(shd)


def tight_cell(cell) -> None:
    """收紧单元格内边距，让宽表塞得下。"""
    tc_pr = cell._tc.get_or_add_tcPr()
    mar = OxmlElement("w:tcMar")
    for side, val in (("top", 40), ("bottom", 40), ("left", 70), ("right", 70)):
        node = OxmlElement(f"w:{side}")
        node.set(qn("w:w"), str(val))
        node.set(qn("w:type"), "dxa")
        mar.append(node)
    tc_pr.append(mar)


def split_row(line: str) -> list[str]:
    line = line.strip()
    if line.startswith("|"):
        line = line[1:]
    if line.endswith("|"):
        line = line[:-1]
    return [c.strip() for c in line.split("|")]


def is_separator(line: str) -> bool:
    """分隔行判据。注意允许单破折号对齐写法（如 `:-:`），
    否则整张表会退化成带竖线的普通段落。"""
    cells = split_row(line)
    return bool(cells) and all(re.fullmatch(r":?-+:?", c) for c in cells)


def configure_document(doc: Document) -> None:
    section = doc.sections[0]
    section.page_width = Cm(21.0)
    section.page_height = Cm(29.7)
    section.top_margin = Cm(2.0)
    section.bottom_margin = Cm(2.0)
    section.left_margin = Cm(2.0)
    section.right_margin = Cm(2.0)

    normal = doc.styles["Normal"]
    normal.font.name = BODY_FONT
    normal.font.size = Pt(10.5)
    normal._element.rPr.rFonts.set(qn("w:eastAsia"), EA_FONT)
    normal.paragraph_format.space_after = Pt(5)
    normal.paragraph_format.line_spacing = 1.25

    for name, size, color in (
        ("Heading 1", 17, ACCENT),
        ("Heading 2", 13.5, ACCENT),
        ("Heading 3", 11.5, ACCENT),
        ("Heading 4", 10.5, MUTED),
    ):
        style = doc.styles[name]
        style.font.name = BODY_FONT
        style.font.size = Pt(size)
        style.font.color.rgb = color
        style.font.bold = True
        style._element.rPr.rFonts.set(qn("w:eastAsia"), EA_FONT)
        style.paragraph_format.space_before = Pt(12 if name != "Heading 1" else 16)
        style.paragraph_format.space_after = Pt(5)


def set_table_layout(table, widths_cm: list[float]) -> None:
    """固定表格布局，并同步写入 tblGrid + 每个单元格宽度。

    python-docx 建表时会把 tblGrid 平均分，只改 cell.width 不会更新 tblGrid；
    Word/LibreOffice 在固定布局下以 tblGrid 为准，因此必须两者都写。
    """
    tbl = table._tbl
    tbl_pr = tbl.tblPr
    total_twips = int(sum(widths_cm) * 567)  # 1cm = 567 twips

    for tag in ("w:tblLayout", "w:tblW"):
        for el in tbl_pr.findall(qn(tag)):
            tbl_pr.remove(el)
    layout = OxmlElement("w:tblLayout")
    layout.set(qn("w:type"), "fixed")
    tbl_pr.append(layout)
    total = OxmlElement("w:tblW")
    total.set(qn("w:w"), str(total_twips))
    total.set(qn("w:type"), "dxa")
    tbl_pr.append(total)

    # 重写 tblGrid，使各列宽度与目标一致
    grid = tbl.find(qn("w:tblGrid"))
    if grid is not None:
        tbl.remove(grid)
    grid = OxmlElement("w:tblGrid")
    for width in widths_cm:
        col = OxmlElement("w:gridCol")
        col.set(qn("w:w"), str(int(width * 567)))
        grid.append(col)
    tbl.insert(list(tbl).index(tbl_pr) + 1, grid)

    table.autofit = False
    for row in table.rows:
        for j, width in enumerate(widths_cm):
            if j < len(row.cells):
                row.cells[j].width = Cm(width)


def compute_widths(rows: list[list[str]], total_cm: float) -> list[float]:
    """按各列内容的字符长度分配宽度，并夹逼在合理区间内。"""
    ncols = len(rows[0])
    if ncols == 1:
        return [total_cm]
    weights: list[float] = []
    for j in range(ncols):
        lens = []
        for row in rows:
            # 中文按 2 个宽度计，英文按 1 个
            text = row[j]
            w = sum(2 if "\u4e00" <= ch <= "\u9fff" else 1 for ch in text)
            lens.append(w)
        longest = max(lens) if lens else 1
        # 列宽主要由内容长度决定；下限 12 避免窄列被过度压缩，
        # 上限 46 避免某一列（如“未采用的原因”）吃掉整张表
        weights.append(min(max(longest, 12), 46) ** 0.8)
    scale = total_cm / sum(weights)
    widths = [w * scale for w in weights]
    # 单列不得窄于 1.6cm，也不得超过总宽的 62%
    floor_cm, cap_cm = 1.6, total_cm * 0.62
    widths = [min(max(w, floor_cm), cap_cm) for w in widths]
    # 归一化回总宽
    scale = total_cm / sum(widths)
    return [w * scale for w in widths]


def add_page_number_footer(doc: Document) -> None:
    footer = doc.sections[0].footer
    para = footer.paragraphs[0] if footer.paragraphs else footer.add_paragraph()
    para.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = para.add_run()
    set_run_fonts(run, size=Pt(8.5))
    run.font.color.rgb = MUTED
    for instr in ("PAGE",):
        fld_begin = OxmlElement("w:fldChar")
        fld_begin.set(qn("w:fldCharType"), "begin")
        instr_el = OxmlElement("w:instrText")
        instr_el.set(qn("xml:space"), "preserve")
        instr_el.text = f" {instr} "
        fld_sep = OxmlElement("w:fldChar")
        fld_sep.set(qn("w:fldCharType"), "separate")
        fld_end = OxmlElement("w:fldChar")
        fld_end.set(qn("w:fldCharType"), "end")
        for el in (fld_begin, instr_el, fld_sep, fld_end):
            run._r.append(el)


def add_table(doc: Document, rows: list[list[str]], total_cm: float = 17.0) -> None:
    if not rows:
        return
    width = max(len(r) for r in rows)
    rows = [r + [""] * (width - len(r)) for r in rows]
    table = doc.add_table(rows=len(rows), cols=width)
    table.style = "Table Grid"
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    for i, row in enumerate(rows):
        for j, text in enumerate(row):
            cell = table.cell(i, j)
            tight_cell(cell)
            para = cell.paragraphs[0]
            para.paragraph_format.space_after = Pt(1)
            para.paragraph_format.line_spacing = 1.08
            if i == 0:
                shade(cell, "E8EFF1")
                add_inline(para, text, size=Pt(9), base_bold=True)
            else:
                add_inline(para, text, size=Pt(9))
    set_table_layout(table, compute_widths(rows, total_cm))
    doc.add_paragraph()


def convert(md_path: Path, docx_path: Path, title: str | None, drop_internal: bool,
            drop_headings: tuple[str, ...] = ()) -> dict:
    raw = md_path.read_text(encoding="utf-8-sig")

    # 跳过 YAML frontmatter（先去掉可能的 BOM，否则 startswith 判定失败）
    raw = raw.lstrip("\ufeff")
    if raw.startswith("---"):
        parts = raw.split("---", 2)
        if len(parts) >= 3:
            raw = parts[2]

    lines = raw.split("\n")
    doc = Document()
    configure_document(doc)
    add_page_number_footer(doc)
    # A4 宽 21cm，左右各 2cm 边距 => 可用 17cm
    usable_cm = 17.0

    if title:
        heading = doc.add_heading(title, level=0)
        for run in heading.runs:
            set_run_fonts(run)

    stats = {"headings": 0, "tables": 0, "paragraphs": 0, "internal_skipped": 0,
             "internal_kept_asnote": 0}

    i = 0
    in_table = False
    table_rows: list[list[str]] = []
    quote_buf: list[str] = []

    def flush_table() -> None:
        nonlocal table_rows, in_table
        if table_rows:
            add_table(doc, table_rows, usable_cm)
            stats["tables"] += 1
        table_rows = []
        in_table = False

    def flush_quote() -> None:
        nonlocal quote_buf
        if not quote_buf:
            return
        text = " ".join(quote_buf).strip()
        quote_buf = []
        if not text:
            return
        internal = any(m in text for m in INTERNAL_MARKERS)
        if internal and drop_internal:
            stats["internal_skipped"] += 1
            return
        para = doc.add_paragraph()
        para.paragraph_format.left_indent = Cm(0.5)
        para.paragraph_format.space_before = Pt(4)
        para.paragraph_format.space_after = Pt(6)
        if internal:
            stats["internal_kept_asnote"] += 1
            add_inline(para, f"※ 内部提示：{text}", size=Pt(9), color=MUTED)
        else:
            add_inline(para, text, size=Pt(10), color=MUTED)

    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        # ---- 表格：必须先于「引用块」判断。
        # 若表头紧跟在一段引用/正文之后，先走引用分支会把表头吃掉，
        # 导致整张表退化成带竖线的普通段落。因此这里用「当前行 + 下一行是分隔行」
        # 作为表格开始的判据，并先落盘已缓存的引用块。
        if stripped.startswith("|") and i + 1 < len(lines) and is_separator(lines[i + 1]):
            flush_quote()
            flush_table()
            table_rows = [split_row(stripped)]
            i += 2
            in_table = True
            while i < len(lines) and lines[i].strip().startswith("|"):
                if is_separator(lines[i]):
                    i += 1
                    continue
                table_rows.append(split_row(lines[i].strip()))
                i += 1
            flush_table()
            continue

        # 引用块
        if stripped.startswith(">"):
            quote_buf.append(stripped.lstrip(">").strip())
            i += 1
            continue
        flush_quote()

        # 空行
        if not stripped:
            i += 1
            continue

        # 分隔线
        if re.fullmatch(r"-{3,}|\*{3,}|_{3,}", stripped):
            para = doc.add_paragraph()
            para.paragraph_format.space_after = Pt(2)
            pf = para.paragraph_format
            pf.space_before = Pt(2)
            ppr = para._p.get_or_add_pPr()
            borders = OxmlElement("w:pBdr")
            bottom = OxmlElement("w:bottom")
            bottom.set(qn("w:val"), "single")
            bottom.set(qn("w:sz"), "6")
            bottom.set(qn("w:color"), "BBBBBB")
            borders.append(bottom)
            ppr.append(borders)
            i += 1
            continue

        # 标题
        m = re.match(r"^(#{1,6})\s+(.*)$", stripped)
        if m:
            level = len(m.group(1))
            text = m.group(2).strip()
            if any(mark in text for mark in INTERNAL_MARKERS) and drop_internal:
                stats["internal_skipped"] += 1
                i += 1
                continue
            # 整节删除：跳过标题及其后的全部内容，直到同级或更高级标题
            if drop_headings and any(dh in text for dh in drop_headings):
                stats["sections_skipped"] = stats.get("sections_skipped", 0) + 1
                i += 1
                while i < len(lines):
                    nxt = lines[i].strip()
                    nm = re.match(r"^(#{1,6})\s+", nxt)
                    if nm and len(nm.group(1)) <= level:
                        break
                    i += 1
                continue
            if level == 1:
                para = doc.add_heading("", level=1)
                add_inline(para, text, size=Pt(17), base_bold=True, color=ACCENT)
            else:
                para = doc.add_heading("", level=min(level - 1, 3))
                size = {2: Pt(13.5), 3: Pt(11.5)}.get(level, Pt(10.5))
                add_inline(para, text, size=size, base_bold=True, color=ACCENT)
            stats["headings"] += 1
            i += 1
            continue

        # 无序列表
        m = re.match(r"^[-*+]\s+(.*)$", stripped)
        if m:
            indent = (len(line) - len(line.lstrip())) // 2
            para = doc.add_paragraph(style="List Bullet")
            para.paragraph_format.left_indent = Cm(0.75 + 0.5 * indent)
            para.paragraph_format.space_after = Pt(2)
            add_inline(para, m.group(1))
            stats["paragraphs"] += 1
            i += 1
            continue

        # 有序列表
        m = re.match(r"^(\d+)[.)]\s+(.*)$", stripped)
        if m:
            para = doc.add_paragraph(style="List Number")
            para.paragraph_format.left_indent = Cm(0.75)
            para.paragraph_format.space_after = Pt(2)
            add_inline(para, m.group(2))
            stats["paragraphs"] += 1
            i += 1
            continue

        # 普通段落
        para = doc.add_paragraph()
        add_inline(para, stripped)
        stats["paragraphs"] += 1
        i += 1

    flush_quote()
    flush_table()
    doc.save(docx_path)
    return stats


def main() -> int:
    if len(sys.argv) < 3:
        print(__doc__)
        return 2
    md_path = Path(sys.argv[1])
    docx_path = Path(sys.argv[2])
    title = None
    drop_internal = "--drop-internal" in sys.argv
    drop_headings: list[str] = []
    if "--drop-section" in sys.argv:
        idx = sys.argv.index("--drop-section")
        drop_headings = [a for a in sys.argv[idx + 1:] if not a.startswith("--")]
    if "--title" in sys.argv:
        title = sys.argv[sys.argv.index("--title") + 1]
    if not md_path.exists():
        print(f"input not found: {md_path}")
        return 1
    stats = convert(md_path, docx_path, title, drop_internal, tuple(drop_headings))
    print(f"source : {md_path}  (未修改)")
    print(f"output : {docx_path}")
    print(f"stats  : {stats}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
