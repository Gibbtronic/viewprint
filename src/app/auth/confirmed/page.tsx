import Link from 'next/link';
import { CheckCircle } from 'lucide-react';

export default function ConfirmedPage() {
  return (
    <main className="app__main">
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        paddingTop: 80,
        maxWidth: 400,
        margin: '0 auto',
        gap: 0,
      }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'var(--success-50)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 24,
        }}>
          <CheckCircle size={30} color="var(--success-500)" />
        </div>

        <h1 style={{ fontSize: 'var(--t-24)', fontWeight: 600, margin: '0 0 12px' }}>
          Email confirmed
        </h1>
        <p style={{ fontSize: 'var(--t-15)', color: 'var(--fg-2)', lineHeight: 1.6, margin: '0 0 32px' }}>
          We received your email. You&apos;ve successfully signed up for Viewprint — you&apos;re all set to start visualizing your service blueprints.
        </p>

        <Link href="/app" className="btn btn--primary" style={{ borderRadius: 999, paddingLeft: 28, paddingRight: 28 }}>
          Go to my blueprints &rarr;
        </Link>
      </div>
    </main>
  );
}
