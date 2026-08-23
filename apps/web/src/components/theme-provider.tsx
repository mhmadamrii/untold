'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type * as React from 'react';

// next-themes injects an inline <script> to set the theme before hydration
// (avoids a flash of the wrong theme). It executes correctly during SSR, but
// React 19 warns about any <script> rendered inside a component regardless.
// next-themes hasn't shipped a fix, so silence this specific false positive.
// https://github.com/pacocoursey/next-themes/issues/387
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  const originalConsoleError = console.error;
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Encountered a script tag')
    ) {
      return;
    }
    originalConsoleError.apply(console, args);
  };
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
