"use client";

import { useRef, useState } from "react";
import { ImageUp, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Upload d'image direct vers Cloudinary (signature fournie par /api/uploads/signature).
 * Si Cloudinary n'est pas configuré, on peut coller l'URL d'une image hébergée ailleurs.
 */
export function ImageUpload({
  name,
  defaultValue,
  folder,
  label = "Choisir une image",
  shape = "rect",
}: {
  name: string;
  defaultValue?: string | null;
  folder: "avatars" | "covers" | "logos" | "thumbnails";
  label?: string;
  shape?: "rect" | "round";
}) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setError(null);
    if (file.size > 8 * 1024 * 1024) return setError("Image trop lourde (8 Mo maximum).");
    setBusy(true);
    try {
      const sig = await fetch(`/api/uploads/signature?dossier=${folder}`, { method: "POST" });
      if (sig.status === 501) {
        setManual(true);
        throw new Error("L'upload n'est pas encore configuré : collez le lien d'une image.");
      }
      if (!sig.ok) throw new Error("Upload impossible pour le moment.");
      const s = (await sig.json()) as { cloudName: string; apiKey: string; folder: string; timestamp: number; signature: string };
      const body = new FormData();
      body.append("file", file);
      body.append("api_key", s.apiKey);
      body.append("timestamp", String(s.timestamp));
      body.append("signature", s.signature);
      body.append("folder", s.folder);
      const res = await fetch(`https://api.cloudinary.com/v1_1/${s.cloudName}/image/upload`, { method: "POST", body });
      const json = (await res.json()) as { secure_url?: string; error?: { message: string } };
      if (!res.ok || !json.secure_url) throw new Error(json.error?.message ?? "Échec de l'upload.");
      setUrl(json.secure_url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Échec de l'upload.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <input type="hidden" name={name} value={url} />
      <div className="flex items-center gap-4">
        <div className={cn("relative grid shrink-0 place-items-center overflow-hidden border border-ink-200 bg-ink-50", shape === "round" ? "size-20 rounded-full" : "aspect-video w-40 rounded-xl")}>
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={url} alt="" className="h-full w-full object-cover" />
          ) : (
            <ImageUp className="size-6 text-ink-300" />
          )}
          {busy && (
            <div className="absolute inset-0 grid place-items-center bg-white/70">
              <Loader2 className="size-5 animate-spin text-brand-600" />
            </div>
          )}
        </div>
        <div className="flex flex-col items-start gap-1.5">
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className="rounded-lg border border-ink-200 px-3 py-1.5 text-sm font-medium hover:bg-ink-50">
            {label}
          </button>
          <div className="flex gap-3 text-xs">
            <button type="button" onClick={() => setManual((v) => !v)} className="text-ink-500 underline-offset-2 hover:underline">
              ou coller un lien
            </button>
            {url && (
              <button type="button" onClick={() => setUrl("")} className="inline-flex items-center gap-0.5 text-red-600">
                <X className="size-3" /> Retirer
              </button>
            )}
          </div>
        </div>
      </div>
      {manual && (
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://…"
          className="mt-3 h-10 w-full rounded-lg border border-ink-200 px-3 text-sm"
          aria-label="Lien de l'image"
        />
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
