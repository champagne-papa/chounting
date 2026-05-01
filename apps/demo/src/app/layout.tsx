import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "chounting · The Bridge",
  description: "V.3.1 design surface for chounting UI artifacts.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
