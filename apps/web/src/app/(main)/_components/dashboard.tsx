'use client';

import type { StoryStatus } from '@untold/db/enums';
import { Badge } from '@untold/ui/components/badge';
import { Button } from '@untold/ui/components/button';
import Link from 'next/link';
import type { authClient } from '@/lib/auth-client';
import { dummyStories, formatRelativeDate } from '@/lib/dummies';
import { firstName } from '@/utils/fn';

const STATUS_LABEL: Record<StoryStatus, string> = {
  DRAFT: 'Draft',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
};

export function Dashboard({
  session,
}: {
  session: typeof authClient.$Infer.Session;
}) {
  const stories = [...dummyStories].sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
  );
  const mostRecent = stories[0];

  return (
    <div className='mx-auto max-w-4xl px-6 py-16'>
      <h1 className='cn-font-heading text-3xl italic'>
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
        <h2 className='cn-font-heading text-xl italic'>Your stories</h2>

        <div className='mt-6 divide-y divide-border border-y border-border'>
          {stories.map((story) => (
            <Link
              key={story.id}
              href={`/stories/${story.id}/edit`}
              className='group flex items-center justify-between gap-6 py-5'
            >
              <div>
                <p className='cn-font-heading text-lg italic group-hover:text-primary'>
                  {story.title}
                </p>
                <p className='mt-1 text-sm text-muted-foreground'>
                  {STATUS_LABEL[story.status]} · {story.chapterCount}{' '}
                  {story.chapterCount === 1 ? 'chapter' : 'chapters'} · Edited{' '}
                  {formatRelativeDate(story.updatedAt)}
                </p>
              </div>
              <Badge variant='outline' className='shrink-0'>
                {story.visibility === 'PRIVATE'
                  ? 'Private'
                  : story.visibility === 'LINK'
                    ? 'Link only'
                    : 'Public'}
              </Badge>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
