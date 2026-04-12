import type { Metadata } from 'next';

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
    <html>
      <body>{children}</body>
    </html>
  );
}