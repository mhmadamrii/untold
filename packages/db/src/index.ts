// Local Postgres (current): plain node-postgres driver over the regular
// Postgres wire protocol. Swap back to Neon below once we migrate to the
// hosted Neon database — the Neon serverless driver only speaks Neon's own
// proxy protocol and cannot connect to a local/plain Postgres instance
// (fails with "Network connection lost").
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from '@untold/env/server';

import { PrismaClient } from '../prisma/generated/client';

export function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString: env.DATABASE_URL,
    }),
  });
}

// --- Neon (cloud) ---
// Uncomment when migrating to the hosted Neon Postgres free tier, and
// comment out the local Postgres block above.
//
// import { neonConfig } from '@neondatabase/serverless';
// import { PrismaNeon } from '@prisma/adapter-neon';
// import { env } from '@untold/env/server';
//
// import { PrismaClient } from '../prisma/generated/client';
//
// neonConfig.poolQueryViaFetch = true;
//
// export function createPrismaClient(): PrismaClient {
//   return new PrismaClient({
//     adapter: new PrismaNeon({
//       connectionString: env.DATABASE_URL,
//     }),
//   });
// }

export type { Chapter, PrismaClient, Story } from '../prisma/generated/client';
export { StoryStatus, StoryType, Visibility } from '../prisma/generated/client';
