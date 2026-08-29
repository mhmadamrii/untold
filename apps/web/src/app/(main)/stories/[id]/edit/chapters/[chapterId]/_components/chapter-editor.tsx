'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Language } from '@untold/db/enums';
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
import { Input } from '@untold/ui/components/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@untold/ui/components/select';
import { Textarea } from '@untold/ui/components/textarea';
import { cn } from '@untold/ui/lib/utils';
import { Trash2Icon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { LogoMark } from '@/components/logo-mark';
import { ShareDialog } from '@/components/share-dialog';
import { formatRelativeDate } from '@/lib/format-date';
import { LANGUAGE_LABEL, VISIBILITY_LABEL } from '@/lib/story-labels';
import { orpc } from '@/utils/orpc';

import { NotesPanel, type NotesPanelHandle } from './notes-panel';

const STUCK_PROMPTS = [
  'Continue from here',
  'Write from my notes',
  'Ask me a question',
];

function countWords(text: string) {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function estimateReadMinutes(words: number) {
  return Math.max(1, Math.round(words / 200));
}

export function ChapterEditor({
  storyId,
  chapterId,
}: {
  storyId: string;
  chapterId: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const story = useQuery(
    orpc.story.getById.queryOptions({ input: { id: storyId } }),
  );

  const chapters = story.data?.chapters ?? [];
  const chapterIndex = chapters.findIndex((c) => c.id === chapterId);
  const chapter = chapterIndex >= 0 ? chapters[chapterIndex] : undefined;
  const writtenCount = chapters.filter(
    (c) => c.content.trim().length > 0,
  ).length;
  const progressPercent =
    chapters.length > 0
      ? Math.round((writtenCount / chapters.length) * 100)
      : 0;
  const totalNotesCount = chapters.reduce((sum, c) => sum + c.notes.length, 0);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [storyTitle, setStoryTitle] = useState('');

  const initializedFor = useRef<string | null>(null);
  const hydratedRef = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const storyTitleInitialized = useRef<string | null>(null);
  const notesPanelRef = useRef<NotesPanelHandle>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  function invalidateStory() {
    queryClient.invalidateQueries({
      queryKey: orpc.story.getById.queryKey({ input: { id: storyId } }),
    });
  }

  const updateChapter = useMutation(
    orpc.chapter.update.mutationOptions({
      onSuccess: () => {
        setStatus('saved');
        invalidateStory();
      },
      onError: (error) => {
        setStatus('idle');
        toast.error(error.message);
      },
    }),
  );

  const updateLanguage = useMutation(
    orpc.story.update.mutationOptions({
      onSuccess: () => {
        invalidateStory();
        toast.success('Language updated');
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const updateStoryTitle = useMutation(
    orpc.story.update.mutationOptions({
      onSuccess: () => invalidateStory(),
      onError: (error) => toast.error(error.message),
    }),
  );

  const createChapter = useMutation(
    orpc.chapter.create.mutationOptions({
      onSuccess: (newChapter) => {
        invalidateStory();
        router.push(`/stories/${storyId}/edit/chapters/${newChapter.id}`);
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const deleteChapter = useMutation(
    orpc.chapter.delete.mutationOptions({
      onSuccess: () => {
        invalidateStory();
        toast.success('Chapter deleted');
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  useEffect(() => {
    if (chapter && initializedFor.current !== chapterId) {
      setTitle(chapter.title);
      setContent(chapter.content);
      initializedFor.current = chapterId;
      hydratedRef.current = false;
      setStatus('idle');
    }
  }, [chapter, chapterId]);

  useEffect(() => {
    if (story.data && storyTitleInitialized.current !== storyId) {
      setStoryTitle(story.data.title);
      storyTitleInitialized.current = storyId;
    }
  }, [story.data, storyId]);

  useEffect(() => {
    if (initializedFor.current !== chapterId) {
      return;
    }
    if (!hydratedRef.current) {
      hydratedRef.current = true;
      return;
    }
    setStatus('saving');
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      updateChapter.mutate({ id: chapterId, title, content });
    }, 1200);
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [title, content, chapterId, updateChapter.mutate]);

  function handleAddChapter() {
    createChapter.mutate({
      storyId,
      title: `Chapter ${chapters.length + 1}`,
    });
  }

  function handleDeleteChapter(id: string) {
    deleteChapter.mutate({ id });
    if (id === chapterId) {
      const remaining = chapters.find((c) => c.id !== id);
      router.push(
        remaining
          ? `/stories/${storyId}/edit/chapters/${remaining.id}`
          : `/stories/${storyId}/edit`,
      );
    }
  }

  function handleStuckPrompt(prompt: string) {
    if (prompt === 'Continue from here') {
      notesPanelRef.current?.triggerGenerateDraft();
      return;
    }
    if (prompt === 'Ask me a question') {
      notesPanelRef.current?.switchToAsk();
      return;
    }
    notesPanelRef.current?.openComposerWithPrompt(prompt);
  }

  function handleStoryTitleBlur() {
    const trimmed = storyTitle.trim();
    if (trimmed && trimmed !== story.data?.title) {
      updateStoryTitle.mutate({ id: storyId, title: trimmed });
    } else if (!trimmed) {
      setStoryTitle(story.data?.title ?? '');
    }
  }

  function handleUseProposal(proposalText: string) {
    const next = content.trim()
      ? `${content}\n\n${proposalText}`
      : proposalText;
    setContent(next);
    updateChapter.mutate({ id: chapterId, title, content: next });
    toast.success('Added to your chapter');
  }

  function handleEditProposal() {
    contentRef.current?.focus();
  }

  const statusLabel =
    status === 'saving'
      ? 'Saving…'
      : status === 'saved'
        ? 'Saved a moment ago'
        : null;

  const contentWordCount = countWords(content);
  const readMinutes = estimateReadMinutes(contentWordCount);

  if (story.isLoading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <p className='text-sm text-muted-foreground'>Loading your story…</p>
      </div>
    );
  }

  if (story.data && !chapter) {
    return (
      <div className='flex min-h-screen flex-col items-center justify-center gap-3 text-center'>
        <p className='text-sm text-muted-foreground'>
          This chapter couldn't be found.
        </p>
        <Link
          href={`/stories/${storyId}/edit`}
          className='text-sm text-primary hover:underline'
        >
          Back to story
        </Link>
      </div>
    );
  }

  return (
    <div className='flex min-h-screen flex-col lg:h-screen lg:min-h-0 lg:overflow-hidden'>
      <div className='flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 lg:px-6'>
        <div className='flex min-w-0 items-center gap-3'>
          <Link
            href='/'
            className='flex shrink-0 items-center gap-2 cn-font-heading text-sm'
          >
            <LogoMark className='size-[18px] text-[10px]' />
            Untold
          </Link>
          <span className='hidden text-border sm:inline'>|</span>
          <Link
            href='/dashboard'
            className='hidden shrink-0 text-sm text-muted-foreground hover:text-foreground sm:inline'
          >
            My stories
          </Link>
          <span className='text-border'>/</span>
          <Input
            value={storyTitle}
            onChange={(event) => setStoryTitle(event.target.value)}
            onBlur={handleStoryTitleBlur}
            placeholder='Untitled story'
            className='h-auto min-w-0 max-w-[220px] border-none bg-transparent p-0 cn-font-heading text-sm focus-visible:ring-0 dark:bg-transparent'
          />
          {story.data && (
            <Badge className='shrink-0'>
              {VISIBILITY_LABEL[story.data.visibility]}
            </Badge>
          )}
        </div>
        <div className='flex items-center gap-3'>
          {statusLabel && (
            <span className='text-xs text-muted-foreground'>{statusLabel}</span>
          )}
          {story.data && (
            <>
              {statusLabel && (
                <span className='text-xs text-muted-foreground'>·</span>
              )}
              <Select
                value={story.data.language}
                onValueChange={(value) =>
                  updateLanguage.mutate({
                    id: storyId,
                    language: value as Language,
                  })
                }
              >
                <SelectTrigger className='h-auto gap-1 border-none bg-transparent p-0 text-xs text-muted-foreground shadow-none hover:text-foreground dark:bg-transparent dark:hover:bg-transparent'>
                  <SelectValue>{(value: string) => value}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {Object.values(Language).map((value) => (
                    <SelectItem key={value} value={value}>
                      {LANGUAGE_LABEL[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
          {story.data && (
            <ShareDialog
              storyId={storyId}
              visibility={story.data.visibility}
              trigger={
                <Button variant='outline' size='sm'>
                  Share
                </Button>
              }
            />
          )}
          <Button
            variant='outline'
            size='sm'
            nativeButton={false}
            render={<Link href={`/stories/${storyId}`} target='_blank' />}
          >
            Read view
          </Button>
          <Button
            size='sm'
            nativeButton={false}
            render={<Link href='/stories/new' />}
          >
            New story
          </Button>
        </div>
      </div>

      <div className='flex flex-1 flex-col lg:min-h-0 lg:flex-row lg:overflow-hidden'>
        <aside className='flex flex-col border-b border-border lg:h-full lg:min-h-0 lg:w-[30%] lg:shrink-0 lg:overflow-hidden lg:border-r lg:border-b-0'>
          <div className='min-h-0 flex-1 overflow-y-auto py-4'>
            <div className='flex items-baseline justify-between gap-2 px-4'>
              <p className='cn-font-heading text-xs uppercase tracking-[0.14em] text-primary'>
                Chapters
              </p>
              <p className='text-xs text-muted-foreground'>
                {writtenCount} of {chapters.length} written
              </p>
            </div>
            <div className='mx-4 mt-2 h-1 overflow-hidden rounded-full bg-border'>
              <div
                className='h-full bg-primary transition-all'
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <nav className='mt-4 flex flex-col gap-1 px-2'>
              {chapters.map((c, index) => {
                const words = countWords(c.content);
                const isActive = c.id === chapterId;
                return (
                  <div key={c.id} className='group relative'>
                    <Link
                      href={`/stories/${storyId}/edit/chapters/${c.id}`}
                      className={cn(
                        'flex items-start gap-2 rounded-md border-l-[3px] px-3 py-2 pr-8 text-sm transition-colors',
                        isActive
                          ? 'border-primary bg-primary/8 text-foreground'
                          : 'border-transparent text-muted-foreground hover:bg-foreground/4 hover:text-foreground',
                      )}
                    >
                      <span className='cn-font-heading mt-0.5 text-xs text-muted-foreground'>
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className='min-w-0 flex-1'>
                        <span className='block truncate'>{c.title}</span>
                        <span className='block truncate text-xs text-muted-foreground'>
                          {words > 0
                            ? `${words} words · edited ${formatRelativeDate(new Date(c.updatedAt))}`
                            : 'Empty · untitled'}
                        </span>
                      </span>
                    </Link>

                    <AlertDialog>
                      <AlertDialogTrigger
                        render={
                          <Button
                            variant='ghost'
                            size='icon-xs'
                            disabled={chapters.length === 1}
                            className='absolute top-2 right-2 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100'
                            onClick={(event) => event.stopPropagation()}
                          />
                        }
                      >
                        <Trash2Icon className='size-3.5' />
                        <span className='sr-only'>
                          Delete &ldquo;{c.title}&rdquo;
                        </span>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Delete this chapter?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            &ldquo;{c.title}&rdquo; and its notes will be
                            permanently deleted. This can&rsquo;t be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            variant='destructive'
                            disabled={deleteChapter.isPending}
                            onClick={() => handleDeleteChapter(c.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                );
              })}
              <button
                type='button'
                onClick={handleAddChapter}
                disabled={createChapter.isPending}
                className='mt-2 rounded-sm border border-dashed border-border px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50'
              >
                + Add chapter
              </button>
            </nav>

            <div className='mx-4 mt-6 border-t border-border pt-4'>
              <p className='cn-font-heading text-xs uppercase tracking-[0.14em] text-primary'>
                The story
              </p>
              <div className='mt-3 flex flex-col gap-2 text-sm text-muted-foreground'>
                <span>Synopsis</span>
                <span>Outline</span>
                <span>People & places</span>
                <span>Cover & details</span>
              </div>
            </div>
          </div>
        </aside>

        <main className='flex flex-col lg:h-full lg:min-h-0 lg:flex-1 lg:overflow-hidden'>
          <div className='min-h-0 flex-1 overflow-y-auto'>
            <div className='mx-auto w-full max-w-3xl px-6 py-10 sm:px-10'>
              <div className='flex flex-wrap items-baseline justify-between gap-2'>
                <p className='cn-font-heading text-xs uppercase tracking-[0.14em] text-primary'>
                  Chapter {chapterIndex + 1}
                </p>
                <p className='text-xs text-muted-foreground'>
                  {contentWordCount} words · about {readMinutes}{' '}
                  {readMinutes === 1 ? 'minute' : 'minutes'} to read
                </p>
              </div>
              <Input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder='Chapter title'
                className='cn-font-heading mt-2 h-auto border-none bg-transparent px-0 text-3xl focus-visible:ring-0 dark:bg-transparent'
              />
              <div className='mt-6 rounded-md bg-secondary/40 p-4 sm:p-6'>
                <Textarea
                  ref={contentRef}
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder='Begin your chapter…'
                  className='cn-font-reading min-h-[50vh] w-full resize-none border-none bg-transparent p-0 text-lg focus-visible:ring-0 dark:bg-transparent'
                />
              </div>
              <div className='mt-6 flex flex-wrap items-center gap-2 rounded-md border border-primary/30 bg-primary/8 px-4 py-3'>
                <span className='cn-font-heading text-xs uppercase tracking-[0.14em] text-primary'>
                  Stuck?
                </span>
                {STUCK_PROMPTS.map((prompt, index) => (
                  <span key={prompt} className='flex items-center gap-2'>
                    {index > 0 ? (
                      <span className='text-muted-foreground'>·</span>
                    ) : null}
                    <button
                      type='button'
                      onClick={() => handleStuckPrompt(prompt)}
                      className='text-sm text-foreground transition-colors hover:text-primary'
                    >
                      {prompt}
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </main>

        <aside className='flex flex-col border-t border-border lg:h-full lg:min-h-0 lg:w-[30%] lg:shrink-0 lg:overflow-hidden lg:border-t-0 lg:border-l'>
          <NotesPanel
            ref={notesPanelRef}
            storyId={storyId}
            chapterId={chapterId}
            chapterLabel={`Chapter ${chapterIndex + 1}`}
            notes={chapter?.notes ?? []}
            description={story.data?.description ?? null}
            chapterCount={chapters.length}
            totalNotesCount={totalNotesCount}
            onNotesChanged={invalidateStory}
            onUseProposal={handleUseProposal}
            onEditProposal={handleEditProposal}
          />
        </aside>
      </div>
    </div>
  );
}
