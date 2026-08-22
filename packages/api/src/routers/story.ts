import { ORPCError } from '@orpc/server';
import { Language, StoryStatus, StoryType, Visibility } from '@untold/db';
import { z } from 'zod';

import type { Context } from '../context';
import { protectedProcedure, publicProcedure } from '../index';

// Anonymous readers get this many chapters in full; the rest are returned
// as locked previews (title + short excerpt, no full content) until they
// sign in. Keeps the "read some, then blur" gate enforced server-side
// rather than trusting the client to hide content it already received.
const FREE_CHAPTER_COUNT = 1;
const LOCKED_PREVIEW_LENGTH = 180;

// The public landing page surfaces titles to anonymous visitors with no
// human review step, so a minimal profanity filter blocks the worst titles
// from that specific feed. Real curation (editorial picks) should replace
// this later — this only guards against the landing page looking broken.
const BLOCKED_TITLE_PATTERN = /\b(fuck|shit|bitch|asshole|cunt)\b/i;

const storyTypeSchema = z.enum(
  Object.values(StoryType) as [StoryType, ...StoryType[]],
);
const visibilitySchema = z.enum(
  Object.values(Visibility) as [Visibility, ...Visibility[]],
);
const storyStatusSchema = z.enum(
  Object.values(StoryStatus) as [StoryStatus, ...StoryStatus[]],
);
const languageSchema = z.enum(
  Object.values(Language) as [Language, ...Language[]],
);

const storyFieldsSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  topic: z.string().trim().max(200).optional(),
  category: z.string().trim().max(200).optional(),
  storyType: storyTypeSchema.optional(),
  language: languageSchema.optional(),
  aiInstructions: z.string().max(5000).optional(),
  coverImage: z.string().url().optional(),
  tags: z.array(z.string().trim().max(50)).max(20).optional(),
  visibility: visibilitySchema.optional(),
});

// The first note a story is created with (the big "what's on your mind"
// textarea on /stories/new). Further notes are added one at a time through
// the `note` router once the story exists.
const createStoryInput = storyFieldsSchema.extend({
  notes: z.string().trim().max(20_000).optional(),
});

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

// A story is viewable by: its owner (any visibility), anyone when PUBLIC,
// or anyone with the id/link when LINK. PRIVATE is owner-only.
export async function findViewableStory(
  db: Context['db'],
  id: string,
  userId: string | undefined,
) {
  const story = await db.story.findUnique({ where: { id } });
  const isOwner = !!userId && story?.authorId === userId;
  if (!story || (story.visibility === Visibility.PRIVATE && !isOwner)) {
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
        include: {
          notes: { orderBy: { order: 'asc' } },
          chapters: { orderBy: { order: 'asc' } },
        },
      });
      if (!story || story.authorId !== context.session.user.id) {
        throw new ORPCError('NOT_FOUND', { message: 'Story not found' });
      }
      return story;
    }),

  create: protectedProcedure
    .input(createStoryInput)
    .handler(async ({ input, context }) => {
      const { notes, ...data } = input;
      return context.db.story.create({
        data: {
          ...data,
          authorId: context.session.user.id,
          notes: notes ? { create: [{ content: notes, order: 0 }] } : undefined,
        },
        include: { notes: { orderBy: { order: 'asc' } } },
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

  // Public "top stories" feed for the landing page — most-liked public
  // stories, newest first as a tiebreak.
  discover: publicProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(50).default(7),
        storyType: storyTypeSchema.optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const stories = await context.db.story.findMany({
        where: {
          visibility: Visibility.PUBLIC,
          storyType: input.storyType,
        },
        orderBy: [{ likes: { _count: 'desc' } }, { updatedAt: 'desc' }],
        take: input.limit * 3,
        include: {
          author: { select: { name: true } },
          _count: { select: { chapters: true, likes: true, comments: true } },
        },
      });

      const filtered = stories
        .filter((story) => !BLOCKED_TITLE_PATTERN.test(story.title))
        .slice(0, input.limit);

      return filtered.map((story) => ({
        id: story.id,
        title: story.title,
        description: story.description,
        coverImage: story.coverImage,
        storyType: story.storyType,
        author: story.author,
        chapterCount: story._count.chapters,
        likeCount: story._count.likes,
        commentCount: story._count.comments,
        updatedAt: story.updatedAt,
      }));
    }),

  // Public story reader. Anonymous visitors get the first FREE_CHAPTER_COUNT
  // chapters in full and locked previews for the rest; signed-in viewers who
  // can view the story (owner, or PUBLIC/LINK) get everything.
  getPublicById: publicProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const userId = context.session?.user.id;
      await findViewableStory(context.db, input.id, userId);

      const story = await context.db.story.findUniqueOrThrow({
        where: { id: input.id },
        include: {
          author: { select: { name: true } },
          chapters: { orderBy: { order: 'asc' } },
          _count: { select: { likes: true, comments: true } },
        },
      });

      const liked = userId
        ? (await context.db.like.findUnique({
            where: { userId_storyId: { userId, storyId: story.id } },
          })) !== null
        : false;

      const chapters = story.chapters.map((chapter, index) => {
        const unlocked = userId !== undefined || index < FREE_CHAPTER_COUNT;
        if (unlocked) {
          return { ...chapter, locked: false as const, preview: null };
        }
        return {
          id: chapter.id,
          storyId: chapter.storyId,
          title: chapter.title,
          order: chapter.order,
          createdAt: chapter.createdAt,
          updatedAt: chapter.updatedAt,
          content: null,
          locked: true as const,
          preview: chapter.content.slice(0, LOCKED_PREVIEW_LENGTH),
        };
      });

      return {
        id: story.id,
        title: story.title,
        description: story.description,
        coverImage: story.coverImage,
        storyType: story.storyType,
        visibility: story.visibility,
        author: story.author,
        likeCount: story._count.likes,
        commentCount: story._count.comments,
        liked,
        chapters,
      };
    }),

  toggleLike: protectedProcedure
    .input(z.object({ storyId: z.string() }))
    .handler(async ({ input, context }) => {
      const userId = context.session.user.id;
      await findViewableStory(context.db, input.storyId, userId);

      const existing = await context.db.like.findUnique({
        where: { userId_storyId: { userId, storyId: input.storyId } },
      });

      if (existing) {
        await context.db.like.delete({ where: { id: existing.id } });
      } else {
        await context.db.like.create({
          data: { userId, storyId: input.storyId },
        });
      }

      const likeCount = await context.db.like.count({
        where: { storyId: input.storyId },
      });

      return { liked: !existing, likeCount };
    }),
};
