'use client';

import { useQuery } from '@tanstack/react-query';
import { Button } from '@untold/ui/components/button';
import { Skeleton } from '@untold/ui/components/skeleton';
import { MessageCircleIcon } from 'lucide-react';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { LikeButton } from '@/components/like-button';
import { StoryComments } from '@/components/story-comments';
import { STORY_TYPE_LABEL } from '@/lib/story-labels';
import { orpc } from '@/utils/orpc';

export function StoryReader({ id }: { id: string }) {
  const story = useQuery(
    orpc.story.getPublicById.queryOptions({ input: { id } }),
  );

  if (story.isLoading) {
    return (
      <div className='mx-auto max-w-6xl px-6 py-20 md:py-28'>
        <div className='mx-auto max-w-2xl space-y-4 text-center'>
          <Skeleton className='mx-auto h-3 w-40' />
          <Skeleton className='mx-auto h-10 w-3/4' />
          <Skeleton className='mx-auto h-4 w-32' />
        </div>
        <Skeleton className='mt-12 aspect-[21/9] w-full' />
        <div className='mx-auto mt-12 max-w-[640px] space-y-3'>
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-2/3' />
        </div>
      </div>
    );
  }

  if (story.error || !story.data) {
    notFound();
  }

  const data = story.data;

  return (
    <div className='px-6 py-20 md:py-28'>
      <header className='mx-auto max-w-2xl text-center'>
        <p className='cn-font-heading text-xs uppercase tracking-[0.14em] text-primary'>
          {data.storyType ? STORY_TYPE_LABEL[data.storyType] : 'Story'} ·{' '}
          {data.chapters.length}{' '}
          {data.chapters.length === 1 ? 'chapter' : 'chapters'}
        </p>
        <h1 className='cn-font-heading mt-3 text-4xl leading-[1.05] sm:text-5xl'>
          {data.title}
        </h1>
        <p className='mt-4 text-sm text-muted-foreground'>
          by {data.author.name}
        </p>
        {data.description && (
          <p className='cn-font-reading mt-6 text-base text-muted-foreground italic'>
            {data.description}
          </p>
        )}
      </header>

      <div className='cn-plate mx-auto mt-12 aspect-[21/9] max-w-4xl bg-secondary grid place-items-center'>
        <span className='text-xs uppercase tracking-widest text-muted-foreground'>
          Placeholder Image
        </span>
      </div>

      <div className='mx-auto mt-16 max-w-[640px]'>
        {data.chapters.map((chapter, index) => (
          <section key={chapter.id} className='mb-16 last:mb-0'>
            <p className='cn-font-heading text-xs uppercase tracking-[0.14em] text-primary'>
              Chapter {index + 1}
              {chapter.locked ? ' · Locked' : ''}
            </p>
            <h2 className='cn-font-heading mt-2 text-2xl'>{chapter.title}</h2>

            {chapter.locked ? (
              <div className='mt-6 border border-border p-6'>
                <p className='cn-font-reading text-muted-foreground/70 italic'>
                  {chapter.preview}…
                </p>
                <Button
                  className='mt-6'
                  nativeButton={false}
                  render={<Link href='/login' />}
                >
                  Sign in to keep reading
                </Button>
              </div>
            ) : (
              <div className='cn-font-reading mt-6 space-y-5 text-lg text-foreground'>
                {chapter.content
                  ?.split('\n')
                  .filter((paragraph) => paragraph.trim().length > 0)
                  .map((paragraph, paragraphIndex) => (
                    <p key={paragraphIndex}>{paragraph}</p>
                  ))}
              </div>
            )}
          </section>
        ))}
      </div>

      <div className='mx-auto mt-4 max-w-[640px]'>
        <div className='flex items-center gap-4 border-y border-border py-6'>
          <LikeButton
            storyId={data.id}
            liked={data.liked}
            likeCount={data.likeCount}
          />
          <span className='flex items-center gap-1.5 text-sm text-muted-foreground'>
            <MessageCircleIcon className='size-4' />
            {data.commentCount}
          </span>
        </div>

        <div className='mt-12'>
          <StoryComments storyId={data.id} />
        </div>

        <div className='mt-16 border border-border p-8 text-center'>
          <p className='cn-font-heading text-xs uppercase tracking-[0.14em] text-primary'>
            The author
          </p>
          <p className='cn-font-heading mt-2 text-xl'>{data.author.name}</p>
          <Button
            variant='outline'
            className='mt-6'
            nativeButton={false}
            render={<Link href='/discover' />}
          >
            More by {data.author.name}
          </Button>
        </div>
      </div>
    </div>
  );
}
