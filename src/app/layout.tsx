import type { Metadata } from 'next';
import { Josefin_Sans, Raleway } from 'next/font/google';
import './globals.css';

const josefin = Josefin_Sans({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['300', '400', '600', '700'],
  display: 'swap',
});

const raleway = Raleway({
  subsets: ['latin'],
  variable: '--font-raleway',
  display: 'swap',
});

export const metadata: Metadata = {
  title: '18g Coffee — Build Your Own',
  description: 'Follow along as we make your coffee, step by step.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${josefin.variable} ${raleway.variable}`}>
      <body>{children}</body>
    </html>
  );
}
