"use client";

import { useEffect, useState } from "react";
import { CircleCheck, TriangleAlert, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function FlashToast({ type, message }: { type: "success" | "error"; message: string }) {
  const [open, setOpen] = useState(true);

  useEffect(() => {
    document.cookie = "rl_flash=; Max-Age=0; path=/";
    const t = setTimeout(() => setOpen(false), type === "error" ? 9000 : 5000);
    return () => clearTimeout(t);
  }, [type, message]);

  if (!open) return null;
  const Icon = type === "success" ? CircleCheck : TriangleAlert;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4 sm:bottom-auto sm:top-20">
      <div
        role={type === "error" ? "alert" : "status"}
        className={cn(
          "pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-2xl border bg-white p-4 text-sm shadow-card-hover",
          type === "success" ? "border-emerald-200" : "border-red-200",
        )}
      >
        <Icon className={cn("mt-0.5 size-5 shrink-0", type === "success" ? "text-emerald-600" : "text-red-600")} />
        <p className="flex-1 text-ink-800">{message}</p>
        <button type="button" onClick={() => setOpen(false)} className="text-ink-400 hover:text-ink-700" aria-label="Fermer">
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
