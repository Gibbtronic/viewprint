'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, CheckCircle, FileText, Image, X } from 'lucide-react';
import { useApp } from './AppProvider';

export function ExportModal() {
  const { setShowExport, blueprint } = useApp();
  const [format, setFormat] = useState<'pdf' | 'svg'>('pdf');
  const [includeKpis, setIncludeKpis] = useState(true);
  const [includeDetail, setIncludeDetail] = useState(false);
  const [status, setStatus] = useState<'idle' | 'preparing' | 'done'>('idle');
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowExport(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [setShowExport]);

  function close() { setShowExport(false); }

  const slug = (blueprint?.title ?? 'blueprint')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  async function handleDownload() {
    setStatus('preparing');
    await new Promise(r => setTimeout(r, 1600));
    setStatus('done');
    await new Promise(r => setTimeout(r, 1400));
    close();
  }

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={e => { if (e.target === overlayRef.current) close(); }}>
      <div className="modal" style={{ maxWidth: 520 }}>
        <div className="modal__hdr">
          <div>
            <div style={{ fontSize: 'var(--t-11)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-2)' }}>Export</div>
            <h2 style={{ margin: '6px 0 0', fontSize: 'var(--t-20)', fontWeight: 600 }}>Download blueprint</h2>
          </div>
          <button className="icon-btn" onClick={close}><X size={16} /></button>
        </div>

        <div className="modal__body">
          {status === 'idle' && (
            <>
              <div
                className={`export-format-row${format === 'pdf' ? ' export-format-row--active' : ''}`}
                onClick={() => setFormat('pdf')}
              >
                <div className="export-format-row__icon"><FileText size={20} color="var(--brand-500)" /></div>
                <div>
                  <div style={{ fontWeight: 600 }}>PDF</div>
                  <div style={{ fontSize: 'var(--t-12)', color: 'var(--fg-2)', marginTop: 2 }}>Full-page document, ready to share or print</div>
                </div>
                <div className="export-format-row__radio">
                  {format === 'pdf' && <Check size={10} color="white" />}
                </div>
              </div>

              <div
                className={`export-format-row${format === 'svg' ? ' export-format-row--active' : ''}`}
                onClick={() => setFormat('svg')}
              >
                <div className="export-format-row__icon"><Image size={20} color="var(--brand-500)" /></div>
                <div>
                  <div style={{ fontWeight: 600 }}>SVG</div>
                  <div style={{ fontSize: 'var(--t-12)', color: 'var(--fg-2)', marginTop: 2 }}>Scalable vector, ideal for design tools</div>
                </div>
                <div className="export-format-row__radio">
                  {format === 'svg' && <Check size={10} color="white" />}
                </div>
              </div>

              <div className="export-options">
                <label className="export-check-row">
                  <input type="checkbox" checked={includeKpis} onChange={e => setIncludeKpis(e.target.checked)} />
                  KPIs and target values
                </label>
                <label className="export-check-row">
                  <input type="checkbox" checked={includeDetail} onChange={e => setIncludeDetail(e.target.checked)} />
                  Detail pages for each stage
                </label>
              </div>

              <div style={{ marginBottom: 'var(--s-2)', color: 'var(--fg-2)', fontSize: 'var(--t-12)' }}>File</div>
              <div className="export-filename">{slug}.{format}</div>
            </>
          )}

          {status === 'preparing' && (
            <div style={{ padding: 'var(--s-9) var(--s-6)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--s-3)' }}>
              <div className="dot--pulse" style={{ width: 10, height: 10 }} />
              <div style={{ fontWeight: 600 }}>Preparing {format.toUpperCase()}…</div>
            </div>
          )}

          {status === 'done' && (
            <div style={{ padding: 'var(--s-9) var(--s-6)', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--s-3)' }}>
              <div className="export-success">
                <CheckCircle size={16} />
                Download ready
              </div>
            </div>
          )}
        </div>

        {status === 'idle' && (
          <div className="modal__ftr">
            <button className="btn btn--ghost" onClick={close}>Cancel</button>
            <button className="btn btn--primary" onClick={handleDownload}>
              <FileText size={14} />
              Download
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
