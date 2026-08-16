import type { RouterClient } from '@orpc/server';

import { protectedProcedure, publicProcedure } from '../index';
import { aiRouter } from './ai';
import { chapterRouter } from './chapter';
import { commentRouter } from './comment';
import { noteRouter } from './note';
import { storyRouter } from './story';

export const appRouter = {
  healthCheck: publicProcedure.handler(() => {
    return 'OK';
  }),
  privateData: protectedProcedure.handler(({ context }) => {
    return {
      message: 'This is private',
      user: context.session?.user,
    };
  }),
  story: storyRouter,
  chapter: chapterRouter,
  comment: commentRouter,
  note: noteRouter,
  ai: aiRouter,
};
export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
