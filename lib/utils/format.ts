import type { GrantCritique } from "@/lib/schemas/critique";

function appendRubricSections(lines: string[], critique: GrantCritique): void {
  lines.push("Reviewer rubric (1–9)");
  lines.push(
    `Overall: ${critique.rubric.overall_score} / 9`,
    critique.rubric.overall_rationale,
    ""
  );
  const dims = [
    ["significance", "Significance"],
    ["innovation", "Innovation"],
    ["approach", "Approach"],
    ["feasibility", "Feasibility"]
  ] as const;
  for (const [key, label] of dims) {
    const d = critique.rubric[key];
    lines.push(`${label}: ${d.score} / 9`);
    lines.push(d.rationale, "");
  }
}

export function formatCritiqueForClipboard(critique: GrantCritique): string {
  const lines: string[] = [];

  lines.push("Aims Review", "");

  appendRubricSections(lines, critique);

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

  return lines.join("\n");
}

export function formatCritiqueAsMarkdown(critique: GrantCritique): string {
  const lines: string[] = [];

  lines.push("# Aims Review", "");

  lines.push("## Reviewer rubric (1–9)");
  lines.push(
    `- **Overall**: **${critique.rubric.overall_score} / 9** — ${critique.rubric.overall_rationale}`,
    ""
  );
  for (const [key, label] of [
    ["significance", "Significance"],
    ["innovation", "Innovation"],
    ["approach", "Approach"],
    ["feasibility", "Feasibility"]
  ] as const) {
    const d = critique.rubric[key];
    lines.push(`### ${label}: ${d.score} / 9`);
    lines.push(`${d.rationale}`, "");
  }

  lines.push("## Strengths");
  if (critique.strengths.length === 0) {
    lines.push("- (none identified)");
  } else {
    for (const s of critique.strengths) {
      lines.push(`- ${s}`);
    }
  }
  lines.push("");

  lines.push("## Major Concerns");
  if (critique.major_concerns.length === 0) {
    lines.push("- (none identified)");
  } else {
    for (const c of critique.major_concerns) {
      lines.push(`- ${c}`);
    }
  }
  lines.push("");

  lines.push("## Reviewer Critique");
  lines.push(critique.reviewer_critique, "");

  lines.push("## Suggestions for Improvement");
  if (critique.suggestions_for_improvement.length === 0) {
    lines.push("- (none identified)");
  } else {
    for (const s of critique.suggestions_for_improvement) {
      lines.push(`- ${s}`);
    }
  }

  return lines.join("\n");
}

