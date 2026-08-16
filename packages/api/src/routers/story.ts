import { ORPCError } from '@orpc/server';
import { StoryStatus, StoryType, Visibility } from '@untold/db';
import { z } from 'zod';

import type { Context } from '../context';
import { protectedProcedure } from '../index';

const storyTypeSchema = z.enum(
  Object.values(StoryType) as [StoryType, ...StoryType[]],
);
const visibilitySchema = z.enum(
  Object.values(Visibility) as [Visibility, ...Visibility[]],
);
const storyStatusSchema = z.enum(
  Object.values(StoryStatus) as [StoryStatus, ...StoryStatus[]],
);

const storyFieldsSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  notes: z.string().max(20000).optional(),
  topic: z.string().trim().max(200).optional(),
  category: z.string().trim().max(200).optional(),
  storyType: storyTypeSchema.optional(),
  aiInstructions: z.string().max(5000).optional(),
  coverImage: z.string().url().optional(),
  tags: z.array(z.string().trim().max(50)).max(20).optional(),
  visibility: visibilitySchema.optional(),
});

const createStoryInput = storyFieldsSchema;

const updateStoryInput = storyFieldsSchema.partial().extend({
  id: z.string(),
  status: storyStatusSchema.optional(),
});

export async function findOwnedStory(
  db: Context['db'],
  id: string,
  userId: string,
) {
  const story = await db.story.findUnique({ where: { id } });
  if (!story || story.authorId !== userId) {
    throw new ORPCError('NOT_FOUND', { message: 'Story not found' });
  }
  return story;
}

export const storyRouter = {
  list: protectedProcedure.handler(async ({ context }) => {
    return context.db.story.findMany({
      where: { authorId: context.session.user.id },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { chapters: true } } },
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const story = await context.db.story.findUnique({
        where: { id: input.id },
        include: { chapters: { orderBy: { order: 'asc' } } },
      });
      if (!story || story.authorId !== context.session.user.id) {
        throw new ORPCError('NOT_FOUND', { message: 'Story not found' });
      }
      return story;
    }),

  create: protectedProcedure
    .input(createStoryInput)
    .handler(async ({ input, context }) => {
      return context.db.story.create({
        data: {
          ...input,
          authorId: context.session.user.id,
        },
      });
    }),

  update: protectedProcedure
    .input(updateStoryInput)
    .handler(async ({ input, context }) => {
      const { id, ...data } = input;
      await findOwnedStory(context.db, id, context.session.user.id);
      return context.db.story.update({ where: { id }, data });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      await findOwnedStory(context.db, input.id, context.session.user.id);
      await context.db.story.delete({ where: { id: input.id } });
      return { success: true };
    }),
};
