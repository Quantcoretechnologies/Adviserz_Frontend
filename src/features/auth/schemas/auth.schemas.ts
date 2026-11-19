import { z } from "zod";
import { emailSchema, phoneSchema } from "@/lib/validation/contact";

/**
 * Client-side validation for the auth forms. The field rules mirror
 * adviserz_be/src/modules/auth/auth.schemas.ts so users see the same message
 * before submitting that the API would return after. Keep the two in sync.
 */

const email = emailSchema;
const phone = phoneSchema;

const fullName = z
  .string()
  .trim()
  .min(1, "Full name is required")
  .min(2, "Full name must be at least 2 characters")
  .max(100, "Full name must be at most 100 characters")
  .regex(
    /^[A-Za-z][A-Za-z .'-]*$/,
    "Full name may contain only letters, spaces, full stops, apostrophes and hyphens",
  );

const newPassword = z
  .string()
  .min(1, "Password is required")
  .min(8, "Password must be at least 8 characters")
  .max(64, "Password must be at most 64 characters")
  .regex(/^\S+$/, "Password must not contain spaces")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/\d/, "Password must contain at least one number")
  .regex(
    /[^A-Za-z0-9]/,
    "Password must contain at least one special character",
  );

const consent = z
  .boolean()
  .refine((accepted) => accepted, "Please accept the Disclaimer and T&Cs");

export const phoneLoginSchema = z.object({ phone });
export type PhoneLoginValues = z.infer<typeof phoneLoginSchema>;

export const emailLoginSchema = z.object({
  email,
  // Existing passwords are only checked for presence; the rules may have changed since signup.
  password: z.string().min(1, "Password is required"),
});
export type EmailLoginValues = z.infer<typeof emailLoginSchema>;

export const phoneSignupSchema = z.object({ fullName, phone, consent });
export type PhoneSignupValues = z.infer<typeof phoneSignupSchema>;

export const emailSignupSchema = z.object({
  fullName,
  email,
  password: newPassword,
  consent,
});
export type EmailSignupValues = z.infer<typeof emailSignupSchema>;

export const forgotPasswordSchema = z.object({ email });
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    newPassword,
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
