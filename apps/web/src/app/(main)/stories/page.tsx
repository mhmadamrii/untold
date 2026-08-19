'use client';

import { useQuery } from '@tanstack/react-query';
import { Badge } from '@untold/ui/components/badge';
import { Button } from '@untold/ui/components/button';
import { Skeleton } from '@untold/ui/components/skeleton';
import Link from 'next/link';

import { formatRelativeDate } from '@/lib/format-date';
import { STORY_STATUS_LABEL, VISIBILITY_LABEL } from '@/lib/story-labels';
import { orpc } from '@/utils/orpc';

export default function StoriesPage() {
  const stories = useQuery(orpc.story.list.queryOptions());

  return (
    <div className='mx-auto max-w-6xl px-6 py-16'>
      <div className='flex flex-wrap items-end justify-between gap-6 border-b border-border pb-8'>
        <div>
          <h1 className='cn-font-heading text-3xl'>Your stories</h1>
          <p className='mt-2 text-sm text-muted-foreground'>
            {stories.data
              ? `${stories.data.length} ${stories.data.length === 1 ? 'story' : 'stories'}`
              : 'Everything you’re writing, in one place.'}
          </p>
        </div>
        <Button
          size='lg'
          nativeButton={false}
          render={<Link href='/stories/new' />}
        >
          Start a new story
        </Button>
      </div>

      {stories.isLoading && (
        <div className='mt-10 grid gap-px overflow-hidden bg-border ring-1 ring-border sm:grid-cols-2 lg:grid-cols-3'>
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className='space-y-3 bg-card p-6'>
              <Skeleton className='h-6 w-10' />
              <Skeleton className='h-5 w-2/3' />
              <Skeleton className='h-3 w-full' />
            </div>
          ))}
        </div>
      )}

      {stories.data && stories.data.length === 0 && (
        <div className='mx-auto max-w-md py-24 text-center'>
          <p className='cn-font-heading text-2xl'>
            Your next story hasn&rsquo;t been written yet.
          </p>
          <p className='mt-3 text-sm text-muted-foreground'>
            Start with a memory, an idea, or even a single sentence.
          </p>
          <Button
            size='lg'
            className='mt-8'
            nativeButton={false}
            render={<Link href='/stories/new' />}
          >
            Start a story
          </Button>
        </div>
      )}

      {stories.data && stories.data.length > 0 && (
        <div className='mt-10 grid gap-px overflow-hidden bg-border ring-1 ring-border sm:grid-cols-2 lg:grid-cols-3'>
          {stories.data.map((story) => (
            <Link
              key={story.id}
              href={`/stories/${story.id}/edit`}
              className='group flex flex-col justify-between gap-6 bg-card p-6 transition-colors hover:bg-secondary'
            >
              <div>
                <div className='flex items-start justify-between gap-3'>
                  <span className='cn-font-heading text-2xl text-primary'>
                    {story.title.charAt(0).toUpperCase()}
                  </span>
                  <Badge variant='outline' className='shrink-0'>
                    {STORY_STATUS_LABEL[story.status]}
                  </Badge>
                </div>
                <p className='cn-font-heading mt-4 text-lg group-hover:text-primary'>
                  {story.title}
                </p>
                {story.description && (
                  <p className='mt-2 line-clamp-2 text-sm text-muted-foreground'>
                    {story.description}
                  </p>
                )}
              </div>
              <div className='flex items-center justify-between text-xs text-muted-foreground'>
                <span>
                  {story._count.chapters}{' '}
                  {story._count.chapters === 1 ? 'chapter' : 'chapters'}
                </span>
                <span className='flex items-center gap-3'>
                  <span>{VISIBILITY_LABEL[story.visibility]}</span>
                  <span>Edited {formatRelativeDate(story.updatedAt)}</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
