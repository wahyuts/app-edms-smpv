import { z } from "zod";

export const PASSWORD_CONFIRMATION_MISMATCH_MESSAGE = "Confirm Password does not match.";

const requiredText = (fieldName) =>
  z.string({
    error: `${fieldName} is required.`,
  }).trim().min(1, `${fieldName} is required.`);

export const forgotPasswordSchema = z.object({
  registeredEmail: requiredText("Registered Email").email("Registered Email is required."),
  username: requiredText("Username"),
});

export const resetPasswordSchema = z.object({
  confirmPassword: requiredText("Confirm Password"),
  newPassword: requiredText("New Password"),
}).refine(
  (value) => value.newPassword === value.confirmPassword,
  {
    message: PASSWORD_CONFIRMATION_MISMATCH_MESSAGE,
    path: ["confirmPassword"],
  },
);

export const formatValidationIssues = (issues) =>
  issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
