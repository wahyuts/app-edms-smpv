import { z } from "zod";

const requiredText = (fieldName) =>
  z.string({
    error: `${fieldName} is required.`,
  }).trim().min(1, `${fieldName} is required.`);

export const forgotPasswordSchema = z.object({
  email: requiredText("Registered Email").email("Registered Email is not valid."),
  username: requiredText("Username"),
});

export const resetPasswordSchema = z.object({
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
