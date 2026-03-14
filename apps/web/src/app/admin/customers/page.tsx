import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Customers | Admin' };

export default function AdminCustomersPage(): React.JSX.Element {
  return (
    <main style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
      <h1>Customers</h1>
      <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Manage your loyalty program members.</p>
      {/* TODO Phase 2: Fetch from GET /api/v1/customers */}
      <div style={{ marginTop: '1.5rem', padding: '2rem', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', textAlign: 'center', color: 'var(--text-muted)' }}>
        No customers yet.
      </div>
    </main>
  );
}
