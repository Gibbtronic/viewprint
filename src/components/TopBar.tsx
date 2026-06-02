'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Download, Layers, LogOut, Plus, User } from 'lucide-react';
import { useApp } from './AppProvider';

export function TopBar() {
  const { user, signOut, blueprint, setShowAuth, setShowExport } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isBlueprintRoute = pathname.startsWith('/b/');
  const bpId = isBlueprintRoute ? pathname.split('/')[2] : null;

  const isOverview = bpId && pathname === `/b/${bpId}`;
  const isDetail   = bpId && pathname.includes('/stage/');
  const isEditor   = bpId && pathname.endsWith('/edit');

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  function handleNavClick(path: string) {
    if (!user) { setShowAuth(true); return; }
    router.push(path);
  }

  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <header className="topbar">
      <div className="topbar__inner">
        {/* Left */}
        <div className="topbar__left">
          <Link href="/" className="logo-btn">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 178 48" width="119" height="32" role="img" aria-label="Viewprint">
              <circle cx="8" cy="15" r="2.6" fill="#4F46E5"/>
              <circle cx="8" cy="24" r="2.6" fill="#4F46E5"/>
              <circle cx="8" cy="33" r="2.6" fill="#4F46E5"/>
              <rect x="14" y="12" width="28" height="6" rx="3" fill="#4F46E5"/>
              <rect x="14" y="21" width="20" height="6" rx="3" fill="#A5B4FC"/>
              <rect x="14" y="30" width="24" height="6" rx="3" fill="#C7D2FE"/>
              <text x="50" y="31" fontFamily="Inter, system-ui, sans-serif" fontSize="22" fontWeight="600" letterSpacing="-0.015em">
                <tspan fill="#4F46E5">View</tspan><tspan fill="#0B0B0F">print</tspan>
              </text>
            </svg>
          </Link>
          <nav className="topbar__nav">
            <button
              className={`nav-link${pathname === '/app' ? ' nav-link--active' : ''}`}
              onClick={() => handleNavClick('/app')}
            >
              <Layers size={15} />
              My blueprints
            </button>
            <button
              className="nav-link"
              onClick={() => handleNavClick('/')}
            >
              <Plus size={15} />
              New
            </button>
          </nav>
        </div>

        {/* Center — segmented control when a blueprint is open */}
        <div className="topbar__center">
          {isBlueprintRoute && blueprint && bpId && (
            <div className="seg">
              <Link href={`/b/${bpId}`} className={`seg__btn${isOverview ? ' seg__btn--active' : ''}`}>
                Overview
              </Link>
              <Link
                href={`/b/${bpId}/stage/0`}
                className={`seg__btn${isDetail ? ' seg__btn--active' : ''}`}
              >
                Detail
              </Link>
              <Link href={`/b/${bpId}/edit`} className={`seg__btn${isEditor ? ' seg__btn--active' : ''}`}>
                Editor
              </Link>
            </div>
          )}
        </div>

        {/* Right */}
        <div className="topbar__right">
          {isBlueprintRoute && blueprint && (
            <button className="btn btn--ghost" onClick={() => setShowExport(true)}>
              <Download size={15} />
              Export
            </button>
          )}

          {!user ? (
            <button className="btn btn--primary" onClick={() => setShowAuth(true)}>
              Sign in
            </button>
          ) : (
            <div className="usermenu" ref={menuRef}>
              <button className="usermenu__trigger" onClick={() => setMenuOpen(v => !v)}>
                <div className="avatar">{initials}</div>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {menuOpen && (
                <div className="popover">
                  <div className="popover__hdr">
                    <div className="popover__name">{user.name}</div>
                    <div className="popover__email">{user.email}</div>
                  </div>
                  <div className="popover__div" />
                  <button className="popover__item" onClick={() => { setMenuOpen(false); router.push('/app'); }}>
                    <Layers size={15} />
                    My blueprints
                  </button>
                  <div className="popover__div" />
                  <button className="popover__item" onClick={() => { signOut(); setMenuOpen(false); }}>
                    <LogOut size={15} />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
