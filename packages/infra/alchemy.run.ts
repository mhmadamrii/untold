import * as Alchemy from 'alchemy';
import * as Cloudflare from 'alchemy/Cloudflare';
import { config } from 'dotenv';
import * as Config from 'effect/Config';
import * as Effect from 'effect/Effect';

config({ path: './.env' });
config({ path: '../../apps/web/.env' });
config({ path: '../../apps/server/.env' });

export const server = Cloudflare.Worker('server', {
  main: '../../apps/server/src/index.ts',
  compatibility: {
    flags: ['nodejs_compat'],
  },
  env: {
    DATABASE_URL: Config.redacted('DATABASE_URL'),
    CORS_ORIGIN: Config.string('CORS_ORIGIN'),
    BETTER_AUTH_SECRET: Config.redacted('BETTER_AUTH_SECRET'),
    BETTER_AUTH_URL: Cloudflare.Worker.URL,
    // Optional until the Gemini key is added to apps/server/.env — defaults
    // to empty rather than failing stack startup when absent.
    GEMINI_API_KEY: Config.string('GEMINI_API_KEY').pipe(
      Config.withDefault(''),
    ),
  },
  dev: {
    port: 3000,
  },
});

export type ServerEnv = Cloudflare.InferEnv<typeof server>;

export default Alchemy.Stack(
  'untold',
  {
    providers: Cloudflare.providers(),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    const serverWorker = yield* server;
    const webWorker = yield* Cloudflare.Website.StaticSite('web', {
      cwd: '../../apps/web',
      command: 'bun run build:cloudflare',
      // Rebuild shared workspace dependencies until Alchemy has a workspace-aware default memo.
      memo: false,
      outdir: '.open-next/assets',
      main: '../../apps/web/.open-next/worker.js',
      bundle: false,
      compatibility: {
        flags: ['nodejs_compat', 'global_fetch_strictly_public'],
      },
      env: {
        IMAGES: Cloudflare.Images.Images(),
        NEXT_PUBLIC_SERVER_URL: serverWorker.url.as<string>(),
      },
      dev: {
        command: 'bun run dev:bare',
        url: 'http://localhost:3001',
      },
    });

    return {
      web: webWorker.url,
      server: serverWorker.url,
    };
  }),
);
