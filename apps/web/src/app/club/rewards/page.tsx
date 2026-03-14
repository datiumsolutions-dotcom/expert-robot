import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Rewards | Club' };

export default function ClubRewardsPage(): React.JSX.Element {
  return (
    <main style={{ padding: '2rem', maxWidth: 600, margin: '0 auto' }}>
      <h1>Available Rewards</h1>
      <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
        Redeem your points for exclusive rewards.
      </p>
      {/* TODO Phase 2: Fetch and render rewards from API */}
      <div style={{ marginTop: '1.5rem', padding: '2rem', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', textAlign: 'center', color: 'var(--text-muted)' }}>
        No rewards available yet.
      </div>
    </main>
  );
}
