import { useState, type KeyboardEvent } from "react";

interface ProcessState {
  biomass?: number;
  substrate?: number;
  product?: number;
  DO?: number;
  temperature?: number;
  pH?: number;
  aeration?: number;
  agitation?: number;
  growth_rate?: number;
  oxygen_transfer?: number;
  oxygen_demand?: number;
  [key: string]: unknown;
}

interface AICopilotProps {
  processState: ProcessState;
}

interface CopilotResponse {
  status?: string;
  answer?: string;
  message?: string;
}

export function AICopilot({
  processState,
}: AICopilotProps) {
  /*
   * BioPilot API configuration
   *
   * Local development:
   * http://127.0.0.1:8000
   *
   * Production:
   * VITE_API_URL will be supplied by the hosting platform.
   */
  const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://127.0.0.1:8000";

  const [message, setMessage] = useState("");
  const [language, setLanguage] = useState("English");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const askCopilot = async () => {
    const question = message.trim();

    if (!question || loading) {
      return;
    }

    setLoading(true);
    setError("");
    setAnswer("");

    try {
      const response = await fetch(
        `${API_URL}/api/copilot`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: question,
            language,
            process_state: processState,
          }),
        }
      );

      let data: CopilotResponse;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "The BioPilot backend returned an invalid response."
        );
      }

      if (!response.ok || data.status !== "success") {
        throw new Error(
          data.message ||
            "BioPilot AI Copilot could not generate a response."
        );
      }

      setAnswer(data.answer || "");
    } catch (err) {
      console.error("BioPilot Copilot error:", err);

      if (err instanceof TypeError) {
        setError(
          "Unable to connect to the BioPilot AI backend. Please check that the BioPilot backend is running and accessible."
        );
      } else {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to connect to BioPilot AI backend."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      askCopilot();
    }
  };

  const askQuickQuestion = (question: string) => {
    setMessage(question);
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">

      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

        <div>
          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-lg font-bold text-white dark:bg-white dark:text-slate-900">
              AI
            </div>

            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                BioPilot AI Copilot
              </h2>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                ChatGPT-powered bioprocess engineering reasoning
              </p>
            </div>

          </div>
        </div>

        {/* Status */}
        <div className="flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">

          <span className="h-2 w-2 rounded-full bg-emerald-500" />

          ChatGPT Copilot

        </div>

      </div>

      {/* Process Context */}
      <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">

        <div className="mb-3 flex items-center justify-between">

          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Current Process Context
          </h3>

          <span className="text-xs text-slate-500 dark:text-slate-400">
            Live simulation state
          </span>

        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">

          <Metric
            label="Biomass"
            value={processState.biomass}
            unit="g/L"
          />

          <Metric
            label="Substrate"
            value={processState.substrate}
            unit="g/L"
          />

          <Metric
            label="DO"
            value={processState.DO}
            unit="%"
          />

          <Metric
            label="pH"
            value={processState.pH}
            unit=""
          />

          <Metric
            label="Temperature"
            value={processState.temperature}
            unit="°C"
          />

        </div>

      </div>

      {/* Quick Questions */}
      <div className="mb-5">

        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Quick Engineering Questions
        </p>

        <div className="flex flex-wrap gap-2">

          <button
            type="button"
            onClick={() =>
              askQuickQuestion(
                "Assess the current fermentation process risk and explain the main concern."
              )
            }
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-500"
          >
            Assess Process Risk
          </button>

          <button
            type="button"
            onClick={() =>
              askQuickQuestion(
                "Why is dissolved oxygen changing in the current process, and what should I investigate?"
              )
            }
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-500"
          >
            Explain DO
          </button>

          <button
            type="button"
            onClick={() =>
              askQuickQuestion(
                "What engineering intervention should I simulate next, and why?"
              )
            }
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-500"
          >
            Suggest Simulation
          </button>

          <button
            type="button"
            onClick={() =>
              askQuickQuestion(
                "Explain the current fermentation process phase using the available process data."
              )
            }
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-500"
          >
            Explain Phase
          </button>

        </div>

      </div>

      {/* Question */}
      <div className="mb-4">

        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Ask the Engineering Copilot
        </label>

        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Example: Why is dissolved oxygen falling, and what should I simulate?"
          rows={4}
          className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 dark:border-slate-600 dark:bg-slate-950 dark:text-white dark:focus:border-slate-400 dark:focus:ring-slate-800"
        />

        <div className="mt-2 flex items-center justify-between">

          <span className="text-xs text-slate-400">
            Press Enter to ask • Shift + Enter for a new line
          </span>

          <span className="text-xs text-slate-400">
            {message.length} characters
          </span>

        </div>

      </div>

      {/* Controls */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row">

        <select
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
          className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-700 outline-none dark:border-slate-600 dark:bg-slate-950 dark:text-slate-200"
        >
          <option value="English">English</option>
          <option value="Hindi">Hindi</option>
          <option value="Telugu">Telugu</option>
          <option value="Tamil">Tamil</option>
          <option value="Kannada">Kannada</option>
          <option value="Malayalam">Malayalam</option>
          <option value="Bengali">Bengali</option>
          <option value="Marathi">Marathi</option>
          <option value="Gujarati">Gujarati</option>
          <option value="Punjabi">Punjabi</option>
          <option value="Odia">Odia</option>
        </select>

        <button
          type="button"
          onClick={askCopilot}
          disabled={loading || !message.trim()}
          className="flex-1 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
        >
          {loading
            ? "Analyzing Process..."
            : "Ask BioPilot Copilot"}
        </button>

      </div>

      {/* Loading */}
      {loading && (
        <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/50">

          <div className="flex items-center gap-3">

            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-slate-800 dark:border-slate-600 dark:border-t-white" />

            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                BioPilot is reasoning...
              </p>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Analyzing the current process state with ChatGPT.
              </p>
            </div>

          </div>

        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">

          <p className="text-sm font-semibold text-red-700 dark:text-red-400">
            Copilot Connection Error
          </p>

          <p className="mt-1 text-sm leading-6 text-red-600 dark:text-red-300">
            {error}
          </p>

          <p className="mt-2 text-xs text-red-500 dark:text-red-400">
            Check that your BioPilot FastAPI backend is running
            and that the configured API URL is correct.
          </p>

        </div>
      )}

      {/* Answer */}
      {answer && !loading && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/50">

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Engineering Copilot Response
              </h3>

              <p className="text-xs text-slate-500 dark:text-slate-400">
                Generated from the supplied BioPilot process state
              </p>
            </div>

            <span className="w-fit rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-600 dark:border-slate-600 dark:text-slate-300">
              Human Review Required
            </span>

          </div>

          <div className="whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-300">
            {answer}
          </div>

        </div>
      )}

      {/* Empty state */}
      {!answer && !loading && !error && (
        <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center dark:border-slate-700">

          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Ask BioPilot about the current fermentation process.
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-400">
            The Copilot receives the live simulation state and provides
            engineering reasoning and simulation-oriented recommendations.
          </p>

        </div>
      )}

      {/* Safety */}
      <div className="mt-5 border-t border-slate-200 pt-4 dark:border-slate-700">

        <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">

          <strong className="text-slate-700 dark:text-slate-300">
            Decision-support only:
          </strong>{" "}

          BioPilot AI does not autonomously control physical
          bioreactor equipment. Recommendations should be reviewed
          by a qualified engineer before real-world implementation.

        </p>

      </div>

    </section>
  );
}

/* ============================================================
   METRIC
============================================================ */

function Metric({
  label,
  value,
  unit,
}: {
  label: string;
  value?: number;
  unit: string;
}) {
  const numericValue =
    typeof value === "number" && Number.isFinite(value)
      ? value
      : null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">

      <p className="text-xs text-slate-500 dark:text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">

        {numericValue !== null
          ? numericValue.toFixed(2)
          : "—"}{" "}

        <span className="text-xs font-normal text-slate-400">
          {unit}
        </span>

      </p>

    </div>
  );
}