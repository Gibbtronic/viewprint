'use client';

import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, ArrowRight, Brain, CheckCircle, Database,
  Eye, Layers, Monitor, Server, Target, Users,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useApp } from '@/components/AppProvider';
import type { Stage } from '@/lib/types';

const SECTION_META: {
  key: keyof Stage;
  label: string;
  icon: React.ReactNode;
  tint: string;
  border: string;
}[] = [
  { key: 'task',       label: 'Customer task',  icon: <Eye size={14} />,       tint: 'var(--brand-50)',   border: 'var(--brand-100)'   },
  { key: 'mindset',    label: 'Mindset',         icon: <Brain size={14} />,     tint: 'var(--brand-50)',   border: 'var(--brand-100)'   },
  { key: 'frontstage', label: 'Frontstage',      icon: <Monitor size={14} />,   tint: 'var(--info-50)',    border: '#DBEAFE'             },
  { key: 'backstage',  label: 'Backstage',       icon: <Server size={14} />,    tint: 'var(--success-50)', border: '#D1FAE5'             },
  { key: 'actors',     label: 'Actors',          icon: <Users size={14} />,     tint: '#F4F5F7',           border: 'var(--border-1)'    },
  { key: 'systems',    label: 'Systems',         icon: <Monitor size={14} />,   tint: 'var(--warning-50)', border: '#FDE68A'             },
  { key: 'data',       label: 'Data',            icon: <Database size={14} />,  tint: 'var(--danger-50)',  border: '#FECACA'             },
];

const DOT_COLORS: Partial<Record<keyof Stage, string>> = {
  frontstage: 'var(--info-500)',
  backstage:  'var(--success-500)',
  actors:     'var(--fg-2)',
  systems:    'var(--warning-500)',
  data:       'var(--danger-500)',
};

function Dot({ color }: { color: string }) {
  return (
    <span style={{
      display: 'inline-block', width: 6, height: 6,
      borderRadius: '50%', background: color, flexShrink: 0, marginTop: 5,
    }} />
  );
}

export default function DetailPage() {
  const { id, n } = useParams<{ id: string; n: string }>();
  const { blueprint } = useApp();
  const router = useRouter();
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  if (!blueprint) {
    router.replace('/');
    return null;
  }

  const stageIdx = parseInt(n, 10) || 0;
  const { stages } = blueprint;
  const stage = stages[stageIdx];

  if (!stage) {
    router.replace(`/b/${id}`);
    return null;
  }

  const hasPrev = stageIdx > 0;
  const hasNext = stageIdx < stages.length - 1;

  function toggleExpand(key: string) {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <main className="app__main">
      <div className="screen">
        {/* Breadcrumb */}
        <div className="crumbs">
          <Link href={`/b/${id}`} style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--brand-500)' }}>
            <ArrowLeft size={13} /> Overview
          </Link>
          <span className="crumbs__sep">/</span>
          <Layers size={13} />
          <span>{blueprint.title}</span>
          <span className="crumbs__count">Stage {stageIdx + 1} of {stages.length}</span>
        </div>

        {/* Stage tabs */}
        <div className="stage-tabs">
          {stages.map((s, i) => (
            <button
              key={i}
              className={`stage-tab${i === stageIdx ? ' stage-tab--active' : ''}`}
              onClick={() => router.push(`/b/${id}/stage/${i}`)}
            >
              <span className="stage-tab__num">Stage {String(i + 1).padStart(2, '0')}</span>
              <span className="stage-tab__name">{s.name}</span>
            </button>
          ))}
        </div>

        {/* Stage header */}
        <div className="detail__hdr">
          <div className="pill pill--brand">Stage {stageIdx + 1}</div>
          <h1 className="screen__title">{stage.name}</h1>
        </div>

        {/* KPI strip */}
        {stage.kpis.length > 0 && (
          <div className="kpi-strip">
            <div className="kpi-strip__hdr">
              <Target size={14} color="var(--brand-500)" />
              <span style={{ fontWeight: 600, fontSize: 'var(--t-14)' }}>Stage KPIs</span>
              <span className="kpi-strip__count pill">
                {stage.kpis.length} metric{stage.kpis.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="kpi-strip__items">
              {stage.kpis.map((kpi, i) => (
                <div key={i} className="kpi-chip">
                  <CheckCircle size={13} color="var(--brand-500)" />
                  <span className="kpi-chip__label">{kpi.label}</span>
                  {kpi.target && <span className="kpi-chip__target">{kpi.target}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Body grid */}
        <div className="detail__grid">
          {/* Left: section cards */}
          <div className="detail__cards">
            {SECTION_META.map(sec => {
              const val = stage[sec.key];
              const isText = sec.key === 'task' || sec.key === 'mindset';
              const items = isText ? [] : (val as string[]) ?? [];
              const text  = isText ? (val as string) ?? '' : '';

              if (isText && !text) return null;
              if (!isText && items.length === 0) return null;

              const expanded = expandedCards.has(sec.key);
              const MAX = 5;
              const visibleItems = expanded ? items : items.slice(0, MAX);
              const hasMore = items.length > MAX;
              const dotColor = DOT_COLORS[sec.key] ?? 'var(--brand-500)';

              return (
                <div
                  key={sec.key}
                  className="detail-card"
                  style={{
                    '--card-tint':   sec.tint,
                    '--card-border': sec.border,
                  } as React.CSSProperties}
                >
                  <div className="detail-card__hdr">
                    <span style={{ color: 'var(--fg-2)' }}>{sec.icon}</span>
                    <span style={{ fontWeight: 600, fontSize: 'var(--t-14)' }}>{sec.label}</span>
                    {!isText && (
                      <span className="detail-card__count">{items.length}</span>
                    )}
                  </div>
                  <div className="detail-card__body">
                    {isText ? (
                      <p style={{ lineHeight: 'var(--lh-normal)' }}>{text}</p>
                    ) : (
                      <>
                        <ul className="bullet-list">
                          {visibleItems.map((item, i) => (
                            <li key={i}>
                              <Dot color={dotColor} />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                        {hasMore && (
                          <button
                            className="link-btn"
                            style={{ marginTop: 8, fontSize: 'var(--t-12)' }}
                            onClick={() => toggleExpand(sec.key)}
                          >
                            {expanded ? `Hide` : `Show ${items.length - MAX} more`}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: sticky stage rail */}
          <div className="detail__rail">
            <div className="eyebrow" style={{ fontSize: 'var(--t-11)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-2)', marginBottom: 10 }}>
              All stages
            </div>
            <ul className="rail-list">
              {stages.map((s, i) => (
                <li key={i}>
                  <button
                    className={`rail-item${i === stageIdx ? ' rail-item--active' : ''}`}
                    onClick={() => router.push(`/b/${id}/stage/${i}`)}
                  >
                    <span className="rail-item__num">{i + 1}</span>
                    <span className="rail-item__name">{s.name}</span>
                    {s.kpis.length > 0 && (
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand-500)', flexShrink: 0 }} />
                    )}
                  </button>
                </li>
              ))}
            </ul>
            <div className="rail-foot">
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand-500)', display: 'inline-block' }} />
              <span style={{ fontSize: 'var(--t-12)', color: 'var(--fg-2)' }}>Has KPIs</span>
            </div>
          </div>
        </div>

        {/* Bottom nav */}
        <div className="detail__nav">
          <button
            className="btn btn--ghost"
            disabled={!hasPrev}
            onClick={() => router.push(`/b/${id}/stage/${stageIdx - 1}`)}
          >
            <ArrowLeft size={14} />
            Previous
          </button>
          <div className="detail__dots">
            {stages.map((_, i) => (
              <div key={i} className={`pgdot${i === stageIdx ? ' pgdot--active' : ''}`} />
            ))}
          </div>
          <button
            className="btn btn--ghost"
            disabled={!hasNext}
            onClick={() => router.push(`/b/${id}/stage/${stageIdx + 1}`)}
          >
            Next: {hasNext ? stages[stageIdx + 1].name : ''}
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </main>
  );
}
