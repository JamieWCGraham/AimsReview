import { z } from "zod";

const rubricScore = z.number().int().min(1).max(9);

export const RubricDimensionSchema = z.object({
  score: rubricScore,
  rationale: z.string()
});

export const ReviewerRubricSchema = z.object({
  significance: RubricDimensionSchema,
  innovation: RubricDimensionSchema,
  approach: RubricDimensionSchema,
  feasibility: RubricDimensionSchema,
  overall_score: rubricScore,
  overall_rationale: z.string()
});

export const GrantCritiqueSchema = z.object({
  rubric: ReviewerRubricSchema,
  strengths: z.array(z.string()).min(0).max(8),
  major_concerns: z.array(z.string()).min(1).max(8),
  reviewer_critique: z.string(),
  suggestions_for_improvement: z.array(z.string()).min(1).max(8)
});

export type GrantCritique = z.infer<typeof GrantCritiqueSchema>;

