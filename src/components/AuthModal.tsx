'use client';

import { useEffect, useRef, useState } from 'react';
import { Lock, Mail, User, X } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useApp } from './AppProvider';

export function AuthModal() {
  const { setShowAuth } = useApp();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setShowAuth(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [setShowAuth]);

  function close() { setShowAuth(false); }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!email.includes('@')) { setError('Enter a valid email address.'); return; }
    if (password.length < 6)  { setError('Password must be at least 6 characters.'); return; }
    if (mode === 'signup' && !name.trim()) { setError('Please enter your name.'); return; }

    setLoading(true);
    const supabase = createClient();

    if (mode === 'signin') {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (err) {
        setError(err.message === 'Invalid login credentials'
          ? 'Incorrect email or password.'
          : err.message);
        return;
      }
    } else {
      const { error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name: name.trim() } },
      });
      setLoading(false);
      if (err) {
        setError(err.message.includes('already registered')
          ? 'An account with this email already exists.'
          : err.message);
        return;
      }
    }

    close();
  }

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={e => { if (e.target === overlayRef.current) close(); }}>
      <div className="modal" style={{ maxWidth: 440 }}>
        <div className="modal__hdr">
          <div>
            <div className="eyebrow" style={{ fontSize: 'var(--t-11)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--fg-2)' }}>
              {mode === 'signin' ? 'Welcome back' : 'Get started'}
            </div>
            <h2 style={{ margin: '6px 0 0', fontSize: 'var(--t-20)', fontWeight: 600 }}>
              {mode === 'signin' ? 'Sign in to Viewprint' : 'Create your account'}
            </h2>
          </div>
          <button className="icon-btn" onClick={close}><X size={16} /></button>
        </div>

        <div className="modal__body">
          <form onSubmit={submit}>
            {mode === 'signup' && (
              <div className="field">
                <label className="field__label">Name</label>
                <div className="field__input">
                  <User size={14} color="var(--fg-3)" />
                  <input
                    type="text"
                    placeholder="Your name"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
            )}
            <div className="field">
              <label className="field__label">Work email</label>
              <div className="field__input">
                <Mail size={14} color="var(--fg-3)" />
                <input
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoFocus={mode === 'signin'}
                />
              </div>
            </div>
            <div className="field">
              <label className="field__label">Password</label>
              <div className="field__input">
                <Lock size={14} color="var(--fg-3)" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && <div className="form-err">{error}</div>}

            <button type="submit" className="btn btn--primary btn--block" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? 'Just a moment…' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div className="form-foot" style={{ marginTop: 16 }}>
            {mode === 'signin' ? (
              <>Don&apos;t have an account?{' '}
                <button className="link-btn" onClick={() => { setMode('signup'); setError(''); }}>
                  Sign up
                </button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button className="link-btn" onClick={() => { setMode('signin'); setError(''); }}>
                  Sign in
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
