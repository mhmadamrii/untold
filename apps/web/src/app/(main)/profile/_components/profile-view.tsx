'use client';

import { useQuery } from '@tanstack/react-query';
import { StoryStatus, Visibility } from '@untold/db/enums';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@untold/ui/components/avatar';
import { Button } from '@untold/ui/components/button';
import { Skeleton } from '@untold/ui/components/skeleton';
import { cn } from '@untold/ui/lib/utils';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { StoryCard } from '@/app/(main)/_components/dashboard';
import { authClient } from '@/lib/auth-client';
import { orpc } from '@/utils/orpc';

type Session = NonNullable<Awaited<ReturnType<typeof authClient.getSession>>>;

type ProfileFilter = 'ALL' | 'PUBLISHED' | 'DRAFTS';

const FILTERS: { value: ProfileFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'DRAFTS', label: 'Drafts' },
];

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function ProfileView({ session }: { session: Session }) {
  const router = useRouter();
  const [filter, setFilter] = useState<ProfileFilter>('ALL');
  const stories = useQuery(orpc.story.list.queryOptions());

  const allStories = stories.data ?? [];
  const publicCount = allStories.filter(
    (story) => story.visibility === Visibility.PUBLIC,
  ).length;

  const filteredStories = allStories.filter((story) => {
    if (filter === 'PUBLISHED') {
      return story.visibility === Visibility.PUBLIC;
    }
    if (filter === 'DRAFTS') {
      return story.status === StoryStatus.DRAFT;
    }
    return true;
  });

  return (
    <div className='mx-auto max-w-6xl px-6 py-20 md:py-28'>
      <div className='flex flex-col items-start gap-6 sm:flex-row sm:items-center'>
        <Avatar size='lg'>
          <AvatarImage src={session.user.image ?? undefined} alt='' />
          <AvatarFallback className='cn-font-heading'>
            {initials(session.user.name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h1 className='cn-font-heading text-3xl sm:text-4xl'>
            {session.user.name}
          </h1>
          <div className='mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground'>
            <span>
              {allStories.length}{' '}
              {allStories.length === 1 ? 'story' : 'stories'} total
            </span>
            <span>
              {publicCount} public {publicCount === 1 ? 'story' : 'stories'}
            </span>
          </div>
        </div>
      </div>

      <div className='mt-16 flex flex-wrap items-center justify-between gap-4'>
        <h2 className='cn-font-heading text-2xl'>My stories</h2>
        <div className='flex flex-wrap gap-2'>
          {FILTERS.map((item) => (
            <button
              key={item.value}
              type='button'
              onClick={() => setFilter(item.value)}
              className={cn(
                'cn-font-heading rounded-sm border px-3 py-1 text-xs uppercase tracking-wide transition-colors',
                filter === item.value
                  ? 'border-primary text-primary'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {stories.isLoading ? (
        <div className='mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4'>
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className='space-y-3'>
              <Skeleton className='aspect-[3/2] w-full' />
              <Skeleton className='h-4 w-2/3' />
              <Skeleton className='h-3 w-1/2' />
            </div>
          ))}
        </div>
      ) : filteredStories.length === 0 ? (
        <p className='mt-8 text-sm text-muted-foreground'>
          {filter === 'PUBLISHED'
            ? "You haven't published a story publicly yet."
            : filter === 'DRAFTS'
              ? 'No drafts right now.'
              : "You haven't started a story yet."}
        </p>
      ) : (
        <div className='mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4'>
          {filteredStories.map((story) => (
            <StoryCard key={story.id} story={story} />
          ))}
        </div>
      )}

      <div className='mt-16'>
        <h2 className='cn-font-heading text-2xl'>Account</h2>
        <div className='mt-6 divide-y divide-border border-y border-border'>
          <div className='flex items-center justify-between py-4'>
            <div>
              <p className='text-xs uppercase tracking-widest text-muted-foreground'>
                Email
              </p>
              <p className='mt-1 text-sm'>{session.user.email}</p>
            </div>
          </div>
          <div className='flex items-center justify-between py-4'>
            <div>
              <p className='text-xs uppercase tracking-widest text-muted-foreground'>
                Session
              </p>
              <p className='mt-1 text-sm'>Signed in as {session.user.name}</p>
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={() => {
                authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => {
                      router.push('/');
                    },
                  },
                });
              }}
            >
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
