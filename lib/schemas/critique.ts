import { z } from "zod";

export const RewriteSuggestionSchema = z.object({
  issue: z.string(),
  original_excerpt: z.string().optional(),
  suggested_revision: z.string()
});

export const GrantCritiqueSchema = z.object({
  overall_assessment: z.object({
    rating: z.string(),
    summary: z.string(),
    reviewer_confidence: z.enum(["low", "medium", "high"])
  }),
  strengths: z.array(z.string()).min(0).max(8),
  major_concerns: z.array(z.string()).min(1).max(8),
  reviewer_critique: z.string(),
  suggestions_for_improvement: z.array(z.string()).min(1).max(10),
  rewrite_suggestions: z.array(RewriteSuggestionSchema).max(5),
  meta_assessment: z.object({
    likely_competitiveness: z.enum(["weak", "mixed", "promising"]),
    main_risk_area: z.enum([
      "significance",
      "innovation",
      "clarity",
      "feasibility",
      "approach",
      "alignment",
      "scope",
      "writing"
    ])
  })
});

export type GrantCritique = z.infer<typeof GrantCritiqueSchema>;

