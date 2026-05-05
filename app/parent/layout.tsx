export const dynamic = "force-dynamic";

export default function ParentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
