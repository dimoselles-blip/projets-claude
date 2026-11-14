import { NextResponse, type NextRequest } from "next/server";
import { config } from "@/lib/config";
import { runAutoCompletions } from "@/lib/escrow";
import { refreshExchangeRates } from "@/lib/rates";

/**
 * Tâches planifiées (à appeler toutes les heures) :
 *  - validation automatique des livraisons sans réponse du client ;
 *  - mise à jour des taux de change.
 * Appel : GET /api/cron avec l'en-tête « Authorization: Bearer <CRON_SECRET> ».
 * Vercel Cron envoie cet en-tête automatiquement si CRON_SECRET est défini.
 */
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!config.cron.secret || request.headers.get("authorization") !== `Bearer ${config.cron.secret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const autoCompleted = await runAutoCompletions();
  let rates: string[] | string = [];
  try {
    rates = await refreshExchangeRates();
  } catch (err) {
    rates = err instanceof Error ? err.message : "erreur";
  }
  return NextResponse.json({ ok: true, autoCompleted, rates, at: new Date().toISOString() });
}
