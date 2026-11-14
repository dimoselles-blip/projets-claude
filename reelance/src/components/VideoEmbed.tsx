import { ExternalLink, PlayCircle } from "lucide-react";

/** Transforme un lien YouTube / Vimeo / Google Drive en lecteur intégré ; sinon, affiche un lien. */
export function embedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = u.searchParams.get("v") ?? u.pathname.match(/\/(?:shorts|embed)\/([\w-]+)/)?.[1];
      return id ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    }
    if (host === "youtu.be") return `https://www.youtube-nocookie.com/embed/${u.pathname.slice(1)}`;
    if (host === "vimeo.com") {
      const id = u.pathname.match(/\/(\d+)/)?.[1];
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    if (host === "player.vimeo.com") return url;
    if (host === "drive.google.com") {
      const id = u.pathname.match(/\/file\/d\/([\w-]+)/)?.[1];
      return id ? `https://drive.google.com/file/d/${id}/preview` : null;
    }
  } catch {
    return null;
  }
  return null;
}

export function VideoEmbed({ url, title }: { url: string; title: string }) {
  const src = embedUrl(url);
  if (!src) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl bg-ink-900 text-white hover:bg-ink-800">
        <PlayCircle className="size-10 text-white/80" />
        <span className="inline-flex items-center gap-1 text-sm">
          Voir la vidéo <ExternalLink className="size-3.5" />
        </span>
      </a>
    );
  }
  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl bg-ink-900">
      <iframe src={src} title={title} loading="lazy" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen className="h-full w-full border-0" />
    </div>
  );
}
