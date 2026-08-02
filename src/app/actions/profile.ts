"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { assertCustomer } from "@/lib/auth-helpers";
import { recordAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";
import { changePasswordSchema } from "@/lib/validations/auth";

export interface ProfileActionResult {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
}

const profileSchema = z.object({
  companyName: z.string().trim().min(2, "Enter a company or full name.").max(160),
  contactPerson: z.string().trim().min(2, "Enter a contact name.").max(120),
  phone: z.string().trim().min(6, "Enter a phone number.").max(40),
  vatNumber: z.string().trim().max(60).optional().or(z.literal("")),
  marketingOptIn: z.boolean().default(false),
  shipping: z.object({
    line1: z.string().trim().max(160).optional().or(z.literal("")),
    line2: z.string().trim().max(160).optional().or(z.literal("")),
    city: z.string().trim().max(80).optional().or(z.literal("")),
    state: z.string().trim().max(80).optional().or(z.literal("")),
    postalCode: z.string().trim().max(40).optional().or(z.literal("")),
    country: z.string().trim().max(80).optional().or(z.literal("")),
  }),
});

/**
 * Updates the signed-in client's own profile.
 *
 * Note what is NOT updatable here: the email address (it is the identity on
 * issued certificates, and changing it would orphan history) and the linked user
 * account. Both require the laboratory to act.
 */
export async function updateProfile(
  raw: unknown,
): Promise<ProfileActionResult> {
  const parsed = profileSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  try {
    const { customerId, userId } = await assertCustomer();
    const data = parsed.data;

    await prisma.customer.update({
      where: { id: customerId },
      data: {
        companyName: data.companyName,
        contactPerson: data.contactPerson,
        phone: data.phone,
        vatNumber: data.vatNumber || null,
        marketingOptIn: data.marketingOptIn,
        shippingLine1: data.shipping.line1 || null,
        shippingLine2: data.shipping.line2 || null,
        shippingCity: data.shipping.city || null,
        shippingState: data.shipping.state || null,
        shippingPostalCode: data.shipping.postalCode || null,
        shippingCountry: data.shipping.country || null,
      },
    });

    await recordAudit({
      action: "customer.updated",
      userId,
      entity: "Customer",
      entityId: customerId,
      metadata: { self_service: true },
    });

    revalidatePath("/dashboard/settings");
    return { ok: true, message: "Your details have been updated." };
  } catch (error) {
    console.error("[profile] update failed", error);
    return { ok: false, message: "We could not save your changes." };
  }
}

/** Changes the signed-in user's password after verifying the current one. */
export async function changePassword(
  raw: unknown,
): Promise<ProfileActionResult> {
  const parsed = changePasswordSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  try {
    const { userId } = await assertCustomer();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });

    if (!user?.passwordHash) {
      return {
        ok: false,
        message: "This account does not use password sign-in.",
      };
    }

    const matches = await bcrypt.compare(
      parsed.data.currentPassword,
      user.passwordHash,
    );
    if (!matches) {
      return {
        ok: false,
        message: "Your current password is not correct.",
        fieldErrors: { currentPassword: ["That password is not correct."] },
      };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 12) },
    });

    await recordAudit({
      action: "customer.updated",
      userId,
      entity: "User",
      entityId: userId,
      metadata: { password_changed: true },
    });

    return { ok: true, message: "Your password has been changed." };
  } catch (error) {
    console.error("[profile] password change failed", error);
    return { ok: false, message: "We could not change your password." };
  }
}
