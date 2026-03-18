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

  const exampleAims = `SPECIFIC AIMS

Acute kidney injury (AKI) affects over 10 million hospitalized patients worldwide each year and is strongly associated with mortality, prolonged length of stay, and progression to chronic kidney disease. Despite decades of work, clinicians still lack reliable, early warning tools that can identify high‑risk patients in time to intervene. Existing risk scores are coarse, static, and rarely integrated into real‑time workflows. As a result, potentially preventable renal injury is often detected only after creatinine has already risen, when damage is harder to reverse.

Our long‑term goal is to reduce preventable AKI in hospitalized adults by coupling high‑fidelity electronic health record (EHR) data with interpretable, clinician‑facing decision support. The overall objective of this application is to develop and prospectively evaluate a pragmatic, real‑time AKI risk prediction system embedded in routine hospital care. Our central hypothesis is that a well‑calibrated, interpretable model that surfaces specific, actionable risk factors will improve clinician trust and enable earlier, targeted interventions that reduce the incidence and severity of AKI. This hypothesis is supported by strong preliminary data from our institution demonstrating that (1) granular trajectories of vitals, labs, and medication exposures are predictive of near‑term AKI and (2) clinicians are more likely to act on models that explain “why” a patient is high‑risk.

We will pursue the following Specific Aims:

Aim 1: Develop and internally validate a real‑time AKI prediction model using multi‑center EHR data. We will assemble a retrospective cohort of >150,000 hospitalizations across three academic medical centers, harmonize key variables, and train time‑updated models to predict AKI within the next 48 hours. We will compare traditional regression, gradient boosting, and sequence models, prioritizing calibration, transportability, and stability across sites. We expect to identify a model that reliably stratifies risk and remains robust across hospitals and subgroups.

Aim 2: Design an interpretable, clinician‑facing interface that links AKI risk to concrete, patient‑specific drivers. Using human‑centered design methods with hospitalists, nephrologists, and nurses, we will iteratively prototype visualizations that expose the main contributors to a given patient’s risk (e.g., nephrotoxic medications, volume status, hemodynamics) and suggest candidate actions aligned with existing guidelines. We will evaluate comprehension, perceived usefulness, and potential for alert fatigue in simulation studies. Our working hypothesis is that transparent, factor‑level explanations will increase clinician willingness to act on alerts without increasing cognitive load.

Aim 3: Conduct a pragmatic, stepped‑wedge trial to test whether the AKI prediction and explanation system improves clinical processes and patient outcomes. We will roll out the intervention across six medicine units over 18 months, comparing rates of AKI, timing of nephrology consultation, adjustment of nephrotoxic medications, and adherence to hospital AKI bundles before and after activation. We anticipate that units receiving the intervention will demonstrate earlier recognition of high‑risk patients, more timely process‑of‑care changes, and a measurable reduction in moderate‑to‑severe AKI.

Impact: Successful completion of these aims will establish a scalable, interpretable framework for real‑time AKI risk prediction that is tightly integrated into clinical workflows. By emphasizing transparency, transportability, and pragmatic evaluation, this work will provide a generalizable blueprint for using EHR‑driven models to prevent organ injury in hospitalized patients.`;

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
        <h1 className="text-3xl font-semibold text-slate-900">
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
          helperBelowLabel={
            <div className="flex items-center gap-3">
              <span>Best results: paste a full 1-page Specific Aims section.</span>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-800 shadow-sm transition hover:bg-slate-50"
                onClick={() => {
                  setText(exampleAims);
                  setInputError(null);
                }}
              >
                Load example
              </button>
            </div>
          }
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
          <ResultsPanel
            critique={state.data.result}
            promptVersion={state.data.promptVersion}
            model={state.data.model}
          />
        )}
      </section>

      <footer className="mt-12 border-t border-slate-200 pt-4">
        <p className="text-xs text-slate-500">
          Feedback is generated from the writing provided and should be treated
          as an early critique aid, not a substitute for expert scientific
          review. Evaluates only the writing provided; does not verify
          scientific claims.
        </p>
      </footer>
    </main>
  );
}

