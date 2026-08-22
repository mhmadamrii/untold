'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { StoryStatus, type Visibility } from '@untold/db/enums';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@untold/ui/components/alert-dialog';
import { Badge } from '@untold/ui/components/badge';
import { Button } from '@untold/ui/components/button';
import { Card, CardContent } from '@untold/ui/components/card';
import { Skeleton } from '@untold/ui/components/skeleton';
import { cn } from '@untold/ui/lib/utils';
import { Trash2Icon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

import type { authClient } from '@/lib/auth-client';
import { formatRelativeDate } from '@/lib/format-date';
import { STORY_STATUS_LABEL, VISIBILITY_LABEL } from '@/lib/story-labels';
import { orpc } from '@/utils/orpc';

type Session = NonNullable<Awaited<ReturnType<typeof authClient.getSession>>>;

type StatusFilter = 'ALL' | StoryStatus;

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: StoryStatus.DRAFT, label: 'Draft' },
  { value: StoryStatus.IN_PROGRESS, label: 'In progress' },
  { value: StoryStatus.COMPLETED, label: 'Completed' },
];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) {
    return 'Good morning';
  }
  if (hour < 18) {
    return 'Good afternoon';
  }
  return 'Good evening';
}

export type StoryListItem = {
  id: string;
  title: string;
  coverImage: string | null;
  status: StoryStatus;
  visibility: Visibility;
  updatedAt: Date | string;
  _count: { chapters: number };
};

export function StoryCover({ coverImage }: { coverImage: string | null }) {
  return (
    <div className='cn-plate aspect-[3/2] bg-secondary'>
      {coverImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverImage}
          alt=''
          className='h-full w-full object-cover'
        />
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

export function StoryCard({ story }: { story: StoryListItem }) {
  const queryClient = useQueryClient();

  const deleteStory = useMutation(
    orpc.story.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: orpc.story.list.queryKey() });
        toast.success('Story deleted.');
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  return (
    <div className='group relative'>
      <Link href={`/stories/${story.id}/edit`}>
        <Card size='sm' className='transition-colors hover:bg-secondary/40'>
          <StoryCover coverImage={story.coverImage} />
          <CardContent className='space-y-2'>
            <div className='flex flex-wrap gap-1.5'>
              <Badge variant='outline'>
                {STORY_STATUS_LABEL[story.status]}
              </Badge>
              <Badge variant='outline'>
                {VISIBILITY_LABEL[story.visibility]}
              </Badge>
            </div>
            <p className='cn-font-heading text-base leading-snug'>
              {story.title}
            </p>
            <p className='text-xs text-muted-foreground'>
              {story._count.chapters}{' '}
              {story._count.chapters === 1 ? 'chapter' : 'chapters'} · updated{' '}
              {formatRelativeDate(new Date(story.updatedAt))}
            </p>
          </CardContent>
        </Card>
      </Link>

      <AlertDialog>
        <AlertDialogTrigger
          render={
            <Button
              variant='outline'
              size='icon-sm'
              className='absolute top-2 right-2 bg-card opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100'
              onClick={(event) => event.stopPropagation()}
            />
          }
        >
          <Trash2Icon className='size-3.5' />
          <span className='sr-only'>Delete &ldquo;{story.title}&rdquo;</span>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this story?</AlertDialogTitle>
            <AlertDialogDescription>
              &ldquo;{story.title}&rdquo; and all its chapters will be
              permanently deleted. This can&rsquo;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              disabled={deleteStory.isPending}
              onClick={() => deleteStory.mutate({ id: story.id })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function Dashboard({ session }: { session: Session }) {
  const [filter, setFilter] = useState<StatusFilter>('ALL');
  const stories = useQuery(orpc.story.list.queryOptions());

  const firstName = session.user.name.split(' ')[0];

  if (stories.isLoading) {
    return (
      <div className='mx-auto max-w-6xl px-6 py-20 md:py-28'>
        <Skeleton className='h-3 w-24' />
        <Skeleton className='mt-4 h-10 w-80' />
        <div className='mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4'>
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className='space-y-3'>
              <Skeleton className='aspect-[3/2] w-full' />
              <Skeleton className='h-4 w-2/3' />
              <Skeleton className='h-3 w-1/2' />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const allStories = stories.data ?? [];

  if (allStories.length === 0) {
    return (
      <div className='mx-auto flex max-w-6xl flex-col px-6 py-20 md:py-28'>
        <p className='cn-font-heading text-xs uppercase tracking-[0.14em] text-primary'>
          Welcome back
        </p>
        <h1 className='cn-font-heading mt-3 text-4xl sm:text-5xl'>
          {greeting()}, {firstName}.
        </h1>

        <div className='mt-24 flex flex-col items-center text-center'>
          <h2 className='cn-font-heading text-2xl sm:text-3xl'>
            Your next story hasn&apos;t been written yet.
          </h2>
          <p className='mt-3 max-w-sm text-muted-foreground'>
            Start with a memory, an idea, or even a single sentence.
          </p>
          <Button
            className='mt-8'
            render={<Link href='/stories/new' />}
            nativeButton={false}
          >
            Start a story
          </Button>
        </div>
      </div>
    );
  }

  const mostRecent = allStories[0];
  const showHero =
    mostRecent.status === StoryStatus.IN_PROGRESS ||
    mostRecent.status === StoryStatus.DRAFT;

  const filteredStories =
    filter === 'ALL'
      ? allStories
      : allStories.filter((story) => story.status === filter);

  return (
    <div className='mx-auto max-w-6xl px-6 py-20 md:py-28'>
      <p className='cn-font-heading text-xs uppercase tracking-[0.14em] text-primary'>
        Welcome back
      </p>
      <h1 className='cn-font-heading mt-3 text-4xl sm:text-5xl'>
        {greeting()}, {firstName}.
      </h1>

      {showHero && (
        <Card className='mt-12 sm:flex-row sm:items-stretch'>
          <div className='sm:w-64 sm:shrink-0'>
            <StoryCover coverImage={mostRecent.coverImage} />
          </div>
          <CardContent className='flex flex-1 flex-col justify-between gap-4'>
            <div>
              <p className='cn-font-heading text-xs uppercase tracking-[0.14em] text-primary'>
                Continue writing
              </p>
              <h2 className='cn-font-heading mt-2 text-2xl'>
                {mostRecent.title}
              </h2>
              <div className='mt-3 flex flex-wrap items-center gap-2'>
                <Badge variant='outline'>
                  {STORY_STATUS_LABEL[mostRecent.status]}
                </Badge>
                <Badge variant='outline'>
                  {VISIBILITY_LABEL[mostRecent.visibility]}
                </Badge>
                <span className='text-xs text-muted-foreground'>
                  {mostRecent._count.chapters}{' '}
                  {mostRecent._count.chapters === 1 ? 'chapter' : 'chapters'}
                </span>
              </div>
            </div>
            <Button
              className='w-fit'
              render={<Link href={`/stories/${mostRecent.id}/edit`} />}
              nativeButton={false}
            >
              Continue
            </Button>
          </CardContent>
        </Card>
      )}

      <div className='mt-16 flex flex-wrap items-center justify-between gap-4'>
        <h2 className='cn-font-heading text-2xl'>All my stories</h2>
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

      <div className='mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4'>
        {filteredStories.map((story) => (
          <StoryCard key={story.id} story={story} />
        ))}

        <Link
          href='/discover'
          className='grid min-h-40 place-items-center rounded-md border border-dashed border-border p-6 text-center transition-colors hover:border-primary/60'
        >
          <div>
            <p className='cn-font-heading text-sm'>Not in the mood to write?</p>
            <p className='mt-1 text-xs text-muted-foreground'>
              Read stories other people have told.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
