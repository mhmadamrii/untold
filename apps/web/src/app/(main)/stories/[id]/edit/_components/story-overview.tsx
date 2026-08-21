'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@untold/ui/components/button';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';

import { orpc } from '@/utils/orpc';

export function StoryOverview({ storyId }: { storyId: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const story = useQuery(
    orpc.story.getById.queryOptions({ input: { id: storyId } }),
  );

  const createChapter = useMutation(
    orpc.chapter.create.mutationOptions({
      onSuccess: (chapter) => {
        queryClient.invalidateQueries({
          queryKey: orpc.story.getById.queryKey({ input: { id: storyId } }),
        });
        router.replace(`/stories/${storyId}/edit/chapters/${chapter.id}`);
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  useEffect(() => {
    if (story.data && story.data.chapters.length > 0) {
      router.replace(
        `/stories/${storyId}/edit/chapters/${story.data.chapters[0].id}`,
      );
    }
  }, [story.data, storyId, router]);

  if (story.isLoading || (story.data && story.data.chapters.length > 0)) {
    return (
      <div className='flex min-h-[70vh] items-center justify-center'>
        <p className='text-sm text-muted-foreground'>Opening your story…</p>
      </div>
    );
  }

  return (
    <div className='flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center'>
      <p className='cn-font-heading text-xs uppercase tracking-[0.14em] text-primary'>
        {story.data?.title}
      </p>
      <h1 className='cn-font-heading text-2xl'>
        This story doesn't have any chapters yet.
      </h1>
      <p className='max-w-md text-sm text-muted-foreground'>
        Every story starts with a first page. Add a chapter and begin writing.
      </p>
      <Button
        onClick={() => createChapter.mutate({ storyId, title: 'Chapter 1' })}
        disabled={createChapter.isPending}
      >
        Add a first chapter
      </Button>
    </div>
  );
}
