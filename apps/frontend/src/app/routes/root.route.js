import { createElement } from "react";
import { Navigate, Outlet } from "react-router-dom";

import AuthLayout from "@/app/layouts/AuthLayout";
import ProjectContextRoute from "@/app/routes/ProjectContextRoute";
import ProtectedRoute from "@/app/routes/ProtectedRoute";
import AppShell from "@/app/shell";
import {
  ChangePasswordPage,
  CheckEmailPage,
  ForgotPasswordPage,
  LoginPage,
  MockEmailDetailPage,
  ProfilePage,
  ResetPasswordPage,
  UserManagementPage,
} from "@/features/auth";
import { AuditTrailPage } from "@/features/audit-trail";
import { DashboardPage } from "@/features/dashboard";
import { DocumentRegisterPage } from "@/features/document-register";
import { EscalationAlertPage } from "@/features/escalation-alert";
import { NotificationPage } from "@/features/notification";
import {
  ProjectManagementPage,
  ProjectMembershipManagementPage,
  SelectProjectPage,
} from "@/features/project";
import { SlaMonitoringPage } from "@/features/sla-monitoring";
import ContentLayout from "@/shared/layouts/ContentLayout";

/**
 * ============================================================
 * Root Route
 * ============================================================
 *
 * Description
 * ----------------------------------------
 * Root application routes.
 *
 * References
 * ----------------------------------------
 * - ROUTING.md
 * - PRD.md
 */

const UnderDevelopmentPage = ({ title }) =>
  createElement(
    "section",
    {
      className: "rounded-lg border border-[#123A5A] bg-[#061B2F] p-6",
    },
    createElement("h1", { className: "text-3xl font-bold" }, title),
    createElement(
      "p",
      { className: "mt-3 text-sm text-[#CBD5E1]" },
      "This feature is currently under development.",
    ),
  );

const createProtectedPage = ({
  element,
  permission,
  projectScoped = false,
  width,
}) =>
  projectScoped
    ? createElement(
        ProtectedRoute,
        null,
        createElement(
          ProjectContextRoute,
          null,
          createElement(
            ProtectedRoute,
            {
              permission,
              permissionScope: "project",
            },
            createElement(ContentLayout, { width }, element),
          ),
        ),
      )
    : createElement(
        ProtectedRoute,
        {
          permission,
        },
        createElement(ContentLayout, { width }, element),
      );

const rootRoute = [
  {
    element: createElement(AuthLayout),
    children: [
      {
        path: "/login",
        element: createElement(LoginPage),
      },
      {
        path: "/forgot-password",
        element: createElement(ForgotPasswordPage),
      },
      {
        path: "/check-email",
        element: createElement(CheckEmailPage),
      },
      {
        path: "/mock-email/:emailId",
        element: createElement(MockEmailDetailPage),
      },
      {
        path: "/reset-password",
        element: createElement(ResetPasswordPage),
      },
      {
        path: "/select-project",
        element: createElement(
          ProtectedRoute,
          null,
          createElement(SelectProjectPage),
        ),
      },
    ],
  },
  {
    path: "/",
    element: createElement(
      ProtectedRoute,
      null,
      createElement(AppShell, null, createElement(Outlet)),
    ),
    children: [
      {
        index: true,
        element: createElement(Navigate, {
          to: "/dashboard",
          replace: true,
        }),
      },
      {
        path: "dashboard",
        element: createProtectedPage({
          element: createElement(DashboardPage),
          permission: "dashboard.view",
          projectScoped: true,
        }),
      },
      {
        path: "document-register/pfd",
        element: createProtectedPage({
          element: createElement(DocumentRegisterPage),
          permission: "document-register.view",
          projectScoped: true,
        }),
      },
      {
        path: "document-register/pid",
        element: createProtectedPage({
          element: createElement(DocumentRegisterPage),
          permission: "document-register.view",
          projectScoped: true,
        }),
      },
      {
        path: "transmittal/incoming",
        element: createProtectedPage({
          element: createElement(UnderDevelopmentPage, {
            title: "Incoming Transmittal",
          }),
          permission: "transmittal.incoming",
          projectScoped: true,
        }),
      },
      {
        path: "transmittal/outgoing",
        element: createProtectedPage({
          element: createElement(UnderDevelopmentPage, {
            title: "Outgoing Transmittal",
          }),
          permission: "transmittal.outgoing",
          projectScoped: true,
        }),
      },
      {
        path: "sla-monitoring",
        element: createProtectedPage({
          element: createElement(SlaMonitoringPage),
          permission: "sla-monitoring.view",
          projectScoped: true,
        }),
      },
      {
        path: "escalation-alert",
        element: createProtectedPage({
          element: createElement(EscalationAlertPage),
          permission: "escalation.view",
          projectScoped: true,
        }),
      },
      {
        path: "audit-trail",
        element: createProtectedPage({
          element: createElement(AuditTrailPage),
          permission: "audit-trail.view",
          projectScoped: true,
        }),
      },
      {
        path: "storage-nas",
        element: createProtectedPage({
          element: createElement(UnderDevelopmentPage, {
            title: "Storage NAS",
          }),
          permission: "storage.view",
          projectScoped: true,
        }),
      },
      {
        path: "notifications",
        element: createProtectedPage({
          element: createElement(NotificationPage),
          permission: "notifications.view",
          projectScoped: true,
        }),
      },
      {
        path: "profile",
        element: createProtectedPage({
          element: createElement(ProfilePage),
          permission: "profile.view",
          width: "profile",
        }),
      },
      {
        path: "change-password",
        element: createProtectedPage({
          element: createElement(ChangePasswordPage),
          permission: "password.change",
          width: "form",
        }),
      },
      {
        path: "user-management",
        element: createProtectedPage({
          element: createElement(UserManagementPage),
          permission: "user-management.view",
        }),
      },
      {
        path: "project-management",
        element: createProtectedPage({
          element: createElement(ProjectManagementPage),
          permission: "user-management.view",
        }),
      },
      {
        path: "project-membership",
        element: createProtectedPage({
          element: createElement(ProjectMembershipManagementPage),
          permission: "user-management.view",
        }),
      },
    ],
  },
];

export default rootRoute;
