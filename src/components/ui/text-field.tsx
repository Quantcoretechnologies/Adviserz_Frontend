import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";
import { Field, fieldErrorProps, inputBoxClassName } from "./field";

interface TextFieldProps extends ComponentProps<"input"> {
  id: string;
  label: string;
  error?: string;
}

export function TextField({
  id,
  label,
  error,
  className,
  ...props
}: TextFieldProps) {
  return (
    <Field label={label} htmlFor={id} error={error}>
      <input
        id={id}
        className={cn(
          inputBoxClassName,
          "w-full p-4 placeholder:text-subtle focus:border-primary focus:outline-none aria-invalid:border-destructive",
          className,
        )}
        {...fieldErrorProps(id, error)}
        {...props}
      />
    </Field>
  );
}
