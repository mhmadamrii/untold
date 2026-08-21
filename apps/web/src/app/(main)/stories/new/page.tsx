import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { NewStoryWizard } from './_components/new-story-wizard';

export default async function NewStoryPage() {
  const session = await authClient.getSession({
    fetchOptions: {
      headers: await headers(),
      throw: true,
    },
  });

  if (!session?.user) {
    redirect('/login');
  }

  return <NewStoryWizard />;
}
