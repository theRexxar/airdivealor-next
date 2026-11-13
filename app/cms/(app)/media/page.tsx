"use client";

import { useState } from "react";
import { useCmsUser } from "@/components/cms/CmsUser";
import { MediaDetails, MediaLibrary, type MediaItem } from "@/components/cms/media";
import type { FolderTree } from "@/components/cms/media-folders";
import { PageHead } from "@/components/cms/Shell";
import { Forbidden } from "../Forbidden";

export default function MediaPage() {
  const { can } = useCmsUser();
  const [open, setOpen] = useState<MediaItem | null>(null);
  const [version, setVersion] = useState(0);
  const [tree, setTree] = useState<FolderTree | null>(null);
  if (!can("media.view")) return <Forbidden />;
  return (
    <>
      <PageHead
        title="Media library"
        sub="Photos and videos for the website, in folders. Uploads go straight to storage, then a background worker makes web-sized versions: WebP images in several sizes, and an MP4 with a poster for videos. Moving files between folders never changes their web addresses."
      />
      <div className="cms-card">
        <div className="cms-card__body">
          <MediaLibrary manage refresh={version} onTree={setTree} onPick={setOpen} />
        </div>
      </div>
      {open && (
        <MediaDetails
          m={open}
          tree={tree}
          onClose={() => setOpen(null)}
          onChanged={(m) => {
            setOpen(m);
            setVersion((v) => v + 1);
          }}
          onDeleted={() => {
            setOpen(null);
            setVersion((v) => v + 1);
          }}
        />
      )}
    </>
  );
}
