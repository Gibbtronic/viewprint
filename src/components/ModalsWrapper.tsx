'use client';

import { useApp } from './AppProvider';
import { AuthModal } from './AuthModal';
import { ExportModal } from './ExportModal';
import { UploadModal } from './UploadModal';

export function ModalsWrapper() {
  const { showAuth, showExport, showUpload } = useApp();
  return (
    <>
      {showAuth && <AuthModal />}
      {showExport && <ExportModal />}
      {showUpload && <UploadModal />}
    </>
  );
}
