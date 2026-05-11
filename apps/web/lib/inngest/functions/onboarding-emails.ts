import { inngest } from "@/lib/inngest/client";
import { sendEmail } from "@/lib/notifications/email";
import { prisma } from "@repo/database";

// ---------------------------------------------------------------------------
// Onboarding E-mail Sekansı (14 günlük)
// Tetikleyici: "onboarding/tenant.registered" eventi
// ---------------------------------------------------------------------------

export const onboardingEmailSequence = inngest.createFunction(
  {
    id: "onboarding-email-sequence",
    name: "Onboarding E-mail Sekansı",
    triggers: [{ event: "onboarding/tenant.registered" }],
  },
  async ({ event, step }: { event: any; step: any }) => {
    const { tenantId, email, firstName, companyName } = event.data as {
      tenantId: string;
      email: string;
      firstName: string;
      companyName: string;
    };

    const appUrl = process.env.NEXTAUTH_URL ?? "https://bstoto.com";
    const dashboardUrl = `${appUrl}/dashboard`;

    // ── Gün 0: Hoşgeldin ──────────────────────────────────────────────────
    await step.run("email-day-0-welcome", async () => {
      await sendEmail({
        to: email,
        subject: `Hoşgeldiniz ${firstName}! MS Oto Servis'e başlamak için 3 adım`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:0;background:#f8fafc;">
            <div style="background:linear-gradient(135deg,#1e40af,#3b82f6);padding:40px 32px;text-align:center;border-radius:12px 12px 0 0;">
              <h1 style="color:#fff;margin:0;font-size:26px;">Hoşgeldiniz, ${firstName}!</h1>
              <p style="color:#bfdbfe;margin:8px 0 0;font-size:15px;">${companyName} servisiniz artık dijitalde</p>
            </div>
            <div style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
              <p style="color:#334155;font-size:15px;">Merhaba <strong>${firstName}</strong>,</p>
              <p style="color:#475569;font-size:14px;line-height:1.7;">
                MS Oto Servis ailesine katıldığınız için teşekkürler! 14 günlük ücretsiz deneme süreniz başladı.
                Aşağıdaki 3 adımla servisinizi 30 dakika içinde hazır hâle getirebilirsiniz.
              </p>
              <div style="margin:24px 0;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
                ${[
                  { step: "1", icon: "👥", title: "Müşterilerinizi ekleyin", desc: "CSV ile toplu aktarım ya da tek tek kayıt", href: `${dashboardUrl}/customers` },
                  { step: "2", icon: "🔧", title: "İlk iş emrinizi oluşturun", desc: "Araç + servis + parça + işçilik tek ekranda", href: `${dashboardUrl}/services` },
                  { step: "3", icon: "💸", title: "Fatura ve tahsilat yapın", desc: "Müşteriye SMS/WhatsApp otomatik gönderim", href: `${dashboardUrl}/finances` },
                ].map((s) => `
                  <a href="${s.href}" style="display:flex;align-items:center;gap:16px;padding:16px 20px;border-bottom:1px solid #f1f5f9;text-decoration:none;color:inherit;">
                    <div style="width:40px;height:40px;background:#eff6ff;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0;">${s.icon}</div>
                    <div>
                      <div style="font-weight:700;color:#1e293b;font-size:14px;">${s.step}. ${s.title}</div>
                      <div style="color:#64748b;font-size:12px;margin-top:2px;">${s.desc}</div>
                    </div>
                  </a>
                `).join("")}
              </div>
              <div style="text-align:center;margin:28px 0;">
                <a href="${dashboardUrl}" style="display:inline-block;background:#2563eb;color:#fff;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;font-size:15px;">
                  Panelime Git →
                </a>
              </div>
              <p style="color:#94a3b8;font-size:12px;text-align:center;">
                Sorularınız için WhatsApp: <a href="https://wa.me/905551234567" style="color:#2563eb;">+90 555 123 45 67</a>
              </p>
            </div>
          </div>
        `,
        tenantId,
      });
    });

    // ── Gün 1: Müşteri ekleme ────────────────────────────────────────────
    await step.sleep("wait-day-1", "1d");
    await step.run("email-day-1-customers", async () => {
      const customerCount = await prisma.customer.count({ where: { tenantId } });
      if (customerCount > 0) return; // Zaten eklemiş, atlayın
      await sendEmail({
        to: email,
        subject: "Müşterilerinizi 5 dakikada aktarın — MS Oto Servis",
        html: emailTemplate({
          firstName,
          preheader: "Excel veya kağıt listenizdeki müşterileri CSV ile hızla aktarın.",
          heading: "Müşteri listenizi taşıyın",
          body: `Excel veya kağıt defterinizde müşteri bilgileri var mı? CSV ile toplu aktarım sayesinde
                 yüzlerce müşteriyi tek seferde sisteme alabilirsiniz.`,
          ctaText: "Müşteri Aktar",
          ctaUrl: `${dashboardUrl}/customers/import`,
          tip: "İpucu: CSV şablonunu indirin, Excel ile doldurun, yükleyin. Hepsi bu!",
        }),
        tenantId,
      });
    });

    // ── Gün 2: İlk iş emri ──────────────────────────────────────────────
    await step.sleep("wait-day-2", "1d");
    await step.run("email-day-2-first-order", async () => {
      const orderCount = await prisma.serviceOrder.count({ where: { tenantId } });
      if (orderCount > 0) return;
      await sendEmail({
        to: email,
        subject: "İlk iş emrinizi oluşturun — 3 dakikada hazır",
        html: emailTemplate({
          firstName,
          preheader: "Servis emri oluşturmak çok kolay. Adım adım gösteriyoruz.",
          heading: "İlk servis emrinizi oluşturun",
          body: `Sisteminizde henüz iş emri yok. Araba girişinden parça-işçilik eklemeye,
                 müşteri onayına ve fatura oluşturmaya kadar tüm süreci 3 dakikada deneyimleyin.`,
          ctaText: "İş Emri Oluştur",
          ctaUrl: `${dashboardUrl}/services`,
          tip: "İpucu: İş emrine parça eklerken stoktan otomatik düşüm yapılır.",
        }),
        tenantId,
      });
    });

    // ── Gün 3: Usta ekleme ve mobil ─────────────────────────────────────
    await step.sleep("wait-day-3", "1d");
    await step.run("email-day-3-mechanics", async () => {
      await sendEmail({
        to: email,
        subject: "Ustalarınıza mobil uygulamayı indirtin",
        html: emailTemplate({
          firstName,
          preheader: "Ustalar mobil uygulamayla anlık iş emri alıyor ve güncelliyor.",
          heading: "Usta portalı ve mobil uygulama",
          body: `Ustalarınızı sisteme ekleyip mobil uygulamayı indirdiklerinde,
                 size WhatsApp veya telefon açmadan anlık iş emri alabilirler.
                 Siz de her işin durumunu gerçek zamanlı görürsünüz.`,
          ctaText: "Usta Ekle",
          ctaUrl: `${dashboardUrl}/mechanics`,
          tip: "İpucu: Her usta kendi atanan iş emirlerini görür, başkasının bilgilerine erişemez.",
        }),
        tenantId,
      });
    });

    // ── Gün 5: Fatura ve tahsilat ────────────────────────────────────────
    await step.sleep("wait-day-5", "2d");
    await step.run("email-day-5-invoice", async () => {
      const invoiceCount = await prisma.invoice.count({ where: { tenantId } });
      if (invoiceCount > 0) return;
      await sendEmail({
        to: email,
        subject: "İlk faturanızı oluşturun ve müşteriye SMS ile gönderin",
        html: emailTemplate({
          firstName,
          preheader: "Fatura oluştururken müşteri otomatik SMS/WhatsApp alıyor.",
          heading: "Fatura ve tahsilat",
          body: `İş emri tamamlanınca tek tıkla fatura oluşturulur. Müşteri otomatik olarak
                 SMS veya WhatsApp ile bilgilendirilir. Online ödeme linki de gönderilebilir.`,
          ctaText: "Faturaya Git",
          ctaUrl: `${dashboardUrl}/finances`,
          tip: "İpucu: Kısmi tahsilat yapabilir, çek/senet kaydedebilirsiniz.",
        }),
        tenantId,
      });
    });

    // ── Gün 7: Check-in görüşmesi ────────────────────────────────────────
    await step.sleep("wait-day-7", "2d");
    await step.run("email-day-7-checkin", async () => {
      await sendEmail({
        to: email,
        subject: `${firstName}, nasıl gidiyor? Bir görüşme ayarlayalım mı?`,
        html: emailTemplate({
          firstName,
          preheader: "7 günlük deneyiminizi duymak isteriz. 15 dakikalık ücretsiz destek görüşmesi.",
          heading: "7. gün check-in",
          body: `Deneme sürenizin 7. günündesiniz. Bu sürede aklınıza takılan sorular, kullanmakta zorlandığınız
                 özellikler veya eklemek istediğiniz şeyler oldu mu? 15 dakikalık ücretsiz görüşme ayarlayalım.`,
          ctaText: "Görüşme Ayarla",
          ctaUrl: "https://wa.me/905551234567?text=7.+g%C3%BCn+check-in+g%C3%B6r%C3%BC%C5%9Fmesi+istiyorum",
          tip: "Veya doğrudan arayın: +90 555 123 45 67",
        }),
        tenantId,
      });
    });

    // ── Gün 10: Deneme bitiyor uyarısı ──────────────────────────────────
    await step.sleep("wait-day-10", "3d");
    await step.run("email-day-10-expiry-warning", async () => {
      const sub = await prisma.subscription.findFirst({
        where: { tenantId, status: "TRIAL" },
        orderBy: { startDate: "desc" },
      });
      if (!sub) return; // Zaten ücretliye geçmiş
      await sendEmail({
        to: email,
        subject: "Deneme süreniz 4 gün sonra bitiyor — kaybetmeden devam edin",
        html: emailTemplate({
          firstName,
          preheader: "4 gün sonra deneme süresi sona eriyor. Aboneliğinizi şimdi başlatın.",
          heading: "⏰ 4 gün kaldı",
          body: `Deneme süreniz <strong>4 gün sonra sona eriyor</strong>. Bu süre içinde verileriniz
                 ve tüm iş emirleriniz güvende. Aboneliğinizi şimdi başlatırsanız veri kaybı yaşamazsınız.
                 Aylık ₺799'dan başlayan planlarımıza göz atın.`,
          ctaText: "Abonelik Başlat",
          ctaUrl: `${dashboardUrl}/settings/subscription`,
          tip: "Yıllık ödemede 2 ay bedava (yaklaşık %17 tasarruf).",
        }),
        tenantId,
      });
    });

    // ── Gün 14: Deneme bitti ─────────────────────────────────────────────
    await step.sleep("wait-day-14", "4d");
    await step.run("email-day-14-trial-end", async () => {
      const sub = await prisma.subscription.findFirst({
        where: { tenantId, status: "TRIAL" },
        orderBy: { startDate: "desc" },
      });
      if (!sub) return; // Ücretliye geçmiş, e-mail gerekmez
      await sendEmail({
        to: email,
        subject: "Deneme süreniz doldu — verilerinizi kurtarın",
        html: emailTemplate({
          firstName,
          preheader: "14 günlük denemeniz tamamlandı. Abonelik başlatmak için hâlâ zamanınız var.",
          heading: "Deneme süresi tamamlandı",
          body: `14 günlük deneme süreniz doldu. Verileriniz (müşteriler, araçlar, iş emirleri) 30 gün boyunca
                 saklanmaya devam eder. Bu süre içinde abonelik başlatırsanız kaldığınız yerden devam edersiniz.`,
          ctaText: "Aboneliği Başlat — ₺799/ay'dan",
          ctaUrl: `${dashboardUrl}/settings/subscription`,
          tip: "Yardıma ihtiyaç duyarsanız +90 555 123 45 67 numarasını arayabilirsiniz.",
        }),
        tenantId,
      });
    });

    return { status: "completed", email };
  }
);

// ---------------------------------------------------------------------------
// Ortak HTML e-mail şablonu
// ---------------------------------------------------------------------------
function emailTemplate({
  firstName,
  preheader,
  heading,
  body,
  ctaText,
  ctaUrl,
  tip,
}: {
  firstName: string;
  preheader: string;
  heading: string;
  body: string;
  ctaText: string;
  ctaUrl: string;
  tip?: string;
}): string {
  return `
    <!DOCTYPE html>
    <html lang="tr">
    <head><meta charset="UTF-8"/></head>
    <body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;">
      <!-- Preheader (hidden) -->
      <div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>
      <div style="max-width:600px;margin:0 auto;padding:24px;">
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#1e40af,#2563eb);padding:28px 32px;border-radius:12px 12px 0 0;text-align:center;">
          <span style="color:#fff;font-weight:900;font-size:18px;letter-spacing:-0.5px;">MS Oto Servis</span>
        </div>
        <!-- Body -->
        <div style="background:#fff;padding:32px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;">
          <p style="color:#334155;font-size:15px;margin:0 0 8px;">Merhaba <strong>${firstName}</strong>,</p>
          <h2 style="color:#1e293b;font-size:20px;margin:0 0 16px;font-weight:900;">${heading}</h2>
          <p style="color:#475569;font-size:14px;line-height:1.7;margin:0 0 24px;">${body}</p>
          <div style="text-align:center;margin-bottom:24px;">
            <a href="${ctaUrl}"
               style="display:inline-block;background:#2563eb;color:#fff;font-weight:700;padding:14px 32px;border-radius:10px;text-decoration:none;font-size:15px;">
              ${ctaText}
            </a>
          </div>
          ${tip ? `<div style="background:#f0f9ff;border-left:4px solid #3b82f6;padding:12px 16px;border-radius:0 8px 8px 0;font-size:13px;color:#1d4ed8;">${tip}</div>` : ""}
          <hr style="margin:28px 0;border:none;border-top:1px solid #e2e8f0;"/>
          <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">
            MS Oto Servis — Türkiye'de oto servislerin tercihi<br/>
            <a href="${ctaUrl}" style="color:#94a3b8;">Aboneliği yönet</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
