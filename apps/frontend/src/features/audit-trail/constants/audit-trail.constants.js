export const AUDIT_TRAIL_ACTION = {
  APPROVAL_A: "Approval A",
  APPROVAL_B: "Approval B",
  APPROVAL_C: "Approval C",
  ACTIVATE_DEPARTMENT: "Activate Department",
  ACTIVATE_USER: "Activate User",
  CHANGE_PASSWORD: "Change Password",
  CREATE_DEPARTMENT: "Create Department",
  CREATE_PROJECT_MEMBERSHIP: "Create Project Membership",
  CREATE_USER: "Create User",
  DEACTIVATE_DEPARTMENT: "Deactivate Department",
  DEACTIVATE_PROJECT_MEMBERSHIP: "Deactivate Project Membership",
  DEACTIVATE_USER: "Deactivate User",
  DOCUMENT_ARCHIVED: "Document Archived",
  DOCUMENT_APPROVED: "Document Approved",
  DOCUMENT_RESTORED: "Document Restored",
  DOWNLOAD_DOCUMENT: "Download Document",
  EDIT_DOCUMENT: "Edit Document",
  EDIT_PROFILE: "Edit Profile",
  ESCALATION_CREATED: "Escalation Created",
  ESCALATION_RESOLVED: "Escalation Resolved",
  LOGIN: "Login",
  LOGOUT: "Logout",
  NOTIFICATION_CREATED: "Notification Created",
  NOTIFICATION_READ: "Notification Read",
  PASSWORD_RESET_COMPLETED: "Password Reset Completed",
  PASSWORD_RESET_REQUESTED: "Password Reset Requested",
  PROJECT_CLOSED: "Project Closed",
  UPDATE_DEPARTMENT: "Update Department",
  UPDATE_PROJECT_MEMBERSHIP: "Update Project Membership",
  UPDATE_USER: "Update User",
  ACTIVATE_PROJECT_MEMBERSHIP: "Activate Project Membership",
  UPLOAD_DOCUMENT: "Upload Document",
  UPLOAD_REVISION: "Upload Revision",
  WORKFLOW_ATTACHMENT: "Workflow Attachment",
  WORKFLOW_STATUS_CHANGE: "Workflow Status Change",
};

export const AUDIT_TRAIL_DICTIONARY = {
  [AUDIT_TRAIL_ACTION.LOGIN]: {
    businessEvent: "User Login Success",
    detail: "User logged in.",
  },
  [AUDIT_TRAIL_ACTION.LOGOUT]: {
    businessEvent: "User Logout Success",
    detail: "User logged out.",
  },
  [AUDIT_TRAIL_ACTION.CHANGE_PASSWORD]: {
    businessEvent: "User Password Changed",
    detail: "User password changed.",
  },
  [AUDIT_TRAIL_ACTION.PASSWORD_RESET_REQUESTED]: {
    businessEvent: "Password Reset Requested",
    detail: "Password reset requested.",
  },
  [AUDIT_TRAIL_ACTION.PASSWORD_RESET_COMPLETED]: {
    businessEvent: "Password Reset Completed",
    detail: "Password reset completed.",
  },
  [AUDIT_TRAIL_ACTION.PROJECT_CLOSED]: {
    businessEvent: "Project Closed",
    detail: "Project changed to Closed permanently.",
  },
  [AUDIT_TRAIL_ACTION.EDIT_PROFILE]: {
    businessEvent: "User Profile Updated",
    detail: "User profile updated.",
  },
  [AUDIT_TRAIL_ACTION.UPLOAD_DOCUMENT]: {
    businessEvent: "Document Uploaded",
    detail: "Document uploaded.",
  },
  [AUDIT_TRAIL_ACTION.EDIT_DOCUMENT]: {
    businessEvent: "Document Updated",
    detail: "Document updated.",
  },
  [AUDIT_TRAIL_ACTION.DOWNLOAD_DOCUMENT]: {
    businessEvent: "Document Downloaded",
    detail: "Document downloaded.",
  },
  [AUDIT_TRAIL_ACTION.UPLOAD_REVISION]: {
    businessEvent: "Revision Uploaded",
    detail: "Revision uploaded.",
  },
  [AUDIT_TRAIL_ACTION.APPROVAL_A]: {
    businessEvent: "Approval A Completed",
    detail: "Approval A completed.",
  },
  [AUDIT_TRAIL_ACTION.APPROVAL_B]: {
    businessEvent: "Approval B Completed",
    detail: "Approval B completed with comment.",
  },
  [AUDIT_TRAIL_ACTION.APPROVAL_C]: {
    businessEvent: "Approval C Completed",
    detail: "Approval C completed.",
  },
  [AUDIT_TRAIL_ACTION.WORKFLOW_STATUS_CHANGE]: {
    businessEvent: "Workflow Status Updated",
    detail: "Workflow status updated.",
  },
  [AUDIT_TRAIL_ACTION.WORKFLOW_ATTACHMENT]: {
    businessEvent: "Workflow Attachment Uploaded",
    detail: "Workflow attachment uploaded.",
  },
  [AUDIT_TRAIL_ACTION.DOCUMENT_APPROVED]: {
    businessEvent: "Document Approved",
    detail: "Document reached Approved status.",
  },
  [AUDIT_TRAIL_ACTION.DOCUMENT_ARCHIVED]: {
    businessEvent: "Document Archived",
    detail: "Document lifecycle changed to Archived.",
  },
  [AUDIT_TRAIL_ACTION.DOCUMENT_RESTORED]: {
    businessEvent: "Document Restored",
    detail: "Document lifecycle changed to Active.",
  },
  [AUDIT_TRAIL_ACTION.CREATE_USER]: {
    businessEvent: "User Created",
    detail: "User account created.",
  },
  [AUDIT_TRAIL_ACTION.UPDATE_USER]: {
    businessEvent: "User Updated",
    detail: "User account updated.",
  },
  [AUDIT_TRAIL_ACTION.ACTIVATE_USER]: {
    businessEvent: "User Activated",
    detail: "User account activated.",
  },
  [AUDIT_TRAIL_ACTION.DEACTIVATE_USER]: {
    businessEvent: "User Deactivated",
    detail: "User account deactivated.",
  },
  [AUDIT_TRAIL_ACTION.CREATE_DEPARTMENT]: {
    businessEvent: "Department Created",
    detail: "Department created.",
  },
  [AUDIT_TRAIL_ACTION.UPDATE_DEPARTMENT]: {
    businessEvent: "Department Updated",
    detail: "Department updated.",
  },
  [AUDIT_TRAIL_ACTION.ACTIVATE_DEPARTMENT]: {
    businessEvent: "Department Activated",
    detail: "Department activated.",
  },
  [AUDIT_TRAIL_ACTION.DEACTIVATE_DEPARTMENT]: {
    businessEvent: "Department Deactivated",
    detail: "Department deactivated.",
  },
  [AUDIT_TRAIL_ACTION.CREATE_PROJECT_MEMBERSHIP]: {
    businessEvent: "Project Membership Created",
    detail: "Project Membership created.",
  },
  [AUDIT_TRAIL_ACTION.UPDATE_PROJECT_MEMBERSHIP]: {
    businessEvent: "Project Membership Updated",
    detail: "Project Membership updated.",
  },
  [AUDIT_TRAIL_ACTION.ACTIVATE_PROJECT_MEMBERSHIP]: {
    businessEvent: "Project Membership Activated",
    detail: "Project Membership activated.",
  },
  [AUDIT_TRAIL_ACTION.DEACTIVATE_PROJECT_MEMBERSHIP]: {
    businessEvent: "Project Membership Deactivated",
    detail: "Project Membership deactivated.",
  },
  [AUDIT_TRAIL_ACTION.NOTIFICATION_CREATED]: {
    businessEvent: "Notification Created",
    detail: "Personal notification created.",
  },
  [AUDIT_TRAIL_ACTION.NOTIFICATION_READ]: {
    businessEvent: "Notification Read",
    detail: "Notification marked as read.",
  },
  [AUDIT_TRAIL_ACTION.ESCALATION_CREATED]: {
    businessEvent: "Escalation Created",
    detail: "Document entered Escalation Alert.",
  },
  [AUDIT_TRAIL_ACTION.ESCALATION_RESOLVED]: {
    businessEvent: "Escalation Resolved",
    detail: "Document left Escalation Alert.",
  },
};

export const AUDIT_RESOURCE_TYPE = {
  AUTHENTICATION: "Authentication",
  DEPARTMENT: "Department",
  DOCUMENT: "Document",
  ESCALATION: "Escalation",
  NOTIFICATION: "Notification",
  PROJECT: "Project",
  PROJECT_MEMBERSHIP: "Project Membership",
  USER: "User",
  USER_PROFILE: "User Profile",
  WORKFLOW_ATTACHMENT: "Workflow Attachment",
};
