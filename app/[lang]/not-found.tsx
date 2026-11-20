import type { Metadata } from "next";
import { NotFoundView } from "./_404/NotFoundView";

export const metadata: Metadata = { title: "Page not found | Air Dive Alor", robots: { index: false, follow: true } };

/** 404 for every website address that doesn't exist (/en/..., /id/...), with the site's header and footer. */
export default function NotFound() {
  return <NotFoundView />;
}
