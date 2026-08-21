import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { ChapterEditor } from './_components/chapter-editor';

export default async function ChapterEditorPage({
  params,
}: {
  params: Promise<{ id: string; chapterId: string }>;
}) {
  const session = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
      throw: true,
    },
  });

  if (!session?.user) {
    redirect('/login');
  }

  const { id, chapterId } = await params;

  return <ChapterEditor storyId={id} chapterId={chapterId} />;
}
