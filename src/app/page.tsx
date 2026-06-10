'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, FileText, Upload } from 'lucide-react';
import { useApp } from '@/components/AppProvider';
import { createClient } from '@/lib/supabase';
import { parseMarkdown } from '@/lib/parser';
import { DEMO_MARKDOWN } from '@/lib/demo';

const ACCEPTED = ['.md', '.markdown', '.txt'];

export default function LandingPage() {
  const { user, setMarkdown } = useApp();
  const router = useRouter();
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  async function loadMarkdown(md: string) {
    if (user) {
      const title = parseMarkdown(md).title;
      const { data } = await createClient()
        .from('blueprints')
        .insert({ title, markdown: md, owner_id: user.id })
        .select('id')
        .single();
      if (data?.id) {
        setMarkdown(md, data.id);
        router.push(`/b/${data.id}`);
        return;
      }
    }
    const id = `local-${Date.now()}`;
    setMarkdown(md, id);
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
        setMarkdown(DEMO_MARKDOWN, data.id);
        router.push(`/b/${data.id}`);
        return;
      }
    }
    setMarkdown(DEMO_MARKDOWN, 'demo');
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
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const onDragLeave = useCallback(() => setDragging(false), []);

  const onFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) readFile(file);
    // reset so same file can be re-selected
    e.target.value = '';
  }, []);

  return (
    <main className="app__main">
      <div className="landing">
        {/* Hero */}
        <div className="landing__hero">
          <div className="pill pill--brand">
            <FileText size={12} />
            Service blueprint visualizer
          </div>
          <h1 className="hero-title">
            Visualize your{' '}
            <span className="hero-title__accent">service blueprint</span>
            {' '}from a markdown file
          </h1>
          <p className="hero-sub">
            Upload a structured Markdown file describing your service stages and swimlane
            data. Viewprint renders it as an interactive horizontal blueprint — ready to
            explore, present, and navigate.
          </p>
        </div>

        {/* Demo CTA */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            className="btn btn--primary"
            style={{ borderRadius: 999, paddingLeft: 24, paddingRight: 24, gap: 10, fontSize: 'var(--t-15)' }}
            onClick={loadDemo}
          >
            View example blueprint
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Dropzone */}
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
            <Upload size={28} color="var(--brand-500)" />
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

        {/* Format reference card */}
        <div className="landing__format">
          <p style={{ fontWeight: 600, marginBottom: 12 }}>Expected markdown structure</p>
          <div className="code-card">
            <div className="code-card__hdr">
              <span className="tl-dot tl-dot--red" />
              <span className="tl-dot tl-dot--yellow" />
              <span className="tl-dot tl-dot--green" />
              <span style={{
                marginLeft: 8,
                fontSize: 'var(--t-12)',
                color: 'var(--fg-2)',
                fontFamily: 'var(--font-mono)',
              }}>
                service-blueprint.md
              </span>
            </div>
            <pre className="code-card__body"><code>{`# My Service Name

## Stage Name

### Task
What the customer is trying to accomplish

### Mindset
The customer’s emotional state and attitude

### Frontstage Touchpoints
- Visible interaction point 1
- Visible interaction point 2

### Backstage Touchpoints
- Hidden process or action 1
- Hidden process or action 2

### Actors
- Customer
- Staff member name

### Systems
- System or platform name

### Data
- Data point or metric tracked

### KPIs
- KPI name — target value`}</code></pre>
          </div>
        </div>
      </div>
    </main>
  );
}
