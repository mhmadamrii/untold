import path from 'node:path';

import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

import { PrismaClient, Visibility } from '../prisma/generated-node/client';

// createPrismaClient() (./index.ts) reads DATABASE_URL from
// @untold/env/server, which only resolves inside the Cloudflare Workers
// runtime (`cloudflare:workers` binding). This script runs under plain
// Bun/Node, so it loads the same apps/server/.env file prisma.config.ts
// uses and builds its own client instead.
dotenv.config({ path: path.join(__dirname, '../../../apps/server/.env') });

const STORY_COUNT = 15;

const LOREM_IPSUM = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`;

async function main() {
  const db = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

  // Story.authorId is a required FK to User, and users only exist once
  // someone has signed in through better-auth — so seeding picks up
  // whoever signed in first rather than fabricating a fake user.
  const author = await db.user.findFirst({ orderBy: { createdAt: 'asc' } });
  if (!author) {
    throw new Error(
      'No user found. Sign in to the app once, then re-run the seed.',
    );
  }

  for (let i = 1; i <= STORY_COUNT; i++) {
    await db.story.create({
      data: {
        authorId: author.id,
        title: `Dummy Story ${i}`,
        visibility: Visibility.PUBLIC,
        chapters: {
          create: [{ title: 'Chapter 1', content: LOREM_IPSUM, order: 1 }],
        },
      },
    });
  }

  console.log(`Seeded ${STORY_COUNT} dummy stories for ${author.email}.`);
  await db.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
