"use server";

import { revalidatePath } from "next/cache";
import { assertCustomer } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";

/**
 * Marks notifications read.
 *
 * The update is scoped by the caller's own customerId, so passing another
 * client's notification ids does nothing - `updateMany` simply matches zero
 * rows rather than leaking or modifying anything.
 */
export async function markNotificationsRead(ids: string[]): Promise<void> {
  if (ids.length === 0) return;

  try {
    const { customerId } = await assertCustomer();

    await prisma.notification.updateMany({
      where: { id: { in: ids.slice(0, 200) }, customerId, readAt: null },
      data: { readAt: new Date() },
    });

    // Refresh the sidebar badge.
    revalidatePath("/dashboard", "layout");
  } catch (error) {
    console.error("[notifications] mark read failed", error);
  }
}
