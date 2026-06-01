import type { Blueprint, BlueprintSummary, Kpi, Stage } from './types';

const SECTION_KEYS: Record<string, RegExp> = {
  task:       /^task$/i,
  mindset:    /^mind[\s-]?set$/i,
  frontstage: /^frontstage(?:\s+touchpoints?)?$/i,
  backstage:  /^backstage(?:\s+touchpoints?)?$/i,
  actors:     /^actors?$/i,
  systems:    /^systems?$/i,
  data:       /^data(?:\s+points?)?$/i,
  kpis:       /^kpis?$|^metrics?$|^stage\s+kpis$/i,
};

function classifySection(heading: string): string | null {
  const h = heading.trim();
  for (const [k, re] of Object.entries(SECTION_KEYS)) {
    if (re.test(h)) return k;
  }
  return null;
}

function parseKpi(line: string): Kpi {
  const dashSplit = line.split(/\s+[—–-]\s+/);
  if (dashSplit.length >= 2) {
    return { label: dashSplit[0].trim(), target: dashSplit.slice(1).join(' — ').trim() };
  }
  const parenMatch = line.match(/^(.*)\(([^)]+)\)\s*$/);
  if (parenMatch) {
    return { label: parenMatch[1].trim(), target: parenMatch[2].trim() };
  }
  return { label: line.trim(), target: null };
}

interface SectionBuffer {
  type: string;
  items: string[];
  text: string;
}

function emptyStage(name: string): Stage {
  return { name, task: '', mindset: '', frontstage: [], backstage: [], actors: [], systems: [], data: [], kpis: [] };
}

export function parseMarkdown(src: string): Blueprint {
  const lines = (src || '').replace(/\r\n/g, '\n').split('\n');
  const blueprint: Blueprint = { title: 'Untitled blueprint', description: '', stages: [], _raw: src };

  let currentStage: Stage | null = null;
  let currentSection: SectionBuffer | null = null;
  let descriptionLines: string[] = [];
  let descriptionMode = false;

  function commitSection() {
    if (!currentSection || !currentStage) return;
    const { type, items, text } = currentSection;
    if (type === 'task' || type === 'mindset') {
      (currentStage as unknown as Record<string, string>)[type] = (text || items.join(' ')).trim();
    } else if (type === 'kpis') {
      currentStage.kpis = items.map(parseKpi);
    } else {
      (currentStage as unknown as Record<string, string[]>)[type] = items.slice();
    }
    currentSection = null;
  }

  function commitStage() {
    commitSection();
    if (currentStage) blueprint.stages.push(currentStage);
    currentStage = null;
  }

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, '');

    const h1 = line.match(/^#\s+(.+)$/);
    if (h1) {
      blueprint.title = h1[1].trim();
      descriptionMode = true;
      descriptionLines = [];
      continue;
    }

    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) {
      descriptionMode = false;
      blueprint.description = descriptionLines.join(' ').trim();
      commitStage();
      currentStage = emptyStage(h2[1].trim());
      continue;
    }

    const h3 = line.match(/^###\s+(.+)$/);
    if (h3 && currentStage) {
      commitSection();
      const type = classifySection(h3[1]);
      currentSection = type ? { type, items: [], text: '' } : null;
      continue;
    }

    if (descriptionMode) {
      const bq = line.match(/^>\s?(.*)$/);
      if (bq) { descriptionLines.push(bq[1]); continue; }
      if (line.trim()) descriptionLines.push(line.trim());
      continue;
    }

    const li = line.match(/^[\s]*[-*+]\s+(.+)$/);
    if (li && currentSection) {
      currentSection.items.push(li[1].trim());
      continue;
    }

    if (line.trim() && currentSection) {
      currentSection.text = (currentSection.text ? currentSection.text + ' ' : '') + line.trim();
    }
  }

  if (descriptionMode) blueprint.description = descriptionLines.join(' ').trim();
  commitStage();
  return blueprint;
}

export function summarize(bp: Blueprint): BlueprintSummary {
  const stages = bp.stages ?? [];
  let touchpoints = 0;
  const actorSet = new Set<string>();
  let stagesWithKpis = 0;
  let totalKpis = 0;

  for (const s of stages) {
    touchpoints += (s.frontstage?.length ?? 0) + (s.backstage?.length ?? 0);
    (s.actors ?? []).forEach(a => actorSet.add(a.toLowerCase()));
    if ((s.kpis ?? []).length > 0) stagesWithKpis++;
    totalKpis += (s.kpis ?? []).length;
  }

  return {
    stageCount: stages.length,
    touchpoints,
    actorCount: actorSet.size,
    kpiCoverage: stages.length ? Math.round((stagesWithKpis / stages.length) * 100) : 0,
    totalKpis,
  };
}
