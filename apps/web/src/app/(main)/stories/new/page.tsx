'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { orpc } from '@/utils/orpc';

export default function NewStoryPage() {
  const router = useRouter();
  const hasStarted = useRef(false);

  const createStory = useMutation(
    orpc.story.create.mutationOptions({
      onSuccess: (story) => {
        router.replace(`/stories/${story.id}/edit`);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: fire once on mount only
  useEffect(() => {
    if (hasStarted.current) {
      return;
    }
    hasStarted.current = true;
    createStory.mutate({ title: 'Untitled story' });
  }, []);

  return (
    <div className='mx-auto max-w-2xl px-6 py-24 text-center'>
      <p className='cn-font-heading text-2xl'>
        {createStory.isError
          ? 'Something went wrong starting your story.'
          : 'Starting your story...'}
      </p>
    </div>
  );
}
