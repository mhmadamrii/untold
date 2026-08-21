'use client';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@untold/ui/components/sheet';
import { Button } from '@untold/ui/components/button';
import { Menu } from 'lucide-react';
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
        <div className='flex items-center gap-4 sm:gap-6'>
          <nav className='hidden items-center gap-5 md:flex'>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className='py-2 text-sm text-muted-foreground transition-colors hover:text-foreground'
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <ModeToggle />
          <UserMenu />
          <Sheet>
            <SheetTrigger
              render={
                <Button variant='outline' size='icon' className='md:hidden' />
              }
            >
              <Menu className='size-4' />
              <span className='sr-only'>Open menu</span>
            </SheetTrigger>
            <SheetContent side='right'>
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <nav className='flex flex-col px-4'>
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className='border-b border-border py-3 text-sm text-foreground'
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
