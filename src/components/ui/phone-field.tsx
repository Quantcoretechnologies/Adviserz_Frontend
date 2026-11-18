import Image from "next/image";
import type { Ref } from "react";
import { cn } from "@/lib/utils/cn";
import { Field, fieldErrorProps, inputBoxClassName } from "./field";

interface PhoneFieldProps {
  id: string;
  label: string;
  /** Ten national digits, without the +91 prefix. */
  value: string;
  onChange: (digits: string) => void;
  onBlur?: () => void;
  name?: string;
  ref?: Ref<HTMLInputElement>;
  error?: string;
}

const PHONE_LENGTH = 10;

/** Indian mobile number input. The country is fixed to India (+91). */
export function PhoneField({
  id,
  label,
  value,
  onChange,
  onBlur,
  name,
  ref,
  error,
}: PhoneFieldProps) {
  return (
    <Field label={label} htmlFor={id} error={error}>
      <div
        className={cn(
          inputBoxClassName,
          "flex w-full items-center gap-2.5 p-4 focus-within:border-primary",
          error && "border-destructive",
        )}
      >
        <span className="flex shrink-0 items-center gap-2" aria-hidden>
          <Image src="/icons/flag-india.svg" alt="" width={20} height={20} />
          <Image src="/icons/chevron-down.svg" alt="" width={16} height={16} />
        </span>
        <span className="flex min-w-0 flex-1 items-center gap-1">
          <span>+91</span>
          <input
            id={id}
            ref={ref}
            name={name}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="XXXXX - XXXXX"
            maxLength={PHONE_LENGTH}
            value={value}
            onChange={(event) =>
              onChange(
                event.target.value.replace(/\D/g, "").slice(0, PHONE_LENGTH),
              )
            }
            onBlur={onBlur}
            className="min-w-0 flex-1 bg-transparent placeholder:text-subtle focus:outline-none"
            {...fieldErrorProps(id, error)}
          />
        </span>
      </div>
    </Field>
  );
}
