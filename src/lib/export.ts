import type { Blueprint, Stage } from './types';

// ── Design tokens (resolved from globals.css) ────────────────────────────────
const C = {
  fg1:      '#0B0B0F',
  fg2:      '#6B7280',
  fg3:      '#9CA3AF',
  white:    '#FFFFFF',
  bgNested: '#F4F5F7',
  border1:  '#E5E7EB',
  brand500: '#4F46E5',
  brand50:  '#EEF2FF',
  success500: '#10B981',
  info500:    '#3B82F6',
  warning500: '#F59E0B',
  danger500:  '#EF4444',
};

// ── Lane definitions (mirrors LANE_ORDER in page.tsx) ───────────────────────
type LaneType = 'text' | 'list' | 'kpi' | 'struct';
interface Lane {
  key: string;
  label: string;
  color: string;
  type: LaneType;
}

const LANES: Lane[] = [
  { key: 'task',         label: 'Customer task',       color: C.brand500,   type: 'text'   },
  { key: 'mindset',      label: 'Mindset',             color: C.brand500,   type: 'text'   },
  { key: '_interaction', label: 'Line of interaction', color: C.brand500,   type: 'struct' },
  { key: 'frontstage',   label: 'Frontstage',          color: C.info500,    type: 'list'   },
  { key: '_visibility',  label: 'Line of visibility',  color: C.success500, type: 'struct' },
  { key: 'backstage',    label: 'Backstage',           color: C.success500, type: 'list'   },
  { key: 'actors',       label: 'Actors',              color: C.fg2,        type: 'list'   },
  { key: 'systems',      label: 'Systems',             color: C.warning500, type: 'list'   },
  { key: 'data',         label: 'Data',                color: C.danger500,  type: 'list'   },
  { key: 'kpis',         label: 'KPIs',                color: C.brand500,   type: 'kpi'    },
];

// ── Layout constants ─────────────────────────────────────────────────────────
const MARGIN    = 48;
const LABEL_W   = 200;
const COL_W     = 280;
const HPAD      = 16;   // horizontal cell padding
const VPAD      = 20;   // vertical cell padding
const STRUCT_H  = 28;
const HEAD_H    = 84;   // stage header row
const ITEM_H    = 20;   // height of one bullet item line
const ITEM_GAP  = 8;
const KPI_CARD_H = 52;  // one KPI card (label + target + padding)
const KPI_GAP   = 8;
const LINE_H    = 22;   // line height for 14px text
const MIN_ROW_H = 64;
const FONT      = 'Inter, system-ui, sans-serif';

// ── Helpers ──────────────────────────────────────────────────────────────────
function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function wrapText(text: string, availW: number, fontSize = 14): string[] {
  if (!text) return [];
  const charsPerLine = Math.floor(availW / (fontSize * 0.52));
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const candidate = line ? `${line} ${w}` : w;
    if (candidate.length <= charsPerLine) {
      line = candidate;
    } else {
      if (line) lines.push(line);
      line = w;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [text];
}

function stageValue(stage: Stage, key: string): string | string[] | Stage['kpis'] {
  if (key.startsWith('_')) return [];
  return (stage as unknown as Record<string, string | string[] | Stage['kpis']>)[key] ?? [];
}

function rowHeight(lane: Lane, stages: Stage[]): number {
  if (lane.type === 'struct') return STRUCT_H;
  let max = MIN_ROW_H;
  for (const stage of stages) {
    let h: number;
    const val = stageValue(stage, lane.key);
    if (lane.type === 'text') {
      const lines = wrapText(val as string, COL_W - HPAD * 2);
      h = Math.max(MIN_ROW_H, lines.length * LINE_H + VPAD * 2);
    } else if (lane.type === 'list') {
      const items = val as string[];
      h = items.length === 0
        ? MIN_ROW_H
        : Math.max(MIN_ROW_H, items.length * (ITEM_H + ITEM_GAP) - ITEM_GAP + VPAD * 2);
    } else {
      const kpis = val as Stage['kpis'];
      h = kpis.length === 0
        ? MIN_ROW_H
        : Math.max(MIN_ROW_H, kpis.length * (KPI_CARD_H + KPI_GAP) - KPI_GAP + VPAD * 2);
    }
    max = Math.max(max, h);
  }
  return max;
}

// ── SVG builder ──────────────────────────────────────────────────────────────
function buildBlueprintSvg(blueprint: Blueprint): string {
  const { stages, title, description } = blueprint;
  const n = stages.length;

  // Pre-compute row heights
  const rowHeights = LANES.map(lane => rowHeight(lane, stages));
  const gridH = HEAD_H + rowHeights.reduce((a, b) => a + b, 0);

  // Legend height
  const LEGEND_H = 44;

  // Total title block height
  const descLines = description ? wrapText(description, LABEL_W + n * COL_W - HPAD, 13) : [];
  const titleBlockH = MARGIN + 32 + (descLines.length > 0 ? descLines.length * 20 + 8 : 0) + 24;

  const totalW = MARGIN + LABEL_W + n * COL_W + MARGIN;
  const totalH = titleBlockH + gridH + LEGEND_H + MARGIN;

  const els: string[] = [];

  // White background
  els.push(`<rect width="${totalW}" height="${totalH}" fill="${C.white}"/>`);

  // ── Title block ────────────────────────────────────────────────────────────
  let ty = MARGIN + 24;
  els.push(`<text x="${MARGIN}" y="${ty}" font-family="${FONT}" font-size="24" font-weight="600" fill="${C.fg1}">${esc(title)}</text>`);
  ty += 10;
  if (descLines.length) {
    for (const dl of descLines) {
      ty += 20;
      els.push(`<text x="${MARGIN}" y="${ty}" font-family="${FONT}" font-size="13" fill="${C.fg2}">${esc(dl)}</text>`);
    }
  }

  // ── Grid ───────────────────────────────────────────────────────────────────
  const gridX = MARGIN;
  const gridY = titleBlockH;

  // Outer border
  els.push(`<rect x="${gridX}" y="${gridY}" width="${LABEL_W + n * COL_W}" height="${gridH}" fill="${C.white}" stroke="${C.border1}" stroke-width="1" rx="12"/>`);

  // ── Stage header row ───────────────────────────────────────────────────────
  // Corner cell
  els.push(`<rect x="${gridX}" y="${gridY}" width="${LABEL_W}" height="${HEAD_H}" fill="${C.bgNested}" rx="12"/>`);
  els.push(`<rect x="${gridX}" y="${gridY + 12}" width="${LABEL_W}" height="${HEAD_H - 12}" fill="${C.bgNested}"/>`);
  els.push(`<text x="${gridX + HPAD}" y="${gridY + HEAD_H / 2 + 5}" font-family="${FONT}" font-size="11" font-weight="600" fill="${C.fg2}" letter-spacing="0.06em">SWIMLANE</text>`);

  // Stage header cells
  for (let i = 0; i < n; i++) {
    const cx = gridX + LABEL_W + i * COL_W;
    const stage = stages[i];
    const isLast = i === n - 1;

    els.push(`<rect x="${cx}" y="${gridY}" width="${COL_W}" height="${HEAD_H}" fill="${C.bgNested}" ${isLast ? 'rx="0"' : ''}/>`);
    if (isLast) {
      // round top-right corner
      els.push(`<rect x="${cx + COL_W - 12}" y="${gridY}" width="12" height="${HEAD_H}" fill="${C.bgNested}"/>`);
      els.push(`<rect x="${cx + COL_W - 12}" y="${gridY}" width="12" height="12" fill="${C.white}"/>`);
      els.push(`<circle cx="${cx + COL_W - 12}" cy="${gridY + 12}" r="12" fill="${C.bgNested}"/>`);
    }

    // Stage number eyebrow
    const numLabel = `STAGE ${String(i + 1).padStart(2, '0')}`;
    els.push(`<text x="${cx + HPAD}" y="${gridY + VPAD + 12}" font-family="${FONT}" font-size="11" font-weight="600" fill="${C.fg2}" letter-spacing="0.06em">${esc(numLabel)}</text>`);
    // Stage name
    const nameLines = wrapText(stage.name, COL_W - HPAD * 2, 16);
    nameLines.forEach((nl, ni) => {
      els.push(`<text x="${cx + HPAD}" y="${gridY + VPAD + 30 + ni * 22}" font-family="${FONT}" font-size="16" font-weight="600" fill="${C.fg1}">${esc(nl)}</text>`);
    });
    // Vertical divider
    if (i < n - 1) {
      els.push(`<line x1="${cx + COL_W}" y1="${gridY}" x2="${cx + COL_W}" y2="${gridY + HEAD_H}" stroke="${C.border1}" stroke-width="1"/>`);
    }
  }
  // Bottom border of header
  els.push(`<line x1="${gridX}" y1="${gridY + HEAD_H}" x2="${gridX + LABEL_W + n * COL_W}" y2="${gridY + HEAD_H}" stroke="${C.border1}" stroke-width="1"/>`);

  // ── Lane rows ──────────────────────────────────────────────────────────────
  let rowY = gridY + HEAD_H;

  LANES.forEach((lane, li) => {
    const rh = rowHeights[li];
    const isLastRow = li === LANES.length - 1;

    if (lane.type === 'struct') {
      // Structural line row
      els.push(`<rect x="${gridX}" y="${rowY}" width="${LABEL_W + n * COL_W}" height="${rh}" fill="${C.white}"/>`);
      // Label
      els.push(`<text x="${gridX + HPAD}" y="${rowY + rh / 2 + 4}" font-family="${FONT}" font-size="10" font-weight="600" fill="${lane.color}" letter-spacing="0.06em">${esc(lane.label.toUpperCase())}</text>`);
      // Dashed line across
      els.push(`<line x1="${gridX + LABEL_W}" y1="${rowY + rh / 2}" x2="${gridX + LABEL_W + n * COL_W}" y2="${rowY + rh / 2}" stroke="${lane.color}" stroke-width="1" stroke-dasharray="6 4"/>`);
      els.push(`<line x1="${gridX}" y1="${rowY + rh}" x2="${gridX + LABEL_W + n * COL_W}" y2="${rowY + rh}" stroke="${C.border1}" stroke-width="1"/>`);
      rowY += rh;
      return;
    }

    // Lane label cell
    els.push(`<rect x="${gridX}" y="${rowY}" width="${LABEL_W}" height="${rh}" fill="${C.white}"/>`);
    // Colored dot
    els.push(`<circle cx="${gridX + HPAD + 5}" cy="${rowY + rh / 2}" r="4" fill="${lane.color}"/>`);
    els.push(`<text x="${gridX + HPAD + 16}" y="${rowY + rh / 2 + 5}" font-family="${FONT}" font-size="13" font-weight="500" fill="${C.fg1}">${esc(lane.label)}</text>`);
    // Label right border
    els.push(`<line x1="${gridX + LABEL_W}" y1="${rowY}" x2="${gridX + LABEL_W}" y2="${rowY + rh}" stroke="${C.border1}" stroke-width="1"/>`);

    // Data cells
    for (let i = 0; i < n; i++) {
      const cx = gridX + LABEL_W + i * COL_W;
      const stage = stages[i];
      const val = stageValue(stage, lane.key);

      els.push(`<rect x="${cx}" y="${rowY}" width="${COL_W}" height="${rh}" fill="${C.white}"/>`);

      if (lane.type === 'text') {
        const text = val as string;
        if (text) {
          const lines = wrapText(text, COL_W - HPAD * 2);
          lines.forEach((l, li2) => {
            els.push(`<text x="${cx + HPAD}" y="${rowY + VPAD + 14 + li2 * LINE_H}" font-family="${FONT}" font-size="14" fill="${C.fg1}">${esc(l)}</text>`);
          });
        } else {
          els.push(`<text x="${cx + HPAD}" y="${rowY + rh / 2 + 5}" font-family="${FONT}" font-size="14" fill="${C.fg3}">—</text>`);
        }
      } else if (lane.type === 'list') {
        const items = val as string[];
        if (items.length) {
          items.forEach((item, ii) => {
            const iy = rowY + VPAD + ii * (ITEM_H + ITEM_GAP);
            els.push(`<circle cx="${cx + HPAD + 4}" cy="${iy + 8}" r="3" fill="${lane.color}"/>`);
            const itemLines = wrapText(item, COL_W - HPAD * 2 - 14, 13);
            itemLines.forEach((il, ili) => {
              els.push(`<text x="${cx + HPAD + 14}" y="${iy + 12 + ili * 18}" font-family="${FONT}" font-size="13" fill="${C.fg1}">${esc(il)}</text>`);
            });
          });
        } else {
          els.push(`<text x="${cx + HPAD}" y="${rowY + rh / 2 + 5}" font-family="${FONT}" font-size="14" fill="${C.fg3}">—</text>`);
        }
      } else if (lane.type === 'kpi') {
        const kpis = val as Stage['kpis'];
        if (kpis.length) {
          kpis.forEach((kpi, ki) => {
            const ky = rowY + VPAD + ki * (KPI_CARD_H + KPI_GAP);
            els.push(`<rect x="${cx + HPAD}" y="${ky}" width="${COL_W - HPAD * 2}" height="${KPI_CARD_H}" fill="${C.brand50}" rx="8"/>`);
            const kpiLines = wrapText(kpi.label, COL_W - HPAD * 2 - 16, 12);
            kpiLines.forEach((kl, kli) => {
              els.push(`<text x="${cx + HPAD + 10}" y="${ky + 18 + kli * 16}" font-family="${FONT}" font-size="12" fill="${C.fg1}">${esc(kl)}</text>`);
            });
            if (kpi.target) {
              els.push(`<text x="${cx + HPAD + 10}" y="${ky + KPI_CARD_H - 12}" font-family="${FONT}" font-size="12" font-weight="600" fill="${C.brand500}">${esc(kpi.target)}</text>`);
            }
          });
        } else {
          els.push(`<text x="${cx + HPAD}" y="${rowY + rh / 2 + 5}" font-family="${FONT}" font-size="14" fill="${C.fg3}">—</text>`);
        }
      }

      // Right cell border
      if (i < n - 1) {
        els.push(`<line x1="${cx + COL_W}" y1="${rowY}" x2="${cx + COL_W}" y2="${rowY + rh}" stroke="${C.border1}" stroke-width="1"/>`);
      }
    }

    // Bottom row border (skip last row — outer border handles it)
    if (!isLastRow) {
      els.push(`<line x1="${gridX}" y1="${rowY + rh}" x2="${gridX + LABEL_W + n * COL_W}" y2="${rowY + rh}" stroke="${C.border1}" stroke-width="1"/>`);
    }

    rowY += rh;
  });

  // ── Legend ─────────────────────────────────────────────────────────────────
  const legendY = gridY + gridH + 20;
  els.push(`<line x1="${MARGIN}" y1="${legendY + 8}" x2="${MARGIN + 24}" y2="${legendY + 8}" stroke="${C.brand500}" stroke-width="1" stroke-dasharray="6 4"/>`);
  els.push(`<text x="${MARGIN + 30}" y="${legendY + 13}" font-family="${FONT}" font-size="12" fill="${C.fg2}">Line of interaction</text>`);
  els.push(`<line x1="${MARGIN + 160}" y1="${legendY + 8}" x2="${MARGIN + 184}" y2="${legendY + 8}" stroke="${C.success500}" stroke-width="1" stroke-dasharray="6 4"/>`);
  els.push(`<text x="${MARGIN + 190}" y="${legendY + 13}" font-family="${FONT}" font-size="12" fill="${C.fg2}">Line of visibility</text>`);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} ${totalH}" width="${totalW}" height="${totalH}" role="img" aria-label="${esc(title)}">${els.join('')}</svg>`;
}

// ── Public export functions ──────────────────────────────────────────────────

export function exportAsSvg(blueprint: Blueprint, filename: string): void {
  const svg = buildBlueprintSvg(blueprint);
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.svg`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportAsPdf(blueprint: Blueprint, filename: string): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const svg = buildBlueprintSvg(blueprint);

  // Render SVG to canvas at 2× for print quality
  const SCALE = 2;
  const parser = new DOMParser();
  const doc2 = parser.parseFromString(svg, 'image/svg+xml');
  const svgEl = doc2.documentElement;
  const svgW = parseFloat(svgEl.getAttribute('width') ?? '800');
  const svgH = parseFloat(svgEl.getAttribute('height') ?? '600');

  const canvas = document.createElement('canvas');
  canvas.width  = svgW * SCALE;
  canvas.height = svgH * SCALE;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(SCALE, SCALE);

  await new Promise<void>((resolve, reject) => {
    const img = new Image();
    const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    img.onload = () => { ctx.drawImage(img, 0, 0); URL.revokeObjectURL(url); resolve(); };
    img.onerror = reject;
    img.src = url;
  });

  // Fit to landscape page (A3 landscape for larger blueprints, A4 landscape otherwise)
  const format = blueprint.stages.length > 5 ? 'a3' : 'a4';
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();

  const margin = 10;
  const maxW = pageW - margin * 2;
  const maxH = pageH - margin * 2;
  const ratio = Math.min(maxW / svgW, maxH / svgH);

  pdf.addImage(
    canvas.toDataURL('image/png'),
    'PNG',
    margin,
    margin,
    svgW * ratio,
    svgH * ratio,
  );

  pdf.save(`${filename}.pdf`);
}
