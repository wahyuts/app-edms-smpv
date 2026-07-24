import { z } from "zod";

import {
  PROJECT_MEMBERSHIP_STATUS_OPTIONS,
  PROJECT_OFFICIAL_ROLE_OPTIONS,
  PROJECT_STATUS_OPTIONS,
} from "../constants/project.constants";

const requiredText = (fieldName) =>
  z.string({
    error: `${fieldName} is required.`,
  }).trim().min(1, `${fieldName} is required.`);

export const projectCodeSchema = requiredText("Project Code")
  .regex(/^[A-Za-z0-9][A-Za-z0-9._-]*$/, "Project Code may only contain letters, numbers, dot, underscore, or dash.");

export const projectNameSchema = requiredText("Project Name");

export const projectStatusSchema = z.enum(PROJECT_STATUS_OPTIONS, {
  error: "Project Status must be Active, Inactive, or Closed.",
});

export const projectMembershipStatusSchema = z.enum(
  PROJECT_MEMBERSHIP_STATUS_OPTIONS,
  {
    error: "Membership Status must be Active or Inactive.",
  },
);

export const projectOfficialRoleSchema = z.enum(PROJECT_OFFICIAL_ROLE_OPTIONS, {
  error: "Official Role is required.",
});

export const projectUserIdSchema = z.coerce
  .number({
    error: "User is required.",
  })
  .int("User is required.")
  .positive("User is required.");

export const createProjectSchema = z.object({
  description: z.string().trim().optional().default(""),
  projectCode: projectCodeSchema,
  projectName: projectNameSchema,
  status: projectStatusSchema,
});

export const updateProjectSchema = z.object({
  description: z.string().trim().optional().default(""),
  projectCode: projectCodeSchema.optional(),
  projectName: projectNameSchema,
  status: projectStatusSchema,
});

export const createProjectMembershipSchema = z.object({
  officialRole: projectOfficialRoleSchema,
  projectId: requiredText("Project"),
  status: projectMembershipStatusSchema,
  userId: projectUserIdSchema,
});

export const updateProjectMembershipSchema = z.object({
  officialRole: projectOfficialRoleSchema,
  status: projectMembershipStatusSchema,
});

export const formatProjectValidationIssues = (issues) =>
  issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));
