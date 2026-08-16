/*
  THESIS: Prove the mechanism — notes become a chapter — before any claim is made.
  OWN-WORLD: warm paper/ink palette, one terracotta accent, hairline rules (no
    shadow-cards), Fraunces italic for display, Lora for reading passages,
    Plus Jakarta Sans for UI copy.
  STORY: a writer with an unfinished memory or idea sees Untold turn rough
    notes into a real chapter, sees AI propose (not decide) where it could go,
    and leaves knowing their story stays private until they say otherwise.
  FIRST VIEWPORT: headline + subhead on the left rail, a two-panel "notes →
    chapter" demonstration is the dominant visual, primary CTA below it.
  FORM: editorial/literary, own-world build (no dice roll — CLAUDE.md is
    itself a fully pinned brief for this product).
  FINISH: unreviewed and undocumented is unfinished; this build ends with the
    finish review, the verdict, DESIGN.md, and every shipping raster carrying
    its provenance.
*/

import { Button } from '@untold/ui/components/button';
import Link from 'next/link';
import { PopularStories } from '@/components/popular-stories';

export default function LandingPage() {
  return (
    <div className='px-6'>
      {/* Hero */}
      <section className='mx-auto grid max-w-6xl gap-12 py-20 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] md:items-center md:py-28'>
        <div>
          <h1 className='cn-font-heading text-4xl leading-[1.05] font-medium italic sm:text-5xl'>
            Everyone has a story. Not everyone knows how to tell it.
          </h1>
          <p className='mt-6 max-w-md text-base text-muted-foreground'>
            Untold helps you find the story inside your memories, ideas, and
            unfinished thoughts — then helps you write it. You stay the author.
            Untold is the companion, never the ghostwriter.
          </p>
          <div className='mt-8 flex items-center gap-5'>
            <Button
              size='lg'
              nativeButton={false}
              render={<Link href='/login' />}
            >
              Start your story
            </Button>
            <Link
              href='/login'
              className='text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline'
            >
              Already writing? Sign in
            </Link>
          </div>
        </div>

        <div className='animate-in fade-in slide-in-from-bottom-4 grid gap-px overflow-hidden bg-border ring-1 ring-border duration-700 sm:grid-cols-2'>
          <div className='bg-secondary p-6'>
            <p className='text-xs font-medium tracking-wide text-muted-foreground'>
              Your notes
            </p>
            <p className='mt-4 text-sm leading-relaxed text-muted-foreground'>
              grandpa's house every summer. old tree behind the house.
              <br />
              <br />
              one summer I found something buried underneath it.
              <br />
              <br />
              never told anyone. don't know why I'm thinking about it now
            </p>
          </div>
          <div className='bg-card p-6'>
            <p className='text-xs font-medium tracking-wide text-muted-foreground'>
              Chapter One
            </p>
            <p className='cn-font-heading mt-2 text-lg italic'>
              The House Behind the Hill
            </p>
            <p className='cn-font-reading mt-4 text-sm leading-relaxed'>
              Every summer, my grandfather's house smelled like cut grass and
              diesel from the mower he refused to replace. The tree behind it
              had been there longer than any of us — taller than the roof, wider
              than the porch. I was nine the summer I found what was buried
              beneath its roots, though it would take another twenty years
              before I understood what it meant.
            </p>
          </div>
          <p className='col-span-full bg-background px-6 py-3 text-xs text-muted-foreground'>
            Illustrative example — not a real Untold story.
          </p>
        </div>
      </section>

      <div className='mx-auto h-px max-w-6xl bg-border' />

      {/* Direction */}
      <section className='mx-auto max-w-6xl py-20 md:py-28'>
        <div className='grid gap-10 md:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]'>
          <div>
            <h2 className='cn-font-heading text-3xl italic'>
              Untold proposes. You decide.
            </h2>
            <p className='mt-4 max-w-sm text-sm text-muted-foreground'>
              When your story could go more than one way, Untold won't pick for
              you. It shows you what it could become, and you choose the
              direction that feels true.
            </p>
          </div>

          <div className='divide-y divide-border border-y border-border'>
            {[
              {
                letter: 'A',
                title: 'The Family Secret',
                body: 'The discovery reveals something your grandfather never told anyone.',
              },
              {
                letter: 'B',
                title: 'A Childhood Adventure',
                body: 'The discovery begins an adventure that changes how you remember your childhood.',
              },
              {
                letter: 'C',
                title: 'Keep It Real',
                body: 'Build this around the emotions and memories you actually experienced.',
              },
            ].map((direction) => (
              <div key={direction.letter} className='flex gap-5 py-6'>
                <span className='cn-font-heading text-2xl text-primary italic'>
                  {direction.letter}
                </span>
                <div>
                  <p className='font-medium'>{direction.title}</p>
                  <p className='mt-1 text-sm text-muted-foreground'>
                    {direction.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className='mx-auto h-px max-w-6xl bg-border' />

      {/* Popular stories */}
      <section className='mx-auto max-w-6xl py-20 md:py-28'>
        <h2 className='cn-font-heading text-3xl italic'>
          Stories people are reading.
        </h2>
        <p className='mt-4 max-w-sm text-sm text-muted-foreground'>
          Shared publicly by other writers. Read freely — sign in to keep
          reading the rest, like a story, or leave a comment.
        </p>
        <div className='mt-10'>
          <PopularStories />
        </div>
      </section>

      <div className='mx-auto h-px max-w-6xl bg-border' />

      {/* Continuation */}
      <section className='mx-auto max-w-6xl py-20 md:py-28'>
        <div className='grid gap-10 md:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] md:items-center'>
          <div className='order-2 bg-card p-8 ring-1 ring-border md:order-1'>
            <p className='text-xs font-medium tracking-wide text-muted-foreground'>
              Chapter Four
            </p>
            <p className='cn-font-reading mt-4 text-sm leading-relaxed'>
              She never mentioned the letter again, but I kept it folded in the
              same drawer where I found it, and every summer after that felt a
              little different.
            </p>
            <p className='cn-font-heading mt-6 text-lg italic'>
              To be continued&hellip;
            </p>
            <Button variant='outline' className='mt-4'>
              Continue it
            </Button>
          </div>
          <div className='order-1 md:order-2'>
            <h2 className='cn-font-heading text-3xl italic'>
              Your story keeps growing.
            </h2>
            <p className='mt-4 max-w-sm text-sm text-muted-foreground'>
              Stories aren't finished in one sitting. Untold remembers what
              happened, so when you come back — a day, a week, a season later —
              it picks up where you left off.
            </p>
          </div>
        </div>
      </section>

      <div className='mx-auto h-px max-w-6xl bg-border' />

      {/* Closing */}
      <section className='mx-auto max-w-6xl py-20 text-center md:py-28'>
        <h2 className='cn-font-heading mx-auto max-w-2xl text-3xl italic sm:text-4xl'>
          Private, until you decide otherwise.
        </h2>
        <p className='mx-auto mt-4 max-w-md text-sm text-muted-foreground'>
          Every story starts private. You choose if, when, and how it's shared —
          with one person, with a link, or with the world.
        </p>
        <div className='mt-8 flex justify-center'>
          <Button
            size='lg'
            nativeButton={false}
            render={<Link href='/login' />}
          >
            Start your story
          </Button>
        </div>
      </section>
    </div>
  );
}
