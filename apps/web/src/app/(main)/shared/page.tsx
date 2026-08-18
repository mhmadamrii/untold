import { Share2Icon } from 'lucide-react';
import Link from 'next/link';

export default function SharedPage() {
  return (
    <div className='mx-auto max-w-6xl px-6 py-16'>
      <div className='border-b border-border pb-8'>
        <h1 className='cn-font-heading text-3xl italic'>Shared with you</h1>
        <p className='mt-2 text-sm text-muted-foreground'>
          Stories other writers share with you privately.
        </p>
      </div>

      <div className='mx-auto max-w-md py-24 text-center'>
        <div className='mx-auto flex size-12 items-center justify-center ring-1 ring-border'>
          <Share2Icon className='size-5 text-muted-foreground' />
        </div>
        <p className='cn-font-heading mt-6 text-2xl italic'>
          Nothing shared with you yet.
        </p>
        <p className='mt-3 text-sm text-muted-foreground'>
          When someone shares a story with you directly, it will show up here.
          In the meantime, take a look at what other writers have made public.
        </p>
        <Link
          href='/discover'
          className='mt-8 inline-block text-sm text-primary hover:underline'
        >
          Browse public stories
        </Link>
      </div>
    </div>
  );
}
