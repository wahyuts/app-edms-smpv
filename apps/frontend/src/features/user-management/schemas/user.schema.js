import { z } from "zod";

import { USER_STATUS_OPTIONS } from "../constants/user.constants";

const requiredText = (fieldName) =>
  z.string({
    error: `${fieldName} is required.`,
  }).trim().min(1, `${fieldName} is required.`);

const requiredConfirmPassword = z.string({
  error: "Konfirmasi password wajib diisi",
}).trim().min(1, "Konfirmasi password wajib diisi");

const emailSchema = requiredText("Email").email("Email is not valid.");

export const userIdentitySchema = z.object({
  department: requiredText("Department"),
  email: emailSchema,
  name: requiredText("Name"),
  username: requiredText("Username"),
});

export const updateUserIdentitySchema = z.object({
  department: requiredText("Department"),
  email: emailSchema,
  name: requiredText("Name"),
});

export const createUserSchema = userIdentitySchema.extend({
  confirmPassword: requiredConfirmPassword,
  initialPassword: requiredText("Initial Password"),
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
