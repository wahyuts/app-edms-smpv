export const canAddEmergencyAttachment = ({ documentItem, project, role, flags }) =>
  Boolean(documentItem?.projectId === project?.id && project?.status === "Active" && documentItem?.lifecycle === "Active" &&
    ((role === "Team Process" && flags.EMERGENCY_UPLOAD_TEAM_PROCESS_ENABLED && documentItem.revision === "IFA-Submitted") ||
      (role === "Team Project" && flags.EMERGENCY_UPLOAD_TEAM_PROJECT_ENABLED && documentItem.status === "Approved")));
