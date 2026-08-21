import { DiscoverFilters, DiscoverGrid } from '@/components/discover-grid';

export default function DiscoverPage() {
  return (
    <div className='mx-auto max-w-6xl px-6 py-20 md:py-28'>
      <p className='cn-font-heading text-xs uppercase tracking-[0.14em] text-primary'>
        Discover
      </p>
      <h1 className='cn-font-heading mt-3 text-4xl sm:text-5xl'>
        Stories people have told
      </h1>
      <p className='mt-4 max-w-md text-base text-muted-foreground'>
        Read what other people finally sat down and told.
      </p>

      <div className='mt-10'>
        <DiscoverFilters />
      </div>

      <DiscoverGrid />
    </div>
  );
}
