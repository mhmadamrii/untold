'use client';

import { useQuery } from '@tanstack/react-query';
import { Badge } from '@untold/ui/components/badge';
import { Button } from '@untold/ui/components/button';
import { Skeleton } from '@untold/ui/components/skeleton';
import Link from 'next/link';
import type { authClient } from '@/lib/auth-client';
import { formatRelativeDate } from '@/lib/format-date';
import { STORY_STATUS_LABEL, VISIBILITY_LABEL } from '@/lib/story-labels';
import { firstName } from '@/utils/fn';
import { orpc } from '@/utils/orpc';

export function Dashboard({
  session,
}: {
  session: typeof authClient.$Infer.Session;
}) {
  const stories = useQuery(orpc.story.list.queryOptions());
  const mostRecent = stories.data?.[0];

  return (
    <div className='mx-auto max-w-4xl px-6 py-16'>
      <h1 className='cn-font-heading text-3xl'>
        Good morning, {firstName(session.user.name)}.
      </h1>
      <p className='mt-3 text-muted-foreground'>
        What story are you thinking about today?
      </p>

      <div className='mt-8 flex items-center gap-5'>
        {mostRecent && (
          <Button
            size='lg'
            nativeButton={false}
            render={<Link href={`/stories/${mostRecent.id}/edit`} />}
          >
            Continue writing
          </Button>
        )}
        <Link
          href='/stories/new'
          className='text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline'
        >
          Start a new story
        </Link>
      </div>

      <div className='mt-16'>
        <h2 className='cn-font-heading text-xl'>Your stories</h2>

        {stories.isLoading && (
          <div className='mt-6 divide-y divide-border border-y border-border'>
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className='space-y-2 py-5'>
                <Skeleton className='h-5 w-1/3' />
                <Skeleton className='h-3 w-1/2' />
              </div>
            ))}
          </div>
        )}

        {stories.data && stories.data.length === 0 && (
          <div className='mt-6 border-y border-border py-10 text-center'>
            <p className='cn-font-heading text-lg'>
              Your next story hasn&rsquo;t been written yet.
            </p>
            <p className='mt-2 text-sm text-muted-foreground'>
              Start with a memory, an idea, or even a single sentence.
            </p>
          </div>
        )}

        {stories.data && stories.data.length > 0 && (
          <div className='mt-6 divide-y divide-border border-y border-border'>
            {stories.data.map((story) => (
              <Link
                key={story.id}
                href={`/stories/${story.id}/edit`}
                className='group flex items-center justify-between gap-6 py-5'
              >
                <div>
                  <p className='cn-font-heading text-lg group-hover:text-primary'>
                    {story.title}
                  </p>
                  <p className='mt-1 text-sm text-muted-foreground'>
                    {STORY_STATUS_LABEL[story.status]} ·{' '}
                    {story._count.chapters}{' '}
                    {story._count.chapters === 1 ? 'chapter' : 'chapters'} ·
                    Edited {formatRelativeDate(story.updatedAt)}
                  </p>
                </div>
                <Badge variant='outline' className='shrink-0'>
                  {VISIBILITY_LABEL[story.visibility]}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
