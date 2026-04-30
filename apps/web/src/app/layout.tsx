import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'The Bridge',
  description: 'AI-native accounting platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}