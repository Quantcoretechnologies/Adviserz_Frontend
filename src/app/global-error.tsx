"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary for errors thrown by the root layout itself. It
 * replaces the root layout, so it renders its own <html>/<body> and uses
 * inline styles instead of depending on the global stylesheet.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          padding: "24px",
          textAlign: "center",
          fontFamily: "system-ui, sans-serif",
          colorScheme: "light dark",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "24px" }}>Something went wrong</h1>
        <p style={{ margin: 0 }}>
          An unexpected error occurred. Please try again.
        </p>
        <button
          type="button"
          onClick={() => retry()}
          style={{ padding: "8px 16px", fontSize: "14px", cursor: "pointer" }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
