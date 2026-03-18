import { z } from "zod";
import { GrantCritiqueSchema } from "@/lib/schemas/critique";

export const AnalyzeSuccessResponseSchema = z.object({
  ok: z.literal(true),
  requestId: z.string(),
  result: GrantCritiqueSchema,
  promptVersion: z.string(),
  model: z.string(),
  latencyMs: z.number()
});

export type AnalyzeSuccessResponse = z.infer<
  typeof AnalyzeSuccessResponseSchema
>;

export const AnalyzeErrorResponseSchema = z.object({
  ok: z.literal(false),
  requestId: z.string(),
  error: z.object({
    code: z.enum([
      "INVALID_INPUT",
      "MODEL_ERROR",
      "INVALID_MODEL_OUTPUT",
      "RATE_LIMITED",
      "UNKNOWN"
    ]),
    message: z.string()
  })
});

export type AnalyzeErrorResponse = z.infer<typeof AnalyzeErrorResponseSchema>;

export const AnalyzeResponseSchema = z.union([
  AnalyzeSuccessResponseSchema,
  AnalyzeErrorResponseSchema
]);

export type AnalyzeResponse = z.infer<typeof AnalyzeResponseSchema>;

