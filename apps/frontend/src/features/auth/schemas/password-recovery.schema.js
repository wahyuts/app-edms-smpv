import { z } from "zod";

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
export const PASSWORD_RULE_MESSAGES = {
  lowercase: "Password harus mengandung minimal satu huruf kecil.",
  minLength: "Password minimal 8 karakter.",
  number: "Password harus mengandung minimal satu angka.",
  symbol: "Password harus mengandung minimal satu simbol.",
  uppercase: "Password harus mengandung minimal satu huruf besar.",
};
export const PASSWORD_CONFIRMATION_MISMATCH_MESSAGE = "Confirm Password tidak sama.";

const requiredText = (fieldName) =>
  z.string({
    error: `${fieldName} wajib diisi.`,
  }).trim().min(1, `${fieldName} wajib diisi.`);

export const getPasswordPolicyMessages = (password) => {
  const value = String(password ?? "");
  const messages = [];

  if (value.length < 8) {
    messages.push(PASSWORD_RULE_MESSAGES.minLength);
  }

  if (!/[A-Z]/.test(value)) {
    messages.push(PASSWORD_RULE_MESSAGES.uppercase);
  }

  if (!/[a-z]/.test(value)) {
    messages.push(PASSWORD_RULE_MESSAGES.lowercase);
  }

  if (!/\d/.test(value)) {
    messages.push(PASSWORD_RULE_MESSAGES.number);
  }

  if (!/[^A-Za-z0-9]/.test(value)) {
    messages.push(PASSWORD_RULE_MESSAGES.symbol);
  }

  return messages;
};

export const getPasswordPolicyMessage = (password) =>
  getPasswordPolicyMessages(password).join("\n");

export const forgotPasswordSchema = z.object({
  registeredEmail: requiredText("Registered Email").email("Registered Email tidak valid."),
  username: requiredText("Username"),
});

export const resetPasswordSchema = z.object({
  confirmPassword: requiredText("Confirm Password"),
  newPassword: requiredText("New Password").refine(
    (value) => PASSWORD_PATTERN.test(value),
    (value) => ({ message: getPasswordPolicyMessage(value) }),
  ),
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
