export default async function ChapterEditorPage({
  params,
}: {
  params: Promise<{ id: string; chapterId: string }>;
}) {
  const { id, chapterId } = await params;
  return (
    <h1>
      Page for route /stories/{id}/chapters/{chapterId}
    </h1>
  );
}
