import { ORPCError } from '@orpc/server';
import { z } from 'zod';

import type { Context } from '../context';
import { protectedProcedure } from '../index';
import { findOwnedStory } from './story';

const createChapterInput = z.object({
  storyId: z.string(),
  title: z.string().trim().min(1).max(200),
  content: z.string().max(200_000).optional(),
});

const updateChapterInput = z.object({
  id: z.string(),
  title: z.string().trim().min(1).max(200).optional(),
  content: z.string().max(200_000).optional(),
});

async function findChapterOrThrow(db: Context['db'], id: string) {
  const chapter = await db.chapter.findUnique({ where: { id } });
  if (!chapter) {
    throw new ORPCError('NOT_FOUND', { message: 'Chapter not found' });
  }
  return chapter;
}

// Used by the note and ai routers, whose ownership check needs to go
// through the parent story rather than the chapter itself.
export async function findOwnedChapter(
  db: Context['db'],
  chapterId: string,
  userId: string,
) {
  const chapter = await db.chapter.findUnique({
    where: { id: chapterId },
    include: { story: true },
  });
  if (!chapter || chapter.story.authorId !== userId) {
    throw new ORPCError('NOT_FOUND', { message: 'Chapter not found' });
  }
  return chapter;
}

export const chapterRouter = {
  list: protectedProcedure
    .input(z.object({ storyId: z.string() }))
    .handler(async ({ input, context }) => {
      await findOwnedStory(context.db, input.storyId, context.session.user.id);
      return context.db.chapter.findMany({
        where: { storyId: input.storyId },
        orderBy: { order: 'asc' },
      });
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const chapter = await findChapterOrThrow(context.db, input.id);
      await findOwnedStory(
        context.db,
        chapter.storyId,
        context.session.user.id,
      );
      return chapter;
    }),

  create: protectedProcedure
    .input(createChapterInput)
    .handler(async ({ input, context }) => {
      const { storyId, ...data } = input;
      await findOwnedStory(context.db, storyId, context.session.user.id);

      const lastChapter = await context.db.chapter.findFirst({
        where: { storyId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });

      return context.db.chapter.create({
        data: {
          ...data,
          storyId,
          order: (lastChapter?.order ?? -1) + 1,
        },
      });
    }),

  update: protectedProcedure
    .input(updateChapterInput)
    .handler(async ({ input, context }) => {
      const { id, ...data } = input;
      const chapter = await findChapterOrThrow(context.db, id);
      await findOwnedStory(
        context.db,
        chapter.storyId,
        context.session.user.id,
      );
      return context.db.chapter.update({ where: { id }, data });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const chapter = await findChapterOrThrow(context.db, input.id);
      await findOwnedStory(
        context.db,
        chapter.storyId,
        context.session.user.id,
      );
      await context.db.chapter.delete({ where: { id: input.id } });
      return { success: true };
    }),

  reorder: protectedProcedure
    .input(
      z.object({
        storyId: z.string(),
        orderedIds: z.array(z.string()).min(1),
      }),
    )
    .handler(async ({ input, context }) => {
      await findOwnedStory(context.db, input.storyId, context.session.user.id);

      const chapters = await context.db.chapter.findMany({
        where: { storyId: input.storyId },
        select: { id: true },
      });
      const chapterIds = new Set(chapters.map((chapter) => chapter.id));
      const isExactMatch =
        input.orderedIds.length === chapters.length &&
        input.orderedIds.every((id) => chapterIds.has(id));
      if (!isExactMatch) {
        throw new ORPCError('BAD_REQUEST', {
          message: 'orderedIds must exactly match the chapters of this story',
        });
      }

      await context.db.$transaction([
        // Move every chapter to a temporary negative order first so the
        // (storyId, order) unique constraint never collides mid-transaction.
        ...input.orderedIds.map((id, index) =>
          context.db.chapter.update({
            where: { id },
            data: { order: -(index + 1) },
          }),
        ),
        ...input.orderedIds.map((id, index) =>
          context.db.chapter.update({
            where: { id },
            data: { order: index },
          }),
        ),
      ]);

      return context.db.chapter.findMany({
        where: { storyId: input.storyId },
        orderBy: { order: 'asc' },
      });
    }),
};
