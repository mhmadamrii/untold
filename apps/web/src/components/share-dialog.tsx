'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Visibility } from '@untold/db/enums';
import { Button } from '@untold/ui/components/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@untold/ui/components/dialog';
import { Input } from '@untold/ui/components/input';
import { RadioGroup, RadioGroupItem } from '@untold/ui/components/radio-group';
import { CopyIcon } from 'lucide-react';
import type * as React from 'react';
import { useState } from 'react';
import { toast } from 'sonner';

import { orpc } from '@/utils/orpc';

const OPTIONS: {
  value: Visibility;
  label: string;
  description: string;
}[] = [
  {
    value: Visibility.PRIVATE,
    label: 'Only you',
    description: 'This is the default for every new story.',
  },
  {
    value: Visibility.LINK,
    label: 'Anyone with the link',
    description: 'Not listed anywhere.',
  },
  {
    value: Visibility.PUBLIC,
    label: 'Anyone',
    description: 'Appears in Discover and can be read by anyone.',
  },
];

export function ShareDialog({
  storyId,
  visibility,
  trigger,
}: {
  storyId: string;
  visibility: Visibility;
  trigger: React.ReactNode;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Visibility>(visibility);

  const updateVisibility = useMutation(
    orpc.story.update.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: orpc.story.getById.queryKey({ input: { id: storyId } }),
        });
        queryClient.invalidateQueries({
          queryKey: orpc.story.list.queryKey(),
        });
        toast.success('Visibility updated');
        setOpen(false);
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const shareLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/stories/${storyId}`
      : '';

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setSelected(visibility);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle className='cn-font-heading text-xl font-semibold'>
            Who can read this?
          </DialogTitle>
          <p className='text-xs text-muted-foreground'>
            You can change this at any time.
          </p>
        </DialogHeader>

        <RadioGroup
          value={selected}
          onValueChange={(value) => setSelected(value as Visibility)}
        >
          {OPTIONS.map((option) => (
            <label
              key={option.value}
              htmlFor={`visibility-${option.value}`}
              className='flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 has-data-checked:border-primary'
            >
              <RadioGroupItem
                value={option.value}
                id={`visibility-${option.value}`}
                className='mt-0.5'
              />
              <span>
                <span className='block text-sm font-medium'>
                  {option.label}
                </span>
                <span className='block text-xs text-muted-foreground'>
                  {option.description}
                </span>
              </span>
            </label>
          ))}
        </RadioGroup>

        <div className='border-t border-border pt-4'>
          <p className='mb-2 cn-font-heading text-xs uppercase tracking-[0.14em] text-primary'>
            Share link
          </p>
          <div className='flex items-center gap-2'>
            <Input value={shareLink} readOnly className='text-xs' />
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={() => {
                navigator.clipboard.writeText(shareLink);
                toast.success('Link copied');
              }}
            >
              <CopyIcon data-icon='inline-start' />
              Copy
            </Button>
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant='outline' />}>
            Cancel
          </DialogClose>
          <Button
            onClick={() =>
              updateVisibility.mutate({ id: storyId, visibility: selected })
            }
            disabled={updateVisibility.isPending}
          >
            Save visibility
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
