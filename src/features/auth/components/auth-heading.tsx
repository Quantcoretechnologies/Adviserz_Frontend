interface AuthHeadingProps {
  title: string;
  description: string;
}

/** Title and supporting line at the top of every auth form. */
export function AuthHeading({ title, description }: AuthHeadingProps) {
  return (
    <header className="flex w-full flex-col gap-2 font-semibold">
      <h1 className="font-display text-[36px] leading-[1.2] text-foreground sm:text-[47px]">
        {title}
      </h1>
      <p className="text-lg tracking-[-0.27px] text-muted-foreground">
        {description}
      </p>
    </header>
  );
}
