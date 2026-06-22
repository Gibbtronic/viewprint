'use client';

import { useEffect, useRef, useState } from 'react';
import { Mail, Trash2, UserPlus, X } from 'lucide-react';
import { useApp } from './AppProvider';
import { createClient } from '@/lib/supabase';
import type { Collaborator } from '@/lib/types';

export function ShareModal({ blueprintId }: { blueprintId: string }) {
  const { user, setShowShare } = useApp();
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [inviting, setInviting] = useState(false);
  const [loading, setLoading] = useState(true);
  const overlayRef = useRef<HTMLDivElement>(null);

  const isOwner = !!user && ownerId === user.id;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowShare(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [setShowShare]);

  async function load() {
    const supabase = createClient();
    const [{ data: bp }, { data: rows }] = await Promise.all([
      supabase.from('blueprints').select('owner_id').eq('id', blueprintId).single(),
      supabase
        .from('blueprint_collaborators')
        .select('user_id, profiles(email, name)')
        .eq('blueprint_id', blueprintId),
    ]);
    setOwnerId(bp?.owner_id ?? null);
    setCollaborators(
      (rows ?? []).map(r => {
        const profile = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
        return {
          userId: r.user_id as string,
          email: profile?.email ?? '',
          name: profile?.name || profile?.email?.split('@')[0] || 'User',
        };
      })
    );
    setLoading(false);
  }

  useEffect(() => { load(); }, [blueprintId]);

  function close() { setShowShare(false); }

  async function invite() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    setError('');
    setInviting(true);
    const supabase = createClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, name')
      .eq('email', trimmed)
      .maybeSingle();

    if (!profile) {
      setError("No account found with that email — they'll need to sign up first.");
      setInviting(false);
      return;
    }
    if (profile.id === ownerId || collaborators.some(c => c.userId === profile.id)) {
      setError('Already has access.');
      setInviting(false);
      return;
    }

    const { error: insertError } = await supabase
      .from('blueprint_collaborators')
      .insert({ blueprint_id: blueprintId, user_id: profile.id });

    if (insertError) {
      setError('Could not add collaborator. Please try again.');
    } else {
      setCollaborators(prev => [...prev, {
        userId: profile.id,
        email: profile.email,
        name: profile.name || profile.email.split('@')[0],
      }]);
      setEmail('');
    }
    setInviting(false);
  }

  async function remove(userId: string) {
    await createClient()
      .from('blueprint_collaborators')
      .delete()
      .eq('blueprint_id', blueprintId)
      .eq('user_id', userId);
    setCollaborators(prev => prev.filter(c => c.userId !== userId));
  }

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={e => { if (e.target === overlayRef.current) close(); }}>
      <div className="modal" style={{ maxWidth: 480 }}>
        <div className="modal__hdr">
          <div>
            <div style={{ fontSize: 'var(--t-11)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-2)' }}>Share</div>
            <h2 style={{ margin: '6px 0 0', fontSize: 'var(--t-20)', fontWeight: 600 }}>Share this blueprint</h2>
          </div>
          <button className="icon-btn" onClick={close}><X size={16} /></button>
        </div>

        <div className="modal__body">
          {isOwner && (
            <>
              <div style={{ display: 'flex', gap: 8 }}>
                <div className="field" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Mail size={14} color="var(--fg-3)" />
                  <input
                    type="email"
                    placeholder="Invite by email…"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && invite()}
                    style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 'var(--t-14)' }}
                  />
                </div>
                <button className="btn btn--primary" onClick={invite} disabled={inviting || !email.trim()}>
                  <UserPlus size={14} />
                  Invite
                </button>
              </div>
              {error && (
                <div style={{ marginTop: 8, fontSize: 'var(--t-12)', color: 'var(--error-500)' }}>{error}</div>
              )}
            </>
          )}

          <div style={{ marginTop: 20 }}>
            <div style={{ fontSize: 'var(--t-12)', fontWeight: 600, color: 'var(--fg-2)', marginBottom: 8 }}>
              People with access
            </div>
            {loading ? (
              <div style={{ color: 'var(--fg-2)', fontSize: 'var(--t-14)' }}>Loading…</div>
            ) : collaborators.length === 0 ? (
              <div style={{ color: 'var(--fg-2)', fontSize: 'var(--t-14)' }}>
                {isOwner ? 'Not shared with anyone yet.' : 'No other collaborators.'}
              </div>
            ) : (
              <ul style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: 0, padding: 0, listStyle: 'none' }}>
                {collaborators.map(c => (
                  <li key={c.userId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: 'var(--t-14)', fontWeight: 500 }}>{c.name}</div>
                      <div style={{ fontSize: 'var(--t-12)', color: 'var(--fg-2)' }}>{c.email}</div>
                    </div>
                    {isOwner && (
                      <button className="icon-btn" onClick={() => remove(c.userId)}>
                        <Trash2 size={14} color="var(--error-500)" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
