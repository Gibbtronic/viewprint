import type { Blueprint, Stage } from './types';

// ── Design tokens ────────────────────────────────────────────────────────────
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

// ── Lane definitions ─────────────────────────────────────────────────────────
type LaneType = 'text' | 'list' | 'kpi' | 'struct';
interface Lane { key: string; label: string; color: string; type: LaneType; }

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
const HPAD      = 16;   // cell horizontal padding
const VPAD      = 16;   // cell vertical padding
const HEAD_H    = 84;
const STRUCT_H  = 28;
const FONT      = 'Inter, system-ui, sans-serif';

// Per-item spacing
const ITEM_GAP      = 10;  // gap between bullet items
const KPI_GAP       = 8;   // gap between KPI cards
const CARD_PAD_V    = 10;  // padding inside KPI card (top/bottom)
const CARD_PAD_H    = 10;  // padding inside KPI card (left/right)

// Line heights
const TEXT_LINE_H   = 22;  // 14px body text
const BULLET_LINE_H = 18;  // 13px bullet text
const KPI_LABEL_LH  = 17;  // 12px KPI label
const KPI_TARGET_H  = 20;  // KPI target line

const MIN_ROW_H = 56;

// ── Text helpers ─────────────────────────────────────────────────────────────
function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// Estimate word-wrapped lines for given available pixel width and font size
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

// Height of one KPI card, accounting for label line wrapping
function kpiCardHeight(kpi: Stage['kpis'][0], availW: number): number {
  const labelLines = wrapText(kpi.label, availW - CARD_PAD_H * 2, 12);
  const labelBlockH = labelLines.length * KPI_LABEL_LH;
  const targetBlockH = kpi.target ? KPI_TARGET_H : 0;
  const gapH = (kpi.target && labelBlockH) ? 4 : 0;
  return CARD_PAD_V * 2 + labelBlockH + gapH + targetBlockH;
}

// Height of one bullet item, accounting for text wrapping
function bulletItemHeight(item: string, availW: number): number {
  const lines = wrapText(item, availW, 13);
  return lines.length * BULLET_LINE_H;
}

function stageValue(stage: Stage, key: string): string | string[] | Stage['kpis'] {
  if (key.startsWith('_')) return [];
  return (stage as unknown as Record<string, string | string[] | Stage['kpis']>)[key] ?? [];
}

// Compute the height of a row by finding the tallest cell across all stages
function computeRowHeight(lane: Lane, stages: Stage[]): number {
  if (lane.type === 'struct') return STRUCT_H;

  let max = MIN_ROW_H;

  for (const stage of stages) {
    const val = stageValue(stage, lane.key);
    let h: number;

    if (lane.type === 'text') {
      const lines = wrapText(val as string, COL_W - HPAD * 2, 14);
      h = VPAD * 2 + lines.length * TEXT_LINE_H;

    } else if (lane.type === 'list') {
      const items = val as string[];
      if (!items.length) {
        h = MIN_ROW_H;
      } else {
        const availW = COL_W - HPAD * 2 - 14; // 14 = dot(6) + gap(8)
        const itemsH = items.reduce((sum, item, ii) => {
          return sum + bulletItemHeight(item, availW) + (ii < items.length - 1 ? ITEM_GAP : 0);
        }, 0);
        h = VPAD * 2 + itemsH;
      }

    } else { // kpi
      const kpis = val as Stage['kpis'];
      if (!kpis.length) {
        h = MIN_ROW_H;
      } else {
        const availW = COL_W - HPAD * 2;
        const kpisH = kpis.reduce((sum, kpi, ki) => {
          return sum + kpiCardHeight(kpi, availW) + (ki < kpis.length - 1 ? KPI_GAP : 0);
        }, 0);
        h = VPAD * 2 + kpisH;
      }
    }

    max = Math.max(max, h);
  }

  return max;
}

// ── SVG builder ──────────────────────────────────────────────────────────────
function buildBlueprintSvg(blueprint: Blueprint): string {
  const { stages, title, description } = blueprint;
  const n = stages.length;

  const rowHeights = LANES.map(lane => computeRowHeight(lane, stages));
  const gridH = HEAD_H + rowHeights.reduce((a, b) => a + b, 0);

  const descLines = description ? wrapText(description, LABEL_W + n * COL_W - HPAD, 13) : [];
  const titleBlockH = MARGIN + 32 + (descLines.length ? descLines.length * 20 + 8 : 0) + 24;

  const LEGEND_H = 44;
  const totalW = MARGIN + LABEL_W + n * COL_W + MARGIN;
  const totalH = titleBlockH + gridH + LEGEND_H + MARGIN;

  const els: string[] = [];

  // Background
  els.push(`<rect width="${totalW}" height="${totalH}" fill="${C.white}"/>`);

  // ── Title ──────────────────────────────────────────────────────────────────
  let ty = MARGIN + 24;
  els.push(`<text x="${MARGIN}" y="${ty}" font-family="${FONT}" font-size="24" font-weight="600" fill="${C.fg1}">${esc(title)}</text>`);
  if (descLines.length) {
    for (const dl of descLines) {
      ty += 20;
      els.push(`<text x="${MARGIN}" y="${ty}" font-family="${FONT}" font-size="13" fill="${C.fg2}">${esc(dl)}</text>`);
    }
  }

  // ── Grid ───────────────────────────────────────────────────────────────────
  const gridX = MARGIN;
  const gridY = titleBlockH;
  const gridW = LABEL_W + n * COL_W;

  // Outer border / background
  els.push(`<rect x="${gridX}" y="${gridY}" width="${gridW}" height="${gridH}" fill="${C.white}" stroke="${C.border1}" stroke-width="1" rx="12"/>`);

  // ── Header row ─────────────────────────────────────────────────────────────
  // Background for the full header row (nested bg)
  els.push(`<rect x="${gridX}" y="${gridY}" width="${gridW}" height="${HEAD_H}" fill="${C.bgNested}" rx="12"/>`);
  // Clip bottom corners square
  els.push(`<rect x="${gridX}" y="${gridY + HEAD_H - 12}" width="${gridW}" height="12" fill="${C.bgNested}"/>`);

  // Corner label
  els.push(`<text x="${gridX + HPAD}" y="${gridY + HEAD_H / 2 + 4}" font-family="${FONT}" font-size="11" font-weight="600" fill="${C.fg2}" letter-spacing="0.06em">SWIMLANE</text>`);

  // Stage headers
  for (let i = 0; i < n; i++) {
    const cx = gridX + LABEL_W + i * COL_W;
    const stage = stages[i];
    const numLabel = `STAGE ${String(i + 1).padStart(2, '0')}`;

    els.push(`<text x="${cx + HPAD}" y="${gridY + VPAD + 12}" font-family="${FONT}" font-size="11" font-weight="600" fill="${C.fg2}" letter-spacing="0.06em">${esc(numLabel)}</text>`);

    const nameLines = wrapText(stage.name, COL_W - HPAD * 2, 16);
    nameLines.forEach((nl, ni) => {
      els.push(`<text x="${cx + HPAD}" y="${gridY + VPAD + 30 + ni * 22}" font-family="${FONT}" font-size="16" font-weight="600" fill="${C.fg1}">${esc(nl)}</text>`);
    });

    // Vertical divider between stage columns
    if (i < n - 1) {
      els.push(`<line x1="${cx + COL_W}" y1="${gridY}" x2="${cx + COL_W}" y2="${gridY + HEAD_H}" stroke="${C.border1}" stroke-width="1"/>`);
    }
  }

  // Label col right divider in header
  els.push(`<line x1="${gridX + LABEL_W}" y1="${gridY}" x2="${gridX + LABEL_W}" y2="${gridY + HEAD_H}" stroke="${C.border1}" stroke-width="1"/>`);

  // Header bottom border
  els.push(`<line x1="${gridX}" y1="${gridY + HEAD_H}" x2="${gridX + gridW}" y2="${gridY + HEAD_H}" stroke="${C.border1}" stroke-width="1"/>`);

  // ── Data rows ──────────────────────────────────────────────────────────────
  let rowY = gridY + HEAD_H;

  LANES.forEach((lane, li) => {
    const rh = rowHeights[li];
    const isLastRow = li === LANES.length - 1;

    if (lane.type === 'struct') {
      els.push(`<rect x="${gridX}" y="${rowY}" width="${gridW}" height="${rh}" fill="${C.white}"/>`);
      // Label
      els.push(`<text x="${gridX + HPAD}" y="${rowY + rh / 2 + 4}" font-family="${FONT}" font-size="10" font-weight="600" fill="${lane.color}" letter-spacing="0.06em">${esc(lane.label.toUpperCase())}</text>`);
      // Dashed rule
      els.push(`<line x1="${gridX + LABEL_W}" y1="${rowY + rh / 2}" x2="${gridX + gridW}" y2="${rowY + rh / 2}" stroke="${lane.color}" stroke-width="1" stroke-dasharray="6 4"/>`);
      els.push(`<line x1="${gridX}" y1="${rowY + rh / 2}" x2="${gridX + LABEL_W}" y2="${rowY + rh / 2}" stroke="${C.border1}" stroke-width="0.5" stroke-dasharray="4 4"/>`);
      if (!isLastRow) {
        els.push(`<line x1="${gridX}" y1="${rowY + rh}" x2="${gridX + gridW}" y2="${rowY + rh}" stroke="${C.border1}" stroke-width="1"/>`);
      }
      rowY += rh;
      return;
    }

    // ── Label cell ────────────────────────────────────────────────────────────
    els.push(`<rect x="${gridX}" y="${rowY}" width="${LABEL_W}" height="${rh}" fill="${C.white}"/>`);
    // Colored dot
    els.push(`<circle cx="${gridX + HPAD + 5}" cy="${rowY + rh / 2}" r="4" fill="${lane.color}"/>`);
    els.push(`<text x="${gridX + HPAD + 16}" y="${rowY + rh / 2 + 5}" font-family="${FONT}" font-size="13" font-weight="500" fill="${C.fg1}">${esc(lane.label)}</text>`);
    // Label right divider
    els.push(`<line x1="${gridX + LABEL_W}" y1="${rowY}" x2="${gridX + LABEL_W}" y2="${rowY + rh}" stroke="${C.border1}" stroke-width="1"/>`);

    // ── Data cells ────────────────────────────────────────────────────────────
    for (let i = 0; i < n; i++) {
      const cx = gridX + LABEL_W + i * COL_W;
      const stage = stages[i];
      const val = stageValue(stage, lane.key);

      els.push(`<rect x="${cx}" y="${rowY}" width="${COL_W}" height="${rh}" fill="${C.white}"/>`);

      if (lane.type === 'text') {
        const text = val as string;
        if (text) {
          const lines = wrapText(text, COL_W - HPAD * 2, 14);
          lines.forEach((l, li2) => {
            els.push(`<text x="${cx + HPAD}" y="${rowY + VPAD + 14 + li2 * TEXT_LINE_H}" font-family="${FONT}" font-size="14" fill="${C.fg1}">${esc(l)}</text>`);
          });
        } else {
          els.push(`<text x="${cx + HPAD}" y="${rowY + rh / 2 + 5}" font-family="${FONT}" font-size="14" fill="${C.fg3}">—</text>`);
        }

      } else if (lane.type === 'list') {
        const items = val as string[];
        const dotGap = 8;
        const dotR = 3;
        const dotW = dotR * 2 + dotGap; // 14px total
        const availW = COL_W - HPAD * 2 - dotW;

        if (items.length) {
          let iy = rowY + VPAD;
          for (let ii = 0; ii < items.length; ii++) {
            const itemLines = wrapText(items[ii], availW, 13);
            const itemH = bulletItemHeight(items[ii], availW);
            // Dot aligned to first line
            els.push(`<circle cx="${cx + HPAD + dotR}" cy="${iy + BULLET_LINE_H / 2}" r="${dotR}" fill="${lane.color}"/>`);
            itemLines.forEach((il, ili) => {
              els.push(`<text x="${cx + HPAD + dotW}" y="${iy + 13 + ili * BULLET_LINE_H}" font-family="${FONT}" font-size="13" fill="${C.fg1}">${esc(il)}</text>`);
            });
            iy += itemH + (ii < items.length - 1 ? ITEM_GAP : 0);
          }
        } else {
          els.push(`<text x="${cx + HPAD}" y="${rowY + rh / 2 + 5}" font-family="${FONT}" font-size="14" fill="${C.fg3}">—</text>`);
        }

      } else { // kpi
        const kpis = val as Stage['kpis'];
        const availW = COL_W - HPAD * 2;

        if (kpis.length) {
          let ky = rowY + VPAD;
          for (let ki = 0; ki < kpis.length; ki++) {
            const kpi = kpis[ki];
            const cardH = kpiCardHeight(kpi, availW);

            els.push(`<rect x="${cx + HPAD}" y="${ky}" width="${availW}" height="${cardH}" fill="${C.brand50}" rx="8"/>`);

            const labelLines = wrapText(kpi.label, availW - CARD_PAD_H * 2, 12);
            labelLines.forEach((kl, kli) => {
              els.push(`<text x="${cx + HPAD + CARD_PAD_H}" y="${ky + CARD_PAD_V + 12 + kli * KPI_LABEL_LH}" font-family="${FONT}" font-size="12" fill="${C.fg1}">${esc(kl)}</text>`);
            });

            if (kpi.target) {
              const targetY = ky + CARD_PAD_V + labelLines.length * KPI_LABEL_LH + 4 + 12;
              els.push(`<text x="${cx + HPAD + CARD_PAD_H}" y="${targetY}" font-family="${FONT}" font-size="12" font-weight="600" fill="${C.brand500}">${esc(kpi.target)}</text>`);
            }

            ky += cardH + (ki < kpis.length - 1 ? KPI_GAP : 0);
          }
        } else {
          els.push(`<text x="${cx + HPAD}" y="${rowY + rh / 2 + 5}" font-family="${FONT}" font-size="14" fill="${C.fg3}">—</text>`);
        }
      }

      // Vertical cell divider
      if (i < n - 1) {
        els.push(`<line x1="${cx + COL_W}" y1="${rowY}" x2="${cx + COL_W}" y2="${rowY + rh}" stroke="${C.border1}" stroke-width="1"/>`);
      }
    }

    // Row bottom border (omit on last row — outer rect handles it)
    if (!isLastRow) {
      els.push(`<line x1="${gridX}" y1="${rowY + rh}" x2="${gridX + gridW}" y2="${rowY + rh}" stroke="${C.border1}" stroke-width="1"/>`);
    }

    rowY += rh;
  });

  // ── Legend ─────────────────────────────────────────────────────────────────
  const legendY = gridY + gridH + 20;
  els.push(`<line x1="${MARGIN}" y1="${legendY + 7}" x2="${MARGIN + 24}" y2="${legendY + 7}" stroke="${C.brand500}" stroke-width="1" stroke-dasharray="6 4"/>`);
  els.push(`<text x="${MARGIN + 30}" y="${legendY + 12}" font-family="${FONT}" font-size="12" fill="${C.fg2}">Line of interaction</text>`);
  els.push(`<line x1="${MARGIN + 160}" y1="${legendY + 7}" x2="${MARGIN + 184}" y2="${legendY + 7}" stroke="${C.success500}" stroke-width="1" stroke-dasharray="6 4"/>`);
  els.push(`<text x="${MARGIN + 190}" y="${legendY + 12}" font-family="${FONT}" font-size="12" fill="${C.fg2}">Line of visibility</text>`);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW} ${totalH}" width="${totalW}" height="${totalH}" role="img" aria-label="${esc(title)}">${els.join('')}</svg>`;
}

// ── Public API ───────────────────────────────────────────────────────────────

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

  const parser = new DOMParser();
  const svgDoc = parser.parseFromString(svg, 'image/svg+xml');
  const svgEl = svgDoc.documentElement;
  const svgW = parseFloat(svgEl.getAttribute('width') ?? '800');
  const svgH = parseFloat(svgEl.getAttribute('height') ?? '600');

  // Render at 2× for print quality
  const SCALE = 2;
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

  // Choose page size: A3 landscape for wider blueprints, A4 otherwise
  const format = blueprint.stages.length > 5 ? 'a3' : 'a4';
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const ratio = Math.min((pageW - margin * 2) / svgW, (pageH - margin * 2) / svgH);

  pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, margin, svgW * ratio, svgH * ratio);
  pdf.save(`${filename}.pdf`);
}
