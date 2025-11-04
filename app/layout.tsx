import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Drug Development Research Explorer',
  description:
    'Search and synthesize the latest drug development research from trusted scholarly sources.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
