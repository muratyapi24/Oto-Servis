"use server";

import { guardTenant } from "@/lib/guards";

import { revalidatePath } from "next/cache";
import { prisma } from "@repo/database";
import * as Sentry from "@sentry/nextjs";
import {
  customerPreferenceSchema,
  type CustomerPreferenceInput,
} from "@/lib/validations/notification";

type ActionResult<T = void> = {
  success: boolean;
  data?: T;
  error?: string;
};

// ---------------------------------------------------------------------------
// 4.4 getCustomerNotificationPreference
// ---------------------------------------------------------------------------

export async function getCustomerNotificationPreference(
  customerId: string
): Promise<ActionResult<{ preference: unknown }>> {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;


    const preference = await prisma.customerNotificationPreference.findFirst({
      where: { tenantId, customerId },
    });

    return {
      success: true,
      data: {
        preference: preference ?? {
          smsEnabled: true,
          whatsappEnabled: false,
          emailEnabled: true,
          preferredChannel: "SMS",
        },
      },
    };
  } catch (error: unknown) {
    Sentry.captureException(error);
    return { success: false, error: "Tercihler alınamadı." };
  }
}

// ---------------------------------------------------------------------------
// 4.4 updateCustomerNotificationPreference
// ---------------------------------------------------------------------------

export async function updateCustomerNotificationPreference(
  customerId: string,
  data: CustomerPreferenceInput
): Promise<ActionResult> {
  try {
    const g = await guardTenant();
    if ("error" in g) return g as never;
    const { tenantId } = g;

    const validatedData = customerPreferenceSchema.parse(data);

    // WhatsApp etkinleştirmede telefon numarası doğrulaması
    if (validatedData.whatsappEnabled) {
      const customer = await prisma.customer.findFirst({
        where: { id: customerId, tenantId },
        select: { phone: true },
      });

      if (!customer?.phone) {
        return {
          success: false,
          error: "WhatsApp etkinleştirmek için telefon numarası gereklidir.",
        };
      }
    }

    await prisma.customerNotificationPreference.upsert({
      where: { customerId },
      create: {
        tenantId,
        customerId,
        smsEnabled: validatedData.smsEnabled,
        whatsappEnabled: validatedData.whatsappEnabled,
        emailEnabled: validatedData.emailEnabled,
        preferredChannel: validatedData.preferredChannel,
      },
      update: {
        smsEnabled: validatedData.smsEnabled,
        whatsappEnabled: validatedData.whatsappEnabled,
        emailEnabled: validatedData.emailEnabled,
        preferredChannel: validatedData.preferredChannel,
      },
    });

    revalidatePath("/m/musteri/bildirim-tercihleri");
    return { success: true };
  } catch (error: unknown) {
    Sentry.captureException(error);
    return { success: false, error: "Tercihler güncellenemedi." };
  }
}
