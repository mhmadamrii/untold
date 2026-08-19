import Image from 'next/image';

export default function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <main className='flex-1'>{children}</main>
      <footer className='border-t border-border'>
        <div className='mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 py-10 sm:flex-row sm:items-center'>
          <div>
            <p className='flex items-center gap-2 cn-font-heading text-lg'>
              <Image src='/logo.png' alt='' width={20} height={20} />
              Untold
            </p>
            <p className='mt-1 text-sm text-muted-foreground'>
              Everyone has a story. Not everyone knows how to tell it.
            </p>
          </div>
          <p className='text-sm text-muted-foreground'>
            &copy; {new Date().getFullYear()} Untold
          </p>
        </div>
      </footer>
    </>
  );
}
