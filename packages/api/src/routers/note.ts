import { ORPCError } from '@orpc/server';
import { z } from 'zod';

import type { Context } from '../context';
import { protectedProcedure } from '../index';
import { findOwnedChapter } from './chapter';

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
        chapterId: z.string(),
        content: z.string().trim().min(1).max(20_000),
      }),
    )
    .handler(async ({ input, context }) => {
      await findOwnedChapter(
        context.db,
        input.chapterId,
        context.session.user.id,
      );

      const lastNote = await context.db.note.findFirst({
        where: { chapterId: input.chapterId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });

      return context.db.note.create({
        data: {
          chapterId: input.chapterId,
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
      await findOwnedChapter(
        context.db,
        note.chapterId,
        context.session.user.id,
      );
      return context.db.note.update({
        where: { id: input.id },
        data: { content: input.content },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const note = await findNoteOrThrow(context.db, input.id);
      await findOwnedChapter(
        context.db,
        note.chapterId,
        context.session.user.id,
      );
      await context.db.note.delete({ where: { id: input.id } });
      return { success: true };
    }),

  reorder: protectedProcedure
    .input(
      z.object({
        chapterId: z.string(),
        noteIds: z.array(z.string()).min(1),
      }),
    )
    .handler(async ({ input, context }) => {
      await findOwnedChapter(
        context.db,
        input.chapterId,
        context.session.user.id,
      );

      // noteIds comes straight from the client's drag-and-drop order, so
      // verify it's exactly this chapter's notes before writing — otherwise
      // a crafted id from another chapter could have its order overwritten.
      const existing = await context.db.note.findMany({
        where: { chapterId: input.chapterId },
        select: { id: true },
      });
      const existingIds = new Set(existing.map((note) => note.id));
      const isValidSet =
        input.noteIds.length === existingIds.size &&
        input.noteIds.every((id) => existingIds.has(id));
      if (!isValidSet) {
        throw new ORPCError('BAD_REQUEST', {
          message: "Note list doesn't match this chapter.",
        });
      }

      await context.db.$transaction(
        input.noteIds.map((id, index) =>
          context.db.note.update({ where: { id }, data: { order: index } }),
        ),
      );
      return { success: true };
    }),

  markUsed: protectedProcedure
    .input(
      z.object({
        chapterId: z.string(),
        noteIds: z.array(z.string()).min(1),
      }),
    )
    .handler(async ({ input, context }) => {
      await findOwnedChapter(
        context.db,
        input.chapterId,
        context.session.user.id,
      );

      // Verify noteIds belongs to this chapter before writing — same
      // ownership guard as reorder above.
      const existing = await context.db.note.findMany({
        where: { chapterId: input.chapterId },
        select: { id: true },
      });
      const existingIds = new Set(existing.map((note) => note.id));
      const isValidSet = input.noteIds.every((id) => existingIds.has(id));
      if (!isValidSet) {
        throw new ORPCError('BAD_REQUEST', {
          message: "Note list doesn't match this chapter.",
        });
      }

      await context.db.note.updateMany({
        where: { id: { in: input.noteIds } },
        data: { usedInDraft: true },
      });
      return { success: true };
    }),
};
