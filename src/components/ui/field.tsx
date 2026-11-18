import type { ReactNode } from "react";

interface FieldProps {
  label: string;
  /** `id` of the control inside. Its error message gets the id `${htmlFor}-error`. */
  htmlFor: string;
  error?: string;
  children: ReactNode;
}

/** Label, control and validation message. Every form control is wrapped in one. */
export function Field({ label, htmlFor, error, children }: FieldProps) {
  return (
    <div className="flex w-full flex-col gap-3">
      <label
        htmlFor={htmlFor}
        className="font-display text-base font-semibold text-foreground"
      >
        {label}
      </label>
      {children}
      <FieldError id={`${htmlFor}-error`} message={error} />
    </div>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-sm font-semibold text-destructive">
      {message}
    </p>
  );
}

/** ARIA attributes that tie a control to its `FieldError`. */
export function fieldErrorProps(id: string, error?: string) {
  return error
    ? ({ "aria-invalid": true, "aria-describedby": `${id}-error` } as const)
    : {};
}

/** The filled, rounded box shared by every input in the design. */
export const inputBoxClassName =
  "rounded-xl border border-transparent bg-surface text-base font-semibold tracking-[-0.24px] text-foreground";
