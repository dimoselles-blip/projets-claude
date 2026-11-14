import "server-only";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export async function audit(
  actorId: string | null,
  action: string,
  targetType: string,
  targetId: string,
  details?: Prisma.InputJsonValue,
) {
  await prisma.auditLog.create({ data: { actorId, action, targetType, targetId, details } });
}
