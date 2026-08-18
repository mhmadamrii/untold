import { DiscoverFilters, DiscoverGrid } from '@/components/discover-grid';

export default function DiscoverPage() {
  return (
    <div className='mx-auto max-w-6xl px-6 py-16'>
      <div className='border-b border-border pb-8'>
        <h1 className='cn-font-heading text-3xl'>Discover</h1>
        <p className='mt-2 text-sm text-muted-foreground'>
          Stories other writers have chosen to share publicly.
        </p>
        <div className='mt-6'>
          <DiscoverFilters />
        </div>
      </div>

      <DiscoverGrid />
    </div>
  );
}
