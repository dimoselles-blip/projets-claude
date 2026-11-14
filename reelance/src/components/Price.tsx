import { getCurrencyContext } from "@/lib/display-currency";
import { formatXof } from "@/lib/currency";

/** Affiche un prix de référence (FCFA) dans la devise du visiteur. */
export async function Price({ xof, showBase = false, className }: { xof: number; showBase?: boolean; className?: string }) {
  const { currency, format } = await getCurrencyContext();
  return (
    <span className={className}>
      {format(xof)}
      {showBase && currency !== "XOF" && currency !== "XAF" && (
        <span className="ml-1.5 text-xs font-normal text-ink-500">({formatXof(xof)})</span>
      )}
    </span>
  );
}
