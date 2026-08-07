import { useState } from "react";
import {
  X,
  ChevronDown,
  MessagesSquare,
  LineChart,
  Building2,
  FileText,
  Beaker,
  ShieldAlert,
  Quote as QuoteIcon,
  Sparkle,
  Link2,
} from "lucide-react";
import type { Opportunity } from "@/components/atlas/data/investigation";

function Section({
  title,
  icon: Icon,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="border-t border-border py-6">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2.5 text-left"
      >
        <Icon className="size-4 text-muted-foreground" />
        <h3 className="flex-1 text-xs font-medium tracking-widest text-muted-foreground uppercase">
          {title}
        </h3>
        <ChevronDown
          className={`size-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="mt-5">{children}</div>}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] tracking-widest text-muted-foreground uppercase">{label}</p>
      <p className="mt-1 text-sm leading-relaxed">{value}</p>
    </div>
  );
}

export function OpportunityDrawer({
  opportunity,
  onClose,
}: {
  opportunity: Opportunity;
  onClose: () => void;
}) {
  const o = opportunity;
  const [activeChip, setActiveChip] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close opportunity"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/20 backdrop-blur-[2px]"
      />
      <aside className="relative flex h-full w-full max-w-2xl flex-col overflow-y-auto border-l border-border-strong bg-background shadow-card">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-border bg-background/90 px-7 py-5 backdrop-blur">
          <div>
            <p className="font-mono text-[10px] text-muted-foreground">{o.id}</p>
            <h2 className="font-display mt-1 text-xl font-semibold tracking-tight">{o.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="px-7 pb-16">
          <div className="grid gap-4 py-6 sm:grid-cols-3">
            <Field label="Business impact" value={`${o.impact} impact`} />
            <Field label="Confidence" value={`${o.confidence}%`} />
            <Field label="ICE score" value={o.ice.toFixed(1)} />
            <Field label="Estimated business impact" value={o.estImpact} />
            <Field label="Estimated effort" value={o.effort} />
            <Field label="Status" value={o.status} />
          </div>

          <Section title="Business rationale" icon={FileText}>
            <div className="space-y-5">
              <Field label="Problem" value={o.rationale.problem} />
              <Field label="Why it matters" value={o.rationale.whyItMatters} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Users affected" value={o.rationale.usersAffected} />
                <Field label="Business metric" value={o.rationale.metric} />
                <Field label="Estimated impact" value={o.rationale.estImpact} />
                <Field label="Strategic goal" value={o.rationale.objective} />
              </div>
            </div>
          </Section>

          <Section title="Why PM Atlas recommends this" icon={Sparkle}>
            <p className="rounded-xl border border-border bg-card p-5 text-sm leading-relaxed text-muted-foreground">
              {o.recommendation}
            </p>
          </Section>

          <Section title="Supporting evidence" icon={MessagesSquare}>
            <div className="space-y-7">
              <div>
                <p className="text-sm font-medium">Customer feedback</p>
                <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                  {o.evidence.feedback.map((f) => (
                    <div
                      key={f.label}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2"
                    >
                      <dt className="text-xs text-muted-foreground">{f.label}</dt>
                      <dd className="font-mono text-xs">{f.value}</dd>
                    </div>
                  ))}
                </dl>
                <ul className="mt-4 space-y-2.5">
                  {o.evidence.quotes.map((q) => (
                    <li key={q.text} className="rounded-xl border border-border bg-card p-4">
                      <div className="flex gap-2.5">
                        <QuoteIcon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                        <p className="text-sm leading-relaxed">{q.text}</p>
                      </div>
                      <p className="mt-3 flex flex-wrap items-center gap-2 font-mono text-[10px] text-muted-foreground">
                        <span>{q.source}</span>
                        <span>·</span>
                        <span>{q.date}</span>
                        <span>·</span>
                        <span className="text-positive">{q.confidence}</span>
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <LineChart className="size-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Product analytics</p>
                </div>
                <dl className="mt-3 space-y-2">
                  {o.evidence.analytics.map((a) => (
                    <div
                      key={a.label}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2"
                    >
                      <dt className="flex items-center gap-2 text-xs text-muted-foreground">
                        {a.label}
                        {a.internal && (
                          <span className="rounded border border-positive/40 px-1.5 py-0.5 text-[10px] text-positive">
                            From your upload
                          </span>
                        )}
                      </dt>
                      <dd className="font-mono text-xs">{a.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <Building2 className="size-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Competitor intelligence</p>
                </div>
                <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                  {o.evidence.competitors.map((c) => (
                    <div
                      key={c.label}
                      className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2"
                    >
                      <dt className="text-xs text-muted-foreground">{c.label}</dt>
                      <dd className="font-mono text-xs">{c.value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </Section>

          <Section title="Evidence traceability" icon={Link2}>
            <div className="flex flex-wrap gap-2">
              {o.chips.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => setActiveChip(activeChip === c.label ? null : c.label)}
                  className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                    activeChip === c.label
                      ? "border-accent text-foreground"
                      : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            {activeChip && (
              <div className="fade-step mt-4 rounded-xl border border-border bg-card p-4">
                <p className="text-xs font-medium">{activeChip}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {o.chips.find((c) => c.label === activeChip)?.detail}
                </p>
              </div>
            )}
          </Section>

          <Section title="Suggested experiment" icon={Beaker}>
            <div className="space-y-5">
              <Field label="Hypothesis" value={o.experiment.hypothesis} />
              <Field label="Experiment" value={o.experiment.design} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Primary metric" value={o.experiment.primaryMetric} />
                <Field label="Guardrail metrics" value={o.experiment.guardrails} />
                <Field label="Expected impact" value={o.experiment.expected} />
                <Field label="Estimated duration" value={o.experiment.duration} />
              </div>
              <Field label="Success criteria" value={o.experiment.success} />
            </div>
          </Section>

          <Section title="Risks & assumptions" icon={ShieldAlert}>
            <div className="space-y-5">
              <div>
                <p className="text-[11px] tracking-widest text-muted-foreground uppercase">
                  Key assumptions
                </p>
                <ul className="mt-2 space-y-1.5">
                  {o.risks.assumptions.map((a) => (
                    <li key={a} className="text-sm leading-relaxed text-muted-foreground">
                      · {a}
                    </li>
                  ))}
                </ul>
              </div>
              <Field label="Confidence explanation" value={o.risks.confidenceExplanation} />
              <div>
                <p className="text-[11px] tracking-widest text-muted-foreground uppercase">
                  Missing evidence
                </p>
                <ul className="mt-2 space-y-1.5">
                  {o.risks.missingEvidence.map((m) => (
                    <li key={m} className="text-sm leading-relaxed text-muted-foreground">
                      · {m}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[11px] tracking-widest text-muted-foreground uppercase">
                  Potential risks
                </p>
                <ul className="mt-2 space-y-1.5">
                  {o.risks.risks.map((r) => (
                    <li key={r} className="text-sm leading-relaxed text-muted-foreground">
                      · {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Section>

          <Section title="Generated artifacts" icon={FileText}>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                "Product Requirements Document",
                "Executive Summary",
                "Jira Tickets",
                "Stakeholder Brief",
              ].map((a) => (
                <button
                  key={a}
                  type="button"
                  className="rounded-lg border border-border-strong px-3.5 py-2.5 text-left text-sm font-medium transition-colors hover:bg-surface"
                >
                  Generate {a}
                </button>
              ))}
            </div>
          </Section>
        </div>
      </aside>
    </div>
  );
}
