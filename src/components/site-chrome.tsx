"use client";

import { usePathname } from "next/navigation";

import { ScrollToTop } from "@/components/scroll-to-top";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

type SiteChromeProps = {
  children: React.ReactNode;
};

export function SiteChrome({ children }: SiteChromeProps) {
  const pathname = usePathname();
  const hidePublicChrome =
    pathname.startsWith("/admin") ||
    pathname.startsWith("/login");

  if (hidePublicChrome) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen">
      <ScrollToTop />
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}
