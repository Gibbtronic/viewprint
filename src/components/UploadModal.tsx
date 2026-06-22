'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Sparkles, Upload, X } from 'lucide-react';
import { useApp } from './AppProvider';
import { createClient } from '@/lib/supabase';
import { parseMarkdown } from '@/lib/parser';
import { DEMO_MARKDOWN } from '@/lib/demo';

const ACCEPTED = ['.md', '.markdown', '.txt'];

export function UploadModal() {
  const { user, setMarkdown, setShowUpload } = useApp();
  const router = useRouter();
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowUpload(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [setShowUpload]);

  function close() { setShowUpload(false); }

  async function loadMarkdown(md: string) {
    if (user) {
      const title = parseMarkdown(md).title;
      const { data } = await createClient()
        .from('blueprints')
        .insert({ title, markdown: md, owner_id: user.id })
        .select('id')
        .single();
      if (data?.id) {
        setMarkdown(md, data.id, user.id);
        close();
        router.push(`/b/${data.id}`);
        return;
      }
    }
    const id = `local-${Date.now()}`;
    setMarkdown(md, id);
    close();
    router.push(`/b/${id}`);
  }

  async function loadDemo() {
    if (user) {
      const title = parseMarkdown(DEMO_MARKDOWN).title;
      const { data } = await createClient()
        .from('blueprints')
        .insert({ title, markdown: DEMO_MARKDOWN, owner_id: user.id })
        .select('id')
        .single();
      if (data?.id) {
        setMarkdown(DEMO_MARKDOWN, data.id, user.id);
        close();
        router.push(`/b/${data.id}`);
        return;
      }
    }
    setMarkdown(DEMO_MARKDOWN, 'demo');
    close();
    router.push('/b/demo');
  }

  function readFile(file: File) {
    if (!ACCEPTED.some(ext => file.name.toLowerCase().endsWith(ext))) {
      setError('Invalid file type. Please upload a .md, .markdown, or .txt file.');
      return;
    }
    setError('');
    const reader = new FileReader();
    reader.onload = e => loadMarkdown(e.target?.result as string);
    reader.readAsText(file);
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) readFile(file);
  }, [user]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const onDragLeave = useCallback(() => setDragging(false), []);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) readFile(file);
    e.target.value = '';
  }, [user]);

  return (
    <div
      className="modal-overlay"
      ref={overlayRef}
      onClick={e => { if (e.target === overlayRef.current) close(); }}
    >
      <div className="modal" style={{ maxWidth: 580 }}>
        <div className="modal__hdr">
          <div>
            <div className="eyebrow" style={{ fontSize: 'var(--t-11)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-2)' }}>
              New blueprint
            </div>
            <h2 style={{ margin: '6px 0 8px', fontSize: 'var(--t-20)', fontWeight: 600 }}>
              Visualise from a markdown file
            </h2>
            <p style={{ margin: 0, fontSize: 'var(--t-14)', color: 'var(--fg-2)', lineHeight: 1.5 }}>
              Upload a structured markdown file describing your service stages, swimlanes, and KPIs — Viewprint renders it as an interactive blueprint.
            </p>
          </div>
          <button className="icon-btn" onClick={close} style={{ alignSelf: 'flex-start' }}>
            <X size={16} />
          </button>
        </div>

        <div className="modal__body">
          <div
            className={`dropzone${dragging ? ' dropzone--drag' : ''}${error ? ' dropzone--error' : ''}`}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".md,.markdown,.txt"
              style={{ display: 'none' }}
              onChange={onFileChange}
            />
            <div className="dropzone__icon">
              <Upload size={24} color="var(--brand-500)" />
            </div>
            <div className="dropzone__title">Upload your blueprint markdown</div>
            <p className="dropzone__sub">
              Drag &amp; drop a <code>.md</code> or <code>.txt</code> file, or click to browse
            </p>
            {error && <div className="dropzone__error">{error}</div>}
            <div className="dropzone__meta">
              <FileText size={12} />
              Markdown format with stage sections and swimlane fields
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 20 }}>
            <span style={{ fontSize: 'var(--t-14)', color: 'var(--fg-2)' }}>Don&apos;t have a file yet?</span>
            <button className="btn btn--ghost" onClick={loadDemo}>
              <Sparkles size={14} />
              Load demo blueprint
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
