export default async function DiscoverByTypePage({
  params,
}: {
  params: Promise<{ type: string }>;
}) {
  const { type } = await params;
  return <h1>Page for route /discover/types/{type}</h1>;
}
