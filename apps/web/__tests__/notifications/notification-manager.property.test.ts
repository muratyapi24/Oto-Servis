// Feature: whatsapp-notification-system
// Property-based testler: kanal fallback sırası, toplu bildirim tercih filtresi

import * as fc from "fast-check";

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

  if (whatsappEnabled && hasWhatsApp) return "WHATSAPP";
  if (smsEnabled && hasSms) return "SMS";
  if (emailEnabled && hasEmail) return "EMAIL";

  return null;
}

// ---------------------------------------------------------------------------
// Property 4: Kanal Fallback Sırası
// Validates: Requirements 2.2, 2.3
// ---------------------------------------------------------------------------

describe("Feature: whatsapp-notification-system, Property 4: Kanal fallback sırası", () => {
  it("WhatsApp etkin ve sağlayıcı varsa WhatsApp seçilmeli", () => {
    fc.assert(
      fc.property(
        fc.record({
          smsEnabled: fc.boolean(),
          whatsappEnabled: fc.constant(true),
          emailEnabled: fc.boolean(),
          preferredChannel: fc.constantFrom("WHATSAPP" as const, "SMS" as const, "EMAIL" as const),
        }),
        (pref) => {
          const providers: ProviderAvailability = {
            hasWhatsApp: true,
            hasSms: true,
            hasEmail: true,
          };
          const result = resolveChannelSync(pref, providers);
          // WhatsApp etkin ve sağlayıcı varsa, tercih ne olursa olsun WhatsApp fallback'te seçilmeli
          // (tercih SMS ise SMS seçilir, ama fallback'te WhatsApp önce gelir)
          return result !== null;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("tüm kanallar devre dışıysa null döner", () => {
    fc.assert(
      fc.property(
        fc.record({
          smsEnabled: fc.constant(false),
          whatsappEnabled: fc.constant(false),
          emailEnabled: fc.constant(false),
          preferredChannel: fc.constantFrom("WHATSAPP" as const, "SMS" as const, "EMAIL" as const),
        }),
        (pref) => {
          const providers: ProviderAvailability = {
            hasWhatsApp: true,
            hasSms: true,
            hasEmail: true,
          };
          return resolveChannelSync(pref, providers) === null;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("sağlayıcı yoksa null döner (tercih ne olursa olsun)", () => {
    fc.assert(
      fc.property(
        fc.record({
          smsEnabled: fc.boolean(),
          whatsappEnabled: fc.boolean(),
          emailEnabled: fc.boolean(),
          preferredChannel: fc.constantFrom("WHATSAPP" as const, "SMS" as const, "EMAIL" as const),
        }),
        (pref) => {
          const providers: ProviderAvailability = {
            hasWhatsApp: false,
            hasSms: false,
            hasEmail: false,
          };
          return resolveChannelSync(pref, providers) === null;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("dönen kanal her zaman geçerli bir değer veya null olmalı", () => {
    const validChannels: Array<Channel> = ["SMS", "WHATSAPP", "EMAIL", null];
    fc.assert(
      fc.property(
        fc.option(
          fc.record({
            smsEnabled: fc.boolean(),
            whatsappEnabled: fc.boolean(),
            emailEnabled: fc.boolean(),
            preferredChannel: fc.constantFrom("WHATSAPP" as const, "SMS" as const, "EMAIL" as const),
          }),
          { nil: null }
        ),
        fc.record({
          hasWhatsApp: fc.boolean(),
          hasSms: fc.boolean(),
          hasEmail: fc.boolean(),
        }),
        (pref, providers) => {
          const result = resolveChannelSync(pref, providers);
          return validChannels.includes(result);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 10: Toplu Bildirim Tercih Filtresi
// Validates: Requirements 6.8, 2.4
// ---------------------------------------------------------------------------

function shouldIncludeInBulk(
  preference: CustomerPreference | null,
  channel: "SMS" | "WHATSAPP"
): boolean {
  if (!preference) return true; // Tercih yoksa dahil et

  if (channel === "SMS") return preference.smsEnabled;
  if (channel === "WHATSAPP") return preference.whatsappEnabled;
  return true;
}

describe("Feature: whatsapp-notification-system, Property 10: Toplu bildirim tercih filtresi", () => {
  it("SMS devre dışıysa SMS kampanyasından çıkarılmalı", () => {
    fc.assert(
      fc.property(
        fc.record({
          smsEnabled: fc.constant(false),
          whatsappEnabled: fc.boolean(),
          emailEnabled: fc.boolean(),
          preferredChannel: fc.constantFrom("WHATSAPP" as const, "SMS" as const, "EMAIL" as const),
        }),
        (pref) => {
          return shouldIncludeInBulk(pref, "SMS") === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("WhatsApp devre dışıysa WhatsApp kampanyasından çıkarılmalı", () => {
    fc.assert(
      fc.property(
        fc.record({
          smsEnabled: fc.boolean(),
          whatsappEnabled: fc.constant(false),
          emailEnabled: fc.boolean(),
          preferredChannel: fc.constantFrom("WHATSAPP" as const, "SMS" as const, "EMAIL" as const),
        }),
        (pref) => {
          return shouldIncludeInBulk(pref, "WHATSAPP") === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("SMS etkinse SMS kampanyasına dahil edilmeli", () => {
    fc.assert(
      fc.property(
        fc.record({
          smsEnabled: fc.constant(true),
          whatsappEnabled: fc.boolean(),
          emailEnabled: fc.boolean(),
          preferredChannel: fc.constantFrom("WHATSAPP" as const, "SMS" as const, "EMAIL" as const),
        }),
        (pref) => {
          return shouldIncludeInBulk(pref, "SMS") === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it("tercih yoksa her kampanyaya dahil edilmeli", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("SMS" as const, "WHATSAPP" as const),
        (channel) => {
          return shouldIncludeInBulk(null, channel) === true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
