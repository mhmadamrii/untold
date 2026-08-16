'use client';
import Link from 'next/link';

import { ModeToggle } from './mode-toggle';
import UserMenu from './user-menu';

export default function Header() {
  return (
    <header className='border-b border-border'>
      <div className='mx-auto flex max-w-6xl items-center justify-between px-6 py-4'>
        <Link
          href='/'
          className='cn-font-heading text-xl italic tracking-tight'
        >
          Untold
        </Link>
        <div className='flex items-center gap-6'>
          <Link
            href='/dashboard'
            className='text-sm text-muted-foreground transition-colors hover:text-foreground'
          >
            Dashboard
          </Link>
          <ModeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
