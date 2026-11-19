import Image from "next/image";
import type { ComponentProps, ReactNode } from "react";
import { FieldError, fieldErrorProps } from "./field";

interface CheckboxProps extends Omit<ComponentProps<"input">, "type"> {
  id: string;
  /** The label shown next to the box. */
  children: ReactNode;
  error?: string;
}

/**
 * A native checkbox drawn with the design's tick icon. Works controlled or
 * uncontrolled (the visual state follows the input through CSS).
 */
export function Checkbox({ id, children, error, ...props }: CheckboxProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* `relative` keeps the visually hidden input next to its label. Without
          it the input is placed against the nearest positioned ancestor (for
          example a dialog), and focusing it scrolls that ancestor instead. */}
      <label
        htmlFor={id}
        className="relative flex cursor-pointer items-center gap-2 text-base font-semibold tracking-[-0.24px] text-foreground"
      >
        <input
          id={id}
          type="checkbox"
          className="peer sr-only"
          {...fieldErrorProps(id, error)}
          {...props}
        />
        <span className="m-[1.67px] size-[16.67px] shrink-0 rounded-[5px] border-[1.25px] border-subtle peer-checked:hidden peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring" />
        <Image
          src="/icons/tick-square.svg"
          alt=""
          width={20}
          height={20}
          className="hidden shrink-0 rounded-[5px] peer-checked:block peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring"
        />
        <span>{children}</span>
      </label>
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}
