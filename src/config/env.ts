import { z } from "zod";

/**
 * Public (browser-exposed) environment variables, validated once at module load.
 *
 * NEXT_PUBLIC_* values are inlined at build time, so each one must be
 * referenced as a literal `process.env.NAME` below — dynamic lookups are not
 * inlined. Add server-only secrets to a separate module, never here.
 */
const withoutTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const publicEnvSchema = z.object({
  /** Backend base URL including the API prefix, e.g. http://localhost:4000/api/v1 */
  NEXT_PUBLIC_API_URL: z.url().transform(withoutTrailingSlash),
  /** Public origin of this web app, e.g. http://localhost:3000 */
  NEXT_PUBLIC_APP_URL: z.url().transform(withoutTrailingSlash),
});

const parsed = publicEnvSchema.safeParse({
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
});

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(
    `Invalid environment variables:\n${issues}\nCopy .env.example to .env.local and fill in the values.`,
  );
}

export const env = parsed.data;
