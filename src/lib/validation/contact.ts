import { z } from "zod";

/**
 * Contact field rules shared by every form that asks for an email or phone.
 * They mirror adviserz_be/src/modules/auth/auth.schemas.ts; keep them in sync.
 */

export const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .max(254, "Email must be at most 254 characters")
  .pipe(z.email("Enter a valid email address"));

/** Ten national digits; the +91 prefix is added by the UI. */
export const phoneSchema = z
  .string()
  .min(1, "Phone number is required")
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number");
