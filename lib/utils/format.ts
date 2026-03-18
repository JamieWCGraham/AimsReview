import type { GrantCritique } from "@/lib/schemas/critique";

export function formatCritiqueForClipboard(critique: GrantCritique): string {
  const lines: string[] = [];

  lines.push("Aims Review", "");

  lines.push("Overall Assessment");
  lines.push(`Rating: ${critique.overall_assessment.rating}`);
  lines.push(
    `Reviewer Confidence: ${capitalize(
      critique.overall_assessment.reviewer_confidence
    )}`
  );
  lines.push(`Summary: ${critique.overall_assessment.summary}`, "");

  lines.push("Strengths");
  if (critique.strengths.length === 0) {
    lines.push("- (none identified)");
  } else {
    for (const s of critique.strengths) {
      lines.push(`- ${s}`);
    }
  }
  lines.push("");

  lines.push("Major Concerns");
  for (const c of critique.major_concerns) {
    lines.push(`- ${c}`);
  }
  lines.push("");

  lines.push("Reviewer Critique");
  lines.push(critique.reviewer_critique, "");

  lines.push("Suggestions for Improvement");
  for (const s of critique.suggestions_for_improvement) {
    lines.push(`- ${s}`);
  }
  lines.push("");

  lines.push("Rewrite Suggestions");
  if (critique.rewrite_suggestions.length === 0) {
    lines.push("(none)");
  } else {
    critique.rewrite_suggestions.forEach((item, index) => {
      const n = index + 1;
      lines.push(`${n}. Issue: ${item.issue}`);
      if (item.original_excerpt) {
        lines.push(`   Original Excerpt: ${item.original_excerpt}`);
      }
      lines.push(`   Suggested Revision: ${item.suggested_revision}`, "");
    });
  }

  lines.push("Meta Assessment");
  lines.push(
    `Likely Competitiveness: ${capitalize(
      critique.meta_assessment.likely_competitiveness
    )}`
  );
  lines.push(
    `Main Risk Area: ${capitalize(critique.meta_assessment.main_risk_area)}`
  );

  return lines.join("\n");
}

function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

