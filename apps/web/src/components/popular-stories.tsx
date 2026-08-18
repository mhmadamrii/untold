'use client';

import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@untold/ui/components/skeleton';
import { HeartIcon, MessageCircleIcon } from 'lucide-react';
import Link from 'next/link';

import { orpc } from '@/utils/orpc';

export function PopularStories() {
  const stories = useQuery(
    orpc.story.discover.queryOptions({ input: { limit: 7 } }),
  );

  if (stories.isLoading) {
    return (
      <div className='grid gap-px overflow-hidden bg-border ring-1 ring-border sm:grid-cols-2 lg:grid-cols-3'>
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
      <p className='text-sm text-muted-foreground'>
        No public stories yet — be the first to share one.
      </p>
    );
  }

  return (
    <div className='grid gap-px overflow-hidden bg-border ring-1 ring-border sm:grid-cols-2 lg:grid-cols-3'>
      {stories.data.map((story) => (
        <Link
          key={story.id}
          href={`/stories/${story.id}`}
          className='group flex flex-col justify-between bg-card p-6 transition-colors hover:bg-secondary'
        >
          <div>
            <p className='cn-font-heading text-lg group-hover:text-primary'>
              {story.title}
            </p>
            {story.description && (
              <p className='mt-2 line-clamp-3 text-sm text-muted-foreground'>
                {story.description}
              </p>
            )}
          </div>
          <div className='mt-6 flex items-center justify-between text-xs text-muted-foreground'>
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
