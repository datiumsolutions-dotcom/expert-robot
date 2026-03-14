import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Admin Login' };

export default function AdminLoginPage(): React.JSX.Element {
  return (
    <main style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', padding: '2rem' }}>
      <div style={{ width: '100%', maxWidth: 400, padding: '2rem', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
        <h1 style={{ marginBottom: '1.5rem' }}>Admin Login</h1>
        {/* TODO Phase 2: wire up to /api/v1/auth/login */}
        <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Email</label>
            <input id="email" type="email" placeholder="admin@restaurant.com" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '1rem' }} />
          </div>
          <div>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>Password</label>
            <input id="password" type="password" placeholder="••••••••" style={{ width: '100%', padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: '1rem' }} />
          </div>
          <button type="submit" style={{ padding: '0.75rem', borderRadius: 'var(--radius)', background: 'var(--brand-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '1rem' }}>
            Sign in
          </button>
        </form>
      </div>
    </main>
  );
}
