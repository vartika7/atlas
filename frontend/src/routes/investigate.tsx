import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { ArrowLeft, Check } from "lucide-react";
import { StepCompany } from "@/components/atlas/wizard/StepCompany";
import {
  StepUploads,
  defaultCardOrder,
  type UploadState,
} from "@/components/atlas/wizard/StepUploads";
import { StepReview } from "@/components/atlas/wizard/StepReview";
import { StepProgress } from "@/components/atlas/wizard/StepProgress";

export const Route = createFileRoute("/investigate")({
  head: () => ({
    meta: [
      { title: "Start an Investigation — Atlas" },
      {
        name: "description",
        content:
          "Pick a company, attach optional internal evidence, and let Atlas run a live product investigation in minutes.",
      },
      { property: "og:title", content: "Start an Investigation — Atlas" },
      {
        property: "og:description",
        content:
          "Atlas gathers public and internal product evidence, then generates prioritized opportunities.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: InvestigateFlow,
});

const stepLabels = ["Company", "Internal Evidence", "Review", "Investigation"];

function InvestigateFlow() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [company, setCompany] = useState("");
  const [files, setFiles] = useState<UploadState>({});
  const [cardOrder, setCardOrder] = useState<string[]>(defaultCardOrder);

  const fileCount = Object.values(files).reduce((n, arr) => n + arr.length, 0);

  const finish = useCallback(() => {
    navigate({ to: "/overview", search: { company: company.trim() || "Linear" } });
  }, [company, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <Link to="/" className="font-display text-sm font-semibold tracking-tight">
            Atlas
          </Link>
          {step < 3 && (
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
            >
              <ArrowLeft className="size-4" /> Back
            </button>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pt-10 pb-24">
        <ol className="mb-10 flex flex-wrap items-center gap-x-3 gap-y-2">
          {stepLabels.map((label, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <li key={label} className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex size-6 items-center justify-center rounded-full border text-[11px] font-medium ${
                      done
                        ? "border-positive bg-positive text-primary-foreground"
                        : active
                          ? "border-foreground bg-foreground text-primary-foreground"
                          : "border-border text-muted-foreground"
                    }`}
                  >
                    {done ? <Check className="size-3.5" /> : i + 1}
                  </span>
                  <span
                    className={`text-xs ${active ? "font-medium text-foreground" : "text-muted-foreground"}`}
                  >
                    {label}
                  </span>
                </div>
                {i < stepLabels.length - 1 && <span className="h-px w-6 bg-border-strong" />}
              </li>
            );
          })}
        </ol>

        {step === 0 && (
          <StepCompany value={company} onChange={setCompany} onContinue={() => setStep(1)} />
        )}
        {step === 1 && (
          <StepUploads
            files={files}
            setFiles={setFiles}
            order={cardOrder}
            setOrder={setCardOrder}
            onContinue={() => setStep(2)}
            onSkip={() => {
              setFiles({});
              setStep(2);
            }}
          />
        )}
        {step === 2 && (
          <StepReview
            company={company.trim() || "Linear"}
            fileCount={fileCount}
            onStart={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <StepProgress company={company.trim() || "Linear"} onDone={finish} />
        )}
      </main>
    </div>
  );
}
