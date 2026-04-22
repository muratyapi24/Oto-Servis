/**
 * Stripe SDK kurulumu
 * Ortam değişkenleri: STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET
 */

let stripeInstance: any = null;

export async function getStripe() {
  if (!stripeInstance) {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY ortam değişkeni tanımlı değil");
    }
    const Stripe = (await import("stripe")).default;
    stripeInstance = new Stripe(stripeKey, { apiVersion: "2026-06-20" as any });
  }
  return stripeInstance;
}

export const STRIPE_PUBLISHABLE_KEY = process.env.STRIPE_PUBLISHABLE_KEY ?? "";
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "";
