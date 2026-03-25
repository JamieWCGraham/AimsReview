import { z } from "zod";
import { SYSTEM_PROMPT, buildSpecificAimsUserPrompt } from "@/lib/ai/prompts";
import { GrantCritiqueSchema, GrantCritique } from "@/lib/schemas/critique";
import { logger } from "@/lib/logging/logger";
import { MODEL_NAME, PROMPT_VERSION, TEMPERATURE } from "@/lib/constants";
import { AnalyzeError } from "@/lib/utils/errors";
import { getTracedOpenAI } from "@/lib/ai/langfuse";

const MAX_RETRIES = 1;

// JSON Schema used for model-side structured output constraints.
// This mirrors GrantCritiqueSchema and is kept intentionally simple.
const rubricDimension = {
  type: "object",
  additionalProperties: false,
  properties: {
    score: { type: "integer", minimum: 1, maximum: 9 },
    rationale: { type: "string" }
  },
  required: ["score", "rationale"]
} as const;

const grantCritiqueJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    rubric: {
      type: "object",
      additionalProperties: false,
      properties: {
        significance: rubricDimension,
        innovation: rubricDimension,
        approach: rubricDimension,
        feasibility: rubricDimension,
        overall_score: { type: "integer", minimum: 1, maximum: 9 },
        overall_rationale: { type: "string" }
      },
      required: [
        "significance",
        "innovation",
        "approach",
        "feasibility",
        "overall_score",
        "overall_rationale"
      ]
    },
    strengths: {
      type: "array",
      items: { type: "string" },
      minItems: 0,
      maxItems: 8
    },
    major_concerns: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
      maxItems: 8
    },
    reviewer_critique: { type: "string" },
    suggestions_for_improvement: {
      type: "array",
      items: { type: "string" },
      minItems: 1,
      maxItems: 8
    }
  },
  required: [
    "rubric",
    "strengths",
    "major_concerns",
    "reviewer_critique",
    "suggestions_for_improvement"
  ]
} as const;

type RawModelResult = unknown;

export async function analyzeSpecificAims(args: {
  specificAimsText: string;
  requestId: string;
}): Promise<{
  result: GrantCritique;
  promptVersion: string;
  model: string;
  latencyMs: number;
}> {
  const { specificAimsText, requestId } = args;
  const startedAt = Date.now();

  let attempt = 0;
  let lastValidationError: z.ZodError | null = null;

  while (attempt <= MAX_RETRIES) {
    const attemptStart = Date.now();
    attempt += 1;

    try {
      const userPrompt = buildSpecificAimsUserPrompt({ specificAimsText });

      const tracedOpenai = await getTracedOpenAI({
        generationName: "aims-review.analyze_specific_aims",
        generationMetadata: {
          requestId,
          attempt,
          promptVersion: PROMPT_VERSION
        },
        tags: ["aims-review", "specific-aims"]
      });

      let response: unknown = null;
      try {
        response = await tracedOpenai.responses.create({
          model: MODEL_NAME,
          temperature: TEMPERATURE,
          text: {
            format: {
              type: "json_schema",
              name: "grant_critique",
              schema: grantCritiqueJsonSchema,
              strict: true
            }
          },
          input: [
            {
              role: "system",
              content: SYSTEM_PROMPT
            },
            {
              role: "user",
              content: userPrompt
            }
          ]
        });
      } finally {
        // Ensure queued spans are flushed in short-lived runtimes.
        await (tracedOpenai as { flushAsync?: () => Promise<void> }).flushAsync?.();
      }

      // Prefer top-level output_text (recommended by SDK); otherwise use first output item's content.
      const responseObj = response as {
        output_text?: string;
        output?: Array<{
          type: string;
          content?: Array<{ type: string; text?: string }>;
        }>;
      };

      let rawText: string | undefined;

      if (typeof responseObj.output_text === "string" && responseObj.output_text.trim()) {
        rawText = responseObj.output_text;
      } else {
        const firstOutput = responseObj.output?.[0];
        if (
          firstOutput?.type === "message" &&
          Array.isArray(firstOutput.content) &&
          firstOutput.content.length > 0
        ) {
          const firstContent = firstOutput.content[0];
          if (firstContent?.type === "output_text" && typeof firstContent.text === "string") {
            rawText = firstContent.text;
          }
        }
      }

      if (rawText == null || !rawText.trim()) {
        throw new AnalyzeError(
          "INVALID_MODEL_OUTPUT",
          "Model did not return a message output."
        );
      }

      let parsedJson: RawModelResult;
      try {
        parsedJson = JSON.parse(rawText);
      } catch (err) {
        throw new AnalyzeError(
          "INVALID_MODEL_OUTPUT",
          "Model returned non-JSON output."
        );
      }

      const validation = GrantCritiqueSchema.safeParse(parsedJson);
      if (!validation.success) {
        lastValidationError = validation.error;
        logger.error("model_output_validation_failed", {
          requestId,
          attempt,
          promptVersion: PROMPT_VERSION,
          model: MODEL_NAME,
          issues: validation.error.issues
        });

        if (attempt > MAX_RETRIES) {
          throw new AnalyzeError(
            "INVALID_MODEL_OUTPUT",
            "Model output did not match expected schema."
          );
        }

        continue;
      }

      const totalLatency = Date.now() - startedAt;

      logger.info("analysis_completed", {
        requestId,
        model: MODEL_NAME,
        promptVersion: PROMPT_VERSION,
        attempts: attempt,
        latencyMs: totalLatency
      });

      return {
        result: validation.data,
        promptVersion: PROMPT_VERSION,
        model: MODEL_NAME,
        latencyMs: totalLatency
      };
    } catch (err: unknown) {
      const latencyMs = Date.now() - attemptStart;

      if (err instanceof AnalyzeError) {
        if (err.code === "INVALID_MODEL_OUTPUT" && attempt <= MAX_RETRIES) {
          continue;
        }

        logger.error("analysis_error", {
          requestId,
          code: err.code,
          message: err.message,
          model: MODEL_NAME,
          promptVersion: PROMPT_VERSION,
          attempt,
          latencyMs
        });

        throw err;
      }

      const anyErr = err as { status?: number; message?: string };
      const status = anyErr.status;

      const code =
        status === 429
          ? ("RATE_LIMITED" as const)
          : ("MODEL_ERROR" as const);

      logger.error("analysis_unexpected_error", {
        requestId,
        code,
        message: anyErr?.message ?? "Unknown error",
        model: MODEL_NAME,
        promptVersion: PROMPT_VERSION,
        attempt,
        latencyMs,
        lastValidationError: lastValidationError?.issues
      });

      throw new AnalyzeError(
        code,
        code === "RATE_LIMITED"
          ? "The model is currently rate limited."
          : "The model request failed."
      );
    }
  }

  throw new AnalyzeError(
    "INVALID_MODEL_OUTPUT",
    "Model output did not match expected schema."
  );
}

