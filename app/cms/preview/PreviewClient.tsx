"use client";

import { useEffect, useState } from "react";
import type { PublishedAbout } from "@/lib/cms/about-types";
import type { PublishedBlog, PublishedPost } from "@/lib/cms/blog-cms-types";
import type { PublishedCourse, PublishedCourses } from "@/lib/cms/courses-types";
import type { PublishedDiveSites, PublishedSite } from "@/lib/cms/dive-sites-types";
import type { PublishedFacilities } from "@/lib/cms/facilities-types";
import type { PublishedHome } from "@/lib/cms/home-types";
import { HomeView } from "../../[lang]/_home/HomeView";
import { AboutView } from "../../[lang]/about-us/AboutView";
import { PostView } from "../../[lang]/blog/[slug]/PostView";
import { BlogIndex } from "../../[lang]/blog/BlogIndex";
import { CourseDetailView } from "../../[lang]/dive-courses/[id]/CourseDetailView";
import { CoursesView } from "../../[lang]/dive-courses/CoursesView";
import { SiteGuideView } from "../../[lang]/dive-sites/[slug]/SiteGuideView";
import { SitesView } from "../../[lang]/dive-sites/SitesView";
import { FacilitiesView } from "../../[lang]/facilities-and-rates/FacilitiesView";

/** Loads draft content from the CMS API and renders it with the website's own components, under a preview banner. */
export function PreviewClient({ kind, collection, slug, anchors, back }: { kind: "page" | "item"; collection?: string; slug: string; anchors: Record<string, string>; back: string }) {
  const [data, setData] = useState<unknown>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const url = kind === "page" ? `/api/cms/pages/${slug}/preview` : `/api/cms/collections/${collection}/${slug}/preview`;
    fetch(url, { credentials: "same-origin" })
      .then(async (r) => (r.ok ? setData(await r.json()) : setError((await r.json()).error ?? "Could not load the preview.")))
      .catch(() => setError("Could not load the preview."));
  }, [kind, collection, slug]);
  useEffect(() => {
    if (!data || !location.hash) return;
    const id = anchors[location.hash.slice(1)];
    if (id) setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), slug === "home" ? 2000 : 300);
  }, [data, anchors, slug]);

  let view = null;
  if (data && kind === "item" && collection === "sites") view = <SiteGuideView data={data as PublishedSite} />;
  else if (data && kind === "item" && collection === "posts") view = <PostView data={data as PublishedPost} />;
  else if (data && kind === "item" && collection === "courses") view = <CourseDetailView data={data as PublishedCourse} />;
  else if (data && kind === "page" && slug === "home") view = <HomeView data={data as PublishedHome} />;
  else if (data && kind === "page" && slug === "dive-sites") view = <SitesView data={data as PublishedDiveSites} />;
  else if (data && kind === "page" && slug === "dive-courses") view = <CoursesView data={data as PublishedCourses} />;
  else if (data && kind === "page" && slug === "blog") view = <BlogIndex data={data as PublishedBlog} />;
  else if (data && kind === "page" && slug === "about-us") view = <AboutView data={data as PublishedAbout} />;
  else if (data && kind === "page" && slug === "facilities") view = <FacilitiesView data={data as PublishedFacilities} />;

  return (
    <>
      <div style={{ position: "fixed", left: "50%", bottom: 16, transform: "translateX(-50%)", zIndex: 900, background: "#ffbe18", color: "#202020", padding: "10px 16px", borderRadius: 999, font: "600 13px/1 Inter, sans-serif", boxShadow: "0 10px 15px #0003", whiteSpace: "nowrap" }}>
        Preview: unpublished drafts · <a href={back} style={{ color: "#202020" }}>Back to the CMS</a>
      </div>
      {error ? <p style={{ padding: 40 }}>{error}</p> : view ?? <p style={{ padding: 40 }}>Loading preview…</p>}
    </>
  );
}
