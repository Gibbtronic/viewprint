import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/components/AppProvider';
import { TopBar } from '@/components/TopBar';
import { AuthModal } from '@/components/AuthModal';
import { ExportModal } from '@/components/ExportModal';
import { ModalsWrapper } from '@/components/ModalsWrapper';

export const metadata: Metadata = {
  title: 'Viewprint — Service blueprint visualiser',
  description: 'Turn a structured Markdown file into an interactive service blueprint.',
  icons: { icon: '/logo-mark-tile.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          <div className="app">
            <TopBar />
            <ModalsWrapper />
            {children}
          </div>
        </AppProvider>
      </body>
    </html>
  );
}
