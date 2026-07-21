import type { InputHTMLAttributes } from "react";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
}

export function Field({ label, hint, id, className = "", ...props }: FieldProps) {
  const fieldId = id ?? props.name;
  return (
    <div className={className}>
      <label className="mb-2 block text-xs tracking-[0.06em] text-muted" htmlFor={fieldId}>
        {label}
      </label>
      <input
        className="min-h-12 w-full rounded-[2px] border border-line bg-surface px-4 py-3 text-base text-foreground outline-none transition focus:border-accent"
        id={fieldId}
        {...props}
      />
      {hint ? <p className="mt-2 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}
