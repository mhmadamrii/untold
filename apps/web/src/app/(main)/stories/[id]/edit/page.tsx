import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { StoryOverview } from './_components/story-overview';

export default async function StoryWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
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

  const { id } = await params;

  return <StoryOverview storyId={id} />;
}
