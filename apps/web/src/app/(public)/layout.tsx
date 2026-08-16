export default function PublicLayout({children}: Readonly<{children: React.ReactNode}>) {
  return (
    <>
      <h1>Hello world from public layout</h1>
      {children}
    </>
  );
}
