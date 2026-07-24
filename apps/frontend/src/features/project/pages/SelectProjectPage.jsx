import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import ActiveProjectSelector from "@/features/project/components/ActiveProjectSelector";
import { ProjectService } from "@/features/project/services/project.service";
import { AuthService } from "@/features/auth/services/auth.service";
import { queryClient } from "@/shared/api/query-client";
import { useToast } from "@/shared/components/toast";
import { useProjectContextStore } from "@/shared/stores/project-context.store";

const invalidateProjectScopedQueries = () => {
  queryClient.invalidateQueries({ queryKey: ["notifications"] });
  queryClient.invalidateQueries({ queryKey: ["audit-trail"] });
  queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  queryClient.invalidateQueries({ queryKey: ["documents"] });
  queryClient.invalidateQueries({ queryKey: ["sla-monitoring"] });
  queryClient.invalidateQueries({ queryKey: ["escalation"] });
};

const SelectProjectPage = () => {
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const {
    accessibleProjects,
    activeProject,
    error,
    isLoading,
    setProjectContext,
    setProjectContextError,
    setProjectContextLoading,
  } = useProjectContextStore();

  useEffect(() => {
    let isActive = true;

    const initializeProjectSelection = async () => {
      const currentUser = AuthService.getCurrentUser();
      if (!currentUser?.id) return;

      try {
        setProjectContextLoading(true);
        const context = await ProjectService.resolveActiveProject(currentUser);
        if (!isActive) return;

        setProjectContext(context);
        if (context.accessibleProjects.length === 0) {
          navigate("/dashboard", { replace: true });
        }
      } catch (projectError) {
        if (!isActive) return;
        setProjectContextError(
          projectError instanceof Error
            ? projectError.message
            : "Project context initialization failed.",
        );
      }
    };

    initializeProjectSelection();

    return () => {
      isActive = false;
    };
  }, [
    navigate,
    setProjectContext,
    setProjectContextError,
    setProjectContextLoading,
  ]);

  const handleContinue = async (event) => {
    event.preventDefault();
    if (!activeProject?.id || isSubmitting) return;

    setSubmitError("");
    setIsSubmitting(true);

    try {
      const context = await ProjectService.setActiveProjectForUser({
        projectId: activeProject.id,
        user: AuthService.getCurrentUser(),
      });

      setProjectContext(context);
      invalidateProjectScopedQueries();
      navigate("/dashboard", { replace: true });
    } catch (continueError) {
      const message = continueError instanceof Error
        ? continueError.message
        : "Active Project validation failed.";

      setSubmitError(message);
      setProjectContextError(message);
      showToast({
        message,
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isInitializing = isLoading && accessibleProjects.length === 0;
  const isContinueDisabled = !activeProject || isSubmitting || isInitializing;

  return (
    <section className="text-left">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-wide text-[#0F7BFF]">
          APP EDMS
        </p>
        <h1
          className="mt-3 text-3xl font-bold text-[#F8FAFC]"
          id="select-project-title"
        >
          Select Active Project
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#CBD5E1]">
          Choose the Project you want to work on before entering the EDMS workspace.
        </p>
        <p className="mt-2 text-sm leading-6 text-[#CBD5E1]">
          You can switch to another Project later from the Header.
        </p>
      </div>

      <form
        aria-labelledby="select-project-title"
        className="mt-8 flex flex-col gap-6"
        onSubmit={handleContinue}
      >
        <div className="border-y border-[#123A5A] py-5">
          <label className="mb-3 block text-sm font-medium text-[#CBD5E1]">
            Project
          </label>
          <div className="flex justify-start">
            {isInitializing ? (
              <div className="flex min-h-14 w-full items-center gap-2 rounded-lg border border-[#123A5A] bg-[#08233B] px-3 py-2 text-sm font-semibold text-[#CBD5E1]">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Loading project...
              </div>
            ) : (
              <ActiveProjectSelector variant="gateway" />
            )}
          </div>
        </div>

        {error || submitError ? (
          <p className="rounded-md border border-[#7F1D1D] bg-[#2A1118] px-4 py-3 text-sm text-[#FCA5A5]">
            {submitError || error}
          </p>
        ) : null}

        <button
          className={[
            "h-11 rounded-md px-4 text-sm font-semibold text-white transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-[#0F7BFF]/30",
            isContinueDisabled
              ? "cursor-not-allowed bg-[#123A5A] text-[#94A3B8]"
              : "bg-[#0F7BFF] hover:bg-[#0B63CC]",
          ].join(" ")}
          disabled={isContinueDisabled}
          type="submit"
        >
          {isSubmitting ? "Validating Project..." : "Continue to Dashboard"}
        </button>
      </form>
    </section>
  );
};

export default SelectProjectPage;
