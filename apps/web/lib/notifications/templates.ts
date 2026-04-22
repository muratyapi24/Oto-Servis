/**
 * Bildirim Şablon Sistemi
 * Her şablon { sms: string; emailHtml: string } döndürür
 */

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Kabul Edildi",
  IN_PROGRESS: "Onarım Sürüyor",
  WAITING_APPROVAL: "Onayınız Bekleniyor",
  COMPLETED: "Teslime Hazır",
  CANCELLED: "İptal Edildi",
};

export function getServiceStatusTemplate(params: {
  customerName: string;
  status: string;
  orderNumber: number;
  vehiclePlate: string;
}): { sms: string; emailHtml: string } {
  const statusLabel = STATUS_LABELS[params.status] ?? params.status;

  const sms = `MS Oto Servis: Sayın ${params.customerName}, ${params.vehiclePlate} plakalı aracınızın servis durumu güncellendi: ${statusLabel}. İş Emri #${params.orderNumber}`;

  const emailHtml = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <h2 style="color:#00288e">MS Oto Servis — Servis Güncelleme</h2>
      <p>Sayın <strong>${params.customerName}</strong>,</p>
      <p><strong>${params.vehiclePlate}</strong> plakalı aracınızın servis durumu güncellendi.</p>
      <div style="background:#eff4ff;border-left:4px solid #00288e;padding:16px;border-radius:8px;margin:20px 0">
        <p style="margin:0;font-size:18px;font-weight:bold;color:#00288e">${statusLabel}</p>
        <p style="margin:4px 0 0;color:#444653">İş Emri #${params.orderNumber}</p>
      </div>
      <p style="color:#757684;font-size:12px">MS Oto Servis — Güvenilir Hizmet</p>
    </div>
  `;

  return { sms, emailHtml };
}

export function getApprovalRequestTemplate(params: {
  customerName: string;
  approvalUrl: string;
  totalAmount: number;
  vehiclePlate: string;
}): { sms: string; emailHtml: string } {
  const formattedAmount = params.totalAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 });

  const sms = `MS Oto Servis: Sayın ${params.customerName}, ${params.vehiclePlate} plakalı aracınız için ₺${formattedAmount} tutarında servis onayı bekleniyor. Onaylamak için: ${params.approvalUrl}`;

  const emailHtml = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <h2 style="color:#00288e">MS Oto Servis — Servis Onayı Gerekiyor</h2>
      <p>Sayın <strong>${params.customerName}</strong>,</p>
      <p><strong>${params.vehiclePlate}</strong> plakalı aracınız için servis onayınız bekleniyor.</p>
      <div style="background:#fff3e0;border-left:4px solid #fd761a;padding:16px;border-radius:8px;margin:20px 0">
        <p style="margin:0;font-size:16px;font-weight:bold;color:#9d4300">Tahmini Tutar: ₺${formattedAmount}</p>
      </div>
      <a href="${params.approvalUrl}" style="display:inline-block;background:#00288e;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">
        Servisi Onayla / Reddet
      </a>
      <p style="color:#757684;font-size:12px">Bu link 48 saat geçerlidir.</p>
    </div>
  `;

  return { sms, emailHtml };
}

export function getAppointmentConfirmTemplate(params: {
  customerName: string;
  date: string;
  time: string;
}): { sms: string; emailHtml: string } {
  const sms = `MS Oto Servis: Sayın ${params.customerName}, ${params.date} tarihinde saat ${params.time} için randevu talebiniz alındı. Onay için sizi arayacağız.`;

  const emailHtml = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <h2 style="color:#00288e">MS Oto Servis — Randevu Talebi Alındı</h2>
      <p>Sayın <strong>${params.customerName}</strong>,</p>
      <p>Randevu talebiniz başarıyla alındı.</p>
      <div style="background:#eff4ff;border-left:4px solid #00288e;padding:16px;border-radius:8px;margin:20px 0">
        <p style="margin:0"><strong>Tarih:</strong> ${params.date}</p>
        <p style="margin:4px 0 0"><strong>Saat:</strong> ${params.time}</p>
      </div>
      <p>Servisimiz en kısa sürede sizi arayarak randevunuzu onaylayacak.</p>
      <p style="color:#757684;font-size:12px">MS Oto Servis — Güvenilir Hizmet</p>
    </div>
  `;

  return { sms, emailHtml };
}

export function getQuoteSentTemplate(params: {
  customerName: string;
  quoteUrl: string;
  totalAmount: number;
}): { sms: string; emailHtml: string } {
  const formattedAmount = params.totalAmount.toLocaleString("tr-TR", { minimumFractionDigits: 2 });

  const sms = `MS Oto Servis: Sayın ${params.customerName}, ₺${formattedAmount} tutarında servis teklifiniz hazır. İncelemek için: ${params.quoteUrl}`;

  const emailHtml = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
      <h2 style="color:#00288e">MS Oto Servis — Servis Teklifiniz Hazır</h2>
      <p>Sayın <strong>${params.customerName}</strong>,</p>
      <p>Servis teklifiniz hazırlandı.</p>
      <div style="background:#eff4ff;border-left:4px solid #00288e;padding:16px;border-radius:8px;margin:20px 0">
        <p style="margin:0;font-size:18px;font-weight:bold;color:#00288e">₺${formattedAmount}</p>
      </div>
      <a href="${params.quoteUrl}" style="display:inline-block;background:#00288e;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin:16px 0">
        Teklifi İncele
      </a>
      <p style="color:#757684;font-size:12px">MS Oto Servis — Güvenilir Hizmet</p>
    </div>
  `;

  return { sms, emailHtml };
}
