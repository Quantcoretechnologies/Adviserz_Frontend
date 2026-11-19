"use client";

import Image from "next/image";
import { useState, type ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";
import { Field, fieldErrorProps, inputBoxClassName } from "./field";

interface PasswordFieldProps extends Omit<ComponentProps<"input">, "type"> {
  id: string;
  label: string;
  error?: string;
}

/**
 * A password input with an eye button that shows or hides what was typed.
 * It always starts hidden, and the button never submits the form.
 */
export function PasswordField({
  id,
  label,
  error,
  className,
  ...props
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <Field label={label} htmlFor={id} error={error}>
      <div className="relative w-full">
        <input
          id={id}
          type={visible ? "text" : "password"}
          className={cn(
            inputBoxClassName,
            "w-full py-4 pr-14 pl-4 placeholder:text-subtle focus:border-primary focus:outline-none aria-invalid:border-destructive",
            // Edge draws its own reveal button inside password inputs; ours replaces it.
            "[&::-ms-clear]:hidden [&::-ms-reveal]:hidden",
            className,
          )}
          {...fieldErrorProps(id, error)}
          {...props}
        />
        <button
          type="button"
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          aria-controls={id}
          onClick={() => setVisible((current) => !current)}
          className="absolute top-1/2 right-2 flex size-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg opacity-60 hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-primary"
        >
          <Image
            src={visible ? "/icons/eye-off.svg" : "/icons/eye.svg"}
            alt=""
            width={20}
            height={20}
          />
        </button>
      </div>
    </Field>
  );
}
