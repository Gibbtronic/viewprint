'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { parseMarkdown } from '@/lib/parser';
import { createClient } from '@/lib/supabase';
import type { Blueprint, User } from '@/lib/types';

interface AppState {
  user: User | null;
  markdown: string;
  currentId: string | null;
  blueprint: Blueprint | null;
  setMarkdown: (md: string, id?: string) => void;
  clearBlueprint: () => void;
  signOut: () => Promise<void>;
  showAuth: boolean;
  setShowAuth: (v: boolean) => void;
  showExport: boolean;
  setShowExport: (v: boolean) => void;
}

const AppContext = createContext<AppState | null>(null);

const LS = {
  markdown: 'vp.markdown',
  id:       'vp.id',
};

function load<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const v = localStorage.getItem(key);
    return v !== null ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

function save(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* noop */ }
}

function sessionToUser(session: Session | null): User | null {
  if (!session?.user) return null;
  const u = session.user;
  return {
    id: u.id,
    email: u.email ?? '',
    name: (u.user_metadata?.name as string | undefined) ?? u.email?.split('@')[0] ?? 'User',
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [markdown, setMarkdownState] = useState<string>(() => load(LS.markdown, ''));
  const [currentId, setCurrentId] = useState<string | null>(() => load(LS.id, null));
  const [showAuth, setShowAuth] = useState(false);
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserState(sessionToUser(session));
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserState(sessionToUser(session));
    });
    return () => subscription.unsubscribe();
  }, []);

  const blueprint = useMemo<Blueprint | null>(
    () => (markdown ? parseMarkdown(markdown) : null),
    [markdown]
  );

  const setMarkdown = useCallback((md: string, id?: string) => {
    setMarkdownState(md);
    save(LS.markdown, md);
    if (id !== undefined) {
      setCurrentId(id);
      save(LS.id, id);
    }
  }, []);

  const clearBlueprint = useCallback(() => {
    setMarkdownState('');
    setCurrentId(null);
    localStorage.removeItem(LS.markdown);
    localStorage.removeItem(LS.id);
  }, []);

  const signOut = useCallback(async () => {
    await createClient().auth.signOut();
  }, []);

  return (
    <AppContext.Provider value={{
      user, markdown, currentId, blueprint,
      setMarkdown, clearBlueprint, signOut,
      showAuth, setShowAuth,
      showExport, setShowExport,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be inside AppProvider');
  return ctx;
}
