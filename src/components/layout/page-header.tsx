import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Buttons shown at the end of the header, e.g. "Create role". */
  actions?: ReactNode;
}

/** The title block at the top of a page inside a shell. */
export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="font-display text-[28px] leading-9 font-semibold text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="text-base tracking-[-0.24px] text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 items-center gap-3">{actions}</div>
      ) : null}
    </header>
  );
}
