/**
 * ============================================================
 * Navigation Configuration
 * ============================================================
 *
 * Navigation Item Schema
 *
 * {
 *   id: string,
 *   title: string,
 *   path?: string,
 *   icon: ReactComponent,
 *   permission: string,
 *   children?: NavigationItem[]
 * }
 */
import {
  Bell,
  Database,
  FileText,
  FolderKanban,
  Gauge,
  GitPullRequest,
  LayoutDashboard,
  Send,
  ShieldAlert,
  Users,
} from "lucide-react";

const navigation = [
  {
    id: "dashboard",
    title: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    permission: "dashboard.view",
  },
  {
    id: "document-register",
    title: "Document Register",
    icon: FileText,
    permission: "document-register.view",
    children: [
      {
        id: "document-register-pfd",
        title: "PFD",
        path: "/document-register/pfd",
        icon: FileText,
        permission: "document-register.view",
      },
      {
        id: "document-register-pid",
        title: "P&ID",
        path: "/document-register/pid",
        icon: FileText,
        permission: "document-register.view",
      },
    ],
  },
  {
    id: "transmittal",
    title: "Transmittal",
    icon: Send,
    permission: "transmittal.view",
    children: [
      {
        id: "transmittal-incoming",
        title: "Incoming",
        path: "/transmittal/incoming",
        icon: Send,
        permission: "transmittal.incoming",
      },
      {
        id: "transmittal-outgoing",
        title: "Outgoing",
        path: "/transmittal/outgoing",
        icon: Send,
        permission: "transmittal.outgoing",
      },
    ],
  },
  {
    id: "sla-monitoring",
    title: "SLA Monitoring",
    path: "/sla-monitoring",
    icon: Gauge,
    permission: "sla-monitoring.view",
  },
  {
    id: "escalation-alert",
    title: "Escalation Alert",
    path: "/escalation-alert",
    icon: ShieldAlert,
    permission: "escalation.view",
  },
  {
    id: "audit-trail",
    title: "Audit Trail",
    path: "/audit-trail",
    icon: GitPullRequest,
    permission: "audit-trail.view",
  },
  {
    id: "storage-nas",
    title: "Storage NAS",
    path: "/storage-nas",
    icon: Database,
    permission: "storage.view",
  },
  {
    id: "notification",
    title: "Notification",
    path: "/notifications",
    icon: Bell,
    permission: "notifications.view",
  },
  {
    id: "administration",
    title: "Administration",
    icon: Users,
    permission: "user-management.view",
    children: [
      {
        id: "user-management",
        title: "User Management",
        path: "/user-management",
        icon: Users,
        permission: "user-management.view",
      },
      {
        id: "project-management",
        title: "Project Management",
        path: "/project-management",
        icon: FolderKanban,
        permission: "user-management.view",
      },
      {
        id: "project-membership",
        title: "Project Membership",
        path: "/project-membership",
        icon: Users,
        permission: "user-management.view",
      },
    ],
  },
];

export default navigation;
