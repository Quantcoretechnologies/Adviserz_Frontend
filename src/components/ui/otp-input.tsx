"use client";

import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils/cn";
import { fieldErrorProps, inputBoxClassName } from "./field";

interface OtpInputProps {
  id: string;
  /** The digits entered so far, e.g. "123". */
  value: string;
  onChange: (value: string) => void;
  /** Total number of digits. */
  length?: number;
  /** Digits per visual group; the design shows 6 digits as 3 + 3. */
  groupSize?: number;
  error?: string;
  disabled?: boolean;
}

export function OtpInput({
  id,
  value,
  onChange,
  length = 6,
  groupSize = 3,
  error,
  disabled,
}: OtpInputProps) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const focusBox = (index: number) => {
    inputs.current[Math.max(0, Math.min(index, length - 1))]?.focus();
  };

  const setDigits = (digits: string) => onChange(digits.slice(0, length));

  const handleChange = (index: number, raw: string) => {
    const typed = raw.replace(/\D/g, "");
    if (!typed) return;
    // Typing always fills from the first empty box, so there are never gaps.
    const position = Math.min(index, value.length);
    setDigits(
      value.slice(0, position) + typed + value.slice(position + typed.length),
    );
    focusBox(position + typed.length);
  };

  const handleKeyDown = (
    index: number,
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Backspace") {
      event.preventDefault();
      const position = value[index] ? index : index - 1;
      if (position < 0) return;
      setDigits(value.slice(0, position) + value.slice(position + 1));
      focusBox(position);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusBox(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      focusBox(Math.min(index + 1, value.length));
    }
  };

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;
    setDigits(pasted);
    focusBox(pasted.length);
  };

  const groups = Array.from(
    { length: Math.ceil(length / groupSize) },
    (_, group) =>
      Array.from(
        { length: Math.min(groupSize, length - group * groupSize) },
        (_, offset) => group * groupSize + offset,
      ),
  );

  return (
    <div
      role="group"
      aria-labelledby={`${id}-label`}
      className="flex w-full gap-[22px]"
    >
      {groups.map((indexes) => (
        <div
          key={indexes[0]}
          className="flex w-full max-w-[195px] min-w-0 gap-3"
        >
          {indexes.map((index) => (
            <input
              key={index}
              ref={(element) => {
                inputs.current[index] = element;
              }}
              id={index === 0 ? id : undefined}
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? "one-time-code" : "off"}
              aria-label={`Digit ${index + 1} of ${length}`}
              placeholder="_"
              value={value[index] ?? ""}
              disabled={disabled}
              onChange={(event) => handleChange(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              onPaste={handlePaste}
              onFocus={(event) => event.target.select()}
              className={cn(
                inputBoxClassName,
                "w-0 min-w-0 flex-1 px-1 py-4 text-center placeholder:text-subtle focus:border-primary focus:outline-none aria-invalid:border-destructive",
              )}
              {...fieldErrorProps(id, error)}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
