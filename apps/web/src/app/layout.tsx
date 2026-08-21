import type { Metadata } from 'next';
import { Cormorant_Garamond, Lora } from 'next/font/google';

import '../index.css';
import Header from '@/components/header';
import Providers from '@/components/providers';

const cormorantGaramond = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['400', '600'],
});

const lora = Lora({
  variable: '--font-lora',
  subsets: ['latin'],
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  title: 'Untold — Everyone has a story',
  description:
    "Untold helps you find the story inside your memories, ideas, and unfinished thoughts, and turns it into something you're proud to have written.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <body
        className={`${cormorantGaramond.variable} ${lora.variable} antialiased`}
      >
        <Providers>
          <div className='flex min-h-svh flex-col'>
            <Header />
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
