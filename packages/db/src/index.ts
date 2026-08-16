import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { env } from '@untold/env/server';

import { PrismaClient } from '../prisma/generated/client';

neonConfig.poolQueryViaFetch = true;

export function createPrismaClient() {
  return new PrismaClient({
    adapter: new PrismaNeon({
      connectionString: env.DATABASE_URL,
    }),
  });
}
