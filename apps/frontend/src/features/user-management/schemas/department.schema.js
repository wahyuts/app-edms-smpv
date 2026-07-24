import { z } from "zod";

import { DEPARTMENT_STATUS_OPTIONS } from "../constants/department.constants";

const requiredText = (fieldName) =>
  z.string({
    error: `${fieldName} is required.`,
  }).trim().min(1, `${fieldName} is required.`);

export const departmentNameSchema = requiredText("Department Name");

export const createDepartmentSchema = z.object({
  name: departmentNameSchema,
});

export const updateDepartmentSchema = z.object({
  name: departmentNameSchema,
});

export const departmentStatusSchema = z.enum(DEPARTMENT_STATUS_OPTIONS, {
  error: "Department Status must be Active or Inactive.",
});

export const formatDepartmentValidationIssues = (issues) =>
  issues.map((issue) => ({
    field: issue.path.join("."),
    message: issue.message,
  }));

