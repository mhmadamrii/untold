export default async function DiscoverByCategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  return <h1>Page for route /discover/categories/{category}</h1>;
}
