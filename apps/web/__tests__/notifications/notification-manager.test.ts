// Feature: whatsapp-notification-system
// Birim testleri: kanal seçimi, fallback, SKIPPED durumu (simülasyon)

// ---------------------------------------------------------------------------
// Kanal seçim mantığı simülasyonu
// ---------------------------------------------------------------------------

type Channel = "SMS" | "WHATSAPP" | "EMAIL" | null;

interface CustomerPreference {
  smsEnabled: boolean;
  whatsappEnabled: boolean;
  emailEnabled: boolean;
  preferredChannel: "SMS" | "WHATSAPP" | "EMAIL";
}

interface ProviderAvailability {
  hasWhatsApp: boolean;
  hasSms: boolean;
  hasEmail: boolean;
}

function resolveChannelSync(
  preference: CustomerPreference | null,
  providers: ProviderAvailability
): Channel {
  const { hasWhatsApp, hasSms, hasEmail } = providers;

  if (!preference) {
    if (hasWhatsApp) return "WHATSAPP";
    if (hasSms) return "SMS";
    if (hasEmail) return "EMAIL";
    return null;
  }

  const { preferredChannel, smsEnabled, whatsappEnabled, emailEnabled } = preference;

  if (preferredChannel === "WHATSAPP" && whatsappEnabled && hasWhatsApp) return "WHATSAPP";
  if (preferredChannel === "SMS" && smsEnabled && hasSms) return "SMS";
  if (preferredChannel === "EMAIL" && emailEnabled && hasEmail) return "EMAIL";

  // Fallback
  if (whatsappEnabled && hasWhatsApp) return "WHATSAPP";
  if (smsEnabled && hasSms) return "SMS";
  if (emailEnabled && hasEmail) return "EMAIL";

  return null;
}

// ---------------------------------------------------------------------------
// Testler
// ---------------------------------------------------------------------------

describe("Notification Manager: Kanal seçimi", () => {
  const allProviders: ProviderAvailability = {
    hasWhatsApp: true,
    hasSms: true,
    hasEmail: true,
  };

  it("tercih yoksa WhatsApp önce seçilir (sağlayıcı varsa)", () => {
    const result = resolveChannelSync(null, allProviders);
    expect(result).toBe("WHATSAPP");
  });

  it("tercih yoksa ve WhatsApp yoksa SMS seçilir", () => {
    const result = resolveChannelSync(null, { hasWhatsApp: false, hasSms: true, hasEmail: true });
    expect(result).toBe("SMS");
  });

  it("tercih yoksa ve SMS de yoksa Email seçilir", () => {
    const result = resolveChannelSync(null, { hasWhatsApp: false, hasSms: false, hasEmail: true });
    expect(result).toBe("EMAIL");
  });

  it("tüm sağlayıcılar yoksa null döner", () => {
    const result = resolveChannelSync(null, { hasWhatsApp: false, hasSms: false, hasEmail: false });
    expect(result).toBeNull();
  });

  it("tercih SMS ise SMS seçilir", () => {
    const pref: CustomerPreference = {
      smsEnabled: true,
      whatsappEnabled: true,
      emailEnabled: true,
      preferredChannel: "SMS",
    };
    const result = resolveChannelSync(pref, allProviders);
    expect(result).toBe("SMS");
  });

  it("tercih WhatsApp ise WhatsApp seçilir", () => {
    const pref: CustomerPreference = {
      smsEnabled: true,
      whatsappEnabled: true,
      emailEnabled: true,
      preferredChannel: "WHATSAPP",
    };
    const result = resolveChannelSync(pref, allProviders);
    expect(result).toBe("WHATSAPP");
  });

  it("tercih WhatsApp ama devre dışıysa fallback SMS'e geçer", () => {
    const pref: CustomerPreference = {
      smsEnabled: true,
      whatsappEnabled: false,
      emailEnabled: true,
      preferredChannel: "WHATSAPP",
    };
    const result = resolveChannelSync(pref, allProviders);
    expect(result).toBe("SMS");
  });

  it("tüm kanallar devre dışıysa null döner (SKIPPED)", () => {
    const pref: CustomerPreference = {
      smsEnabled: false,
      whatsappEnabled: false,
      emailEnabled: false,
      preferredChannel: "SMS",
    };
    const result = resolveChannelSync(pref, allProviders);
    expect(result).toBeNull();
  });
});
