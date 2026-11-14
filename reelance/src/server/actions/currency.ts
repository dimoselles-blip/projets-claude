"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { isCurrency } from "@/lib/currency";
import { CURRENCY_COOKIE } from "@/lib/display-currency";

export async function setCurrencyAction(formData: FormData) {
  const currency = formData.get("currency");
  if (!isCurrency(currency)) return;
  (await cookies()).set(CURRENCY_COOKIE, currency, { path: "/", maxAge: 365 * 24 * 3600, sameSite: "lax" });
  const user = await getCurrentUser();
  if (user) await prisma.user.update({ where: { id: user.id }, data: { currency } });
  revalidatePath("/", "layout");
}
