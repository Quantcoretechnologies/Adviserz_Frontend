import { z } from "zod";
import { emailSchema } from "@/lib/validation/contact";

/**
 * Client-side validation for the staff and role forms. The rules mirror
 * adviserz_be/src/modules/admin/admin.schemas.ts so staff see the same
 * message before submitting that the API would return after. Keep in sync.
 */

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

export const staffDetailsSchema = z.object({ fullName, email: emailSchema });
export type StaffDetailsValues = z.infer<typeof staffDetailsSchema>;

export const blockStaffSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(1, "Reason is required")
    .min(3, "Reason must be at least 3 characters")
    .max(500, "Reason must be at most 500 characters"),
});
export type BlockStaffValues = z.infer<typeof blockStaffSchema>;

/** Role names are free text; the permissions are validated separately. */
export const roleDetailsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Role name is required")
    .min(2, "Role name must be at least 2 characters")
    .max(80, "Role name must be at most 80 characters"),
  description: z
    .string()
    .trim()
    .max(500, "Description must be at most 500 characters"),
});
export type RoleDetailsValues = z.infer<typeof roleDetailsSchema>;
