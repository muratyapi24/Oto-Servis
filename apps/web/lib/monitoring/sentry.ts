type SentryContext = {
  extra?: Record<string, unknown>;
  tags?: Record<string, string>;
};

async function loadSentry() {
  if (!process.env.SENTRY_DSN) {
    return null;
  }

  return import("@sentry/nextjs");
}

export async function captureSentryException(error: unknown, context?: SentryContext) {
  const sentry = await loadSentry();
  sentry?.captureException(error, context);
}

export async function captureSentryMessage(message: string, context?: SentryContext) {
  const sentry = await loadSentry();
  sentry?.captureMessage(message, context);
}
