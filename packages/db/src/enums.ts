// Browser/client-safe re-export. The main `@untold/db` entry pulls in
// `@prisma/adapter-pg` (which requires Node's `dns`) via createPrismaClient,
// so client components must import enums from here instead of the package
// root to avoid dragging server-only code into the client bundle.
export {
  Language,
  StoryStatus,
  StoryType,
  Visibility,
} from '../prisma/generated/enums';
