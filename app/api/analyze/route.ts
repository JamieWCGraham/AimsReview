import { NextResponse } from "next/server";
import { AnalyzeRequestSchema } from "@/lib/schemas/request";
import { analyzeSpecificAims } from "@/lib/ai/analyzeSpecificAims";
import { normalizeSpecificAimsText } from "@/lib/utils/text";
import type { AnalyzeErrorCode } from "@/lib/utils/errors";
import { AnalyzeError } from "@/lib/utils/errors";
import { logger } from "@/lib/logging/logger";
import { MODEL_NAME, PROMPT_VERSION } from "@/lib/constants";

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();
  const startedAt = Date.now();

  try {
    const body = await req.json();
    const parsed = AnalyzeRequestSchema.safeParse({
      specificAimsText:
        typeof body?.specificAimsText === "string"
          ? normalizeSpecificAimsText(body.specificAimsText)
          : body?.specificAimsText
    });

    if (!parsed.success) {
      logger.info("request_validation_failed", {
        requestId,
        issues: parsed.error.issues
      });

      return NextResponse.json(
        {
          ok: false as const,
          requestId,
          error: {
            code: "INVALID_INPUT" as AnalyzeErrorCode,
            message: "Please provide a valid Specific Aims section."
          }
        },
        { status: 400 }
      );
    }

    const inputText = parsed.data.specificAimsText;

    logger.info("analysis_request_received", {
      requestId,
      inputChars: inputText.length,
      estimatedWords: inputText.trim().split(/\s+/).length,
      model: MODEL_NAME,
      promptVersion: PROMPT_VERSION
    });

    const result = await analyzeSpecificAims({
      specificAimsText: inputText,
      requestId
    });

    const latencyMs = Date.now() - startedAt;

    logger.info("analysis_request_completed", {
      requestId,
      latencyMs,
      model: result.model,
      promptVersion: result.promptVersion
    });

    return NextResponse.json({
      ok: true as const,
      requestId,
      ...result
    });
  } catch (error: unknown) {
    const latencyMs = Date.now() - startedAt;

    let code: AnalyzeErrorCode = "UNKNOWN";
    let message = "Failed to analyze specific aims.";

    if (error instanceof AnalyzeError) {
      code = error.code;
      if (code === "RATE_LIMITED") {
        message = "The service is temporarily rate limited. Please try again.";
      } else if (code === "INVALID_MODEL_OUTPUT") {
        message = "Analysis failed. Please try again.";
      } else if (code === "MODEL_ERROR") {
        message = "The analysis service encountered an error. Please retry.";
      }
    }

    logger.error("analysis_request_error", {
      requestId,
      code,
      latencyMs,
      model: MODEL_NAME,
      promptVersion: PROMPT_VERSION,
      errorMessage: (error as Error)?.message
    });

    const status =
      code === "INVALID_INPUT"
        ? 400
        : code === "RATE_LIMITED"
        ? 429
        : 500;

    return NextResponse.json(
      {
        ok: false as const,
        requestId,
        error: {
          code,
          message
        }
      },
      { status }
    );
  }
}

