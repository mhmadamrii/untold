'use client';

import { useQuery } from '@tanstack/react-query';
import { StoryType } from '@untold/db/enums';
import { Badge } from '@untold/ui/components/badge';
import { Skeleton } from '@untold/ui/components/skeleton';
import { HeartIcon, MessageCircleIcon } from 'lucide-react';
import Link from 'next/link';

import { orpc } from '@/utils/orpc';

const STORY_TYPE_LABEL: Record<StoryType, string> = {
  PERSONAL: 'Personal Story',
  MEMOIR: 'Memoir',
  LIFE_EXPERIENCE: 'Life Experience',
  FICTION: 'Fiction',
  SHORT_STORY: 'Short Story',
  NOVEL: 'Novel',
  ROMANCE: 'Romance',
  MYSTERY: 'Mystery',
  FANTASY: 'Fantasy',
  ADVENTURE: 'Adventure',
  HORROR: 'Horror',
  HISTORICAL: 'Historical',
  INSPIRATIONAL: 'Inspirational',
  CHILDRENS_STORY: "Children's Story",
};

export function DiscoverFilters({ activeType }: { activeType?: StoryType }) {
  return (
    <div className='flex flex-wrap gap-2'>
      <Link href='/discover'>
        <Badge variant={activeType ? 'outline' : 'default'}>All</Badge>
      </Link>
      {Object.values(StoryType).map((type) => (
        <Link key={type} href={`/discover/types/${type.toLowerCase()}`}>
          <Badge variant={activeType === type ? 'default' : 'outline'}>
            {STORY_TYPE_LABEL[type]}
          </Badge>
        </Link>
      ))}
    </div>
  );
}

export function DiscoverGrid({ storyType }: { storyType?: StoryType }) {
  const stories = useQuery(
    orpc.story.discover.queryOptions({ input: { limit: 24, storyType } }),
  );

  if (stories.isLoading) {
    return (
      <div className='mt-10 grid gap-px overflow-hidden bg-border ring-1 ring-border sm:grid-cols-2 lg:grid-cols-3'>
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className='space-y-3 bg-card p-6'>
            <Skeleton className='h-4 w-2/3' />
            <Skeleton className='h-3 w-full' />
            <Skeleton className='h-3 w-4/5' />
          </div>
        ))}
      </div>
    );
  }

  if (!stories.data || stories.data.length === 0) {
    return (
      <div className='mx-auto max-w-md py-24 text-center'>
        <p className='cn-font-heading text-2xl italic'>Nothing here yet.</p>
        <p className='mt-3 text-sm text-muted-foreground'>
          {storyType
            ? 'No public stories of this type yet — try another, or check back later.'
            : 'No public stories yet — be the first to share one.'}
        </p>
      </div>
    );
  }

  return (
    <div className='mt-10 grid gap-px overflow-hidden bg-border ring-1 ring-border sm:grid-cols-2 lg:grid-cols-3'>
      {stories.data.map((story) => (
        <Link
          key={story.id}
          href={`/stories/${story.id}`}
          className='group flex flex-col justify-between gap-6 bg-card p-6 transition-colors hover:bg-secondary'
        >
          <div>
            <p className='cn-font-heading text-lg italic group-hover:text-primary'>
              {story.title}
            </p>
            {story.description && (
              <p className='mt-2 line-clamp-3 text-sm text-muted-foreground'>
                {story.description}
              </p>
            )}
          </div>
          <div className='flex items-center justify-between text-xs text-muted-foreground'>
            <span>{story.author.name}</span>
            <span className='flex items-center gap-3'>
              <span className='flex items-center gap-1'>
                <HeartIcon className='size-3.5' /> {story.likeCount}
              </span>
              <span className='flex items-center gap-1'>
                <MessageCircleIcon className='size-3.5' /> {story.commentCount}
              </span>
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
