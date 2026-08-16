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
import { findOwnedStory } from './story';

function requireAiConfigured() {
  if (!isAiConfigured()) {
    throw new ORPCError('PRECONDITION_FAILED', {
      message: "AI isn't set up yet — add GEMINI_API_KEY to continue.",
    });
  }
}

async function loadStoryWithNotes(
  db: Context['db'],
  storyId: string,
  userId: string,
) {
  const story = await findOwnedStory(db, storyId, userId);
  const notes = await db.note.findMany({
    where: { storyId },
    orderBy: { order: 'asc' },
  });
  if (notes.length === 0) {
    throw new ORPCError('BAD_REQUEST', {
      message: 'Add a note first — Untold needs something to work with.',
    });
  }
  return { story, notes };
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
    .input(z.object({ storyId: z.string() }))
    .handler(async ({ input, context }) => {
      requireAiConfigured();
      const { story, notes } = await loadStoryWithNotes(
        context.db,
        input.storyId,
        context.session.user.id,
      );

      const draft = await generateStoryDraft({
        notes: notes.map((note) => note.content),
        title: story.title,
        topic: story.topic ?? undefined,
        aiInstructions: story.aiInstructions ?? undefined,
      });

      return { draft };
    }),

  createSynopsis: protectedProcedure
    .input(z.object({ storyId: z.string() }))
    .handler(async ({ input, context }) => {
      requireAiConfigured();
      const { story, notes } = await loadStoryWithNotes(
        context.db,
        input.storyId,
        context.session.user.id,
      );

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
