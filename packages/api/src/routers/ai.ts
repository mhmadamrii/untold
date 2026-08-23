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

      const draft = await generateStoryDraft({
        notes: relevantNotes.map((note) => note.content),
        title: chapter.story.title,
        topic: chapter.story.topic ?? undefined,
        aiInstructions: chapter.story.aiInstructions ?? undefined,
        language: LANGUAGE_NAME[chapter.story.language],
        existingContent: hasExistingContent ? chapter.content : undefined,
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
