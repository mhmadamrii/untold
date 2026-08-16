import { ORPCError } from '@orpc/server';
import { z } from 'zod';

import { protectedProcedure, publicProcedure } from '../index';
import { findViewableStory } from './story';

export const commentRouter = {
  list: publicProcedure
    .input(z.object({ storyId: z.string() }))
    .handler(async ({ input, context }) => {
      await findViewableStory(
        context.db,
        input.storyId,
        context.session?.user.id,
      );
      return context.db.comment.findMany({
        where: { storyId: input.storyId },
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { name: true, image: true } } },
      });
    }),

  create: protectedProcedure
    .input(
      z.object({
        storyId: z.string(),
        content: z.string().trim().min(1).max(2000),
      }),
    )
    .handler(async ({ input, context }) => {
      await findViewableStory(
        context.db,
        input.storyId,
        context.session.user.id,
      );
      return context.db.comment.create({
        data: {
          storyId: input.storyId,
          userId: context.session.user.id,
          content: input.content,
        },
        include: { user: { select: { name: true, image: true } } },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const comment = await context.db.comment.findUnique({
        where: { id: input.id },
      });
      if (!comment || comment.userId !== context.session.user.id) {
        throw new ORPCError('NOT_FOUND', { message: 'Comment not found' });
      }
      await context.db.comment.delete({ where: { id: input.id } });
      return { success: true };
    }),
};
