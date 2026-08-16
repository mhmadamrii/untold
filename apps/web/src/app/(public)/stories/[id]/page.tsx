'use client';

import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@untold/ui/components/skeleton';
import Link from 'next/link';
import { use } from 'react';

import { LikeButton } from '@/components/like-button';
import { StoryComments } from '@/components/story-comments';
import { orpc } from '@/utils/orpc';

export default function StoryReaderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const story = useQuery(
    orpc.story.getPublicById.queryOptions({ input: { id } }),
  );

  if (story.isLoading) {
    return (
      <div className='mx-auto max-w-3xl space-y-4 px-6 py-20'>
        <Skeleton className='h-10 w-2/3' />
        <Skeleton className='h-4 w-1/3' />
        <Skeleton className='mt-8 h-40 w-full' />
      </div>
    );
  }

  if (!story.data) {
    return (
      <div className='mx-auto max-w-3xl px-6 py-20 text-center'>
        <p className='cn-font-heading text-2xl italic'>Story not found.</p>
        <Link
          href='/'
          className='mt-4 inline-block text-sm text-primary hover:underline'
        >
          Back home
        </Link>
      </div>
    );
  }

  const data = story.data;
  const firstLockedIndex = data.chapters.findIndex((chapter) => chapter.locked);

  return (
    <div className='mx-auto max-w-3xl px-6 py-20'>
      <p className='text-xs font-medium tracking-wide text-muted-foreground'>
        by {data.author.name}
      </p>
      <h1 className='cn-font-heading mt-2 text-4xl italic'>{data.title}</h1>
      {data.description && (
        <p className='cn-font-reading mt-4 text-lg text-muted-foreground'>
          {data.description}
        </p>
      )}
      <div className='mt-6'>
        <LikeButton
          storyId={data.id}
          liked={data.liked}
          likeCount={data.likeCount}
        />
      </div>

      <div className='mt-16 space-y-16'>
        {data.chapters.map((chapter, index) => {
          if (!chapter.locked) {
            return (
              <div key={chapter.id}>
                <p className='cn-font-heading text-xl italic'>
                  {chapter.title}
                </p>
                <p className='cn-font-reading mt-4 whitespace-pre-line text-base leading-relaxed'>
                  {chapter.content}
                </p>
              </div>
            );
          }

          if (index !== firstLockedIndex) {
            return (
              <p key={chapter.id} className='text-sm text-muted-foreground/60'>
                {chapter.title} — sign in to keep reading
              </p>
            );
          }

          return (
            <div key={chapter.id} className='relative'>
              <p className='cn-font-heading text-xl italic'>{chapter.title}</p>
              <p className='cn-font-reading mt-4 max-h-40 overflow-hidden text-base leading-relaxed blur-[3px] select-none'>
                {chapter.preview}
                {chapter.preview && chapter.preview.length > 0 ? '…' : ''}
              </p>
              <div className='absolute inset-x-0 bottom-0 flex h-40 flex-col items-center justify-end gap-3 bg-gradient-to-t from-background via-background/95 to-transparent pb-2'>
                <p className='text-sm text-muted-foreground'>
                  There's more to this story.
                </p>
                <Link
                  href='/login'
                  className='bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80'
                >
                  Sign in to keep reading
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <div className='mt-20 border-t border-border pt-16'>
        <StoryComments storyId={data.id} />
      </div>
    </div>
  );
}
