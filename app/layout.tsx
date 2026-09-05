import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: "KosterBro's — The Birthday Quest", description: 'Spring met Epke, spin met Tieme. Twee broers, één epische verjaardagsrun!', icons: { icon: '/favicon.svg' } };
export default function RootLayout({ children }: Readonly<{children: React.ReactNode}>) {
  return <html lang="nl" className="dark"><body>{children}</body></html>;
}
