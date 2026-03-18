"use client";

import { useEffect, useRef, useState } from "react";
import { AimInput } from "@/components/AimInput";
import { AnalyzeButton } from "@/components/AnalyzeButton";
import { ErrorBanner } from "@/components/ErrorBanner";
import { LoadingState } from "@/components/LoadingState";
import { ResultsPanel } from "@/components/ResultsPanel";
import type {
  AnalyzeResponse,
  AnalyzeSuccessResponse
} from "@/lib/ai/types";
import { MIN_AIMS_LENGTH } from "@/lib/constants";

type AnalyzeState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: AnalyzeSuccessResponse }
  | { status: "error"; errorMessage: string };

export default function Page() {
  const [text, setText] = useState("");
  const [state, setState] = useState<AnalyzeState>({ status: "idle" });
  const [inputError, setInputError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (state.status === "success" && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [state.status]);

  async function handleAnalyze() {
    setInputError(null);

    const trimmed = text.trim();
    if (!trimmed) {
      setInputError("Please paste your Specific Aims text.");
      return;
    }
    if (trimmed.length < MIN_AIMS_LENGTH) {
      setInputError(
        "This appears shorter than a typical Specific Aims page. Please ensure you have pasted the full section."
      );
      return;
    }

    setState({ status: "loading" });

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ specificAimsText: trimmed })
      });

      const json = (await res.json()) as AnalyzeResponse;

      if (!json.ok) {
        const message =
          json.error.code === "INVALID_INPUT"
            ? "Please provide a valid Specific Aims section."
            : json.error.code === "RATE_LIMITED"
            ? "The service is temporarily rate limited. Please try again shortly."
            : json.error.code === "INVALID_MODEL_OUTPUT"
            ? "Analysis failed. Please try again."
            : "Something went wrong during analysis. Please try again.";

        setState({ status: "error", errorMessage: message });
        return;
      }

      setState({ status: "success", data: json });
    } catch (error) {
      setState({
        status: "error",
        errorMessage:
          "Unable to reach the analysis service. Please check your connection and try again."
      });
    }
  }

  const showLoading = state.status === "loading";
  const showError = state.status === "error";
  const showResults = state.status === "success";

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 pb-10 pt-10">
      <header className="mb-8 space-y-2">
        <h1 className="text-2xl font-semibold text-slate-900">
          Aims Review
        </h1>
        <p className="max-w-2xl text-sm text-slate-700">
          Structured critique for grant Specific Aims pages. Paste your full
          Specific Aims text to simulate how a rigorous reviewer might respond.
        </p>
      </header>

      <section className="space-y-4">
        <AimInput
          label="Specific Aims text"
          placeholder="Paste the full text of your Specific Aims page here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          error={inputError ?? undefined}
        />

        <div className="flex items-center justify-between gap-4">
          <div className="space-x-3">
            <AnalyzeButton loading={showLoading} onClick={handleAnalyze}>
              Analyze
            </AnalyzeButton>
          </div>
          {showLoading && <LoadingState />}
        </div>

        {showError && <ErrorBanner message={state.errorMessage} />}
      </section>

      <section ref={resultsRef} className="mt-10">
        {showResults && (
          <ResultsPanel critique={state.data.result} />
        )}
      </section>

      <footer className="mt-12 border-t border-slate-200 pt-4">
        <p className="text-xs text-slate-500">
          Feedback is generated from the writing provided and should be treated
          as an early critique aid, not a substitute for expert scientific
          review.
        </p>
      </footer>
    </main>
  );
}

