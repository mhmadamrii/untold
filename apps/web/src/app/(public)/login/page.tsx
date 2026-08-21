'use client';

import Image from 'next/image';
import { useState } from 'react';

import SignInForm from '@/components/sign-in-form';
import SignUpForm from '@/components/sign-up-form';

export default function LoginPage() {
  const [showSignIn, setShowSignIn] = useState(false);

  return (
    <div className='grid md:grid-cols-2'>
      <div className='flex items-center justify-center px-6 py-16 md:py-24'>
        {showSignIn ? (
          <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
        ) : (
          <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
        )}
      </div>

      <div className='hidden flex-col items-center justify-center gap-6 border-l border-border bg-secondary px-12 py-16 md:flex'>
        <div className='cn-plate w-full max-w-xs'>
          <Image
            src='/book.png'
            alt='A hand-drawn illustration of an open notebook with a pen resting across it, a few written lines trailing into a small sketchy flourish.'
            width={409}
            height={610}
            className='h-auto w-full'
          />
        </div>
        <p className='cn-font-heading text-lg text-muted-foreground'>
          Everyone has a story.
        </p>
      </div>
    </div>
  );
}
