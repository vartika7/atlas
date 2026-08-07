import { useState, type DragEvent } from "react";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Check,
  Filter,
  Gauge,
  GripVertical,
  LineChart,
  MessagesSquare,
  Mic,
  RotateCcw,
  Trash2,
  Upload,
  X,
} from "lucide-react";

export const uploadCards = [
  {
    id: "funnel",
    label: "Funnel Data",
    hint: "CSV export of conversion steps",
    formats: ".csv",
    exts: [".csv"],
    icon: Filter,
  },
  {
    id: "events",
    label: "Event Data",
    hint: "Raw product event stream",
    formats: ".csv · .parquet · .json",
    exts: [".csv", ".parquet", ".json"],
    icon: BarChart3,
  },
  {
    id: "support",
    label: "Support Conversations",
    hint: "Zendesk / Intercom threads",
    formats: ".csv · .json · .txt",
    exts: [".csv", ".json", ".txt"],
    icon: MessagesSquare,
  },
  {
    id: "nps",
    label: "NPS Responses",
    hint: "Scores and verbatims",
    formats: ".csv · .xlsx",
    exts: [".csv", ".xlsx"],
    icon: Gauge,
  },
  {
    id: "interviews",
    label: "Customer Interviews",
    hint: "Transcripts or notes",
    formats: ".txt · .docx · .pdf · .md",
    exts: [".txt", ".docx", ".pdf", ".md"],
    icon: Mic,
  },
  {
    id: "analytics",
    label: "Product Analytics Export",
    hint: "Amplitude / Mixpanel export",
    formats: ".csv · .parquet · .json",
    exts: [".csv", ".parquet", ".json"],
    icon: LineChart,
  },
];

export const defaultCardOrder = uploadCards.map((c) => c.id);


export type UploadState = Record<string, string[]>;

export function StepUploads({
  files,
  setFiles,
  order,
  setOrder,
  onContinue,
  onSkip,
}: {
  files: UploadState;
  setFiles: (next: UploadState) => void;
  order: string[];
  setOrder: (next: string[]) => void;
  onContinue: () => void;
  onSkip: () => void;
}) {
  const [over, setOver] = useState<string | null>(null);
  const [dragCard, setDragCard] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const add = (id: string, names: string[]) => {
    if (!names.length) return;
    const exts = uploadCards.find((c) => c.id === id)?.exts ?? [];
    const accepted: string[] = [];
    const rejected: string[] = [];
    for (const name of names) {
      const ext = name.slice(name.lastIndexOf(".")).toLowerCase();
      if (exts.includes(ext)) accepted.push(name);
      else rejected.push(name);
    }
    setErrors({
      ...errors,
      [id]: rejected.length
        ? `Unsupported file type. Please upload one of: ${exts.join(", ")}`
        : null,
    });
    if (!accepted.length) return;
    setFiles({ ...files, [id]: [...(files[id] ?? []), ...accepted] });
  };

  const remove = (id: string, name: string) => {
    setFiles({ ...files, [id]: (files[id] ?? []).filter((n) => n !== name) });
  };

  const removeCard = (id: string) => {
    setOrder(order.filter((c) => c !== id));
    const next = { ...files };
    delete next[id];
    setFiles(next);
    setErrors({ ...errors, [id]: null });
  };




  const reorderTo = (targetId: string) => {
    if (!dragCard || dragCard === targetId) return;
    const next = order.filter((c) => c !== dragCard);
    next.splice(order.indexOf(targetId), 0, dragCard);
    setOrder(next);
  };

  const dropFiles = (e: DragEvent<HTMLDivElement>, id: string) => {
    e.preventDefault();
    setOver(null);
    setDropTarget(null);
    if (dragCard) {
      reorderTo(id);
      setDragCard(null);
      return;
    }
    add(
      id,
      Array.from(e.dataTransfer.files).map((f) => f.name),
    );
  };

  const cards = order
    .map((id) => uploadCards.find((c) => c.id === id))
    .filter((c): c is (typeof uploadCards)[number] => Boolean(c));
  const total = Object.values(files).reduce((n, arr) => n + arr.length, 0);
  const removedCount = uploadCards.length - cards.length;

  return (
    <div className="rise">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="font-display text-2xl font-semibold tracking-tight md:text-3xl">
          Add internal evidence
        </h1>
        <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
          Optional
        </span>
      </div>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
        Internal data sharpens prioritization, but Atlas can run a full investigation on public
        evidence alone. Drag files onto a card to attach, drag a card by its handle to set
        priority order, or remove sources you don't have.
      </p>

      {removedCount > 0 && (
        <button
          type="button"
          onClick={() => setOrder(defaultCardOrder)}
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-accent"
        >
          <RotateCcw className="size-3.5" />
          Restore {removedCount} removed source{removedCount === 1 ? "" : "s"}
        </button>
      )}

      {cards.length === 0 ? (
        <div className="mt-8 rounded-xl border border-dashed border-border-strong bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">
            All internal sources removed — Atlas will investigate public evidence only.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c, i) => {
            const attached = files[c.id] ?? [];
            return (
              <div
                key={c.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragCard) setDropTarget(c.id);
                  else setOver(c.id);
                }}
                onDragLeave={() => {
                  setOver(null);
                  setDropTarget(null);
                }}
                onDrop={(e) => dropFiles(e, c.id)}
                className={`rounded-xl border border-dashed bg-card p-4 transition-colors ${
                  dropTarget === c.id
                    ? "border-accent bg-surface"
                    : over === c.id
                      ? "border-ring bg-surface"
                      : attached.length
                        ? "border-positive/50"
                        : "border-border-strong"
                } ${dragCard === c.id ? "opacity-50" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="flex size-8 items-center justify-center rounded-lg bg-surface-2">
                    <c.icon className="size-4 text-muted-foreground" />
                  </span>
                  <div className="flex items-center gap-1">
                    {attached.length > 0 && <Check className="size-4 text-positive" />}
                    <span
                      draggable
                      onDragStart={() => setDragCard(c.id)}
                      onDragEnd={() => {
                        setDragCard(null);
                        setDropTarget(null);
                      }}
                      aria-label={`Reorder ${c.label}`}
                      className="cursor-grab rounded-md p-1 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground active:cursor-grabbing"
                    >
                      <GripVertical className="size-3.5" />
                    </span>
                    <button

                      type="button"
                      aria-label={`Remove ${c.label}`}
                      onClick={() => removeCard(c.id)}
                      className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-surface-2 hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-sm font-medium">{c.label}</p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{c.hint}</p>
                <p className="mt-1.5 font-mono text-[10px] text-muted-foreground">
                  Supported: {c.formats}
                </p>
                {errors[c.id] && (
                  <p className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-destructive">
                    <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                    {errors[c.id]}
                  </p>
                )}


                {attached.length > 0 && (
                  <ul className="mt-3 space-y-1">
                    {attached.map((n) => (
                      <li
                        key={n}
                        className="flex items-center justify-between gap-2 rounded-md bg-surface px-2 py-1"
                      >
                        <span className="truncate font-mono text-[10px] text-muted-foreground">
                          {n}
                        </span>
                        <button
                          type="button"
                          aria-label={`Remove ${n}`}
                          onClick={() => remove(c.id, n)}
                          className="text-muted-foreground transition-colors hover:text-foreground"
                        >
                          <X className="size-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <label className="mt-3 inline-flex cursor-pointer items-center gap-1.5 text-xs font-medium text-accent">
                  <Upload className="size-3.5" />
                  {attached.length ? "Add another" : "Browse files"}
                  <input
                    type="file"
                    multiple
                    accept={c.exts.join(",")}
                    className="hidden"
                    onChange={(e) =>
                      add(
                        c.id,
                        Array.from(e.target.files ?? []).map((f) => f.name),
                      )
                    }
                  />
                </label>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onContinue}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Continue <ArrowRight className="size-4" />
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="rounded-lg border border-border-strong px-5 py-2.5 text-sm font-medium transition-colors hover:bg-surface"
        >
          Skip this step
        </button>
        <p className="text-xs text-muted-foreground">
          {total} file{total === 1 ? "" : "s"} attached · {cards.length} source
          {cards.length === 1 ? "" : "s"} enabled
        </p>
      </div>
    </div>
  );
}
