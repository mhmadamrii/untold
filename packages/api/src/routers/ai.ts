import { ORPCError } from '@orpc/server';
import {
  generateStoryDraft,
  generateSynopsis,
  isAiConfigured,
  suggestStoryDirections,
} from '@untold/ai';
import { Language } from '@untold/db';
import { z } from 'zod';

import type { Context } from '../context';
import { protectedProcedure } from '../index';
import { findOwnedChapter } from './chapter';
import { findOwnedStory } from './story';

function requireAiConfigured() {
  if (!isAiConfigured()) {
    throw new ORPCError('PRECONDITION_FAILED', {
      message: "AI isn't set up yet — add GEMINI_API_KEY to continue.",
    });
  }
}

const LANGUAGE_NAME: Record<Language, string> = {
  [Language.ENGLISH]: 'English',
  [Language.INDONESIAN]: 'Indonesian',
};

// Keeps chapter generation aware of what already happened in the story —
// without this, each chapter is written in isolation and reads like a
// different story. Capped and biased toward the most recent chapters so
// long stories don't blow up the prompt.
const STORY_SO_FAR_CHAR_BUDGET = 6000;

function buildStorySoFar(
  priorChapters: { title: string; content: string }[],
): string | undefined {
  const withText = priorChapters.filter(
    (chapter) => chapter.content.trim().length > 0,
  );
  if (withText.length === 0) {
    return undefined;
  }

  const sections: string[] = [];
  let used = 0;
  for (let i = withText.length - 1; i >= 0; i--) {
    const chapter = withText[i] as { title: string; content: string };
    const section = `${chapter.title}:\n${chapter.content.trim()}`;
    if (used + section.length > STORY_SO_FAR_CHAR_BUDGET && sections.length > 0) {
      break;
    }
    sections.unshift(section);
    used += section.length;
  }
  return sections.join('\n\n');
}

async function loadChapterWithNotes(
  db: Context['db'],
  chapterId: string,
  userId: string,
) {
  const chapter = await findOwnedChapter(db, chapterId, userId);
  const notes = await db.note.findMany({
    where: { chapterId },
    orderBy: { order: 'asc' },
  });
  if (notes.length === 0) {
    throw new ORPCError('BAD_REQUEST', {
      message:
        'Add a note to this chapter first — Untold needs something to work with.',
    });
  }
  return { chapter, notes };
}

export const aiRouter = {
  suggestDirections: protectedProcedure
    .input(
      z.object({
        notes: z.string().trim().min(1).max(20_000),
        topic: z.string().trim().max(200).optional(),
        storyType: z.string().max(50).optional(),
        language: z
          .enum(Object.values(Language) as [Language, ...Language[]])
          .optional(),
      }),
    )
    .handler(async ({ input }) => {
      requireAiConfigured();
      const { language, ...rest } = input;
      return suggestStoryDirections({
        ...rest,
        language: language ? LANGUAGE_NAME[language] : undefined,
      });
    }),

  generateDraft: protectedProcedure
    .input(z.object({ chapterId: z.string() }))
    .handler(async ({ input, context }) => {
      requireAiConfigured();
      const { chapter, notes } = await loadChapterWithNotes(
        context.db,
        input.chapterId,
        context.session.user.id,
      );

      // Once the chapter already has writing, only the notes not yet folded
      // in should drive the next generation — otherwise every regenerate
      // rewrites the chapter from scratch instead of continuing it.
      const hasExistingContent = chapter.content.trim().length > 0;
      const relevantNotes = hasExistingContent
        ? notes.filter((note) => !note.usedInDraft)
        : notes;

      if (hasExistingContent && relevantNotes.length === 0) {
        throw new ORPCError('BAD_REQUEST', {
          message: 'All your notes are already part of this chapter.',
        });
      }

      const priorChapters = await context.db.chapter.findMany({
        where: { storyId: chapter.storyId, order: { lt: chapter.order } },
        orderBy: { order: 'asc' },
        select: { title: true, content: true },
      });

      const draft = await generateStoryDraft({
        notes: relevantNotes.map((note) => note.content),
        title: chapter.story.title,
        topic: chapter.story.topic ?? undefined,
        aiInstructions: chapter.story.aiInstructions ?? undefined,
        language: LANGUAGE_NAME[chapter.story.language],
        existingContent: hasExistingContent ? chapter.content : undefined,
        storySoFar: buildStorySoFar(priorChapters),
      });

      return { draft, noteIds: relevantNotes.map((note) => note.id) };
    }),

  // Not wired up in the UI yet. Notes now live per-chapter, so a
  // whole-story synopsis pools notes across every chapter instead of a
  // single story-level list.
  createSynopsis: protectedProcedure
    .input(z.object({ storyId: z.string() }))
    .handler(async ({ input, context }) => {
      requireAiConfigured();
      const story = await findOwnedStory(
        context.db,
        input.storyId,
        context.session.user.id,
      );
      const chapters = await context.db.chapter.findMany({
        where: { storyId: input.storyId },
        orderBy: { order: 'asc' },
        include: { notes: { orderBy: { order: 'asc' } } },
      });
      const notes = chapters.flatMap((chapter) => chapter.notes);
      if (notes.length === 0) {
        throw new ORPCError('BAD_REQUEST', {
          message: 'Add a note first — Untold needs something to work with.',
        });
      }

      const synopsis = await generateSynopsis({
        notes: notes.map((note) => note.content),
        title: story.title,
        topic: story.topic ?? undefined,
        language: LANGUAGE_NAME[story.language],
      });

      return context.db.story.update({
        where: { id: input.storyId },
        data: { description: synopsis },
      });
    }),
};
