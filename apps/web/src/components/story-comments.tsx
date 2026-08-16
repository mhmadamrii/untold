'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@untold/ui/components/avatar';
import { Button } from '@untold/ui/components/button';
import { Textarea } from '@untold/ui/components/textarea';
import Link from 'next/link';
import { useState } from 'react';

import { authClient } from '@/lib/auth-client';
import { orpc } from '@/utils/orpc';

export function StoryComments({ storyId }: { storyId: string }) {
  const { data: session } = authClient.useSession();
  const queryClient = useQueryClient();
  const [content, setContent] = useState('');

  const comments = useQuery(
    orpc.comment.list.queryOptions({ input: { storyId } }),
  );

  const createComment = useMutation(
    orpc.comment.create.mutationOptions({
      onSuccess: () => {
        setContent('');
        queryClient.invalidateQueries({
          queryKey: orpc.comment.list.queryKey({ input: { storyId } }),
        });
      },
    }),
  );

  return (
    <div>
      <h2 className='cn-font-heading text-2xl italic'>Comments</h2>

      {session ? (
        <form
          className='mt-6 flex flex-col items-end gap-3'
          onSubmit={(event) => {
            event.preventDefault();
            if (!content.trim()) {
              return;
            }
            createComment.mutate({ storyId, content: content.trim() });
          }}
        >
          <Textarea
            className='min-h-20 text-sm'
            placeholder='Share what this story made you feel...'
            value={content}
            onChange={(event) => setContent(event.target.value)}
          />
          <Button type='submit' size='sm' disabled={createComment.isPending}>
            Post comment
          </Button>
        </form>
      ) : (
        <p className='mt-4 text-sm text-muted-foreground'>
          <Link href='/login' className='text-primary hover:underline'>
            Sign in
          </Link>{' '}
          to leave a comment.
        </p>
      )}

      <div className='mt-8 divide-y divide-border border-t border-border'>
        {comments.data?.length === 0 && (
          <p className='py-6 text-sm text-muted-foreground'>
            No comments yet. Be the first to say something.
          </p>
        )}
        {comments.data?.map((comment) => (
          <div key={comment.id} className='flex gap-3 py-5'>
            <Avatar size='sm'>
              <AvatarImage src={comment.user.image ?? undefined} />
              <AvatarFallback>{comment.user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className='text-sm font-medium'>{comment.user.name}</p>
              <p className='mt-1 text-sm text-muted-foreground'>
                {comment.content}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
