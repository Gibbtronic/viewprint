'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Layers, MoreHorizontal, Plus, Search, Trash2 } from 'lucide-react';
import { useApp } from '@/components/AppProvider';
import { createClient } from '@/lib/supabase';
import { parseMarkdown } from '@/lib/parser';
import type { SavedBlueprint } from '@/lib/types';

type FilterTab = 'All' | 'Published' | 'Draft';

interface DbRow {
  id: string;
  title: string;
  markdown: string;
  status: 'Published' | 'Draft';
  updated_at: string;
  owner_id: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function rowToSavedBlueprint(row: DbRow, currentUserId: string, ownerNames: Record<string, string>): SavedBlueprint {
  const bp = parseMarkdown(row.markdown);
  return {
    id: row.id,
    title: row.title,
    description: bp.description,
    stageCount: bp.stages.length,
    status: row.status,
    owner: row.owner_id === currentUserId ? 'You' : (ownerNames[row.owner_id] ?? 'Unknown'),
    ownerId: row.owner_id,
    lastEdited: formatDate(row.updated_at),
    markdown: row.markdown,
  };
}

export default function DashboardPage() {
  const { user, setMarkdown, setShowAuth, setShowUpload } = useApp();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterTab>('All');
  const [blueprints, setBlueprints] = useState<SavedBlueprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setOpenMenuId(null);
    }
    if (openMenuId) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [openMenuId]);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    const supabase = createClient();
    supabase
      .from('blueprints')
      .select('id, title, markdown, status, updated_at, owner_id')
      .order('updated_at', { ascending: false })
      .then(async ({ data }) => {
        const rows = (data ?? []) as DbRow[];
        const otherOwnerIds = Array.from(new Set(rows.map(r => r.owner_id).filter(id => id !== user.id)));
        let ownerNames: Record<string, string> = {};
        if (otherOwnerIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, name, email')
            .in('id', otherOwnerIds);
          ownerNames = Object.fromEntries(
            (profiles ?? []).map(p => [p.id, p.name || p.email.split('@')[0]])
          );
        }
        setBlueprints(rows.map(r => rowToSavedBlueprint(r, user.id, ownerNames)));
        setLoading(false);
      });
  }, [user]);

  const filtered = useMemo(() => {
    return blueprints.filter(bp => {
      if (filter !== 'All' && bp.status !== filter) return false;
      if (query) {
        const q = query.toLowerCase();
        return bp.title.toLowerCase().includes(q) || bp.description.toLowerCase().includes(q);
      }
      return true;
    });
  }, [blueprints, filter, query]);

  if (!user) {
    return (
      <main className="app__main">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, paddingTop: 80, textAlign: 'center' }}>
          <Layers size={40} color="var(--brand-500)" />
          <h1 style={{ fontSize: 'var(--t-24)', fontWeight: 600, margin: 0 }}>Sign in to view your blueprints</h1>
          <p style={{ color: 'var(--fg-2)', margin: 0 }}>Save and manage all your service blueprints in one place.</p>
          <button className="btn btn--primary" onClick={() => setShowAuth(true)}>Sign in</button>
        </div>
      </main>
    );
  }

  function openBlueprint(bp: SavedBlueprint) {
    setMarkdown(bp.markdown ?? '', bp.id, bp.ownerId);
    router.push(`/b/${bp.id}`);
  }

  async function deleteBlueprint(id: string) {
    setOpenMenuId(null);
    await createClient().from('blueprints').delete().eq('id', id);
    setBlueprints(prev => prev.filter(bp => bp.id !== id));
  }

  const initials = user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <main className="app__main">
      <div className="screen">
        {/* Header */}
        <div className="screen__hdr">
          <div>
            <div className="pill pill--brand">
              <Layers size={12} />
              Workspace
            </div>
            <h1 className="screen__title">My blueprints</h1>
            <p className="screen__sub">
              All your saved service blueprints in one place.
            </p>
          </div>
          <div className="screen__hdr-actions">
            <button className="btn btn--primary" onClick={() => setShowUpload(true)}>
              <Plus size={14} />
              New blueprint
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="dash-toolbar">
          <div className="field--search">
            <Search size={14} color="var(--fg-3)" />
            <input
              type="text"
              placeholder="Search blueprints…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <div className="seg" style={{ marginLeft: 4 }}>
            {(['All', 'Published', 'Draft'] as FilterTab[]).map(tab => (
              <button
                key={tab}
                className={`seg__btn${filter === tab ? ' seg__btn--active' : ''}`}
                onClick={() => setFilter(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="card dash-card">
          {loading ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--fg-2)' }}>
              Loading blueprints…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--fg-2)' }}>
              {blueprints.length === 0
                ? 'No blueprints yet. Upload a markdown file to get started.'
                : 'No blueprints match your search.'}
            </div>
          ) : (
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Blueprint</th>
                  <th>Stages</th>
                  <th>Status</th>
                  <th>Owner</th>
                  <th>Last edited</th>
                  <th style={{ width: 40 }} />
                </tr>
              </thead>
              <tbody>
                {filtered.map(bp => (
                  <tr key={bp.id} className="dash-row" onClick={() => openBlueprint(bp)}>
                    <td>
                      <div className="dash-row__title">
                        <div className="dash-row__icon">
                          <FileText size={15} color="var(--brand-500)" />
                        </div>
                        <div>
                          <div className="dash-row__name">{bp.title}</div>
                          <div className="dash-row__desc">{bp.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="tnum" style={{ color: 'var(--fg-2)' }}>{bp.stageCount}</td>
                    <td>
                      <div className="status-pill" style={{
                        background: bp.status === 'Published' ? 'var(--success-50)' : 'var(--warning-50)',
                        color: bp.status === 'Published' ? 'var(--success-500)' : 'var(--warning-500)',
                      }}>
                        <span style={{
                          width: 6, height: 6, borderRadius: '50%',
                          background: 'currentColor', display: 'inline-block',
                        }} />
                        {bp.status}
                      </div>
                    </td>
                    <td>
                      <div className="dash-row__owner">
                        <div className="avatar avatar--sm">
                          {bp.owner === 'You' ? initials : bp.owner.slice(0, 2).toUpperCase()}
                        </div>
                        {bp.owner}
                      </div>
                    </td>
                    <td style={{ color: 'var(--fg-2)', fontSize: 'var(--t-12)' }}>{bp.lastEdited}</td>
                    <td onClick={e => e.stopPropagation()}>
                      {bp.ownerId === user.id && (
                      <div style={{ position: 'relative' }} ref={openMenuId === bp.id ? menuRef : null}>
                        <button
                          className="icon-btn"
                          onClick={() => setOpenMenuId(openMenuId === bp.id ? null : bp.id)}
                        >
                          <MoreHorizontal size={15} />
                        </button>
                        {openMenuId === bp.id && (
                          <div className="popover" style={{ position: 'absolute', right: 0, top: '100%', minWidth: 140, zIndex: 50 }}>
                            <button
                              className="popover__item"
                              style={{ color: 'var(--error-500)' }}
                              onClick={() => deleteBlueprint(bp.id)}
                            >
                              <Trash2 size={15} />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}
