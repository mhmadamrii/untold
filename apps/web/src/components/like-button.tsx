'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@untold/ui/components/button';
import { HeartIcon } from 'lucide-react';
import Link from 'next/link';

import { authClient } from '@/lib/auth-client';
import { orpc } from '@/utils/orpc';

export function LikeButton({
  storyId,
  liked,
  likeCount,
}: {
  storyId: string;
  liked: boolean;
  likeCount: number;
}) {
  const { data: session } = authClient.useSession();
  const queryClient = useQueryClient();

  const toggleLike = useMutation(
    orpc.story.toggleLike.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.story.getPublicById.queryKey({
            input: { id: storyId },
          }),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.story.discover.queryKey({ input: {} }),
        });
      },
    }),
  );

  if (!session) {
    return (
      <Button
        variant='outline'
        size='sm'
        nativeButton={false}
        render={<Link href='/login' />}
      >
        <HeartIcon data-icon='inline-start' />
        {likeCount}
      </Button>
    );
  }

  return (
    <Button
      variant={liked ? 'default' : 'outline'}
      size='sm'
      disabled={toggleLike.isPending}
      onClick={() => toggleLike.mutate({ storyId })}
    >
      <HeartIcon
        data-icon='inline-start'
        fill={liked ? 'currentColor' : 'none'}
      />
      {likeCount}
    </Button>
  );
}
