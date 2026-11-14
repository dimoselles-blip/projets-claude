import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/misc";
import { ORDER_STATUS } from "@/lib/constants";
import { formatMoney, formatXof } from "@/lib/currency";
import { formatDate } from "@/lib/utils";
import type { Prisma } from "@/generated/prisma/client";

export type OrderRow = Prisma.OrderGetPayload<{ include: { client: { select: { name: true } }; freelancer: { select: { name: true } } } }>;

/** Liste de commandes : le client voit le prix payé (dans sa devise), le freelance son montant net. */
export function OrderList({ orders, viewer, hrefBase = "/tableau-de-bord/commandes" }: { orders: OrderRow[]; viewer: "CLIENT" | "FREELANCER" | "ADMIN"; hrefBase?: string }) {
  return (
    <ul className="divide-y divide-ink-100">
      {orders.map((o) => {
        const other = viewer === "CLIENT" ? o.freelancer.name : o.client.name;
        const amount =
          viewer === "FREELANCER"
            ? formatXof(o.freelancerNetXof)
            : viewer === "CLIENT"
              ? formatMoney(Number(o.displayAmount), o.displayCurrency)
              : formatXof(o.priceXof);
        return (
          <li key={o.id}>
            <Link href={`${hrefBase}/${o.id}`} className="flex items-center gap-3 px-5 py-4 transition hover:bg-ink-50/70 sm:px-6">
              <Avatar name={other} size={38} className="hidden sm:grid" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-ink-900">{o.title}</p>
                <p className="mt-0.5 truncate text-xs text-ink-500">
                  {o.reference} · {viewer === "ADMIN" ? `${o.client.name} → ${o.freelancer.name}` : other} · {formatDate(o.createdAt)}
                  {o.type === "MISSION" ? " · Mission" : ""}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <span className="text-sm font-semibold text-ink-900">{amount}</span>
                <StatusBadge status={o.status} map={ORDER_STATUS} />
              </div>
              <ChevronRight className="hidden size-4 text-ink-300 sm:block" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
