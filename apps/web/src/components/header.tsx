'use client';
import Image from 'next/image';
import Link from 'next/link';

import { ModeToggle } from './mode-toggle';
import UserMenu from './user-menu';

const navLinks = [
  { href: '/dashboard', label: 'Home' },
  { href: '/stories', label: 'My Stories' },
  { href: '/discover', label: 'Discover' },
  { href: '/shared', label: 'Shared' },
] as const;

export default function Header() {
  return (
    <header className='border-b border-border'>
      <div className='mx-auto flex max-w-6xl items-center justify-between px-6 py-4'>
        <Link
          href='/'
          className='flex items-center gap-2 cn-font-heading text-xl tracking-tight'
        >
          <Image src='/logo.png' alt='' width={28} height={28} />
          Untold
        </Link>
        <div className='flex items-center gap-6'>
          <nav className='flex items-center gap-5'>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className='text-sm text-muted-foreground transition-colors hover:text-foreground'
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <ModeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
