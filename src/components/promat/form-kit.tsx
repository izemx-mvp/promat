import { AlertTriangle, Check, ChevronDown, Loader2, Search, X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/* ------------------------------------------------------------------ modal */

export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  danger,
  width = "max-w-lg",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  danger?: boolean;
  width?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <button
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 bg-navy/40 motion-safe:animate-in motion-safe:fade-in-0 motion-safe:duration-200"
        style={{ backdropFilter: "blur(8px)" }}
      />
      <div
        className={cn(
          "glass-strong relative z-10 flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl",
          "motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95 motion-safe:slide-in-from-bottom-3 motion-safe:duration-250",
          width,
        )}
      >
        <span aria-hidden className="mx-auto mt-2.5 block h-1.5 w-10 rounded-full bg-border sm:hidden" />
        <header className="flex items-start gap-3 px-6 pb-4 pt-5 sm:px-7 sm:pt-6">
          {danger && (
            <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <AlertTriangle className="size-4.5" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-lg font-bold tracking-tight">{title}</h2>
            {subtitle && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          >
            <X className="size-4" />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-2 sm:px-7">{children}</div>
        {footer && (
          <footer className="flex items-center justify-end gap-2 border-t border-border px-6 py-4 sm:px-7">{footer}</footer>
        )}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- buttons */

export function GhostButton({
  children,
  onClick,
  type = "button",
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20",
        className,
      )}
    >
      {children}
    </button>
  );
}

export function PrimaryButton({
  children,
  onClick,
  type = "button",
  disabled,
  loading,
  done,
  className,
}: {
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  loading?: boolean;
  done?: boolean;
  className?: string;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "shine relative inline-flex h-10 items-center justify-center gap-2 overflow-hidden rounded-xl gradient-red px-4 text-sm font-semibold text-primary-foreground shadow-[0_10px_26px_-12px_rgba(229,13,45,0.75)] transition-all hover:shadow-[0_14px_34px_-12px_rgba(229,13,45,0.9)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/25 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none",
        className,
      )}
    >
      <span className="shine-sweep" />
      {loading ? <Loader2 className="size-4 animate-spin" /> : done ? <Check className="size-4" strokeWidth={3} /> : children}
    </button>
  );
}

export function SecondaryButton({
  children,
  onClick,
  disabled,
  className,
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-background/60 px-4 text-sm font-medium transition-all hover:border-primary/40 hover:bg-muted active:scale-[0.97] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-40",
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ fields */

export function TextField({
  label,
  value,
  onChange,
  required,
  error,
  placeholder,
  type = "text",
  suffix,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  error?: string;
  placeholder?: string;
  type?: string;
  suffix?: string;
  mono?: boolean;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="label-xs flex items-center gap-1">
        {label}
        {required && <span aria-hidden className="size-1.5 rounded-full bg-primary" />}
      </label>
      <div className="relative mt-2">
        <input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={Boolean(error)}
          className={cn(
            "h-11 w-full rounded-xl border bg-background/60 px-3.5 text-sm outline-none transition focus:ring-4 focus:ring-primary/15",
            suffix && "pr-14",
            mono && "mono",
            error ? "border-primary focus:border-primary" : "border-border focus:border-primary",
          )}
        />
        {suffix && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-muted px-2 py-1 mono text-[10px] text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-primary motion-safe:animate-in motion-safe:slide-in-from-top-1 motion-safe:duration-150">{error}</p>
      )}
    </div>
  );
}

export function SelectField({
  label,
  value,
  options,
  onChange,
  required,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div>
      <p className="label-xs flex items-center gap-1">
        {label}
        {required && <span aria-hidden className="size-1.5 rounded-full bg-primary" />}
      </p>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="mt-2 flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-border bg-background/60 px-3.5 text-left text-sm transition hover:border-primary/40 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/15"
          >
            <span className={cn("truncate", !value && "text-muted-foreground")}>{value || "Sélectionner…"}</span>
            <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width] max-h-72 overflow-y-auto">
          {options.map((o) => (
            <DropdownMenuItem key={o} onClick={() => onChange(o)} className="justify-between">
              {o}
              {o === value && <Check className="size-3.5 text-primary" strokeWidth={3} />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function TableSearch({
  value,
  onChange,
  placeholder = "Rechercher…",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="relative w-full sm:w-72">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-10 w-full rounded-xl border border-border bg-background/60 pl-9 pr-9 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
      />
      {value && (
        <button
          onClick={() => {
            onChange("");
            ref.current?.focus();
          }}
          aria-label="Effacer"
          className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------- empty state */

export function EmptyState({
  title = "Aucun résultat.",
  text = "Aucun élément ne correspond à ces filtres.",
  action,
}: {
  title?: string;
  text?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="glass mb-4 flex size-14 items-center justify-center rounded-full">
        <Search className="size-5 text-muted-foreground" />
      </div>
      <p className="font-display text-base font-semibold">{title}</p>
      <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------- confirm dialog hook */

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  verb,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  verb: string;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <Modal
      open={open}
      onClose={onClose}
      danger
      title={title}
      subtitle={message}
      width="max-w-md"
      footer={
        <>
          <GhostButton onClick={onClose} className="mr-auto">
            Annuler
          </GhostButton>
          <PrimaryButton
            loading={busy}
            onClick={() => {
              setBusy(true);
              setTimeout(() => {
                setBusy(false);
                onConfirm();
                onClose();
              }, 320);
            }}
          >
            {verb}
          </PrimaryButton>
        </>
      }
    >
      <span className="sr-only">{message}</span>
    </Modal>
  );
}
