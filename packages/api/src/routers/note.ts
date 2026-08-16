import { ORPCError } from '@orpc/server';
import { z } from 'zod';

import type { Context } from '../context';
import { protectedProcedure } from '../index';
import { findOwnedStory } from './story';

async function findNoteOrThrow(db: Context['db'], id: string) {
  const note = await db.note.findUnique({ where: { id } });
  if (!note) {
    throw new ORPCError('NOT_FOUND', { message: 'Note not found' });
  }
  return note;
}

export const noteRouter = {
  create: protectedProcedure
    .input(
      z.object({
        storyId: z.string(),
        content: z.string().trim().min(1).max(20_000),
      }),
    )
    .handler(async ({ input, context }) => {
      await findOwnedStory(context.db, input.storyId, context.session.user.id);

      const lastNote = await context.db.note.findFirst({
        where: { storyId: input.storyId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });

      return context.db.note.create({
        data: {
          storyId: input.storyId,
          content: input.content,
          order: (lastNote?.order ?? -1) + 1,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        content: z.string().trim().min(1).max(20_000),
      }),
    )
    .handler(async ({ input, context }) => {
      const note = await findNoteOrThrow(context.db, input.id);
      await findOwnedStory(context.db, note.storyId, context.session.user.id);
      return context.db.note.update({
        where: { id: input.id },
        data: { content: input.content },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const note = await findNoteOrThrow(context.db, input.id);
      await findOwnedStory(context.db, note.storyId, context.session.user.id);
      await context.db.note.delete({ where: { id: input.id } });
      return { success: true };
    }),
};
