'use client';

import { ORPCError } from '@orpc/client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@untold/ui/components/badge';
import { Button } from '@untold/ui/components/button';
import { Input } from '@untold/ui/components/input';
import { Textarea } from '@untold/ui/components/textarea';
import { cn } from '@untold/ui/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { ShareDialog } from '@/components/share-dialog';
import { VISIBILITY_LABEL } from '@/lib/story-labels';
import { orpc } from '@/utils/orpc';

const STUCK_PROMPTS = [
  'What happens next',
  'Write from my notes',
  'Ask me a question',
];

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

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [askText, setAskText] = useState('');
  const [proposal, setProposal] = useState<string | null>(null);
  const [aiUnavailable, setAiUnavailable] = useState(false);

  const initializedFor = useRef<string | null>(null);
  const hydratedRef = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const askInputRef = useRef<HTMLTextAreaElement>(null);
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

  const createChapter = useMutation(
    orpc.chapter.create.mutationOptions({
      onSuccess: (newChapter) => {
        invalidateStory();
        router.push(`/stories/${storyId}/edit/chapters/${newChapter.id}`);
      },
      onError: (error) => toast.error(error.message),
    }),
  );

  const generateDraft = useMutation(
    orpc.ai.generateDraft.mutationOptions({
      onSuccess: (data) => {
        setAiUnavailable(false);
        setProposal(data.draft);
      },
      onError: (error) => {
        if (error instanceof ORPCError && error.code === 'PRECONDITION_FAILED') {
          setAiUnavailable(true);
          toast.error("AI isn't set up for this project yet.");
          return;
        }
        toast.error(error.message);
      },
    }),
  );

  useEffect(() => {
    if (chapter && initializedFor.current !== chapterId) {
      setTitle(chapter.title);
      setContent(chapter.content);
      initializedFor.current = chapterId;
      hydratedRef.current = false;
      setStatus('idle');
      setProposal(null);
      setAiUnavailable(false);
    }
  }, [chapter, chapterId]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, content, chapterId]);

  function handleAddChapter() {
    createChapter.mutate({
      storyId,
      title: `Chapter ${chapters.length + 1}`,
    });
  }

  function handleStuckPrompt(prompt: string) {
    setAskText(prompt);
    askInputRef.current?.focus();
  }

  function handleGenerate() {
    generateDraft.mutate({ storyId });
  }

  function handleUseProposal() {
    if (!proposal) {
      return;
    }
    const next = content.trim() ? `${content}\n\n${proposal}` : proposal;
    setContent(next);
    updateChapter.mutate({ id: chapterId, title, content: next });
    setProposal(null);
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
    <div className='flex min-h-screen flex-col'>
      <div className='flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 lg:px-6'>
        <div className='flex min-w-0 items-center gap-3'>
          <Link
            href='/dashboard'
            className='shrink-0 text-sm text-muted-foreground hover:text-foreground'
          >
            ← My stories
          </Link>
          <span className='text-border'>/</span>
          <span className='cn-font-heading truncate text-sm'>
            {story.data?.title}
          </span>
          {story.data && (
            <Badge variant='outline' className='shrink-0'>
              {VISIBILITY_LABEL[story.data.visibility]}
            </Badge>
          )}
        </div>
        <div className='flex items-center gap-3'>
          {statusLabel && (
            <span className='text-xs text-muted-foreground'>
              {statusLabel}
            </span>
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
        </div>
      </div>

      <div className='grid flex-1 grid-cols-1 lg:grid-cols-[210px_1fr_300px]'>
        <aside className='flex flex-col border-b border-border py-4 lg:border-r lg:border-b-0'>
          <p className='cn-font-heading px-4 text-xs uppercase tracking-[0.14em] text-primary'>
            Chapters
          </p>
          <nav className='mt-3 flex flex-col'>
            {chapters.map((c, index) => (
              <Link
                key={c.id}
                href={`/stories/${storyId}/edit/chapters/${c.id}`}
                className={cn(
                  'flex items-center gap-2 border-l-2 px-4 py-2 text-sm transition-colors',
                  c.id === chapterId
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                <span className='cn-font-heading text-xs text-muted-foreground'>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className='truncate'>{c.title}</span>
              </Link>
            ))}
            <button
              type='button'
              onClick={handleAddChapter}
              disabled={createChapter.isPending}
              className='mx-4 mt-2 rounded-sm border border-dashed border-border px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50'
            >
              + Add chapter
            </button>
          </nav>
          <div className='mt-6 border-t border-border px-4 pt-4'>
            <p className='cn-font-heading text-xs uppercase tracking-[0.14em] text-primary'>
              Story
            </p>
            <Link
              href={`/stories/${storyId}/edit`}
              className='mt-2 block text-sm text-muted-foreground hover:text-foreground'
            >
              Notes
            </Link>
          </div>
        </aside>

        <main className='flex flex-col px-6 py-10 sm:px-10'>
          <div className='mx-auto flex w-full max-w-3xl flex-1 flex-col'>
            <p className='cn-font-heading text-xs uppercase tracking-[0.14em] text-primary'>
              Chapter {chapterIndex + 1}
            </p>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder='Chapter title'
              className='cn-font-heading mt-2 h-auto border-none bg-transparent px-0 text-3xl focus-visible:ring-0'
            />
            <div className='mt-6 flex-1 rounded-md bg-secondary/40 p-6 sm:p-10'>
              <Textarea
                ref={contentRef}
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder='Begin your chapter…'
                className='cn-font-reading min-h-[50vh] w-full resize-none border-none bg-transparent p-0 text-base focus-visible:ring-0'
              />
            </div>
            <div className='mt-6 flex flex-wrap items-center gap-2 rounded-md border border-border bg-secondary/30 px-4 py-3'>
              <span className='text-xs text-muted-foreground'>Stuck?</span>
              {STUCK_PROMPTS.map((prompt) => (
                <Button
                  key={prompt}
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={() => handleStuckPrompt(prompt)}
                >
                  {prompt}
                </Button>
              ))}
            </div>
          </div>
        </main>

        <aside className='flex flex-col gap-4 border-t border-border p-4 lg:border-t-0 lg:border-l lg:p-6'>
          <p className='cn-font-heading text-xs uppercase tracking-[0.14em] text-primary'>
            Companion
          </p>
          <Textarea
            ref={askInputRef}
            value={askText}
            onChange={(event) => setAskText(event.target.value)}
            placeholder='Ask, or paste a fragment…'
            className='min-h-24 text-sm'
          />
          <Button onClick={handleGenerate} disabled={generateDraft.isPending}>
            {generateDraft.isPending ? 'Thinking…' : 'Generate a draft'}
          </Button>
          {aiUnavailable && (
            <p className='text-xs text-muted-foreground'>
              AI isn't set up for this project yet.
            </p>
          )}
          {proposal && (
            <div className='rounded-md border border-primary/30 bg-primary/10 p-4'>
              <p className='cn-font-heading text-xs uppercase tracking-[0.14em] text-primary'>
                Proposal
              </p>
              <p className='cn-font-reading mt-2 text-sm'>{proposal}</p>
              <div className='mt-3 flex flex-wrap gap-2'>
                <Button size='sm' onClick={handleUseProposal}>
                  Use it
                </Button>
                <Button size='sm' variant='outline' onClick={handleEditProposal}>
                  Edit
                </Button>
                <Button
                  size='sm'
                  variant='ghost'
                  onClick={() => setProposal(null)}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
