import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Dashboard | Admin' };

const navItems = [
  { href: '/admin/customers', label: '👥 Customers' },
  { href: '/admin/orders', label: '📋 Orders' },
  { href: '/admin/rewards', label: '🎁 Rewards' },
  { href: '/admin/redemptions', label: '🔖 Redemptions' },
];

export default function AdminDashboardPage(): React.JSX.Element {
  return (
    <main style={{ padding: '2rem', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Admin Dashboard</h1>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Demo Restaurant</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginTop: '1.5rem' }}>
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} style={{ display: 'block', padding: '1.5rem', background: 'var(--surface)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', textDecoration: 'none', color: 'var(--text)', fontWeight: 600 }}>
            {item.label}
          </Link>
        ))}
      </div>
    </main>
  );
}
