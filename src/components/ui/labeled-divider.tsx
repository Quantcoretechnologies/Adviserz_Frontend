/** A horizontal rule with a centred label, e.g. "Or". */
export function LabeledDivider({ label }: { label: string }) {
  return (
    <div className="flex w-full items-center justify-center gap-6" role="none">
      <span className="h-px w-full max-w-[210px] bg-divider" />
      <span className="text-base font-semibold tracking-[-0.24px] text-subtle">
        {label}
      </span>
      <span className="h-px w-full max-w-[210px] bg-divider" />
    </div>
  );
}
