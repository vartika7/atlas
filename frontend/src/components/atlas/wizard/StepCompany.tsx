import { useMemo, useState } from "react";
import { ArrowRight, Building2, Search } from "lucide-react";

const suggestions = ["Notion", "Linear", "Slack", "Duolingo"];

export function StepCompany({
  value,
  onChange,
  onContinue,
}: {
  value: string;
  onChange: (v: string) => void;
  onContinue: () => void;
}) {
  const [focused, setFocused] = useState(false);

  const matches = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return suggestions;
    return suggestions.filter((s) => s.toLowerCase().includes(q) && s.toLowerCase() !== q);
  }, [value]);

  return (
    <div className="rise">
      <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
        What company would you like to investigate?
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
        Atlas will automatically discover public product evidence including customer reviews,
        Reddit discussions, pricing pages, changelogs, documentation, and competitor information.
      </p>

      <form
        className="mt-8 max-w-xl"
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim()) onContinue();
        }}
      >
        <label
          htmlFor="company"
          className="text-xs font-medium tracking-widest text-muted-foreground uppercase"
        >
          Company name
        </label>
        <div className="relative mt-2">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="company"
            autoComplete="off"
            placeholder="e.g. Linear"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 120)}
            className="h-12 w-full rounded-xl border border-input bg-card pr-4 pl-10 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus:border-ring focus:ring-4 focus:ring-ring/15"
          />
          {focused && matches.length > 0 && (
            <ul className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-border-strong bg-popover shadow-card">
              {matches.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onMouseDown={() => {
                      onChange(s);
                      setFocused(false);
                    }}
                    className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm transition-colors hover:bg-surface"
                  >
                    <Building2 className="size-3.5 text-muted-foreground" />
                    {s}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange(s)}
              className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={!value.trim()}
          className="mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
        >
          Continue <ArrowRight className="size-4" />
        </button>
      </form>
    </div>
  );
}
