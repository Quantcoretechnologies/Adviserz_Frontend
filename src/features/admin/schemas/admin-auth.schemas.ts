import { z } from "zod";
import { emailSchema } from "@/lib/validation/contact";

/**
 * Client-side validation for the admin console's auth forms. The rules mirror
 * adviserz_be/src/modules/admin/admin.schemas.ts so staff see the same
 * message before submitting that the API would return after. Keep in sync.
 */

export const adminLoginSchema = z.object({
  email: emailSchema,
  // Only checked for presence: the rules may have changed since it was set.
  password: z.string().min(1, "Password is required"),
});
export type AdminLoginValues = z.infer<typeof adminLoginSchema>;

/** Staff passwords are longer than customer ones: at least 12 characters. */
const staffPassword = z
  .string()
  .min(1, "New password is required")
  .min(12, "Password must be at least 12 characters")
  .max(64, "Password must be at most 64 characters")
  .regex(/^\S+$/, "Password must not contain spaces")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/\d/, "Password must contain at least one number")
  .regex(
    /[^A-Za-z0-9]/,
    "Password must contain at least one special character",
  );

export const changeAdminPasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: staffPassword,
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    path: ["newPassword"],
    message: "New password must differ from your current password",
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });
export type ChangeAdminPasswordValues = z.infer<
  typeof changeAdminPasswordSchema
>;
