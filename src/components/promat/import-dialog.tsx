import { useRef, useState, type ReactNode } from "react";
import { Check, FileSpreadsheet, UploadCloud, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pill } from "@/components/promat/ui";
import { cn } from "@/lib/utils";

export type ImportStats = { detected: number; valid: number; toCheck: number };

export function ImportDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  accept,
  acceptLabel,
  columns,
  stats,
  confirmLabel,
  extra,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  subtitle: string;
  accept: string;
  acceptLabel: string;
  columns?: string[];
  stats?: ImportStats;
  confirmLabel: string;
  extra?: ReactNode;
  onConfirm: (files: string[]) => void;
}) {
  const [files, setFiles] = useState<string[]>([]);
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  function pick(list: FileList | null) {
    if (!list?.length) return;
    setFiles(Array.from(list).map((f) => f.name));
  }

  function close() {
    setFiles([]);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : close())}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{subtitle}</DialogDescription>
        </DialogHeader>

        {files.length === 0 ? (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              pick(e.dataTransfer.files);
            }}
            className={cn(
              "flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-10 text-center transition-colors",
              drag ? "border-primary bg-primary/5" : "border-border bg-muted/40",
            )}
          >
            <UploadCloud className="size-7 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">Glissez vos fichiers ici</p>
            <button
              type="button"
              onClick={() => input.current?.click()}
              className="mt-3 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Sélectionner des fichiers
            </button>
            <p className="mt-3 text-xs text-muted-foreground">{acceptLabel}</p>
            <input
              ref={input}
              type="file"
              multiple
              accept={accept}
              className="hidden"
              onChange={(e) => pick(e.target.files)}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              {files.map((f) => (
                <div
                  key={f}
                  className="flex items-center gap-2.5 rounded-lg border border-border bg-card px-3 py-2.5 text-sm"
                >
                  <FileSpreadsheet className="size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate font-medium">{f}</span>
                  <button
                    type="button"
                    onClick={() => setFiles((p) => p.filter((x) => x !== f))}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
            </div>

            {stats && (
              <div className="rounded-xl border border-border bg-muted/40 p-4">
                <p className="label-xs">Aperçu avant import</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                  <span className="font-semibold tabular-nums">{stats.detected} lignes détectées</span>
                  <Pill tone="ok">
                    <Check className="size-3.5" strokeWidth={3} /> {stats.valid} valides
                  </Pill>
                  <Pill tone="warn">{stats.toCheck} à vérifier</Pill>
                </div>
                {columns && (
                  <>
                    <p className="mt-4 label-xs">Colonnes reconnues automatiquement</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {columns.map((c) => (
                        <span
                          key={c}
                          className="rounded-full bg-card px-2.5 py-1 text-xs text-muted-foreground"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {extra}
          </div>
        )}

        <div className="mt-2 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={close}
            className="rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
          >
            Annuler
          </button>
          <button
            type="button"
            disabled={files.length === 0}
            onClick={() => {
              onConfirm(files);
              close();
            }}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {confirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
