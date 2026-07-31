import { Navigate, useLocation } from "react-router-dom";

import { AuthService } from "@/features/auth/services/auth.service";
import NoProjectAccessState from "@/features/project/components/NoProjectAccessState";
import {
  PROJECT_MEMBERSHIP_STATUS,
  PROJECT_STATUS,
} from "@/features/project/constants/project.constants";
import { useProjectContextStore } from "@/shared/stores/project-context.store";

const ProjectContextRoute = ({ children }) => {
  const location = useLocation();
  const {
    accessibleProjects,
    activeMembership,
    activeProject,
    error: projectContextError,
    isInitialized,
    isLoading,
  } = useProjectContextStore();

  if (isLoading && !isInitialized) {
    return (
      <section className="flex min-h-[calc(100vh-10rem)] items-center justify-center text-sm font-semibold text-[#CBD5E1]">
        Memuat konteks project...
      </section>
    );
  }

  if (projectContextError) {
    return (
      <section className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-6 text-center text-sm text-[#FCA5A5]">
        {projectContextError}
      </section>
    );
  }

  const effectiveAccessibleProjects = isInitialized
    ? accessibleProjects
    : AuthService.getAccessibleProjects();
  const effectiveActiveMembership = isInitialized
    ? activeMembership
    : AuthService.getActiveMembership();
  const effectiveActiveProject = isInitialized
    ? activeProject
    : AuthService.getActiveProject();

  const hasAccessibleProjects = effectiveAccessibleProjects.length > 0;
  const hasValidActiveProject = Boolean(
    effectiveActiveProject?.id &&
    effectiveActiveProject.status === PROJECT_STATUS.ACTIVE &&
    effectiveActiveMembership?.id &&
    effectiveActiveMembership.status === PROJECT_MEMBERSHIP_STATUS.ACTIVE &&
    !AuthService.isProjectSelectionRequired(),
  );

  if (hasAccessibleProjects && !hasValidActiveProject) {
    return (
      <Navigate
        replace
        state={{ from: location }}
        to="/select-project"
      />
    );
  }

  if (!hasValidActiveProject) {
    return <NoProjectAccessState />;
  }

  return children;
};

export default ProjectContextRoute;
