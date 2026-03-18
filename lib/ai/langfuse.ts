import { observeOpenAI } from "@langfuse/openai";

import { openai } from "@/lib/ai/client";
import { logger } from "@/lib/logging/logger";

type ObserveOpenAIConfig = Parameters<typeof observeOpenAI>[1];

declare global {
  // Used to keep OTEL startup idempotent across hot reloads / multiple route invocations.
  // eslint-disable-next-line no-var
  var __aimsReviewLangfuseOtelStarted: boolean | undefined;
  var __aimsReviewLangfuseEnabled: boolean | undefined;
}

async function ensureOtelStarted() {
  if (global.__aimsReviewLangfuseOtelStarted) return;

  const hasLangfuseEnv =
    Boolean(process.env.LANGFUSE_PUBLIC_KEY) &&
    Boolean(process.env.LANGFUSE_SECRET_KEY) &&
    Boolean(process.env.LANGFUSE_BASE_URL);

  if (!hasLangfuseEnv) {
    logger.info("langfuse_skipped_missing_env");
    global.__aimsReviewLangfuseOtelStarted = true;
    global.__aimsReviewLangfuseEnabled = false;
    return;
  }

  try {
    // Lazy-load OTEL pieces to avoid Next.js build-time side effects.
    const [{ NodeSDK }, { LangfuseSpanProcessor }] = await Promise.all([
      import("@opentelemetry/sdk-node"),
      import("@langfuse/otel")
    ]);

    const sdk = new NodeSDK({
      spanProcessors: [new LangfuseSpanProcessor()],
    });

    sdk.start();
    global.__aimsReviewLangfuseOtelStarted = true;
    global.__aimsReviewLangfuseEnabled = true;
  } catch (err: unknown) {
    logger.error("langfuse_otel_start_failed", {
      message: err instanceof Error ? err.message : "Unknown error"
    });
    global.__aimsReviewLangfuseOtelStarted = true;
    global.__aimsReviewLangfuseEnabled = false;
  }
}

export async function getTracedOpenAI(config?: ObserveOpenAIConfig) {
  await ensureOtelStarted();
  if (global.__aimsReviewLangfuseEnabled === false) return openai;
  return observeOpenAI(openai, config) as any;
}

