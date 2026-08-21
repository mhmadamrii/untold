import { StoryReader } from './_components/story-reader';

export default async function StoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <StoryReader id={id} />;
}
