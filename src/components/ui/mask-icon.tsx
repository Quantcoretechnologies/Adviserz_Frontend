import { cn } from "@/lib/utils/cn";

interface MaskIconProps {
  /** Path of an SVG in /public. */
  src: string;
  /** Size of the drawing itself; the icon always occupies a 24px box. */
  width?: number;
  height?: number;
  className?: string;
}

/**
 * Draws an SVG file in the current text colour, so one icon asset works in
 * every state (default, active, disabled) instead of needing a file per colour.
 */
export function MaskIcon({
  src,
  width = 24,
  height = 24,
  className,
}: MaskIconProps) {
  const mask = `url("${src}") center / ${width}px ${height}px no-repeat`;
  return (
    <span
      aria-hidden
      className={cn("inline-block size-6 shrink-0 bg-current", className)}
      style={{ mask, WebkitMask: mask }}
    />
  );
}
