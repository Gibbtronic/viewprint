'use client';

import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import {
  ArrowRight, BarChart2, Brain, Database, Eye,
  Layers, Monitor, RefreshCw, Server, Target, Users,
} from 'lucide-react';
import { useApp } from '@/components/AppProvider';
import { summarize } from '@/lib/parser';
import type { Stage } from '@/lib/types';

const LANE_ORDER = [
  { key: 'task',       label: 'Customer task',  icon: <Eye size={15} />,       color: 'var(--brand-500)'   },
  { key: 'mindset',    label: 'Mindset',         icon: <Brain size={15} />,     color: 'var(--brand-500)'   },
  { key: '_interaction', label: 'Line of interaction', struct: true, color: 'var(--brand-500)' },
  { key: 'frontstage', label: 'Frontstage',      icon: <Monitor size={15} />,   color: 'var(--info-500)'    },
  { key: '_visibility',  label: 'Line of visibility',  struct: true, color: 'var(--success-500)' },
  { key: 'backstage',  label: 'Backstage',       icon: <Server size={15} />,    color: 'var(--success-500)' },
  { key: 'actors',     label: 'Actors',          icon: <Users size={15} />,     color: 'var(--fg-2)'        },
  { key: 'systems',    label: 'Systems',         icon: <Monitor size={15} />,   color: 'var(--warning-500)' },
  { key: 'data',       label: 'Data',            icon: <Database size={15} />,  color: 'var(--danger-500)'  },
  { key: 'kpis',       label: 'KPIs',            icon: <Target size={15} />,    color: 'var(--brand-500)'   },
];

const DOT_COLORS: Record<string, string> = {
  frontstage: 'var(--info-500)',
  backstage:  'var(--success-500)',
  actors:     'var(--fg-2)',
  systems:    'var(--warning-500)',
  data:       'var(--danger-500)',
  kpis:       'var(--brand-500)',
};

function Dot({ color }: { color: string }) {
  return (
    <span style={{
      display: 'inline-block',
      width: 6, height: 6,
      borderRadius: '50%',
      background: color,
      flexShrink: 0,
      marginTop: 5,
    }} />
  );
}

function BulletCell({ items, color, max = 4 }: { items: string[]; color: string; max?: number }) {
  const visible = items.slice(0, max);
  const more = items.length - max;
  return (
    <ul className="bullet-list">
      {visible.map((item, i) => (
        <li key={i}>
          <Dot color={color} />
          <span>{item}</span>
        </li>
      ))}
      {more > 0 && <li className="bullet-list__more">+{more} more</li>}
    </ul>
  );
}

function KpiCell({ kpis, max = 3 }: { kpis: Stage['kpis']; max?: number }) {
  const visible = kpis.slice(0, max);
  const more = kpis.length - max;
  return (
    <ul className="kpi-list">
      {visible.map((kpi, i) => (
        <li key={i}>
          <div className="kpi-list__label">{kpi.label}</div>
          {kpi.target && <div className="kpi-list__target">{kpi.target}</div>}
        </li>
      ))}
      {more > 0 && (
        <li style={{ color: 'var(--fg-3)', fontSize: 'var(--t-12)', marginTop: 2 }}>+{more} more</li>
      )}
    </ul>
  );
}

export default function OverviewPage() {
  const { id } = useParams<{ id: string }>();
  const { blueprint, setMarkdown, clearBlueprint } = useApp();
  const router = useRouter();

  if (!blueprint) {
    router.replace('/');
    return null;
  }

  const { stages } = blueprint;
  const stats = summarize(blueprint);
  const colWidth = 280;
  const labelWidth = 200;

  const gridCols = `${labelWidth}px ${stages.map(() => `${colWidth}px`).join(' ')}`;

  function goToDetail(n: number) {
    router.push(`/b/${id}/stage/${n}`);
  }

  return (
    <main className="app__main">
      <div className="screen">
        {/* Header */}
        <div className="screen__hdr">
          <div>
            <div className="pill pill--brand">
              <Layers size={12} />
              Service blueprint
            </div>
            <h1 className="screen__title">{blueprint.title}</h1>
            {blueprint.description && (
              <p className="screen__sub">{blueprint.description}</p>
            )}
          </div>
          <div className="screen__hdr-actions">
            <button className="btn btn--ghost" onClick={() => { clearBlueprint(); router.push('/'); }}>
              <RefreshCw size={14} />
              Upload new file
            </button>
          </div>
        </div>

        {/* Stat cards */}
        <div className="stat-row">
          <div className="stat-card">
            <div className="stat-card__icon"><Layers size={20} /></div>
            <div>
              <div className="stat-card__eyebrow">Stages</div>
              <div className="stat-card__value tnum">{stats.stageCount}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card__icon"><Eye size={20} /></div>
            <div>
              <div className="stat-card__eyebrow">Touchpoints</div>
              <div className="stat-card__value tnum">{stats.touchpoints}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card__icon"><Users size={20} /></div>
            <div>
              <div className="stat-card__eyebrow">Unique actors</div>
              <div className="stat-card__value tnum">{stats.actorCount}</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-card__icon"><BarChart2 size={20} /></div>
            <div>
              <div className="stat-card__eyebrow">KPI coverage</div>
              <div className="stat-card__value tnum">
                {stats.kpiCoverage}
                <span className="stat-card__suffix">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Hint */}
        <div className="hint-row">
          <span>Click any stage column to open the detail view</span>
          {stages.length > 4 && (
            <span className="hint-row__scroll">Scroll horizontally to see all stages →</span>
          )}
        </div>

        {/* Blueprint grid */}
        <div className="bp-card">
          <div className="bp-scroll">
            <div
              className="bp-grid"
              style={{ gridTemplateColumns: gridCols }}
            >
              {/* Header row */}
              <div className="bp-cell bp-cell--corner">
                <span className="eyebrow" style={{ fontSize: 'var(--t-11)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-2)' }}>
                  Swimlane
                </span>
              </div>
              {stages.map((stage, i) => (
                <div
                  key={i}
                  className="bp-cell bp-cell--head"
                  onClick={() => goToDetail(i)}
                >
                  <span className="eyebrow" style={{ fontSize: 'var(--t-11)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-2)' }}>
                    Stage {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="bp-cell__title">{stage.name}</span>
                  <span className="bp-cell__arrow">
                    <ArrowRight size={14} color="var(--brand-500)" />
                  </span>
                </div>
              ))}

              {/* Data rows */}
              {LANE_ORDER.map(lane => {
                if ((lane as { struct?: boolean }).struct) {
                  const lc = (lane as { color: string }).color;
                  return (
                    <>
                      <div
                        key={`${lane.key}-label`}
                        className="bp-cell bp-cell--struct-label"
                        style={{ '--line-color': lc } as React.CSSProperties}
                      >
                        <span style={{ color: lc }}>{lane.label}</span>
                      </div>
                      <div
                        key={`${lane.key}-line`}
                        className="bp-cell bp-cell--struct-line"
                        style={{
                          '--line-color': lc,
                          gridColumn: `span ${stages.length}`,
                        } as React.CSSProperties}
                      />
                    </>
                  );
                }

                return (
                  <>
                    <div key={`${lane.key}-label`} className="bp-cell bp-cell--lane">
                      <div className="lane-label">
                        <span style={{ color: lane.color }}>{lane.icon}</span>
                        {lane.label}
                      </div>
                    </div>
                    {stages.map((stage, i) => {
                      const val = (stage as unknown as Record<string, unknown>)[lane.key];
                      const color = DOT_COLORS[lane.key] ?? 'var(--brand-500)';

                      if (lane.key === 'task' || lane.key === 'mindset') {
                        return (
                          <div key={i} className="bp-cell bp-cell--data">
                            {val ? (
                              <span className="cell-text">{val as string}</span>
                            ) : (
                              <span className="cell-empty">—</span>
                            )}
                          </div>
                        );
                      }

                      if (lane.key === 'kpis') {
                        const kpis = stage.kpis;
                        return (
                          <div key={i} className="bp-cell bp-cell--multi">
                            {kpis.length > 0
                              ? <KpiCell kpis={kpis} />
                              : <span className="cell-empty">—</span>}
                          </div>
                        );
                      }

                      const items = val as string[];
                      return (
                        <div key={i} className="bp-cell bp-cell--multi">
                          {items?.length > 0
                            ? <BulletCell items={items} color={color} />
                            : <span className="cell-empty">—</span>}
                        </div>
                      );
                    })}
                  </>
                );
              })}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="legend">
          <div className="legend__item">
            <span className="legend__line legend__line--interaction" />
            Line of interaction
          </div>
          <div className="legend__item">
            <span className="legend__line legend__line--visibility" />
            Line of visibility
          </div>
        </div>
      </div>
    </main>
  );
}
