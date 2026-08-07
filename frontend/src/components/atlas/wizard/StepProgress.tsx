import { useEffect, useMemo, useState } from "react";
import {
  Check,
  Loader2,
  Circle,
  Search,
  Brain,
  BarChart3,
  Lightbulb,
  FileText,
  type LucideIcon,
} from "lucide-react";

type Stage = {
  label: string;
  icon: LucideIcon;
  ms: number;
  children?: string[];
};

const stages: Stage[] = [
  {
    label: "Discovering public sources",
    icon: Search,
    ms: 5200,
    children: [
      "Official website found",
      "Pricing page analyzed",
      "Changelog collected",
      "Customer reviews collected",
      "Reddit discussions analyzed",
      "Competitor products identified",
    ],
  },
  { label: "Clustering customer feedback", icon: Brain, ms: 2600 },
  { label: "Detecting product friction", icon: BarChart3, ms: 2400 },
  { label: "Prioritizing opportunities", icon: Lightbulb, ms: 2400 },
  { label: "Generating executive summary", icon: FileText, ms: 2000 },
];

const totalMs = stages.reduce((n, s) => n + s.ms, 0);

export function StepProgress({ company, onDone }: { company: string; onDone: () => void }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const id = window.setInterval(() => {
      const next = Date.now() - start;
      setElapsed(next);
      if (next >= totalMs + 700) {
        window.clearInterval(id);
        onDone();
      }
    }, 100);
    return () => window.clearInterval(id);
  }, [onDone]);

  const progress = Math.min(1, elapsed / totalMs);

  const bounds = useMemo(() => {
    let acc = 0;
    return stages.map((s) => {
      const from = acc;
      acc += s.ms;
      return { from, to: acc };
    });
  }, []);

  const remaining = Math.max(0, Math.ceil((totalMs - elapsed) / 1000));

  const metrics = [
    { label: "Evidence collected", value: Math.round(progress * 1486) },
    { label: "Customer reviews analyzed", value: Math.round(progress * 934) },
    { label: "Competitors discovered", value: Math.round(progress * 7) },
    { label: "Opportunities identified", value: Math.round(progress * 17) },
  ];

  return (
    <div className="rise">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-muted-foreground">
            atlas / investigations / {company.toLowerCase().replace(/\s+/g, "-")}
          </p>
          <h1 className="font-display mt-2 text-2xl font-semibold tracking-tight md:text-3xl">
            Investigating {company}
          </h1>
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          {remaining > 0 ? `~${remaining}s remaining` : "Finalizing…"}
        </p>
      </div>

      <div className="mt-5 h-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-accent transition-[width] duration-200 ease-linear"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <ol className="mt-8 space-y-3">
        {stages.map((s, i) => {
          const { from, to } = bounds[i] ?? { from: 0, to: 0 };
          const done = elapsed >= to;
          const active = !done && elapsed >= from;
          const local = Math.min(1, Math.max(0, (elapsed - from) / s.ms));

          return (
            <li
              key={s.label}
              className={`rounded-xl border bg-card p-4 transition-colors ${
                active ? "border-border-strong shadow-card" : "border-border"
              } ${!done && !active ? "opacity-55" : ""}`}
            >
              <div className="flex items-center gap-3">
                <s.icon
                  className={`size-4 ${done || active ? "text-foreground" : "text-muted-foreground"}`}
                />
                <p className="flex-1 text-sm font-medium">{s.label}</p>
                {done ? (
                  <Check className="size-4 text-positive" />
                ) : active ? (
                  <Loader2 className="size-4 animate-spin text-accent" />
                ) : (
                  <Circle className="size-3.5 text-muted-foreground" />
                )}
              </div>

              {s.children && (active || done) && (
                <ul className="mt-3 space-y-1.5 border-l border-border pl-4">
                  {s.children.map((c, ci) => {
                    const shown = local >= (ci + 1) / (s.children!.length + 0.001);
                    if (!shown && !done) return null;
                    return (
                      <li key={c} className="fade-step flex items-center gap-2 text-xs">
                        <Check className="size-3.5 text-positive" />
                        <span className="text-muted-foreground">{c}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </li>
          );
        })}
      </ol>

      <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-xl border border-border bg-surface p-4">
            <p className="font-display text-2xl font-semibold tabular-nums">
              {m.value.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{m.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
