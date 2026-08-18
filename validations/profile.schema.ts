import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z
    .string({ required_error: "Full name is required" })
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Full name cannot exceed 100 characters"),
  phone: z
    .string({ required_error: "Phone number is required" })
    .trim()
    .min(7, "Phone number must be at least 7 digits")
    .max(15, "Phone number cannot exceed 15 digits")
    .regex(/^[+]?[0-9\s-]{7,15}$/, "Please enter a valid phone number"),
  department: z
    .string({ required_error: "Department is required" })
    .trim()
    .min(2, "Department must be at least 2 characters")
    .max(50, "Department cannot exceed 50 characters"),
  companyName: z
    .string()
    .max(100, "Company name cannot exceed 100 characters")
    .optional()
    .or(z.literal("")),
  profileImage: z.string().optional().or(z.literal("")),
  homeLocation: z
    .string()
    .max(150, "Home location cannot exceed 150 characters")
    .optional()
    .or(z.literal("")),
  commutePreferences: z
    .object({
      departureTimePreference: z.string().optional().or(z.literal("")),
      notes: z.string().max(250, "Notes cannot exceed 250 characters").optional().or(z.literal("")),
      smokingPreference: z.boolean().optional(),
      musicPreference: z.boolean().optional(),
    })
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
