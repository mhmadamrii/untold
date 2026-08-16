import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { env } from '@untold/env/server';

import { PrismaClient } from '../prisma/generated/client';

neonConfig.poolQueryViaFetch = true;

export function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    adapter: new PrismaNeon({
      connectionString: env.DATABASE_URL,
    }),
  });
}

export type { Chapter, PrismaClient, Story } from '../prisma/generated/client';
export { StoryStatus, StoryType, Visibility } from '../prisma/generated/client';
