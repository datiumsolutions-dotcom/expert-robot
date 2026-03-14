import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Verify | Club' };

export default function VerifyPage(): React.JSX.Element {
  return (
    <main style={{ padding: '2rem', maxWidth: 400, margin: '0 auto' }}>
      <h1>Verify Your Number</h1>
      <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
        Enter your phone number to receive an OTP.
      </p>
      {/* TODO Phase 2: OTP form with SMS integration */}
      <form style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <input
          type="tel"
          placeholder="+1 (555) 000-0000"
          style={{ padding: '0.75rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', fontSize: '1rem' }}
        />
        <button
          type="submit"
          style={{ padding: '0.75rem', borderRadius: 'var(--radius)', background: 'var(--brand-primary)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600 }}
        >
          Send OTP
        </button>
      </form>
    </main>
  );
}
