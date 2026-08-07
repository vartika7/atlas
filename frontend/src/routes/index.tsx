import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Search,
  Layers,
  ListOrdered,
  FileText,
  Building2,
  Radar,
  LineChart,
  Sparkle,
  ArrowRight,
  Linkedin,
  Play,
} from "lucide-react";
import { InvestigationMockup } from "@/components/atlas/InvestigationMockup";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Atlas — Decide What to Build Next, Backed by Evidence" },
      {
        name: "description",
        content:
          "Atlas turns scattered product evidence into prioritized, explainable product decisions for PMs at seed to Series B startups.",
      },
      { property: "og:title", content: "Atlas — AI Product Strategy Platform" },
      {
        property: "og:description",
        content:
          "Discover evidence, investigate product signals, and generate prioritized opportunities with Atlas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
];

const features = [
  {
    icon: Search,
    title: "Evidence Discovery",
    body: "Automatically gather customer feedback, competitor intelligence, pricing pages, changelogs, and product documentation.",
  },
  {
    icon: Layers,
    title: "Product Intelligence",
    body: "Combine qualitative and quantitative evidence to uncover real product opportunities.",
  },
  {
    icon: ListOrdered,
    title: "Opportunity Prioritization",
    body: "Rank opportunities using evidence, confidence, and expected business impact.",
  },
  {
    icon: FileText,
    title: "Planning",
    body: "Generate executive summaries, PRDs, and experiment recommendations.",
  },
];

const steps = [
  { icon: Building2, title: "Evidence Sources", body: "Internal uploads plus auto-discovered public evidence." },
  { icon: Radar, title: "Key Findings", body: "Clustered pain points, friction, and competitor gaps." },
  { icon: LineChart, title: "Product Opportunities", body: "Ranked by impact, confidence, and ICE score." },
  { icon: Sparkle, title: "Strategy Report", body: "Executive summaries, PRDs, briefs, and tickets." },
];


function Landing() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-md border border-border-strong bg-surface font-display text-sm font-semibold">
              A
            </span>
            <span className="font-display text-base font-semibold tracking-tight">Atlas</span>
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            {navLinks.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
            <span className="flex items-center gap-2 text-sm text-muted-foreground/60">
              Pricing
              <span className="rounded-md border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
                Soon
              </span>
            </span>
            <a
              href="https://www.linkedin.com/in/vartika7/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <Linkedin className="size-4" /> LinkedIn
            </a>
          </div>
          <Link
            to="/investigate"
            className="rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            Start Investigation
          </Link>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-6 pt-20 pb-24 md:pt-28">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <div className="rise">
              <p className="mb-6 inline-flex items-center rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                AI Product Strategy Platform
              </p>
              <h1 className="text-4xl leading-[1.05] font-semibold md:text-5xl lg:text-[3.4rem]">
                Evidence, not opinions. Build what matters next.
              </h1>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground md:text-lg">
                Automatically discover customer feedback, competitor intelligence, and product
                signals to generate evidence-backed product strategy, prioritized opportunities,
                and execution-ready plans.
              </p>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link
                  to="/investigate"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                >
                  Start Investigation <ArrowRight className="size-4" />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 rounded-lg border border-border-strong px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface"
                >
                  <Play className="size-3.5" /> Watch Demo
                </a>
              </div>
            </div>
            <div className="rise [animation-delay:120ms]">
              <InvestigationMockup />
            </div>
          </div>
        </section>

        <div className="hairline mx-auto h-px max-w-6xl" />

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl px-6 py-24">
          <div className="max-w-xl">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              Capabilities
            </p>
            <h2 className="mt-4 text-3xl font-semibold md:text-4xl">
              Evidence in. Decisions out.
            </h2>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-border bg-card p-7 transition-colors hover:border-border-strong"
              >
                <f.icon className="size-5 text-accent" strokeWidth={1.75} />
                <h3 className="mt-5 text-lg font-medium">{f.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="hairline mx-auto h-px max-w-6xl" />

        {/* How it works */}
        <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-24">
          <div className="max-w-xl">
            <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
              How it works
            </p>
            <h2 className="mt-4 text-3xl font-semibold md:text-4xl">Four steps, no guesswork.</h2>
          </div>
          <ol className="mt-14 grid gap-y-10 md:grid-cols-4 md:gap-x-2">
            {steps.map((s, i) => (
              <li key={s.title} className="relative md:pr-8">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-xl border border-border bg-surface">
                    <s.icon className="size-4 text-foreground" strokeWidth={1.75} />
                  </span>
                  <span className="font-mono text-xs text-muted-foreground">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-medium">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
                {i < steps.length - 1 && (
                  <span className="pointer-events-none absolute top-4 right-0 hidden h-px w-6 bg-border-strong md:block" />
                )}
              </li>
            ))}
          </ol>
        </section>

        <div className="hairline mx-auto h-px max-w-6xl" />

        {/* Final CTA */}
        <section id="cta" className="mx-auto max-w-6xl px-6 py-28">
          <div className="rounded-3xl border border-border bg-card px-8 py-16 text-center">
            <h2 className="mx-auto max-w-xl text-3xl font-semibold md:text-4xl">
              Ready to make product decisions faster?
            </h2>
            <Link
              to="/investigate"
              className="mt-9 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              Start Investigation <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-display text-sm font-semibold">Atlas</p>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Atlas. AI Product Strategy Platform.
          </p>
        </div>
      </footer>
    </div>
  );
}
