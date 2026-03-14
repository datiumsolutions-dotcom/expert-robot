import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Dashboard | Club' };

export default function ClubDashboardPage(): React.JSX.Element {
  return (
    <main style={{ padding: '2rem', maxWidth: 600, margin: '0 auto' }}>
      <h1>My Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
        <div style={{ padding: '1.5rem', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total Points</p>
          <p style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--brand-primary)' }}>—</p>
        </div>
        <div style={{ padding: '1.5rem', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Total Visits</p>
          <p style={{ fontSize: '2rem', fontWeight: 700 }}>—</p>
        </div>
      </div>
      <nav style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
        <Link href="/club/rewards" style={{ color: 'var(--brand-primary)' }}>Rewards</Link>
        <Link href="/club/history" style={{ color: 'var(--text-muted)' }}>History</Link>
      </nav>
    </main>
  );
}
