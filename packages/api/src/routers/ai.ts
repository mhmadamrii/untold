import { ORPCError } from '@orpc/server';
import {
  generateStoryDraft,
  generateSynopsis,
  isAiConfigured,
  suggestStoryDirections,
} from '@untold/ai';
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
      message: 'Add a note to this chapter first — Untold needs something to work with.',
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
      }),
    )
    .handler(async ({ input }) => {
      requireAiConfigured();
      return suggestStoryDirections(input);
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

      const draft = await generateStoryDraft({
        notes: notes.map((note) => note.content),
        title: chapter.story.title,
        topic: chapter.story.topic ?? undefined,
        aiInstructions: chapter.story.aiInstructions ?? undefined,
      });

      return { draft };
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
      });

      return context.db.story.update({
        where: { id: input.storyId },
        data: { description: synopsis },
      });
    }),
};
