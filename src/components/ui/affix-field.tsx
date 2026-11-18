import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";
import { Field, fieldErrorProps, inputBoxClassName } from "./field";

interface AffixFieldProps extends ComponentProps<"input"> {
  id: string;
  label: string;
  /** Shown inside the box before the value, e.g. "₹". */
  prefix?: string;
  /** Shown inside the box after the value, e.g. "%". */
  suffix?: string;
  /** Guidance under the field, e.g. "Minimum ₹75,000". Hidden while there is an error. */
  hint?: string;
  error?: string;
}

/** A text input with a fixed unit before or after the value. */
export function AffixField({
  id,
  label,
  prefix,
  suffix,
  hint,
  error,
  className,
  ...props
}: AffixFieldProps) {
  return (
    <Field label={label} htmlFor={id} error={error}>
      <div
        className={cn(
          inputBoxClassName,
          "flex w-full items-center gap-2 p-4 focus-within:border-primary",
          error && "border-destructive",
        )}
      >
        {prefix ? <span aria-hidden>{prefix}</span> : null}
        <input
          id={id}
          className={cn(
            "min-w-0 flex-1 bg-transparent placeholder:text-subtle focus:outline-none",
            className,
          )}
          {...fieldErrorProps(id, error)}
          {...props}
        />
        {suffix ? <span aria-hidden>{suffix}</span> : null}
      </div>
      {hint && !error ? (
        <p className="text-sm font-semibold text-subtle">{hint}</p>
      ) : null}
    </Field>
  );
}
