import { notFound } from "next/navigation";

/** Any address under /en or /id that no page matches shows the website's 404 page (app/[lang]/not-found.tsx). */
export default function UnknownPage() {
  notFound();
}
