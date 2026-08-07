import { Check, Loader2, ArrowUpRight } from "lucide-react";

const evidence = [
  { label: "Customer feedback", count: "412 items", state: "done" },
  { label: "Competitor changelogs", count: "38 releases", state: "done" },
  { label: "Pricing pages", count: "12 sources", state: "done" },
  { label: "Support tickets", count: "1,204 threads", state: "running" },
];

const opportunities = [
  { title: "Usage-based billing tier", impact: "High", conf: 92, w: "92%" },
  { title: "Team workspace roles", impact: "High", conf: 84, w: "84%" },
  { title: "Slack digest of insights", impact: "Medium", conf: 71, w: "71%" },
];

export function InvestigationMockup() {
  return (
    <div className="rounded-2xl border border-border-strong bg-surface shadow-card">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-muted" />
          <span className="size-2.5 rounded-full bg-muted" />
          <span className="size-2.5 rounded-full bg-muted" />
        </div>
        <p className="ml-2 font-mono text-xs text-muted-foreground">
          atlas / investigations / linear-inc
        </p>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-5">
        <div className="space-y-3 sm:col-span-2">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Evidence Sources
          </p>

          <div className="space-y-2">
            {evidence.map((e) => (
              <div
                key={e.label}
                className="rounded-lg border border-border bg-surface-2 px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium">{e.label}</p>
                  {e.state === "done" ? (
                    <Check className="size-3.5 text-positive" />
                  ) : (
                    <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                  )}
                </div>
                <p className="mt-1 font-mono text-[10px] text-muted-foreground">{e.count}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 sm:col-span-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
              Prioritized opportunities
            </p>
            <span className="font-mono text-[10px] text-muted-foreground">3 of 17</span>
          </div>
          <div className="space-y-2">
            {opportunities.map((o, i) => (
              <div key={o.title} className="rounded-lg border border-border bg-surface-2 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-[10px] text-muted-foreground">
                      OPP-{String(i + 1).padStart(2, "0")}
                    </p>
                    <p className="mt-0.5 text-sm font-medium">{o.title}</p>
                  </div>
                  <span className="rounded-md border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                    {o.impact} impact
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-accent" style={{ width: o.w }} />
                  </div>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {o.conf}% conf
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <p className="text-xs text-muted-foreground">Executive summary generated</p>
            <ArrowUpRight className="size-3.5 text-muted-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
}
