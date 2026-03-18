import { z } from "zod";
import { openai } from "@/lib/ai/client";
import { SYSTEM_PROMPT, buildSpecificAimsUserPrompt } from "@/lib/ai/prompts";
import { GrantCritiqueSchema, GrantCritique } from "@/lib/schemas/critique";
import { logger } from "@/lib/logging/logger";
import { MODEL_NAME, PROMPT_VERSION, TEMPERATURE } from "@/lib/constants";
import { AnalyzeError } from "@/lib/utils/errors";

const MAX_RETRIES = 1;

// JSON Schema used for model-side structured output constraints.
// This mirrors GrantCritiqueSchema and is kept intentionally simple.
const grantCritiqueJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    overall_assessment: {
      type: "object",
      additionalProperties: false,
      properties: {
        rating: { type: "string" },
        summary: { type: "string" },
        reviewer_confidence: {
          type: "string",
          enum: ["low", "medium", "high"]
        }
      },
      required: ["rating", "summary", "reviewer_confidence"]
    },
    strengths: {
      type: "array",
      items: { type: "string" }
    },
    major_concerns: {
      type: "array",
      items: { type: "string" }
    },
    reviewer_critique: { type: "string" },
    suggestions_for_improvement: {
      type: "array",
      items: { type: "string" }
    },
    rewrite_suggestions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          issue: { type: "string" },
          original_excerpt: { type: "string" },
          suggested_revision: { type: "string" }
        },
        required: ["issue", "original_excerpt", "suggested_revision"]
      }
    },
    meta_assessment: {
      type: "object",
      additionalProperties: false,
      properties: {
        likely_competitiveness: {
          type: "string",
          enum: ["weak", "mixed", "promising"]
        },
        main_risk_area: {
          type: "string",
          enum: [
            "significance",
            "innovation",
            "clarity",
            "feasibility",
            "approach",
            "alignment",
            "scope",
            "writing"
          ]
        }
      },
      required: ["likely_competitiveness", "main_risk_area"]
    }
  },
  required: [
    "overall_assessment",
    "strengths",
    "major_concerns",
    "reviewer_critique",
    "suggestions_for_improvement",
    "rewrite_suggestions",
    "meta_assessment"
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

      const response = await openai.responses.create({
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

      const firstOutput = response.output[0];
      if (!firstOutput || firstOutput.type !== "message") {
        throw new AnalyzeError(
          "INVALID_MODEL_OUTPUT",
          "Model did not return a message output."
        );
      }

      const content = firstOutput.message.content[0];
      if (
        !content ||
        (content.type !== "output_text" && content.type !== "output_json")
      ) {
        throw new AnalyzeError(
          "INVALID_MODEL_OUTPUT",
          "Model did not return structured JSON content."
        );
      }

      let parsedJson: RawModelResult;
      try {
        if (content.type === "output_json") {
          parsedJson = content.json;
        } else {
          parsedJson = JSON.parse(content.text);
        }
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

