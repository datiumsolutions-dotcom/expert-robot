import Link from 'next/link';

export default function HomePage(): React.JSX.Element {
  return (
    <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100dvh', gap: '1.5rem', padding: '2rem' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 800 }}>🍽️ Loyalty SaaS</h1>
      <p style={{ color: 'var(--text-muted)', textAlign: 'center', maxWidth: 420 }}>
        Restaurant loyalty management platform
      </p>
      <div style={{ display: 'flex', gap: '1rem' }}>
        <Link href="/admin/login" style={{ background: 'var(--brand-primary)', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius)', textDecoration: 'none', fontWeight: 600 }}>
          Admin Portal
        </Link>
        <Link href="/club" style={{ border: '1px solid var(--border)', color: 'var(--text)', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius)', textDecoration: 'none' }}>
          Customer Club
        </Link>
      </div>
    </main>
  );
}
