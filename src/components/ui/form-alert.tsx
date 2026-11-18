/** A form-level error, e.g. "Invalid email/phone or password". Renders nothing without a message. */
export function FormAlert({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="w-full rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm font-semibold text-destructive"
    >
      {message}
    </p>
  );
}
