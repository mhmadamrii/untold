'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { StoryStatus, StoryType, Visibility } from '@untold/db/enums';
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@untold/ui/components/dialog';
import { Input } from '@untold/ui/components/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@untold/ui/components/select';
import { Skeleton } from '@untold/ui/components/skeleton';
import { Textarea } from '@untold/ui/components/textarea';
import { PlusIcon, TrashIcon, XIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import {
  STORY_STATUS_LABEL,
  STORY_TYPE_LABEL,
  VISIBILITY_LABEL,
} from '@/lib/story-labels';
import { orpc } from '@/utils/orpc';

const TOPICS = [
  'Childhood',
  'Family',
  'Friendship',
  'Love',
  'Loss',
  'Adventure',
  'Growing Up',
  'Dreams',
  'Travel',
  'Identity',
  'Hope',
  'Fear',
  'Life Changes',
] as const;

export default function StoryWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const story = useQuery(orpc.story.getById.queryOptions({ input: { id } }));

  function invalidateStory() {
    queryClient.invalidateQueries({
      queryKey: orpc.story.getById.queryKey({ input: { id } }),
    });
  }

  const updateStory = useMutation(
    orpc.story.update.mutationOptions({
      onSuccess: invalidateStory,
      onError: (error) => toast.error(error.message),
    }),
  );

  const createNote = useMutation(
    orpc.note.create.mutationOptions({
      onSuccess: () => {
        invalidateStory();
        setNoteDraft('');
        setAddNoteOpen(false);
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const deleteNote = useMutation(
    orpc.note.delete.mutationOptions({
      onSuccess: invalidateStory,
      onError: (error) => toast.error(error.message),
    }),
  );

  const generateDraft = useMutation(
    orpc.ai.generateDraft.mutationOptions({
      onError: (error) => toast.error(error.message),
    }),
  );

  const createSynopsis = useMutation(
    orpc.ai.createSynopsis.mutationOptions({
      onSuccess: invalidateStory,
      onError: (error) => toast.error(error.message),
    }),
  );

  const createChapter = useMutation(
    orpc.chapter.create.mutationOptions({
      onSuccess: (chapter) => {
        toast.success('Chapter added.');
        router.push(`/stories/${id}/edit/chapters/${chapter.id}`);
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const deleteStory = useMutation(
    orpc.story.delete.mutationOptions({
      onSuccess: () => {
        toast.success('Story deleted.');
        router.push('/stories');
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const [title, setTitle] = useState('');
  const titleInitialized = useRef(false);
  useEffect(() => {
    if (story.data && !titleInitialized.current) {
      setTitle(story.data.title);
      titleInitialized.current = true;
    }
  }, [story.data]);

  const [tagDraft, setTagDraft] = useState('');
  const [addNoteOpen, setAddNoteOpen] = useState(false);
  const [noteDraft, setNoteDraft] = useState('');

  if (story.isLoading) {
    return (
      <div className='mx-auto max-w-6xl space-y-4 px-6 py-10'>
        <Skeleton className='h-10 w-full' />
        <Skeleton className='h-64 w-full' />
      </div>
    );
  }

  if (!story.data) {
    return (
      <div className='mx-auto max-w-6xl px-6 py-20 text-center'>
        <p className='cn-font-heading text-2xl italic'>Story not found.</p>
      </div>
    );
  }

  const data = story.data;

  return (
    <div className='mx-auto max-w-6xl px-6 py-10'>
      <div className='flex flex-wrap items-center gap-3 border-b border-border pb-6'>
        <Button
          variant='outline'
          size='sm'
          nativeButton={false}
          render={
            <a href={`/stories/${id}`} target='_blank' rel='noreferrer' />
          }
        >
          Preview
        </Button>

        <Select
          value={data.visibility}
          onValueChange={(value) =>
            updateStory.mutate({ id, visibility: value as Visibility })
          }
        >
          <SelectTrigger size='sm'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(Visibility).map((value) => (
              <SelectItem key={value} value={value}>
                {VISIBILITY_LABEL[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={data.status}
          onValueChange={(value) =>
            updateStory.mutate({ id, status: value as StoryStatus })
          }
        >
          <SelectTrigger size='sm'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(StoryStatus).map((value) => (
              <SelectItem key={value} value={value}>
                {STORY_STATUS_LABEL[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <AlertDialog>
          <AlertDialogTrigger
            render={<Button variant='destructive' size='sm' className='ml-auto' />}
          >
            <TrashIcon data-icon='inline-start' />
            Delete
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete this story?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently deletes &ldquo;{data.title}&rdquo;, along with
                all of its notes and chapters. This can&rsquo;t be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                variant='destructive'
                disabled={deleteStory.isPending}
                onClick={() => deleteStory.mutate({ id })}
              >
                {deleteStory.isPending ? 'Deleting...' : 'Delete story'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className='mt-10 grid gap-10 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]'>
        <div className='space-y-6'>
          <div>
            <p className='text-xs font-medium tracking-wide text-primary'>
              Your notes
            </p>

            <div className='mt-3 space-y-2'>
              {data.notes.map((note) => (
                <div
                  key={note.id}
                  className='group flex items-start justify-between gap-2 ring-1 ring-border p-3'
                >
                  <p className='text-sm leading-relaxed'>{note.content}</p>
                  <button
                    type='button'
                    onClick={() => deleteNote.mutate({ id: note.id })}
                    className='shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100'
                  >
                    <XIcon className='size-3.5' />
                    <span className='sr-only'>Remove note</span>
                  </button>
                </div>
              ))}

              {data.notes.length === 0 && (
                <p className='py-3 text-sm text-muted-foreground'>
                  No notes yet — add your first one.
                </p>
              )}

              <Dialog open={addNoteOpen} onOpenChange={setAddNoteOpen}>
                <DialogTrigger
                  render={
                    <Button
                      variant='outline'
                      className='w-full border-dashed'
                    />
                  }
                >
                  <PlusIcon data-icon='inline-start' />
                  Add note
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add a note</DialogTitle>
                  </DialogHeader>
                  <Textarea
                    autoFocus
                    value={noteDraft}
                    onChange={(event) => setNoteDraft(event.target.value)}
                    placeholder="A memory, a moment, anything that's been on your mind..."
                    className='min-h-24'
                  />
                  <DialogFooter>
                    <Button
                      variant='outline'
                      onClick={() => setAddNoteOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      disabled={!noteDraft.trim() || createNote.isPending}
                      onClick={() =>
                        createNote.mutate({ storyId: id, content: noteDraft })
                      }
                    >
                      {createNote.isPending ? 'Adding...' : 'Add note'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className='border-t border-border pt-6 space-y-6'>
            <div className='space-y-2'>
              <p className='text-xs font-medium tracking-wide text-muted-foreground'>
                Story type
              </p>
              <Select
                value={data.storyType ?? ''}
                onValueChange={(value) =>
                  updateStory.mutate({
                    id,
                    storyType: (value || undefined) as StoryType | undefined,
                  })
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Select a type' />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(StoryType).map((value) => (
                    <SelectItem key={value} value={value}>
                      {STORY_TYPE_LABEL[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <p className='text-xs font-medium tracking-wide text-muted-foreground'>
                Topic
              </p>
              <Select
                value={data.topic ?? ''}
                onValueChange={(value) =>
                  updateStory.mutate({ id, topic: value || undefined })
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue placeholder='Select a topic' />
                </SelectTrigger>
                <SelectContent>
                  {TOPICS.map((value) => (
                    <SelectItem key={value} value={value}>
                      {value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <p className='text-xs font-medium tracking-wide text-muted-foreground'>
                Tags
              </p>
              <div className='flex flex-wrap gap-2'>
                {data.tags.map((tag) => (
                  <Badge key={tag} variant='outline' className='gap-1 pr-1.5'>
                    {tag}
                    <button
                      type='button'
                      onClick={() =>
                        updateStory.mutate({
                          id,
                          tags: data.tags.filter(
                            (existing) => existing !== tag,
                          ),
                        })
                      }
                      className='hover:text-destructive'
                    >
                      <XIcon className='size-3' />
                      <span className='sr-only'>Remove tag {tag}</span>
                    </button>
                  </Badge>
                ))}
              </div>
              <Input
                value={tagDraft}
                onChange={(event) => setTagDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    const tag = tagDraft.trim();
                    if (tag && !data.tags.includes(tag)) {
                      updateStory.mutate({ id, tags: [...data.tags, tag] });
                    }
                    setTagDraft('');
                  }
                }}
                placeholder='Add a tag and press enter'
              />
            </div>
          </div>

          <div className='flex items-center gap-3 border-t border-border pt-6'>
            <Button
              variant='outline'
              disabled={!generateDraft.data}
              onClick={() => {
                generateDraft.reset();
                toast('Cleared the last generated draft.');
              }}
            >
              Clear draft
            </Button>
            <Button
              className='flex-1'
              disabled={generateDraft.isPending}
              onClick={() => {
                if (data.notes.length === 0) {
                  toast.error(
                    'Add a note first — Untold needs something to work with.',
                  );
                  return;
                }
                generateDraft.mutate({ storyId: id });
              }}
            >
              {generateDraft.isPending ? 'Generating...' : 'Generate'}
            </Button>
          </div>
        </div>

        <div className='space-y-8'>
          <div className='ring-1 ring-border p-6'>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              onBlur={() => {
                if (title.trim() && title !== data.title) {
                  updateStory.mutate({ id, title: title.trim() });
                }
              }}
              className='cn-font-heading border-0 px-0 text-2xl italic focus-visible:ring-0'
            />

            <div className='mt-6 min-h-40'>
              {generateDraft.data?.draft ? (
                <p className='animate-in fade-in slide-in-from-bottom-2 cn-font-reading text-lg duration-500'>
                  {generateDraft.data.draft}
                </p>
              ) : (
                <p className='text-sm text-muted-foreground'>
                  {generateDraft.isPending
                    ? 'Untold is finding the story in your notes...'
                    : 'Click Generate to see what your notes could become.'}
                </p>
              )}
            </div>
          </div>

          <Button
            variant='outline'
            className='w-full border-dashed'
            disabled={createChapter.isPending}
            onClick={() =>
              createChapter.mutate({
                storyId: id,
                title: `Chapter ${data.chapters.length + 1}`,
                content: generateDraft.data?.draft ?? '',
              })
            }
          >
            <PlusIcon data-icon='inline-start' />
            Add chapter
          </Button>

          <div className='ring-1 ring-border p-6'>
            <div className='flex items-center justify-between gap-4'>
              <p className='cn-font-heading text-lg italic'>Synopsis</p>
              <Button
                variant='outline'
                size='sm'
                disabled={createSynopsis.isPending}
                onClick={() => createSynopsis.mutate({ storyId: id })}
              >
                {createSynopsis.isPending
                  ? 'Writing...'
                  : data.description
                    ? 'Regenerate'
                    : 'Create synopsis'}
              </Button>
            </div>
            <p className='mt-3 text-sm text-muted-foreground'>
              {data.description ??
                (createSynopsis.isPending
                  ? 'Writing a synopsis...'
                  : 'Nothing yet — generate one from your notes.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
