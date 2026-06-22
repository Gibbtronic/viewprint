'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle, Edit, Eye, FileText, Layers, Share2 } from 'lucide-react';
import { useApp } from '@/components/AppProvider';
import { createClient } from '@/lib/supabase';
import { parseMarkdown } from '@/lib/parser';
import type { Blueprint } from '@/lib/types';

function isDbId(id: string): boolean {
  return !id.startsWith('local-') && id !== 'demo';
}

type SaveState = 'saved' | 'saving';

function DocumentPreview({ markdown }: { markdown: string }) {
  const bp = parseMarkdown(markdown);

  return (
    <div className="doc">
      <h1 className="doc__h1">{bp.title}</h1>
      {bp.description && <blockquote className="doc__quote">{bp.description}</blockquote>}
      {bp.stages.map((stage, i) => (
        <div key={i}>
          <h2 className="doc__h2">{stage.name}</h2>
          {stage.task && (
            <>
              <h3 className="doc__h3">Task</h3>
              <p className="doc__p">{stage.task}</p>
            </>
          )}
          {stage.mindset && (
            <>
              <h3 className="doc__h3">Mindset</h3>
              <p className="doc__p">{stage.mindset}</p>
            </>
          )}
          {(['frontstage', 'backstage', 'actors', 'systems', 'data'] as const).map(key => {
            const items = stage[key];
            if (!items.length) return null;
            return (
              <div key={key}>
                <h3 className="doc__h3">{key.charAt(0).toUpperCase() + key.slice(1)}</h3>
                <ul className="doc__list">
                  {items.map((item, j) => <li key={j}>{item}</li>)}
                </ul>
              </div>
            );
          })}
          {stage.kpis.length > 0 && (
            <>
              <h3 className="doc__h3">KPIs</h3>
              <ul className="doc__list">
                {stage.kpis.map((kpi, j) => (
                  <li key={j}>{kpi.label}{kpi.target ? ` — ${kpi.target}` : ''}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

export default function EditorPage() {
  const { id } = useParams<{ id: string }>();
  const { user, blueprint, markdown, setMarkdown, currentOwnerId, setShowShare } = useApp();
  const isOwner = !!user && currentOwnerId === user.id;
  const router = useRouter();
  const [localMd, setLocalMd] = useState(markdown);
  const [saveState, setSaveState] = useState<SaveState>('saved');
  const [splitPct, setSplitPct] = useState(50);
  const isDragging = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setLocalMd(markdown); }, [markdown]);

  if (!blueprint) {
    router.replace('/');
    return null;
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setLocalMd(val);
    setSaveState('saving');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setMarkdown(val, id);
      if (isDbId(id)) {
        const title = parseMarkdown(val).title;
        await createClient()
          .from('blueprints')
          .update({ markdown: val, title })
          .eq('id', id);
      }
      setSaveState('saved');
    }, 600);
  }

  // Draggable divider
  function onMouseDownDivider(e: React.MouseEvent) {
    e.preventDefault();
    isDragging.current = true;
    function onMove(ev: MouseEvent) {
      if (!isDragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      setSplitPct(Math.min(75, Math.max(25, pct)));
    }
    function onUp() {
      isDragging.current = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  const parsedForStats = parseMarkdown(localMd);

  return (
    <div className="editor">
      {/* Blueprint bar */}
      <div className="bpbar">
        <div className="bpbar__inner">
          <div className="bpbar__left">
            <FileText size={16} color="var(--fg-2)" />
            <span style={{ fontWeight: 600, fontSize: 'var(--t-14)' }}>{blueprint.title}</span>
            <div className="bpbar__div" />
            <span style={{ fontSize: 'var(--t-12)', color: 'var(--fg-2)' }}>
              {parsedForStats.stages.length} stage{parsedForStats.stages.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="bpbar__right">
            <div className={`save-state${saveState === 'saving' ? ' save-state--saving' : ''}`}>
              {saveState === 'saving' ? (
                <><div className="dot--pulse" />Saving…</>
              ) : (
                <><CheckCircle size={12} color="var(--success-500)" />All changes saved</>
              )}
            </div>
            {isOwner && isDbId(id) && (
              <button className="btn btn--ghost btn--share" onClick={() => setShowShare(true)}>
                <Share2 size={14} />
                Share
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Panes */}
      <div className="editor__panes" ref={containerRef}>
        {/* Left: code */}
        <div className="editor__pane editor__pane--code" style={{ width: `${splitPct}%` }}>
          <div className="editor__pane-hdr">
            <Edit size={14} color="var(--fg-2)" />
            <span style={{ fontSize: 'var(--t-12)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-2)' }}>
              Markdown source
            </span>
          </div>
          <div className="editor__textarea-wrap">
            <textarea
              className="editor__textarea"
              value={localMd}
              onChange={handleChange}
              spellCheck={false}
              wrap="off"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="editor__divider" onMouseDown={onMouseDownDivider}>
          <div className="editor__divider-grip" />
        </div>

        {/* Right: preview */}
        <div className="editor__pane editor__pane--preview" style={{ flex: 1 }}>
          <div className="editor__pane-hdr">
            <Eye size={14} color="var(--fg-2)" />
            <span style={{ fontSize: 'var(--t-12)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--fg-2)' }}>
              Live preview
            </span>
          </div>
          <div className="editor__preview-scroll">
            <DocumentPreview markdown={localMd} />
          </div>
        </div>
      </div>
    </div>
  );
}
