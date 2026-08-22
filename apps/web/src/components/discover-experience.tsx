'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { StoryType } from '@untold/db/enums';
import { Button } from '@untold/ui/components/button';
import { Skeleton } from '@untold/ui/components/skeleton';
import { cn } from '@untold/ui/lib/utils';
import Link from 'next/link';

import { orpc } from '@/utils/orpc';

const REAL_LIFE_TYPES = new Set<StoryType>([
  StoryType.PERSONAL,
  StoryType.MEMOIR,
  StoryType.LIFE_EXPERIENCE,
]);

type FilterKey = 'all' | 'real-life' | 'fiction' | 'short' | 'newest';

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'real-life', label: 'Real life' },
  { key: 'fiction', label: 'Fiction' },
  { key: 'short', label: 'Short reads' },
  { key: 'newest', label: 'Newest' },
];

function broadCategory(storyType: StoryType | null) {
  if (!storyType) return null;
  return REAL_LIFE_TYPES.has(storyType) ? 'Real life' : 'Fiction';
}

function estimateMinutes(chapterCount: number) {
  return Math.max(3, chapterCount * 4);
}

function CoverPlate({
  coverImage,
  className,
}: {
  coverImage: string | null;
  className?: string;
}) {
  return (
    <div className={cn('cn-plate bg-secondary', className)}>
      {coverImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={coverImage} alt='' className='h-full w-full object-cover' />
      ) : (
        <div className='grid h-full w-full place-items-center'>
          <span className='text-xs uppercase tracking-widest text-muted-foreground'>
            Cover
          </span>
        </div>
      )}
    </div>
  );
}

export function DiscoverExperience() {
  const [filter, setFilter] = useState<FilterKey>('all');

  const stories = useQuery(
    orpc.story.discover.queryOptions({ input: { limit: 40 } }),
  );

  const featured = stories.data?.[0] ?? null;

  const grid = useMemo(() => {
    const rest = (stories.data ?? []).filter(
      (story) => story.id !== featured?.id,
    );

    let result = rest;
    if (filter === 'real-life') {
      result = rest.filter(
        (story) => story.storyType && REAL_LIFE_TYPES.has(story.storyType),
      );
    } else if (filter === 'fiction') {
      result = rest.filter(
        (story) => story.storyType && !REAL_LIFE_TYPES.has(story.storyType),
      );
    } else if (filter === 'short') {
      result = rest.filter((story) => story.chapterCount <= 3);
    } else if (filter === 'newest') {
      result = [...rest].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
    }

    return result.slice(0, 7);
  }, [stories.data, filter, featured]);

  return (
    <div>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between'>
        <h1 className='cn-font-heading text-4xl sm:text-5xl'>
          Stories people have told
        </h1>
        <div className='flex flex-wrap gap-x-5 gap-y-2'>
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type='button'
              aria-pressed={filter === item.key}
              onClick={() => setFilter(item.key)}
              className={cn(
                'cn-font-heading text-sm transition-colors',
                filter === item.key
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {stories.isLoading ? (
        <div className='mt-10 space-y-10'>
          <div className='flex flex-col gap-6 border border-border p-6 sm:flex-row'>
            <Skeleton className='aspect-[3/2] w-full sm:aspect-square sm:w-48' />
            <div className='flex-1 space-y-3'>
              <Skeleton className='h-3 w-28' />
              <Skeleton className='h-7 w-2/3' />
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-1/3' />
            </div>
          </div>
          <div className='grid gap-px overflow-hidden bg-border ring-1 ring-border sm:grid-cols-2 lg:grid-cols-4'>
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className='space-y-3 bg-card p-5'>
                <Skeleton className='aspect-[3/2] w-full' />
                <Skeleton className='h-4 w-2/3' />
                <Skeleton className='h-3 w-full' />
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {stories.isError ? (
        <div className='mx-auto max-w-md py-24 text-center'>
          <p className='cn-font-heading text-2xl'>Could not load stories.</p>
          <p className='mt-3 text-sm text-muted-foreground'>
            Try again in a moment.
          </p>
        </div>
      ) : null}

      {!stories.isLoading && !stories.isError && !featured ? (
        <div className='mx-auto max-w-md py-24 text-center'>
          <p className='cn-font-heading text-2xl'>Nothing here yet.</p>
          <p className='mt-3 text-sm text-muted-foreground'>
            No public stories yet, be the first to share one.
          </p>
          <Button
            className='mt-6'
            nativeButton={false}
            render={<Link href='/stories/new' />}
          >
            Write your own story
          </Button>
        </div>
      ) : null}

      {featured ? (
        <div className='mt-10 flex flex-col gap-6 border border-border p-6 sm:flex-row'>
          <CoverPlate
            coverImage={featured.coverImage}
            className='aspect-[3/2] w-full sm:aspect-square sm:w-48'
          />
          <div className='flex flex-1 flex-col'>
            <p className='cn-font-heading text-xs uppercase tracking-[0.14em] text-primary'>
              Featured
              {broadCategory(featured.storyType)
                ? ` · ${broadCategory(featured.storyType)}`
                : ''}
            </p>
            <h2 className='cn-font-heading mt-2 text-3xl'>
              {featured.title}
            </h2>
            {featured.description ? (
              <p className='mt-2 line-clamp-2 max-w-xl text-sm text-muted-foreground'>
                {featured.description}
              </p>
            ) : null}
            <div className='mt-4 flex flex-wrap items-center gap-4 sm:mt-auto'>
              <Button
                size='sm'
                nativeButton={false}
                render={<Link href={`/stories/${featured.id}`} />}
              >
                Read
              </Button>
              <p className='text-xs text-muted-foreground'>
                by {featured.author.name} · {featured.chapterCount}{' '}
                {featured.chapterCount === 1 ? 'chapter' : 'chapters'} ·{' '}
                {estimateMinutes(featured.chapterCount)} min
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {featured ? (
        <div className='mt-10 grid gap-px overflow-hidden bg-border ring-1 ring-border sm:grid-cols-2 lg:grid-cols-4'>
          {grid.map((story) => {
            const category = broadCategory(story.storyType);
            return (
              <Link
                key={story.id}
                href={`/stories/${story.id}`}
                className='group flex flex-col gap-3 bg-card p-5 transition-colors hover:bg-secondary/40'
              >
                <CoverPlate
                  coverImage={story.coverImage}
                  className='aspect-[3/2] w-full'
                />
                <div>
                  {category ? (
                    <p className='text-[11px] uppercase tracking-widest text-muted-foreground'>
                      {category}
                    </p>
                  ) : null}
                  <p className='cn-font-heading mt-1 text-base group-hover:text-primary'>
                    {story.title}
                  </p>
                  {story.description ? (
                    <p className='mt-1 line-clamp-2 text-xs text-muted-foreground'>
                      {story.description}
                    </p>
                  ) : null}
                </div>
                <p className='mt-auto text-xs text-muted-foreground'>
                  by {story.author.name} · {estimateMinutes(story.chapterCount)}{' '}
                  min
                </p>
              </Link>
            );
          })}

          <div className='flex flex-col items-start justify-center gap-3 bg-card p-5'>
            <p className='cn-font-heading text-base'>Have one of your own?</p>
            <Button
              size='sm'
              nativeButton={false}
              render={<Link href='/stories/new' />}
            >
              Write your own story
            </Button>
          </div>
        </div>
      ) : null}

      {featured && grid.length === 0 ? (
        <p className='mt-6 text-sm text-muted-foreground'>
          No stories match this filter yet, try another.
        </p>
      ) : null}
    </div>
  );
}
