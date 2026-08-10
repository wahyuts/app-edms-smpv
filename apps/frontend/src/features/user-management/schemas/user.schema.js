import { z } from "zod";

import { USER_STATUS_OPTIONS } from "../constants/user.constants";

const requiredText = (fieldName, message = `${fieldName} is required.`) =>
  z.string({
    error: message,
  }).trim().min(1, message);

const requiredConfirmPassword = z.string({
  error: "Konfirmasi password wajib diisi",
}).trim().min(1, "Konfirmasi password wajib diisi");

const emailSchema = requiredText("Email", "Email wajib di isi.").email("Email tidak valid.");

export const userIdentitySchema = z.object({
  department: requiredText("Department", "Department wajib di isi."),
  email: emailSchema,
  name: requiredText("Name", "Name wajib di isi."),
  username: requiredText("Username", "Username wajib di isi."),
});

export const updateUserIdentitySchema = z.object({
  department: requiredText("Department", "Department wajib di isi."),
  email: emailSchema,
  name: requiredText("Name", "Name wajib di isi."),
});

export const createUserSchema = userIdentitySchema.extend({
  confirmPassword: requiredConfirmPassword,
  initialPassword: requiredText("Initial Password", "Password wajib di isi."),
}).refine(
  (value) => value.initialPassword === value.confirmPassword,
  {
    message: "Konfirmasi password tidak sama",
    path: ["confirmPassword"],
  },
);

export const updateUserSchema = updateUserIdentitySchema.extend({
  status: z.enum(USER_STATUS_OPTIONS, {
    error: "Status must be Active or Inactive.",
  }),
});

export const changeUserPasswordSchema = z.object({
  confirmPassword: requiredText("Confirm Password"),
  newPassword: requiredText("New Password"),
}).refine(
  (value) => value.newPassword === value.confirmPassword,
  {
    message: "New Password and Confirm Password must match.",
    path: ["confirmPassword"],
  },
);

export const formatValidationIssues = (issues) =>
  issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
