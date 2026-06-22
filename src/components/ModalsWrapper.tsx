'use client';

import { useApp } from './AppProvider';
import { AuthModal } from './AuthModal';
import { ExportModal } from './ExportModal';
import { UploadModal } from './UploadModal';
import { ShareModal } from './ShareModal';

export function ModalsWrapper() {
  const { showAuth, showExport, showUpload, showShare, currentId } = useApp();
  return (
    <>
      {showAuth && <AuthModal />}
      {showExport && <ExportModal />}
      {showUpload && <UploadModal />}
      {showShare && currentId && <ShareModal blueprintId={currentId} />}
    </>
  );
}
