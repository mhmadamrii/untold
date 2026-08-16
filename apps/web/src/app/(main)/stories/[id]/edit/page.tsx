export default async function StoryWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <h1>Page for route /stories/{id}/edit</h1>;
}
