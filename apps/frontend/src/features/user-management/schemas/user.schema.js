import { z } from "zod";

import { USER_STATUS_OPTIONS } from "../constants/user.constants";

const requiredText = (fieldName, message = `${fieldName} is required.`) =>
  z.string({
    error: message,
  }).trim().min(1, message);

const requiredConfirmPassword = z.string({
  error: "Confirm password is required",
}).trim().min(1, "Confirm password is required");

const emailSchema = requiredText("Email", "Email is required.").email("Email is not valid.");

export const userIdentitySchema = z.object({
  department: requiredText("Department", "Department is required."),
  email: emailSchema,
  name: requiredText("Name", "Name is required."),
  username: requiredText("Username", "Username is required."),
});

export const updateUserIdentitySchema = z.object({
  department: requiredText("Department", "Department is required."),
  email: emailSchema,
  name: requiredText("Name", "Name is required."),
});

export const createUserSchema = userIdentitySchema.extend({
  confirmPassword: requiredConfirmPassword,
  initialPassword: requiredText("Initial Password", "Password is required."),
}).refine(
  (value) => value.initialPassword === value.confirmPassword,
  {
    message: "Confirm password does not match",
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
