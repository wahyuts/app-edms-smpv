import NoProjectAccessState from "@/features/project/components/NoProjectAccessState";
import { PROJECT_STATUS } from "@/features/project/constants/project.constants";
import { useProjectContextStore } from "@/shared/stores/project-context.store";

const ProjectContextRoute = ({ children }) => {
  const {
    activeProject,
    error: projectContextError,
    isInitialized,
    isLoading,
  } = useProjectContextStore();

  if (isLoading && !isInitialized) {
    return (
      <section className="flex min-h-[calc(100vh-10rem)] items-center justify-center text-sm font-semibold text-[#CBD5E1]">
        Loading project context...
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

  if (!activeProject || activeProject.status !== PROJECT_STATUS.ACTIVE) {
    return <NoProjectAccessState />;
  }

  return children;
};

export default ProjectContextRoute;
