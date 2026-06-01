import { SiteChrome } from "@/components/site-chrome";

// Keep the public marketing and checkout routes inside the shared chrome without wrapping admin/auth routes.
export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <SiteChrome>{children}</SiteChrome>;
}
