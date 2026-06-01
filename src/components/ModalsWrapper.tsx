'use client';

import { useApp } from './AppProvider';
import { AuthModal } from './AuthModal';
import { ExportModal } from './ExportModal';

export function ModalsWrapper() {
  const { showAuth, showExport } = useApp();
  return (
    <>
      {showAuth && <AuthModal />}
      {showExport && <ExportModal />}
    </>
  );
}
