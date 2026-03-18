import { z } from "zod";
import { MIN_AIMS_LENGTH, MAX_AIMS_LENGTH } from "@/lib/constants";

export const AnalyzeRequestSchema = z.object({
  specificAimsText: z
    .string()
    .min(MIN_AIMS_LENGTH, "Specific aims text is too short.")
    .max(MAX_AIMS_LENGTH, "Specific aims text is too long.")
});

export type AnalyzeRequest = z.infer<typeof AnalyzeRequestSchema>;

