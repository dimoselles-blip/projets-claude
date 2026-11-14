import type { ReactNode } from "react";
import { cn, initials } from "@/lib/utils";

export function PageHeader({ title, description, actions }: { title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold text-ink-900 sm:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-ink-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ icon, title, description, action }: { icon?: ReactNode; title: string; description?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-ink-200 bg-ink-50/50 px-6 py-12 text-center">
      {icon && <div className="mb-3 grid size-12 place-items-center rounded-full bg-brand-400 text-ink-950">{icon}</div>}
      <p className="font-semibold text-ink-900">{title}</p>
      {description && <p className="mt-1 max-w-md text-sm text-ink-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Stat({ label, value, hint, icon, className }: { label: string; value: ReactNode; hint?: ReactNode; icon?: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-ink-100 bg-white p-5 shadow-card", className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-ink-500">{label}</p>
        {icon && <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-100 text-ink-950">{icon}</span>}
      </div>
      <p className="mt-2 font-display text-2xl font-bold text-ink-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
    </div>
  );
}

const avatarColors = ["bg-brand-400 text-ink-950", "bg-ink-950 text-brand-400", "bg-brand-100 text-ink-900", "bg-ink-100 text-ink-800", "bg-emerald-100 text-emerald-800"];

export function Avatar({ name, src, size = 40, className }: { name: string; src?: string | null; size?: number; className?: string }) {
  const color = avatarColors[name.length % avatarColors.length];
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} width={size} height={size} className={cn("shrink-0 rounded-full object-cover", className)} style={{ width: size, height: size }} />;
  }
  return (
    <span
      aria-hidden
      className={cn("grid shrink-0 place-items-center rounded-full font-semibold", color, className)}
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.36) }}
    >
      {initials(name)}
    </span>
  );
}

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children?: ReactNode; className?: string }) {
  return <th className={cn("border-b border-ink-100 px-4 py-3 text-xs font-semibold tracking-wide text-ink-500 uppercase", className)}>{children}</th>;
}

export function Td({ children, className }: { children?: ReactNode; className?: string }) {
  return <td className={cn("border-b border-ink-100 px-4 py-3 align-middle text-ink-800", className)}>{children}</td>;
}
