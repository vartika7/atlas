import { Check, Clock, FileStack, Play } from "lucide-react";

export const publicSources = [
  "App Store Reviews",
  "Google Play Reviews",
  "Reddit Discussions",
  "G2 Reviews",
  "Capterra Reviews",
  "Product Hunt",
  "Official Website",
  "Pricing Page",
  "Documentation / Help Center",
  "Changelog",
  "Competitor Websites",
];


export function StepReview({
  company,
  fileCount,
  onStart,
}: {
  company: string;
  fileCount: number;
  onStart: () => void;
}) {
  return (
    <div className="rise">
      <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
        Review the investigation plan
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
        Atlas will collect and cross-reference every evidence source below, then move through key
        findings, product opportunities, and a strategy report.
      </p>


      <div className="mt-8 grid gap-4 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
              Company
            </p>
            <p className="font-display mt-1.5 text-xl font-semibold">{company}</p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <FileStack className="size-4 text-muted-foreground" />
              <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
                Internal evidence
              </p>
            </div>
            <p className="mt-1.5 text-sm">
              {fileCount > 0
                ? `${fileCount} file${fileCount === 1 ? "" : "s"} uploaded`
                : "No files uploaded — public evidence only"}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" />
              <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
                Estimated investigation time
              </p>
            </div>
            <p className="mt-1.5 font-mono text-sm">~2–3 minutes</p>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Demonstration estimate — actual timing comes from the live investigation engine.
            </p>

          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-3">
          <p className="text-xs font-medium tracking-widest text-muted-foreground uppercase">
            External evidence sources Atlas will discover
          </p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {publicSources.map((s) => (
              <li key={s} className="flex items-start gap-2 text-sm">
                <Check className="mt-0.5 size-4 shrink-0 text-positive" />
                <span className="text-foreground/90">{s}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <button
        type="button"
        onClick={onStart}
        className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        <Play className="size-3.5" /> Start Investigation
      </button>
    </div>
  );
}
