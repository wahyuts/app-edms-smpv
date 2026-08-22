import { z } from "zod";

export const PASSWORD_CONFIRMATION_MISMATCH_MESSAGE = "Confirm Password tidak sama.";

const requiredText = (fieldName) =>
  z.string({
    error: `${fieldName} wajib diisi.`,
  }).trim().min(1, `${fieldName} wajib diisi.`);

export const forgotPasswordSchema = z.object({
  registeredEmail: requiredText("Registered Email").email("Registered Email tidak valid."),
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
