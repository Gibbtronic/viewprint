import type { Blueprint } from './types';

const BRAND = '#4F46E5';
const INK   = '#0B0B0F';
const FG2   = '#6B7280';
const RULE  = '#E5E7EB';

export async function exportAsPdf(blueprint: Blueprint, filename: string): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const PW = 210;
  const ML = 20;
  const MR = 20;
  const CW = PW - ML - MR;
  const PH = 297;
  const MB = 20;

  let y = 24;

  function checkPage(needed = 10) {
    if (y + needed > PH - MB) {
      doc.addPage();
      y = 24;
    }
  }

  function rule(color = RULE) {
    doc.setDrawColor(color);
    doc.setLineWidth(0.2);
    doc.line(ML, y, ML + CW, y);
    y += 5;
  }

  // ── Title ──────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(INK);
  doc.text(blueprint.title, ML, y);
  y += 9;

  if (blueprint.description) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(FG2);
    const lines = doc.splitTextToSize(blueprint.description, CW) as string[];
    doc.text(lines, ML, y);
    y += lines.length * 5 + 2;
  }

  y += 2;
  rule(BRAND);
  y += 2;

  // ── Stages ─────────────────────────────────────────────────────────
  const SECTIONS: Array<{ key: keyof typeof blueprint.stages[0]; label: string; list?: boolean }> = [
    { key: 'task',        label: 'Task' },
    { key: 'mindset',     label: 'Mindset' },
    { key: 'frontstage',  label: 'Frontstage touchpoints', list: true },
    { key: 'backstage',   label: 'Backstage touchpoints',  list: true },
    { key: 'actors',      label: 'Actors',  list: true },
    { key: 'systems',     label: 'Systems', list: true },
    { key: 'data',        label: 'Data',    list: true },
  ];

  for (const stage of blueprint.stages) {
    checkPage(16);

    // Stage heading pill band
    doc.setFillColor(245, 243, 255);
    doc.roundedRect(ML, y - 1, CW, 10, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(BRAND);
    doc.text(stage.name, ML + 4, y + 6);
    y += 14;

    for (const { key, label, list } of SECTIONS) {
      const value = stage[key];
      const isEmpty = Array.isArray(value) ? value.length === 0 : !value;
      if (isEmpty) continue;

      checkPage(10);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(FG2);
      doc.text(label.toUpperCase(), ML, y);
      y += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(INK);

      if (list && Array.isArray(value)) {
        for (const item of value as string[]) {
          checkPage(6);
          doc.text(`• ${item}`, ML + 3, y);
          y += 5;
        }
      } else {
        const lines = doc.splitTextToSize(String(value), CW) as string[];
        checkPage(lines.length * 5 + 2);
        doc.text(lines, ML, y);
        y += lines.length * 5;
      }
      y += 3;
    }

    // KPIs
    if (stage.kpis.length > 0) {
      checkPage(10);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(FG2);
      doc.text('KPIS', ML, y);
      y += 5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(INK);
      for (const kpi of stage.kpis) {
        checkPage(6);
        const label = kpi.target ? `${kpi.label} — ${kpi.target}` : kpi.label;
        doc.text(`• ${label}`, ML + 3, y);
        y += 5;
      }
      y += 3;
    }

    checkPage(4);
    rule();
  }

  doc.save(`${filename}.pdf`);
}

export function exportAsSvg(blueprint: Blueprint, filename: string): void {
  const STAGE_W = 200;
  const STAGE_H = 48;
  const LABEL_W = 140;
  const ROW_H = 48;
  const PAD = 16;

  const LANES = [
    { key: 'task',       label: 'Task',                  bg: '#F9FAFB' },
    { key: 'mindset',    label: 'Mindset',               bg: '#FAFAF9' },
    { key: 'frontstage', label: 'Frontstage touchpoints', bg: '#EEF2FF' },
    { key: 'backstage',  label: 'Backstage touchpoints',  bg: '#F5F3FF' },
    { key: 'actors',     label: 'Actors',                bg: '#F9FAFB' },
    { key: 'systems',    label: 'Systems',               bg: '#F9FAFB' },
    { key: 'data',       label: 'Data',                  bg: '#F9FAFB' },
    { key: 'kpis',       label: 'KPIs',                  bg: '#ECFDF5' },
  ] as const;

  const stages = blueprint.stages;
  const totalW = LABEL_W + stages.length * STAGE_W + PAD * 2;
  const headerH = STAGE_H;
  const totalH = headerH + LANES.length * ROW_H + PAD * 2 + 60;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}" font-family="Inter, system-ui, sans-serif">`;
  svg += `<rect width="${totalW}" height="${totalH}" fill="white"/>`;

  // Title
  svg += `<text x="${PAD}" y="${PAD + 20}" font-size="18" font-weight="600" fill="${INK}">${esc(blueprint.title)}</text>`;
  const bodyY = PAD + 44;

  // Stage headers
  stages.forEach((stage, i) => {
    const x = PAD + LABEL_W + i * STAGE_W;
    svg += `<rect x="${x}" y="${bodyY}" width="${STAGE_W}" height="${headerH}" fill="#EEF2FF"/>`;
    svg += `<text x="${x + STAGE_W / 2}" y="${bodyY + headerH / 2 + 5}" text-anchor="middle" font-size="12" font-weight="600" fill="${BRAND}">${esc(stage.name)}</text>`;
  });

  // Lane rows
  LANES.forEach((lane, li) => {
    const rowY = bodyY + headerH + li * ROW_H;
    svg += `<rect x="${PAD}" y="${rowY}" width="${LABEL_W}" height="${ROW_H}" fill="#F9FAFB"/>`;
    svg += `<text x="${PAD + 8}" y="${rowY + ROW_H / 2 + 4}" font-size="10" font-weight="600" fill="${FG2}">${esc(lane.label)}</text>`;

    stages.forEach((stage, si) => {
      const cellX = PAD + LABEL_W + si * STAGE_W;
      svg += `<rect x="${cellX}" y="${rowY}" width="${STAGE_W}" height="${ROW_H}" fill="${lane.bg}" stroke="${RULE}" stroke-width="0.5"/>`;

      const raw = stage[lane.key as keyof typeof stage];
      let cellText = '';
      if (lane.key === 'kpis') {
        cellText = stage.kpis.map(k => k.label).join(', ');
      } else if (Array.isArray(raw)) {
        cellText = (raw as string[]).join(', ');
      } else {
        cellText = String(raw ?? '');
      }
      if (cellText) {
        const words = cellText.slice(0, 60) + (cellText.length > 60 ? '…' : '');
        svg += `<text x="${cellX + 8}" y="${rowY + ROW_H / 2 + 4}" font-size="9" fill="${INK}">${esc(words)}</text>`;
      }
    });
  });

  svg += '</svg>';

  const blob = new Blob([svg], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.svg`;
  a.click();
  URL.revokeObjectURL(url);
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
