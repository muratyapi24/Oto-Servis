/**
 * SMS Bildirim Servisi — Multi-Provider (Twilio, Netgsm, İleti Merkezi)
 */

import { prisma } from "@repo/database";
import { checkLimit } from "@/lib/subscription-guard";

interface SendSmsOptions {
  to: string;       // +90XXXXXXXXXX formatında
  body: string;
  tenantId: string;
  customerId?: string;
}

export async function sendSms(options: SendSmsOptions): Promise<{ success: boolean; error?: string }> {
  const { to, body, tenantId, customerId } = options;

  let notificationId: string | null = null;
  let activeProvider: any = null;

  try {
    // Subscription Guard — Aylık SMS kota kontrolü
    const smsLimit = await checkLimit(tenantId, "maxSmsPerMonth");
    if (!smsLimit.allowed) {
      return { success: false, error: smsLimit.message || "Aylık SMS kotanız dolmuştur." };
    }

    // 1. Tenant'ın aktif SMS sağlayıcısını bul
    activeProvider = await prisma.notificationProvider.findFirst({
      where: {
        tenantId,
        type: "SMS",
        isActive: true
      }
    });

    const channelName = activeProvider ? activeProvider.provider.toLowerCase() : "system-default";

    // 2. Log it to Notification table as PENDING
    const notification = await prisma.notification.create({
      data: {
        tenantId,
        customerId: customerId ?? null,
        type: "SMS",
        channel: channelName,
        recipient: to,
        body,
        status: "PENDING",
      },
    });
    notificationId = notification.id;
  } catch (dbErr) {
    console.error("[SMS] Başlangıç veritabanı hatası:", dbErr);
  }

  // Eğer sağlayıcı yoksa veya aktif değilse "MOCK" olarak işleyelim (Simülasyon modu)
  if (!activeProvider) {
    console.warn("[SMS] Aktif sağlayıcı bulunamadı. Simülasyon modunda işlendi. To:", to);
    if (notificationId) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { status: "SENT", sentAt: new Date(), metadata: { simulated: true } },
      });
    }
    return { success: true };
  }

  // 3. İlgili Provider'a göre gönderim yap
  try {
    let providerResultUrl = "";
    let providerResultData: any = {};
    const settings = activeProvider.settings as any;

    // Telefon numarasını temizle
    const cleanPhone = to.replace(/[^0-9]/g, "");

    // --- NETGSM YÖNETİMİ ---
    if (activeProvider.provider === "NETGSM") {
      const xmlData = `<?xml version="1.0" encoding="UTF-8"?>
      <mainbody>
         <header>
            <company dil="TR">Netgsm</company>
            <usercode>${settings.usercode}</usercode>
            <password>${settings.password}</password>
            <startdate></startdate>
            <stopdate></stopdate>
            <type>1:n</type>
            <msgheader>${settings.senderId || settings.usercode}</msgheader>
         </header>
         <body>
            <msg><![CDATA[${body}]]></msg>
            <no>${cleanPhone}</no>
         </body>
      </mainbody>`;

      const res = await fetch("https://api.netgsm.com.tr/sms/send/xml", {
        method: "POST",
        headers: { "Content-Type": "application/xml" },
        body: xmlData
      });
      const responseText = await res.text();
      providerResultData = { response: responseText };

      // Netgsm response: "00 12345678" -> 00 successful
      if (!responseText.startsWith("00")) {
         throw new Error(`NetGSM Hatası: ${responseText}`);
      }

    // --- İLETİM MERKEZİ YÖNETİMİ ---
    } else if (activeProvider.provider === "ILETI_MERKEZI") {
      const xmlData = `<request>
        <authentication>
          <username>${settings.username}</username>
          <password>${settings.password}</password>
        </authentication>
        <order>
          <sender>${settings.senderId}</sender>
          <sendDateTime></sendDateTime>
          <message>
            <text><![CDATA[${body}]]></text>
            <receipents>
              <number>${cleanPhone}</number>
            </receipents>
          </message>
        </order>
      </request>`;

      const res = await fetch("https://api.iletimerkezi.com/v1/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/xml" },
        body: xmlData
      });
      const responseText = await res.text();
      providerResultData = { response: responseText };

      if (!responseText.includes("<status>200</status>")) {
         throw new Error(`İletim Merkezi Hatası: ${responseText}`);
      }

    // --- TWILIO YÖNETİMİ ---
    } else if (activeProvider.provider === "TWILIO") {
      const accountSid = settings.accountSid || process.env.TWILIO_ACCOUNT_SID;
      const authToken = settings.authToken || process.env.TWILIO_AUTH_TOKEN;
      const fromNumber = settings.fromNumber || process.env.TWILIO_PHONE_NUMBER;

      const twilio = (await import("twilio")).default;
      const client = twilio(accountSid, authToken);

      const twilioRes = await client.messages.create({ body, from: fromNumber, to });
      providerResultData = { sid: twilioRes.sid, error: twilioRes.errorCode };

    } else {
      throw new Error("Bilinmeyen SMS sağlayıcısı: " + activeProvider.provider);
    }

    // Gönderim başarılı
    if (notificationId) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: { status: "SENT", sentAt: new Date(), metadata: providerResultData },
      });
    }
    return { success: true };

  } catch (err: any) {
    console.error(`[SMS] ${activeProvider.provider} Gönderim hatası:`, err.message);
    if (notificationId) {
      await prisma.notification.update({
        where: { id: notificationId },
        data: {
          status: "FAILED",
          retryCount: { increment: 1 },
          metadata: { error: err.message },
        },
      });
    }
    return { success: false, error: err.message };
  }
}
