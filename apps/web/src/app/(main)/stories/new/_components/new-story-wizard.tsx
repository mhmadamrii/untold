'use client';

import { Language, StoryType } from '@untold/db/enums';
import { Button } from '@untold/ui/components/button';
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
import { useMutation } from '@tanstack/react-query';
import type { Route } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

import { LANGUAGE_LABEL, STORY_TYPE_LABEL } from '@/lib/story-labels';
import { orpc } from '@/utils/orpc';

type Step = 'idea' | 'explore' | 'shape';

type Direction = {
  title: string;
  description: string;
};

const NUDGES: Array<{
  letter: string;
  title: string;
  description: string;
  starter: string;
}> = [
  {
    letter: 'A',
    title: 'A person who is gone',
    description:
      'Write toward someone you have lost, and the things you never got to say.',
    starter:
      'There is someone I still think about who is not here anymore. I want to write about who they were, and the things I never said.',
  },
  {
    letter: 'B',
    title: 'A year that changed direction',
    description:
      'One stretch of time, before and after, when everything shifted.',
    starter:
      'There was a year when everything changed. Before it, my life looked one way. After it, nothing was quite the same.',
  },
  {
    letter: 'C',
    title: 'Something invented',
    description:
      'Start with a world, a character, or a premise that is not real yet.',
    starter:
      'I keep imagining a character I can picture clearly, in a world that does not exist yet. I am not sure what happens to them, but I want to find out.',
  },
];

function StepBreadcrumb({ step }: { step: Step }) {
  const labels: Array<{ key: Step | 'write'; label: string }> = [
    { key: 'idea', label: 'Idea' },
    { key: 'explore', label: 'Explore' },
    { key: 'shape', label: 'Shape' },
    { key: 'write', label: 'Write' },
  ];

  return (
    <p className='text-xs text-muted-foreground'>
      {labels.map((item, index) => (
        <span key={item.key}>
          <span
            className={
              item.key === step
                ? 'cn-font-heading text-primary'
                : undefined
            }
          >
            {item.label}
          </span>
          {index < labels.length - 1 ? ' · ' : null}
        </span>
      ))}
    </p>
  );
}

function TopBar({
  step,
  showBreadcrumb,
}: {
  step: Step;
  showBreadcrumb: boolean;
}) {
  return (
    <div className='flex items-center justify-between gap-4'>
      <div>
        <p className='cn-font-heading text-sm text-muted-foreground'>
          New story
        </p>
        {showBreadcrumb ? <StepBreadcrumb step={step} /> : null}
      </div>
      <div className='flex items-center gap-4'>
        {step === 'idea' ? (
          <p className='hidden text-xs text-muted-foreground sm:block'>
            Nothing is saved until you begin
          </p>
        ) : null}
        <Button
          variant='ghost'
          size='sm'
          nativeButton={false}
          render={<Link href='/dashboard' />}
        >
          Close
        </Button>
      </div>
    </div>
  );
}

export function NewStoryWizard() {
  const router = useRouter();

  const [step, setStep] = useState<Step>('idea');
  const [storyId, setStoryId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [topic, setTopic] = useState('');
  const [storyType, setStoryType] = useState<StoryType | null>(null);
  const [language, setLanguage] = useState<Language>(Language.ENGLISH);
  const [chapters, setChapters] = useState<string[]>(['Chapter 1']);
  const [isCreatingChapters, setIsCreatingChapters] = useState(false);

  const createStory = useMutation(orpc.story.create.mutationOptions());
  const suggestDirections = useMutation(
    orpc.ai.suggestDirections.mutationOptions(),
  );
  const updateStory = useMutation(orpc.story.update.mutationOptions());
  const createChapter = useMutation(orpc.chapter.create.mutationOptions());

  function fetchDirections() {
    suggestDirections.mutate(
      {
        notes,
        topic: topic.trim() || undefined,
        storyType: storyType ?? undefined,
      },
      {
        onError: (error) => {
          toast.error(error.message);
        },
      },
    );
  }

  function handleBegin() {
    if (!notes.trim()) {
      toast.error('Add a few notes before you begin, a line or two is enough.');
      return;
    }

    createStory.mutate(
      {
        title: 'Untitled story',
        notes,
        topic: topic.trim() || undefined,
        storyType: storyType ?? undefined,
        language,
      },
      {
        onSuccess: (story) => {
          setStoryId(story.id);
          setStep('explore');
          fetchDirections();
        },
        onError: (error) => {
          toast.error(error.message);
        },
      },
    );
  }

  function handleChooseDirection(direction: Direction) {
    if (storyId) {
      updateStory.mutate(
        {
          id: storyId,
          aiInstructions: direction.description,
          description: direction.title,
        },
        {
          onError: (error) => {
            toast.error(error.message);
          },
        },
      );
    }
    setStep('shape');
  }

  function handleSkipDirections() {
    setStep('shape');
  }

  function updateChapterTitle(index: number, value: string) {
    setChapters((prev) => prev.map((title, i) => (i === index ? value : title)));
  }

  function removeChapter(index: number) {
    setChapters((prev) => prev.filter((_, i) => i !== index));
  }

  function addChapter() {
    setChapters((prev) => [...prev, `Chapter ${prev.length + 1}`]);
  }

  async function handleStartWriting() {
    if (!storyId) return;

    setIsCreatingChapters(true);
    try {
      let firstChapterId: string | null = null;
      for (const title of chapters) {
        const chapter = await createChapter.mutateAsync({
          storyId,
          title: title.trim() || 'Untitled chapter',
        });
        if (!firstChapterId) {
          firstChapterId = chapter.id;
        }
      }

      if (firstChapterId) {
        router.push(
          `/stories/${storyId}/edit/chapters/${firstChapterId}` as Route,
        );
        return;
      }

      setIsCreatingChapters(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Could not create your chapters. Try again.',
      );
      setIsCreatingChapters(false);
    }
  }

  return (
    <main className='mx-auto w-full max-w-3xl px-6 py-12 sm:py-16'>
      <TopBar step={step} showBreadcrumb={step !== 'idea'} />

      {step === 'idea' ? (
        <div className='mt-10'>
          <p className='cn-font-heading text-xs uppercase tracking-[0.14em] text-primary'>
            Step one of four
          </p>
          <h1 className='mt-3 cn-font-heading text-4xl sm:text-5xl'>
            What is the story?
          </h1>
          <p className='mt-4 max-w-xl text-sm text-muted-foreground'>
            A memory, an idea, a few lines of notes. It does not need a
            title, an order, or a plan. Untold works from whatever you
            already have.
          </p>

          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder='grandpa house every summer. old tree behind the house. one summer I found something buried underneath it. never told anyone.'
            className='mt-8 min-h-[150px] text-sm'
          />

          <div className='mt-4 flex flex-col gap-3 sm:flex-row sm:items-center'>
            <span className='cn-font-heading text-xs uppercase tracking-[0.14em] text-muted-foreground'>
              All optional
            </span>
            <Select
              value={storyType}
              onValueChange={(value) => setStoryType(value)}
            >
              <SelectTrigger className='sm:w-52'>
                <SelectValue placeholder='Story type' />
              </SelectTrigger>
              <SelectContent>
                {Object.values(StoryType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {STORY_TYPE_LABEL[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder='Topic, e.g. Childhood'
              className='sm:max-w-56'
            />
            <Select
              value={language}
              onValueChange={(value) => setLanguage(value as Language)}
            >
              <SelectTrigger className='sm:w-44'>
                <SelectValue placeholder='Language' />
              </SelectTrigger>
              <SelectContent>
                {Object.values(Language).map((value) => (
                  <SelectItem key={value} value={value}>
                    {LANGUAGE_LABEL[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className='mt-8'>
            <Button
              onClick={handleBegin}
              disabled={createStory.isPending}
              size='lg'
            >
              {createStory.isPending ? 'Beginning…' : 'Begin'}
            </Button>
          </div>

          <div className='mt-14 border-t border-border pt-10'>
            <p className='text-xs text-muted-foreground'>
              Or start from a nudge
            </p>
            <div className='mt-4 flex flex-col'>
              {NUDGES.map((nudge) => (
                <button
                  key={nudge.letter}
                  type='button'
                  onClick={() => setNotes(nudge.starter)}
                  className='flex items-start gap-4 border-b border-border py-4 text-left transition-colors last:border-b-0 hover:bg-foreground/3'
                >
                  <span className='cn-font-heading text-3xl text-primary'>
                    {nudge.letter}
                  </span>
                  <span>
                    <span className='cn-font-heading block text-base'>
                      {nudge.title}
                    </span>
                    <span className='mt-1 block text-sm text-muted-foreground'>
                      {nudge.description}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {step === 'explore' ? (
        <div className='mt-10'>
          <div className='rounded-[4px] border border-border p-5'>
            <p className='cn-font-heading text-xs uppercase tracking-[0.14em] text-primary'>
              What you gave us
            </p>
            <p className='mt-3 whitespace-pre-wrap text-sm text-muted-foreground'>
              {notes}
            </p>
          </div>

          {suggestDirections.isPending ? (
            <div className='mt-10'>
              <p className='text-sm text-muted-foreground'>
                Reading your notes…
              </p>
              <div className='mt-6 grid gap-6 sm:grid-cols-3'>
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className='flex flex-col gap-4 rounded-[4px] border border-border p-6'
                  >
                    <Skeleton className='h-8 w-8' />
                    <Skeleton className='h-5 w-3/4' />
                    <Skeleton className='h-16 w-full' />
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {suggestDirections.isSuccess ? (
            <div className='mt-10'>
              <div className='flex items-center justify-between gap-4'>
                <div>
                  <p className='cn-font-heading text-xs uppercase tracking-[0.14em] text-primary'>
                    {suggestDirections.data.genre}
                  </p>
                  <h2 className='mt-2 cn-font-heading text-3xl'>
                    Three directions this could take
                  </h2>
                </div>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={fetchDirections}
                  disabled={suggestDirections.isPending}
                >
                  Regenerate
                </Button>
              </div>
              <p className='mt-3 max-w-xl text-sm text-muted-foreground'>
                {suggestDirections.data.premise}
              </p>

              <div className='mt-6 grid gap-6 sm:grid-cols-3'>
                {suggestDirections.data.directions.map((direction, index) => (
                  <div
                    key={direction.title}
                    className='flex flex-col gap-4 rounded-[4px] border border-border p-6'
                  >
                    <span className='cn-font-heading text-3xl text-primary'>
                      {String.fromCharCode(65 + index)}
                    </span>
                    <div>
                      <h3 className='cn-font-heading text-lg'>
                        {direction.title}
                      </h3>
                      <p className='mt-2 text-sm text-muted-foreground'>
                        {direction.description}
                      </p>
                    </div>
                    <Button
                      className='mt-auto'
                      variant={index === 0 ? 'default' : 'outline'}
                      onClick={() => handleChooseDirection(direction)}
                    >
                      Take this direction
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {suggestDirections.isError ? (
            <div className='mt-10 rounded-[4px] border border-border p-6'>
              <p className='cn-font-heading text-lg'>
                Untold can not suggest directions right now.
              </p>
              <p className='mt-2 text-sm text-muted-foreground'>
                You can still write your story without them.
              </p>
              <div className='mt-4 flex items-center gap-3'>
                <Button variant='outline' onClick={fetchDirections}>
                  Try again
                </Button>
                <Button variant='ghost' onClick={handleSkipDirections}>
                  Skip, let me just write
                </Button>
              </div>
            </div>
          ) : null}

          {!suggestDirections.isError ? (
            <div className='mt-8'>
              <Button variant='outline' onClick={handleSkipDirections}>
                Skip, let me just write
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}

      {step === 'shape' ? (
        <div className='mt-10'>
          <h1 className='cn-font-heading text-4xl'>The shape of it</h1>
          <p className='mt-3 max-w-xl text-sm text-muted-foreground'>
            A draft, not a contract. Rename, cut, merge or add your own, you
            can change all of it later.
          </p>

          <div className='mt-8 flex flex-col gap-3'>
            {chapters.map((title, index) => (
              <div
                key={`chapter-${index}`}
                className='flex items-center gap-3 rounded-[4px] border border-border p-3'
              >
                <span className='w-6 cn-font-heading text-sm text-muted-foreground'>
                  {String(index + 1).padStart(2, '0')}
                </span>
                <Input
                  value={title}
                  onChange={(e) => updateChapterTitle(index, e.target.value)}
                  disabled={isCreatingChapters}
                  className='flex-1'
                />
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={() => removeChapter(index)}
                  disabled={chapters.length === 1 || isCreatingChapters}
                >
                  Remove
                </Button>
              </div>
            ))}

            <button
              type='button'
              onClick={addChapter}
              disabled={isCreatingChapters}
              className='rounded-[4px] border border-dashed border-border p-3 text-left text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground disabled:pointer-events-none disabled:opacity-45'
            >
              + Add a chapter of my own
            </button>
          </div>

          <div className='mt-8'>
            <Button
              size='lg'
              onClick={handleStartWriting}
              disabled={
                isCreatingChapters || chapters.some((title) => !title.trim())
              }
            >
              {isCreatingChapters
                ? 'Creating chapters…'
                : 'Start writing chapter 1'}
            </Button>
          </div>
        </div>
      ) : null}
    </main>
  );
}
