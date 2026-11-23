const DECLARATION_PREFIX = "Declaration:";
const LIST_ITEM = /^\d+\.\s+/;

/**
 * Split a disclaimer text from the API into its parts. The layout rules are
 * set by the API: paragraphs are separated by a blank line, lines starting
 * "1. " form a numbered list, and a final paragraph starting "Declaration:"
 * is the sentence the user ticks.
 */
export function parseDisclaimer(statement: string): {
  paragraphs: string[];
  declaration: string | null;
} {
  const paragraphs = statement
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
  const last = paragraphs.at(-1);
  if (last?.startsWith(DECLARATION_PREFIX)) {
    return {
      paragraphs: paragraphs.slice(0, -1),
      declaration: last.slice(DECLARATION_PREFIX.length).trim(),
    };
  }
  return { paragraphs, declaration: null };
}

/** Paragraphs and numbered lists of a disclaimer or notice, exactly as worded by the API. */
export function DisclaimerText({ paragraphs }: { paragraphs: string[] }) {
  return (
    <div className="flex flex-col gap-3 text-base tracking-[-0.24px] text-foreground">
      {paragraphs.map((paragraph, index) => {
        const lines = paragraph.split("\n");
        const intro = lines.filter((line) => !LIST_ITEM.test(line));
        const items = lines.filter((line) => LIST_ITEM.test(line));
        return (
          <div key={index} className="flex flex-col gap-2">
            {intro.map((line, lineIndex) => (
              <p
                key={lineIndex}
                // A block of several lines (e.g. one segment in a change
                // notice) opens with its subject: show it as a heading.
                className={
                  lineIndex === 0 && intro.length > 1
                    ? "font-semibold whitespace-pre-line"
                    : "whitespace-pre-line"
                }
              >
                {line}
              </p>
            ))}
            {items.length > 0 ? (
              <ol className="flex list-decimal flex-col gap-1.5 pl-6 marker:text-muted-foreground">
                {items.map((item, itemIndex) => (
                  <li key={itemIndex}>{item.replace(LIST_ITEM, "")}</li>
                ))}
              </ol>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
