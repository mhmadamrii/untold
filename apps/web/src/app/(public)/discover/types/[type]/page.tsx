import { StoryType } from '@untold/db/enums';
import { notFound } from 'next/navigation';

import { DiscoverFilters, DiscoverGrid } from '@/components/discover-grid';

function resolveStoryType(type: string): StoryType | undefined {
  return Object.values(StoryType).find(
    (value) => value.toLowerCase() === type.toLowerCase(),
  );
}

export default async function DiscoverTypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const storyType = resolveStoryType(type);

  if (!storyType) {
    notFound();
  }

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
        <DiscoverFilters activeType={storyType} />
      </div>

      <DiscoverGrid storyType={storyType} />
    </div>
  );
}
