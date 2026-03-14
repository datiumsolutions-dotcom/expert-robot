import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    template: '%s | Loyalty SaaS',
    default: 'Loyalty SaaS for Restaurants',
  },
  description: 'Customer loyalty management platform for restaurants',
};

export default function RootLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
