// Құжаттарға ортақ стильдер мен көмекші функциялар (docx-js).
const fs = require("fs");
const path = require("path");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType,
  HeadingLevel, ShadingType, LevelFormat, ImageRun, PageBreak, Footer, PageNumber, BorderStyle, TableLayoutType,
} = require("docx");

const FONT = "Times New Roman";
const MONO = "Courier New";
const CONTENT_W = 9355; // A4: 11906 - 1701 (сол 30 мм) - 850 (оң 15 мм)
const data = JSON.parse(fs.readFileSync(path.join(__dirname, "data.json"), "utf8"));

// Мәтін бөліктері: "жай мәтін" немесе {text, b, i, ph, mono}
function toRuns(content, base = {}) {
  const parts = Array.isArray(content) ? content : [content];
  return parts.map((part) => {
    const o = typeof part === "string" ? { text: part } : part;
    return new TextRun({
      text: o.text,
      bold: o.b || base.b,
      italics: o.i || base.i,
      font: o.mono ? MONO : FONT,
      size: o.size || base.size,
      highlight: o.ph ? "yellow" : undefined,
    });
  });
}

const ph = (text) => ({ text, ph: true });

function p(content, opts = {}) {
  return new Paragraph({
    children: toRuns(content, opts),
    alignment: opts.align || AlignmentType.JUSTIFIED,
    indent: opts.noIndent ? undefined : { firstLine: 709 },
    spacing: { after: opts.after ?? 60, before: opts.before ?? 0 },
    keepNext: opts.keepNext,
  });
}

const center = (content, opts = {}) => p(content, { ...opts, align: AlignmentType.CENTER, noIndent: true });

function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text, font: FONT })], keepNext: true });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text, font: FONT })], keepNext: true });
}

function bullet(content, opts = {}) {
  return new Paragraph({
    children: toRuns(content, opts),
    numbering: { reference: "bullets", level: 0 },
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 30 },
  });
}

function caption(text) {
  return new Paragraph({
    children: [new TextRun({ text, italics: true, font: FONT, size: 24 })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 60, after: 160 },
  });
}

function tableTitle(text) {
  return new Paragraph({
    children: [new TextRun({ text, font: FONT, size: 24, italics: true })],
    alignment: AlignmentType.LEFT,
    spacing: { before: 120, after: 60 },
    keepNext: true,
  });
}

function codeBlock(text, size = 18, prose = false) {
  const lines = String(text).split("\n");
  return lines.map((line, i) => new Paragraph({
    children: [new TextRun({ text: line.length ? line : " ", font: prose ? FONT : MONO, size })],
    shading: { type: ShadingType.CLEAR, fill: "F2F4F7", color: "auto" },
    spacing: { after: 0, before: i === 0 ? 60 : 0, line: 240 },
    indent: { left: 170, right: 170 },
    keepLines: true,
    keepNext: lines.length <= 20 && i < lines.length - 1,
  }));
}

const border = { style: BorderStyle.SINGLE, size: 4, color: "8C96A8" };
const borders = { top: border, bottom: border, left: border, right: border };

// Ұяшық мазмұны: жол, {mono}, немесе жолдар массиві; "\n" бөлек абзацқа айналады
function cellParas(content, size, bold) {
  const items = Array.isArray(content) ? content : [content];
  const paras = [];
  for (const item of items) {
    if (Array.isArray(item)) { // бір абзацтағы бірнеше бөлік
      paras.push(new Paragraph({
        children: item.map((x) => { const o = typeof x === "string" ? { text: x } : x;
          return new TextRun({ text: o.text, font: o.mono ? MONO : FONT, size: o.mono ? size - 2 : size, bold: bold || o.b, italics: o.i, highlight: o.ph ? "yellow" : undefined }); }),
        spacing: { after: 0, line: 240 },
      }));
      continue;
    }
    const o = typeof item === "object" && item !== null ? item : { text: String(item ?? "") };
    for (const line of String(o.text).split("\n")) {
      paras.push(new Paragraph({
        children: [new TextRun({ text: line, font: o.mono ? MONO : FONT, size: o.mono ? size - 2 : size, bold: bold || o.b, italics: o.i, highlight: o.ph ? "yellow" : undefined })],
        spacing: { after: 0, line: 240 },
        alignment: o.center ? AlignmentType.CENTER : AlignmentType.LEFT,
      }));
    }
  }
  return paras;
}

function table(headers, rows, widths, opts = {}) {
  const size = opts.size || 22;
  const total = widths.reduce((a, b) => a + b, 0);
  const mk = (cells, isHeader) => new TableRow({
    tableHeader: isHeader,
    cantSplit: !opts.allowSplit,
    children: cells.map((c, i) => new TableCell({
      borders,
      width: { size: widths[i], type: WidthType.DXA },
      shading: isHeader ? { fill: "DCE3F0", type: ShadingType.CLEAR, color: "auto" } : (opts.firstColFill && i === 0 ? { fill: "F2F4F7", type: ShadingType.CLEAR, color: "auto" } : undefined),
      margins: { top: 50, bottom: 50, left: 90, right: 90 },
      children: cellParas(c, size, isHeader || (opts.boldFirstCol && i === 0)),
    })),
  });
  const trs = [];
  if (headers) trs.push(mk(headers, true));
  rows.forEach((r) => trs.push(mk(r, false)));
  return new Table({ width: { size: total, type: WidthType.DXA }, columnWidths: widths, layout: TableLayoutType.FIXED, rows: trs });
}

function image(file, widthPx) {
  const buf = fs.readFileSync(path.join(__dirname, file));
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20); // PNG өлшемдері
  return new Paragraph({
    children: [new ImageRun({ type: "png", data: buf, transformation: { width: widthPx, height: Math.round(widthPx * h / w) },
      altText: { title: "Архитектура", description: "Қосымша архитектурасының сызбасы", name: "architecture" } })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 120 },
    keepNext: true,
  });
}

const pageBreak = () => new Paragraph({ children: [new PageBreak()] });
const spacer = (after = 120) => new Paragraph({ children: [], spacing: { after } });

function makeDoc(children, { titlePage = false } = {}) {
  const footer = new Footer({
    children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT], font: FONT, size: 24 })] })],
  });
  return new Document({
    creator: "JS-Тәлімгер жобасы",
    styles: {
      default: { document: { run: { font: FONT, size: 28 }, paragraph: { spacing: { line: 240 } } } },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 28, bold: true, font: FONT, color: "000000" },
          paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 0 } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
          run: { size: 28, bold: true, italics: true, font: FONT, color: "000000" },
          paragraph: { spacing: { before: 180, after: 80 }, outlineLevel: 1 } },
      ],
    },
    numbering: {
      config: [{ reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "–", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 709, hanging: 284 } } } }] }],
    },
    sections: [{
      properties: {
        titlePage,
        page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1701, right: 850 } },
      },
      footers: titlePage ? { default: footer, first: new Footer({ children: [new Paragraph({ children: [] })] }) } : { default: footer },
      children,
    }],
  });
}

async function save(doc, name) {
  const buf = await Packer.toBuffer(doc);
  const out = path.join(__dirname, "..", name);
  fs.writeFileSync(out, buf);
  console.log("жазылды:", name);
}

module.exports = { data, p, center, h1, h2, bullet, caption, tableTitle, codeBlock, table, image, pageBreak, spacer, makeDoc, save, ph, CONTENT_W, AlignmentType };
