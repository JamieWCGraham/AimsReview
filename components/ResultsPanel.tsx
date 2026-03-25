import type { GrantCritique } from "@/lib/schemas/critique";
import { SectionCard } from "@/components/SectionCard";
import { CopyResultsButton } from "@/components/CopyResultsButton";
import { DownloadMarkdownButton } from "@/components/DownloadMarkdownButton";
import {
  formatCritiqueAsMarkdown,
  formatCritiqueForClipboard
} from "@/lib/utils/format";

type Props = {
  critique: GrantCritique;
  promptVersion: string;
  model: string;
};

const RUBRIC_CRITERIA = [
  { id: "significance" as const, label: "Significance" },
  { id: "innovation" as const, label: "Innovation" },
  { id: "approach" as const, label: "Approach" },
  { id: "feasibility" as const, label: "Feasibility" }
];

export function ResultsPanel({ critique, promptVersion, model }: Props) {
  async function handleCopy() {
    const text = formatCritiqueForClipboard(critique);
    await navigator.clipboard.writeText(text);
  }

  function handleDownloadMarkdown() {
    const markdown = formatCritiqueAsMarkdown(critique);
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });

    const a = document.createElement("a");
    const url = URL.createObjectURL(blob);
    a.href = url;

    const date = new Date().toISOString().slice(0, 10);
    a.download = `aims-review-${date}.md`;

    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">
          Structured critique
        </h2>
        <div className="flex items-center gap-2">
          <DownloadMarkdownButton onDownload={handleDownloadMarkdown} />
          <CopyResultsButton onCopy={handleCopy} />
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Prompt {promptVersion} · {model} · generated just now
      </p>

      <SectionCard title="Reviewer rubric (1–9)">
        <div className="border-b border-slate-200 pb-4">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-sm font-medium text-slate-600">Overall score</span>
            <span className="text-3xl font-semibold tabular-nums tracking-tight text-slate-900">
              {critique.rubric.overall_score}
            </span>
            <span className="text-sm text-slate-500">/ 9</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-700">
            {critique.rubric.overall_rationale}
          </p>
        </div>
        <dl className="mt-4 space-y-4">
          {RUBRIC_CRITERIA.map(({ id, label }) => {
            const dim = critique.rubric[id];
            return (
              <div key={id}>
                <dt className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-sm font-semibold text-slate-900">
                    {label}
                  </span>
                  <span className="text-sm tabular-nums text-slate-600">
                    {dim.score} / 9
                  </span>
                </dt>
                <dd className="mt-1.5 text-sm leading-relaxed text-slate-700">
                  {dim.rationale}
                </dd>
              </div>
            );
          })}
        </dl>
      </SectionCard>

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
        <p className="text-sm leading-relaxed text-slate-700">
          {critique.reviewer_critique}
        </p>
      </SectionCard>

      <SectionCard title="Suggestions for Improvement">
        <ul className="list-disc space-y-1 pl-4">
          {critique.suggestions_for_improvement.map((s, idx) => (
            <li key={idx}>{s}</li>
          ))}
        </ul>
      </SectionCard>
    </div>
  );
}

