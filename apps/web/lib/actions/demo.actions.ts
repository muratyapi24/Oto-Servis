"use server";

import { z } from "zod";
import { sendEmail } from "@/lib/notifications/email";

const demoRequestSchema = z.object({
  firstName: z.string().min(2, "Ad en az 2 karakter olmalı"),
  lastName: z.string().min(2, "Soyad en az 2 karakter olmalı"),
  company: z.string().min(2, "Firma adı zorunludur"),
  email: z.string().email("Geçerli bir e-posta giriniz"),
  phone: z.string().min(10, "Geçerli bir telefon giriniz"),
  dailyOrders: z.string().optional(),
  message: z.string().optional(),
});

export type DemoRequestInput = z.infer<typeof demoRequestSchema>;

export async function requestDemo(
  data: DemoRequestInput
): Promise<{ success?: string; error?: string }> {
  const parsed = demoRequestSchema.safeParse(data);
  if (!parsed.success) {
    const first = parsed.error.errors[0];
    return { error: first?.message ?? "Form verisi hatalı." };
  }

  const { firstName, lastName, company, email, phone, dailyOrders, message } = parsed.data;
  const fullName = `${firstName} ${lastName}`;
  const adminEmail = process.env.ADMIN_EMAIL ?? "sistemb24@gmail.com";
  const now = new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" });

  // 1) Admin bildirimi
  await sendEmail({
    to: adminEmail,
    subject: `🚀 Yeni Demo Talebi — ${company} (${phone})`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f8fafc;">
        <div style="background:#1e293b;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0;">
          <h2 style="margin:0;font-size:20px;">Yeni Demo Talebi</h2>
          <p style="margin:4px 0 0;opacity:.7;font-size:13px;">${now}</p>
        </div>
        <div style="background:#fff;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:8px 0;color:#64748b;width:130px;">Ad Soyad</td><td style="font-weight:600;">${fullName}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Firma</td><td style="font-weight:600;">${company}</td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">E-posta</td><td><a href="mailto:${email}">${email}</a></td></tr>
            <tr><td style="padding:8px 0;color:#64748b;">Telefon</td><td><a href="tel:${phone}">${phone}</a></td></tr>
            ${dailyOrders ? `<tr><td style="padding:8px 0;color:#64748b;">Günlük İş Emri</td><td>${dailyOrders}</td></tr>` : ""}
            ${message ? `<tr><td style="padding:8px 0;color:#64748b;vertical-align:top;">Not</td><td>${message}</td></tr>` : ""}
          </table>
          <div style="margin-top:20px;padding:16px;background:#eff6ff;border-radius:8px;font-size:13px;color:#1d4ed8;">
            <strong>Hızlı arama:</strong> <a href="tel:${phone}" style="color:#1d4ed8;">${phone}</a> &nbsp;|&nbsp;
            <a href="mailto:${email}" style="color:#1d4ed8;">${email}</a>
          </div>
        </div>
      </div>
    `,
    tenantId: "system",
  });

  // 2) Kullanıcıya onay e-maili
  await sendEmail({
    to: email,
    subject: "Demo talebiniz alındı — MS Oto Servis",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#f8fafc;">
        <div style="background:linear-gradient(135deg,#1e40af,#3b82f6);color:#fff;padding:32px 24px;border-radius:12px 12px 0 0;text-align:center;">
          <h1 style="margin:0;font-size:24px;">Demo Talebiniz Alındı!</h1>
          <p style="margin:8px 0 0;opacity:.85;">En kısa sürede sizi arayacağız</p>
        </div>
        <div style="background:#fff;padding:32px 24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
          <p style="font-size:15px;color:#334155;">Merhaba <strong>${firstName}</strong>,</p>
          <p style="font-size:14px;color:#475569;line-height:1.6;">
            <strong>${company}</strong> firması için demo talebinizi aldık. Ekibimiz <strong>en geç 1 iş günü içinde</strong>
            sizi arayarak 30 dakikalık ücretsiz demo görüşmesi planlayacak.
          </p>
          <div style="margin:24px 0;padding:20px;background:#f0f9ff;border-left:4px solid #3b82f6;border-radius:0 8px 8px 0;">
            <p style="margin:0 0 8px;font-weight:700;color:#1e40af;">Demo öncesi hazırlık:</p>
            <ul style="margin:0;padding-left:20px;font-size:13px;color:#334155;line-height:2;">
              <li>Mevcut günlük iş emri sayınızı not edin</li>
              <li>Kaç usta / personel çalıştığını hazırlayın</li>
              <li>Hangi sorunları çözmek istediğinizi düşünün</li>
            </ul>
          </div>
          <p style="font-size:14px;color:#475569;">
            Daha hızlı görüşmek isterseniz bizi arayabilirsiniz:<br/>
            <a href="tel:+905551234567" style="color:#3b82f6;font-weight:600;">+90 555 123 45 67</a>
          </p>
          <div style="margin-top:24px;padding-top:20px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;text-align:center;">
            MS Oto Servis — Türkiye'nin oto servislerine özel bulut tabanlı yönetim yazılımı
          </div>
        </div>
      </div>
    `,
    tenantId: "system",
  });

  return { success: "Demo talebiniz başarıyla alındı. En kısa sürede sizi arayacağız!" };
}
