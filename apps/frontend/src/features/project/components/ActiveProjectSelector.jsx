import { ChevronDown, FolderKanban, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { queryClient } from "@/shared/api/query-client";
import { useOutsideClick } from "@/shared/hooks/useOutsideClick";
import { useProjectContextStore } from "@/shared/stores/project-context.store";
import { ProjectService } from "@/features/project/services/project.service";
import { AuthService } from "@/features/auth/services/auth.service";
import { useToast } from "@/shared/components/toast";

const ActiveProjectSelector = ({ variant = "header" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectorRef = useRef(null);
  const {
    accessibleProjects,
    activeProject,
    isLoading,
    setProjectContext,
    setProjectContextError,
    setProjectContextLoading,
  } = useProjectContextStore();
  const { showToast } = useToast();
  const hasActiveProject = Boolean(activeProject);
  const projectName = activeProject?.projectName ?? "Select Project";
  const projectCode = activeProject?.projectCode ?? "No project selected";
  const isGatewayVariant = variant === "gateway";

  const closeDropdown = useCallback(() => {
    setIsOpen(false);
  }, []);

  useOutsideClick({
    enabled: isOpen,
    onOutsideClick: closeDropdown,
    ref: selectorRef,
  });

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") closeDropdown();
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeDropdown, isOpen]);

  if (accessibleProjects.length === 0) {
    return (
      <div
        className="flex min-w-52 max-w-[18rem] items-center gap-2 rounded-lg border border-[#7F1D1D] bg-[#2A1118] px-3 py-2 text-left text-sm text-[#FCA5A5]"
        title="No Project Access"
      >
        <FolderKanban className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span className="min-w-0">
          <span className="block text-[10px] font-bold uppercase leading-3 tracking-wide">
            NO ACTIVE PROJECT
          </span>
          <span className="block truncate text-sm font-semibold">
            No Project Access
          </span>
        </span>
      </div>
    );
  }

  const handleSelectProject = async (projectId) => {
    setIsOpen(false);
    if (projectId === activeProject?.id) return;

    try {
      setProjectContextLoading(true);
      const context = await ProjectService.setActiveProjectForUser({
        projectId,
        user: AuthService.getCurrentUser(),
      });
      setProjectContext(context);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["audit-trail"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["sla-monitoring"] });
      queryClient.invalidateQueries({ queryKey: ["escalation"] });
      showToast({
        message: "Active Project updated.",
        variant: "success",
      });
    } catch (error) {
      setProjectContextError(
        error instanceof Error ? error.message : "Active Project update failed.",
      );
      showToast({
        message: error instanceof Error ? error.message : "Active Project update failed.",
        variant: "error",
      });
    }
  };

  return (
    <div
      className={[
        "relative z-[8400]",
        isGatewayVariant ? "w-full" : "",
      ].join(" ")}
      ref={selectorRef}
    >
      <button
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={[
          "flex min-h-14 items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm text-white shadow-lg transition-colors",
          isGatewayVariant
            ? "w-full"
            : "w-[clamp(13rem,24vw,20rem)] max-w-[20rem]",
          "border-[#0F7BFF] bg-[#0F7BFF] shadow-[#0F7BFF]/20 hover:bg-[#0B6FE8]",
          "focus:outline-none focus:ring-2 focus:ring-[#00C8FF] focus:ring-offset-2 focus:ring-offset-[#020B16]",
          isLoading ? "cursor-wait opacity-80" : "",
        ].join(" ")}
        disabled={isLoading}
        onClick={() => setIsOpen((currentValue) => !currentValue)}
        title={`${projectName} - ${projectCode}`}
        type="button"
      >
        <FolderKanban className="h-5 w-5 shrink-0 text-white" aria-hidden="true" />
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] font-bold uppercase leading-3 tracking-wide text-white/80">
            {hasActiveProject ? "ACTIVE PROJECT" : "NO ACTIVE PROJECT"}
          </span>
          <span className="mt-0.5 flex min-w-0 items-center gap-1">
            <span className="truncate font-semibold leading-4">
              {projectName}
            </span>
          </span>
          <span className="mt-0.5 block truncate text-[11px] font-semibold leading-3 text-white/85">
            {projectCode}
          </span>
        </span>
        {isLoading ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-white" aria-hidden="true" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-white" aria-hidden="true" />
        )}
      </button>

      {isOpen ? (
        <div
          className={[
            "z-[8500] mt-2 overflow-hidden rounded-lg border border-[#123A5A] bg-[#061B2F] shadow-lg",
            isGatewayVariant
              ? "relative w-full"
              : "absolute right-0 w-80",
          ].join(" ")}
        >
          <div className="border-b border-[#123A5A] px-4 py-3">
            <p className="text-xs font-semibold uppercase text-[#94A3B8]">
              Active Project
            </p>
          </div>
          <div
            className={[
              isGatewayVariant ? "max-h-56" : "max-h-80",
              "overflow-y-auto overflow-x-hidden [scrollbar-color:#123A5A_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#123A5A] [&::-webkit-scrollbar-track]:bg-transparent",
            ].join(" ")}
            role="listbox"
          >
            {accessibleProjects.map((project) => {
              const isSelected = project.id === activeProject?.id;

              return (
                <button
                  className={[
                    "block w-full px-4 py-3 text-left transition-colors",
                    isSelected
                      ? "bg-[#0F7BFF] text-white"
                      : "text-[#CBD5E1] hover:bg-[#0B2B47] hover:text-white",
                  ].join(" ")}
                  key={project.id}
                  onClick={() => handleSelectProject(project.id)}
                  role="option"
                  aria-selected={isSelected}
                  type="button"
                >
                  <span className="block text-sm font-semibold">{project.projectName}</span>
                  <span className="mt-1 block text-xs opacity-80">{project.projectCode}</span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ActiveProjectSelector;
