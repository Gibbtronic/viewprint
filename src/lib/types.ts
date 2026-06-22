export interface Kpi {
  label: string;
  target: string | null;
}

export interface Stage {
  name: string;
  task: string;
  mindset: string;
  frontstage: string[];
  backstage: string[];
  actors: string[];
  systems: string[];
  data: string[];
  kpis: Kpi[];
}

export interface Blueprint {
  title: string;
  description: string;
  stages: Stage[];
  _raw: string;
}

export interface BlueprintSummary {
  stageCount: number;
  touchpoints: number;
  actorCount: number;
  kpiCoverage: number;
  totalKpis: number;
}

export interface SavedBlueprint {
  id: string;
  title: string;
  description: string;
  stageCount: number;
  lastEdited: string;
  owner: string;
  ownerId: string;
  status: 'Published' | 'Draft';
  markdown?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Collaborator {
  userId: string;
  email: string;
  name: string;
}
