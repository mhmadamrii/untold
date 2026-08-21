import { Button } from '@untold/ui/components/button';
import Link from 'next/link';
import { PopularStories } from '@/components/popular-stories';

export default function LandingPage() {
  return (
    <div className='px-6'>
      <section className='mx-auto grid max-w-6xl gap-12 py-20 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-center md:py-28'>
        <div>
          <p className='cn-font-heading text-xs uppercase tracking-[0.14em] text-primary'>
            A home for the stories people carry
          </p>
          <h1 className='cn-font-heading mt-3 text-4xl leading-[1.05] font-semibold sm:text-5xl'>
            Everyone has an untold story.
          </h1>
          <p className='mt-6 max-w-md text-base text-muted-foreground'>
            Read memoirs, family histories and fiction written by people who
            finally sat down and told it. Then, if you have one of your own,
            Untold helps you shape a pile of notes and half-memories into
            chapters someone can read.
          </p>
          <div className='mt-8 flex flex-wrap items-center gap-4'>
            <Button size='lg' nativeButton={false} render={<Link href='/discover' />}>
              Read stories
            </Button>
            <Button
              size='lg'
              variant='outline'
              nativeButton={false}
              render={<Link href='/login' />}
            >
              Write your own story
            </Button>
          </div>
          <p className='mt-4 text-sm text-muted-foreground'>
            Free to read. Free to start writing.
          </p>
        </div>

        <figure>
          <div className='cn-plate aspect-[4/5] bg-secondary grid place-items-center'>
            <span className='text-xs uppercase tracking-widest text-muted-foreground'>
              Placeholder Image
            </span>
          </div>
          <figcaption className='cn-font-reading mt-3 text-sm text-muted-foreground italic'>
            A reader's desk, warm daylight.
          </figcaption>
        </figure>
      </section>

      <div className='mx-auto h-px max-w-6xl bg-border' />

      <section className='mx-auto max-w-6xl py-20 md:py-28'>
        <h2 className='cn-font-heading text-3xl'>
          Read first. Write when you're ready.
        </h2>
        <p className='mt-4 max-w-md text-sm text-muted-foreground'>
          You don't need a finished idea, or even a good one. Bring what you
          have, and see what it could become before you commit to writing a
          word of it.
        </p>

        <div className='mt-12 grid divide-y divide-border border-y border-border md:grid-cols-3 md:divide-x md:divide-y-0 md:border-x'>
          {[
            {
              number: '01',
              title: 'Bring the rough version',
              body: 'A memory, a bullet list, a voice note transcript, a single sentence that has been on your mind. Nothing needs to be polished to start.',
            },
            {
              number: '02',
              title: 'See what it could become',
              body: 'Untold reads what you have and proposes a few honest directions — it never decides for you, and it never invents facts about your life.',
            },
            {
              number: '03',
              title: 'Write it, chapter by chapter',
              body: 'Pick a direction, write the first chapter, and come back to continue whenever the next part of the story is ready to be told.',
            },
          ].map((step) => (
            <div key={step.number} className='p-8 first:pt-0 md:first:pl-0 md:last:pr-0'>
              <p className='cn-font-heading text-xs uppercase tracking-[0.14em] text-primary'>
                {step.number}
              </p>
              <p className='cn-font-heading mt-3 text-lg'>{step.title}</p>
              <p className='mt-2 text-sm text-muted-foreground'>{step.body}</p>
            </div>
          ))}
        </div>
      </section>

      <div className='border-y border-border bg-secondary'>
        <section className='mx-auto max-w-6xl px-6 py-20 md:py-28'>
          <div className='flex flex-wrap items-end justify-between gap-4'>
            <h2 className='cn-font-heading text-3xl'>
              From the library this week
            </h2>
            <Button
              variant='outline'
              nativeButton={false}
              render={<Link href='/discover' />}
            >
              See all stories
            </Button>
          </div>
          <div className='mt-10'>
            <PopularStories />
          </div>
        </section>
      </div>

      <section className='mx-auto max-w-6xl py-20 md:py-28'>
        <div className='grid gap-12 md:grid-cols-2 md:items-center'>
          <div className='cn-plate aspect-[4/5] bg-secondary grid place-items-center'>
            <span className='text-xs uppercase tracking-widest text-muted-foreground'>
              Placeholder Image
            </span>
          </div>
          <div>
            <p className='cn-font-heading text-xs uppercase tracking-[0.14em] text-primary'>
              For writers
            </p>
            <h2 className='cn-font-heading mt-3 text-3xl'>
              You are the author. Always.
            </h2>
            <p className='mt-4 max-w-md text-sm text-muted-foreground'>
              Untold never publishes on your behalf and never writes over your
              own words. It helps you find the story inside what you already
              remember, suggests directions, and gets you unstuck — the rest
              stays yours. Every story stays private until you decide it's
              ready to be shared.
            </p>
            <div className='mt-6'>
              <Button nativeButton={false} render={<Link href='/login' />}>
                Write your own story
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className='mx-auto h-px max-w-6xl bg-border' />

      <section className='mx-auto max-w-6xl py-20 text-center md:py-28'>
        <h2 className='cn-font-heading mx-auto max-w-2xl text-3xl sm:text-4xl'>
          Private, until you decide otherwise.
        </h2>
        <p className='mx-auto mt-4 max-w-md text-sm text-muted-foreground'>
          Every story starts private. You choose if, when, and how it's
          shared — with one person, with a link, or with the world.
        </p>
        <div className='mt-8 flex justify-center'>
          <Button size='lg' nativeButton={false} render={<Link href='/login' />}>
            Start your story
          </Button>
        </div>
      </section>
    </div>
  );
}
