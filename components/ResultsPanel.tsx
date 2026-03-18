import type { GrantCritique } from "@/lib/schemas/critique";
import { SectionCard } from "@/components/SectionCard";
import { CopyResultsButton } from "@/components/CopyResultsButton";
import { formatCritiqueForClipboard } from "@/lib/utils/format";

type Props = {
  critique: GrantCritique;
};

export function ResultsPanel({ critique }: Props) {
  async function handleCopy() {
    const text = formatCritiqueForClipboard(critique);
    await navigator.clipboard.writeText(text);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">
          Structured critique
        </h2>
        <CopyResultsButton onCopy={handleCopy} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard title="Overall Assessment">
          <p className="text-sm">
            <span className="font-semibold">Rating:</span>{" "}
            {critique.overall_assessment.rating}
          </p>
          <p className="text-sm">
            <span className="font-semibold">Reviewer confidence:</span>{" "}
            {critique.overall_assessment.reviewer_confidence}
          </p>
          <p className="mt-2 text-sm">
            <span className="font-semibold">Summary:</span>{" "}
            {critique.overall_assessment.summary}
          </p>
        </SectionCard>

        <SectionCard title="Meta Assessment">
          <p className="text-sm">
            <span className="font-semibold">Likely competitiveness:</span>{" "}
            {critique.meta_assessment.likely_competitiveness}
          </p>
          <p className="text-sm">
            <span className="font-semibold">Main risk area:</span>{" "}
            {critique.meta_assessment.main_risk_area}
          </p>
        </SectionCard>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <SectionCard title="Strengths">
          {critique.strengths.length === 0 ? (
            <p className="text-sm text-slate-600">No major strengths listed.</p>
          ) : (
            <ul className="list-disc space-y-1 pl-4">
              {critique.strengths.map((s, idx) => (
                <li key={idx}>{s}</li>
              ))}
            </ul>
          )}
        </SectionCard>

        <SectionCard title="Major Concerns">
          <ul className="list-disc space-y-1 pl-4">
            {critique.major_concerns.map((c, idx) => (
              <li key={idx}>{c}</li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <SectionCard title="Reviewer Critique">
        <p>{critique.reviewer_critique}</p>
      </SectionCard>

      <SectionCard title="Suggestions for Improvement">
        <ul className="list-disc space-y-1 pl-4">
          {critique.suggestions_for_improvement.map((s, idx) => (
            <li key={idx}>{s}</li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="Rewrite Suggestions">
        {critique.rewrite_suggestions.length === 0 ? (
          <p className="text-sm text-slate-600">
            No specific rewrite suggestions were generated.
          </p>
        ) : (
          <ol className="space-y-3">
            {critique.rewrite_suggestions.map((item, idx) => (
              <li key={idx} className="space-y-1 text-sm">
                <p>
                  <span className="font-semibold">Issue:</span> {item.issue}
                </p>
                {item.original_excerpt && (
                  <p>
                    <span className="font-semibold">Original excerpt:</span>{" "}
                    {item.original_excerpt}
                  </p>
                )}
                <p>
                  <span className="font-semibold">Suggested revision:</span>{" "}
                  {item.suggested_revision}
                </p>
              </li>
            ))}
          </ol>
        )}
      </SectionCard>
    </div>
  );
}

