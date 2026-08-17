import { StoryType } from '@untold/db/enums';

import { DiscoverFilters, DiscoverGrid } from '@/components/discover-grid';

function parseStoryType(segment: string): StoryType | null {
  const candidate = segment.toUpperCase();
  const match = Object.values(StoryType).find((type) => type === candidate);
  return match ?? null;
}

export default async function DiscoverByTypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  const storyType = parseStoryType(type);

  return (
    <div className='mx-auto max-w-6xl px-6 py-16'>
      <div className='border-b border-border pb-8'>
        <h1 className='cn-font-heading text-3xl italic'>Discover</h1>
        <p className='mt-2 text-sm text-muted-foreground'>
          Stories other writers have chosen to share publicly.
        </p>
        <div className='mt-6'>
          <DiscoverFilters activeType={storyType ?? undefined} />
        </div>
      </div>

      {storyType ? (
        <DiscoverGrid storyType={storyType} />
      ) : (
        <p className='py-24 text-center text-sm text-muted-foreground'>
          That story type doesn&rsquo;t exist.
        </p>
      )}
    </div>
  );
}
