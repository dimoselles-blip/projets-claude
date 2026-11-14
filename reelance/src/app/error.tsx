"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-bold">Une erreur est survenue</h1>
      <p className="mt-2 max-w-md text-ink-500">{error.message || "Réessayez dans un instant."}</p>
      <Button onClick={reset} className="mt-6">
        Réessayer
      </Button>
    </div>
  );
}
