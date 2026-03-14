import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Club' };

export default function ClubHomePage(): React.JSX.Element {
  return (
    <main style={{ padding: '2rem', maxWidth: 500, margin: '0 auto' }}>
      <h1>🎁 Loyalty Club</h1>
      <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
        Welcome! Earn points and redeem exclusive rewards.
      </p>
      <Link href="/club/verify" style={{ display: 'inline-block', marginTop: '1.5rem', background: 'var(--brand-primary)', color: '#fff', padding: '0.75rem 1.5rem', borderRadius: 'var(--radius)', textDecoration: 'none' }}>
        Get Started →
      </Link>
    </main>
  );
}
