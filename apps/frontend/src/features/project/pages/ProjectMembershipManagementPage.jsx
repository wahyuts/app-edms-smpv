import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit3,
  RefreshCw,
  Search,
  UserPlus,
  UsersRound,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";

import { AuthService } from "@/features/auth/services/auth.service";
import {
  PROJECT_MEMBERSHIP_STATUS,
  PROJECT_MEMBERSHIP_STATUS_OPTIONS,
  PROJECT_OFFICIAL_ROLE_OPTIONS,
  PROJECT_STATUS,
} from "@/features/project/constants/project.constants";
import {
  ProjectService,
  ProjectValidationError,
} from "@/features/project/services/project.service";
import { USER_QUERY_KEY, UserService } from "@/features/user-management";
import { queryClient } from "@/shared/api/query-client";
import SelectDropdown from "@/shared/components/form/SelectDropdown";
import { useToast } from "@/shared/components/toast";
import { useProjectContextStore } from "@/shared/stores/project-context.store";

const controlClassName =
  "h-10 rounded-md border border-[#123A5A] bg-[#08233B] px-3 text-sm text-[#F8FAFC] outline-none transition-colors placeholder:text-[#64748B] focus:border-[#0F7BFF]";
const actionButtonClassName =
  "inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#123A5A] px-3 text-sm font-semibold text-[#CBD5E1] transition-colors hover:border-[#0F7BFF] hover:bg-[#0B2B47] hover:text-white disabled:cursor-not-allowed disabled:text-[#64748B]";
const primaryButtonClassName =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#0F7BFF] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0B63CC] disabled:cursor-not-allowed disabled:bg-[#123A5A] disabled:text-[#94A3B8]";
const paginationButtonClassName =
  "inline-flex h-9 min-w-9 items-center justify-center gap-2 rounded-md border border-[#123A5A] px-3 text-sm font-semibold transition-colors hover:border-[#0F7BFF] hover:bg-[#0B2B47] disabled:cursor-not-allowed disabled:text-[#64748B]";
const activePaginationButtonClassName =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-[#0F7BFF] bg-[#0F7BFF] px-3 text-sm font-bold text-white";

const initialForm = {
  officialRole: PROJECT_OFFICIAL_ROLE_OPTIONS[0],
  projectId: "",
  status: PROJECT_MEMBERSHIP_STATUS.ACTIVE,
  userId: "",
};

const sortOptions = [
  { direction: "asc", label: "Project A-Z", sortBy: "projectName", value: "projectName-asc" },
  { direction: "asc", label: "User A-Z", sortBy: "userName", value: "userName-asc" },
  { direction: "asc", label: "Role A-Z", sortBy: "officialRole", value: "officialRole-asc" },
  { direction: "desc", label: "Newest First", sortBy: "assignedDate", value: "assignedDate-desc" },
  { direction: "asc", label: "Oldest First", sortBy: "assignedDate", value: "assignedDate-asc" },
];

const statusStyles = {
  [PROJECT_MEMBERSHIP_STATUS.ACTIVE]:
    "border-[#22C55E]/40 bg-[#22C55E]/15 text-[#86EFAC]",
  [PROJECT_MEMBERSHIP_STATUS.INACTIVE]:
    "border-[#EF4444]/40 bg-[#EF4444]/15 text-[#FCA5A5]",
};

const isActiveUser = (user) => user?.isActive === true || user?.status === "Active";

const getPaginationItems = (totalPages, currentPage) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const visiblePages = new Set([1, totalPages]);
  for (
    let page = Math.max(2, currentPage - 2);
    page <= Math.min(totalPages - 1, currentPage + 2);
    page += 1
  ) {
    visiblePages.add(page);
  }

  const sortedPages = [...visiblePages].sort(
    (firstPage, secondPage) => firstPage - secondPage,
  );
  const paginationItems = [];

  sortedPages.forEach((page, index) => {
    const previousPage = sortedPages[index - 1];
    if (previousPage && page - previousPage > 1) {
      paginationItems.push(`ellipsis-${previousPage}-${page}`);
    }
    paginationItems.push(page);
  });

  return paginationItems;
};

const getErrorMap = (error) => {
  if (!(error instanceof ProjectValidationError) || !Array.isArray(error.errors)) {
    return {};
  }

  return Object.fromEntries(
    error.errors.map((item) => [item.field, item.message]),
  );
};

const getErrorMessage = (error) => {
  if (error instanceof ProjectValidationError && error.errors?.[0]?.message) {
    return error.errors[0].message;
  }

  return error?.message ?? "Project Membership request failed.";
};

const getEditForm = (membership) => ({
  officialRole: membership.officialRole ?? PROJECT_OFFICIAL_ROLE_OPTIONS[0],
  projectId: membership.projectId ?? "",
  status: membership.status ?? PROJECT_MEMBERSHIP_STATUS.ACTIVE,
  userId: String(membership.userId ?? ""),
});

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("en-GB", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const SummaryCard = ({ icon: Icon, label, value }) => (
  <article className="rounded-lg border border-[#123A5A] bg-[#061B2F] p-4">
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
          {label}
        </p>
        <p className="mt-2 text-3xl font-bold text-[#F8FAFC]">{value}</p>
      </div>
      <div className="flex h-11 w-11 items-center justify-center rounded-md border border-[#123A5A] bg-[#08233B] text-[#00C8FF]">
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </article>
);

const Badge = ({ children, className }) => (
  <span
    className={[
      "inline-flex whitespace-nowrap rounded-md border px-2 py-1 text-xs font-semibold",
      className,
    ].join(" ")}
  >
    {children}
  </span>
);

const FieldError = ({ message }) =>
  message ? <p className="text-xs font-medium text-[#FCA5A5]">{message}</p> : null;

const ReadOnlyField = ({ label, value }) => (
  <label className="flex flex-col gap-2 text-sm font-medium text-[#CBD5E1]">
    <span>{label}</span>
    <input
      className={controlClassName}
      disabled
      type="text"
      value={value || "-"}
    />
  </label>
);

const SelectField = ({ children, disabled = false, error, label, name, onChange, value }) => (
  <label className="flex flex-col gap-2 text-sm font-medium text-[#CBD5E1]">
    <span>{label}</span>
    <SelectDropdown
      className={controlClassName}
      disabled={disabled}
      name={name}
      onChange={onChange}
      value={value}
    >
      {children}
    </SelectDropdown>
    <FieldError message={error} />
  </label>
);

const MembershipFormModal = ({
  activeProjects,
  activeUsers,
  errors,
  form,
  mode,
  onChange,
  onClose,
  onSubmit,
  selectedMembership,
  submitting,
}) => {
  const isCreate = mode === "create";

  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-[#020B16]/80 px-4 py-6">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-[#123A5A] bg-[#061B2F] shadow-2xl">
        <div className="border-b border-[#123A5A] px-5 py-4">
          <h2 className="text-xl font-bold">
            {isCreate ? "Assign User to Project" : "Edit Project Membership"}
          </h2>
          <p className="mt-1 text-sm text-[#94A3B8]">
            {isCreate
              ? "Tambahkan User Active ke Project Active dengan Official Role project-scoped."
              : "Ubah Official Role atau lifecycle Membership tanpa mengubah Project dan User."}
          </p>
        </div>

        <form className="min-h-0 overflow-y-auto px-5 py-4" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            {isCreate ? (
              <SelectField
                error={errors.projectId}
                label="Project"
                name="projectId"
                onChange={onChange}
                value={form.projectId}
              >
                <option value="">Select Project</option>
                {activeProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.projectCode} - {project.projectName}
                  </option>
                ))}
              </SelectField>
            ) : (
              <ReadOnlyField
                label="Project"
                value={`${selectedMembership?.projectCode ?? ""} - ${
                  selectedMembership?.projectName ?? ""
                }`}
              />
            )}

            {isCreate ? (
              <SelectField
                error={errors.userId}
                label="User"
                name="userId"
                onChange={onChange}
                value={form.userId}
              >
                <option value="">Select User</option>
                {activeUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.fullName ?? user.name ?? user.username} ({user.username})
                  </option>
                ))}
              </SelectField>
            ) : (
              <ReadOnlyField
                label="User"
                value={`${selectedMembership?.userName ?? ""} (${
                  selectedMembership?.username ?? ""
                })`}
              />
            )}

            <SelectField
              error={errors.officialRole}
              label="Official Role"
              name="officialRole"
              onChange={onChange}
              value={form.officialRole}
            >
              {PROJECT_OFFICIAL_ROLE_OPTIONS.map((roleName) => (
                <option key={roleName} value={roleName}>
                  {roleName}
                </option>
              ))}
            </SelectField>
            <SelectField
              error={errors.status}
              label="Membership Status"
              name="status"
              onChange={onChange}
              value={form.status}
            >
              {PROJECT_MEMBERSHIP_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </SelectField>
          </div>

          <div className="mt-5 flex flex-col-reverse gap-3 border-t border-[#123A5A] pt-4 sm:flex-row sm:justify-end">
            <button
              className={actionButtonClassName}
              disabled={submitting}
              onClick={onClose}
              type="button"
            >
              Cancel
            </button>
            <button
              className={primaryButtonClassName}
              disabled={submitting}
              type="submit"
            >
              {submitting
                ? "Saving..."
                : isCreate
                  ? "Assign User"
                  : "Update Membership"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const StatusConfirmationModal = ({
  membership,
  onCancel,
  onConfirm,
  submitting,
}) => {
  const isActivate = membership?.status === PROJECT_MEMBERSHIP_STATUS.INACTIVE;

  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-[#020B16]/80 px-4 py-6">
      <div className="w-full max-w-md rounded-lg border border-[#123A5A] bg-[#061B2F] p-5 shadow-2xl">
        <h2 className="text-xl font-bold">
          {isActivate ? "Activate Membership" : "Deactivate Membership"}
        </h2>
        <div className="mt-3 space-y-2 text-sm text-[#CBD5E1]">
          {isActivate ? (
            <p>Membership Active memberi akses Project kepada User selama Project dan User juga Active.</p>
          ) : (
            <p>Membership Inactive menghapus akses Project dari Project Selector User.</p>
          )}
        </div>
        <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            className={actionButtonClassName}
            disabled={submitting}
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
          <button
            className={[
              "inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:bg-[#123A5A] disabled:text-[#94A3B8]",
              isActivate
                ? "bg-[#16A34A] hover:bg-[#15803D]"
                : "bg-[#DC2626] hover:bg-[#B91C1C]",
            ].join(" ")}
            disabled={submitting}
            onClick={onConfirm}
            type="button"
          >
            {submitting
              ? "Saving..."
              : isActivate
                ? "Activate"
                : "Deactivate"}
          </button>
        </div>
      </div>
    </div>
  );
};

const ProjectMembershipManagementPage = () => {
  const [formErrors, setFormErrors] = useState({});
  const [formMode, setFormMode] = useState(null);
  const [formState, setFormState] = useState(initialForm);
  const [officialRoleFilter, setOfficialRoleFilter] = useState("");
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [projectFilter, setProjectFilter] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [selectedMembership, setSelectedMembership] = useState(null);
  const [sortValue, setSortValue] = useState("assignedDate-desc");
  const [statusFilter, setStatusFilter] = useState("");
  const [statusTarget, setStatusTarget] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();
  const { setProjectContext, setProjectContextError } = useProjectContextStore();

  const {
    data: allMemberships = [],
    error: loadError,
    isLoading,
    refetch: refetchMemberships,
  } = useQuery({
    queryFn: ProjectService.getEnrichedProjectMemberships,
    queryKey: ["project-membership-management", "memberships"],
  });
  const { data: allProjects = [] } = useQuery({
    queryFn: ProjectService.getProjects,
    queryKey: ["project-membership-management", "projects"],
  });
  const { data: allUsers = [] } = useQuery({
    queryFn: UserService.getUsers,
    queryKey: USER_QUERY_KEY,
  });

  const activeProjects = useMemo(
    () => allProjects.filter((project) => project.status === PROJECT_STATUS.ACTIVE),
    [allProjects],
  );
  const activeUsers = useMemo(
    () => allUsers.filter(isActiveUser),
    [allUsers],
  );
  const errorMessage = loadError ? getErrorMessage(loadError) : "";
  const sortOption = sortOptions.find((option) => option.value === sortValue) ?? sortOptions[0];
  const queryResult = useMemo(
    () =>
      ProjectService.queryProjectMemberships(allMemberships, {
        direction: sortOption.direction,
        officialRole: officialRoleFilter,
        page: pageNumber,
        pageSize,
        projectId: projectFilter,
        search: searchValue,
        sortBy: sortOption.sortBy,
        status: statusFilter,
      }),
    [
      allMemberships,
      officialRoleFilter,
      pageNumber,
      pageSize,
      projectFilter,
      searchValue,
      sortOption.direction,
      sortOption.sortBy,
      statusFilter,
    ],
  );
  const rows = queryResult.data;
  const pagination = queryResult.pagination;
  const paginationItems = getPaginationItems(
    pagination.totalPages,
    pagination.page,
  );
  const startIndex = (pagination.page - 1) * pagination.pageSize;
  const summary = useMemo(
    () => ({
      active: allMemberships.filter((membership) =>
        membership.status === PROJECT_MEMBERSHIP_STATUS.ACTIVE,
      ).length,
      inactive: allMemberships.filter((membership) =>
        membership.status === PROJECT_MEMBERSHIP_STATUS.INACTIVE,
      ).length,
      total: allMemberships.length,
    }),
    [allMemberships],
  );

  const resetPage = () => setPageNumber(1);

  const refreshProjectState = async () => {
    const currentUser = AuthService.getCurrentUser();
    if (!currentUser?.id) return;

    try {
      const context = await ProjectService.resolveActiveProject(currentUser);
      setProjectContext(context);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["audit-trail"] });
    } catch (error) {
      setProjectContextError(
        error instanceof Error ? error.message : "Project context refresh failed.",
      );
    }
  };

  const handleFilterChange = (setter) => (event) => {
    setter(event.target.value);
    resetPage();
  };

  const handlePageSizeChange = (event) => {
    setPageSize(Number(event.target.value));
    resetPage();
  };

  const closeForm = () => {
    setFormMode(null);
    setFormErrors({});
    setFormState(initialForm);
    setSelectedMembership(null);
  };

  const openCreateForm = () => {
    setFormMode("create");
    setFormErrors({});
    setSelectedMembership(null);
    setFormState(initialForm);
  };

  const openEditForm = (membership) => {
    setFormMode("edit");
    setFormErrors({});
    setSelectedMembership(membership);
    setFormState(getEditForm(membership));
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setFormState((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
    setFormErrors((currentErrors) => ({
      ...currentErrors,
      [name]: null,
    }));
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setFormErrors({});

    try {
      if (formMode === "create") {
        await ProjectService.createProjectMembership(formState);
        showToast({
          message: "Project Membership created successfully.",
          variant: "success",
        });
      } else if (formMode === "edit" && selectedMembership) {
        await ProjectService.updateProjectMembership(selectedMembership.id, formState);
        showToast({
          message: "Project Membership updated successfully.",
          variant: "success",
        });
      }

      closeForm();
      await refetchMemberships();
      await refreshProjectState();
    } catch (error) {
      setFormErrors(getErrorMap(error));
      showToast({
        message: getErrorMessage(error),
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusConfirm = async () => {
    if (!statusTarget) return;

    setIsSubmitting(true);

    try {
      if (statusTarget.status === PROJECT_MEMBERSHIP_STATUS.INACTIVE) {
        await ProjectService.activateProjectMembership(statusTarget.id);
        showToast({
          message: "Project Membership activated successfully.",
          variant: "success",
        });
      } else {
        await ProjectService.deactivateProjectMembership(statusTarget.id);
        showToast({
          message: "Project Membership deactivated successfully.",
          variant: "success",
        });
      }

      setStatusTarget(null);
      await refetchMemberships();
      await refreshProjectState();
    } catch (error) {
      showToast({
        message: getErrorMessage(error),
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#0F7BFF]">
            Administration
          </p>
          <h1 className="mt-2 text-3xl font-bold">Project Membership</h1>
          <p className="mt-2 max-w-3xl text-sm text-[#CBD5E1]">
            Kelola hubungan User, Project, Official Role, dan Membership Status.
          </p>
        </div>
        <button
          className={primaryButtonClassName}
          disabled={isLoading}
          onClick={openCreateForm}
          type="button"
        >
          <UserPlus className="h-4 w-4" />
          Assign User
        </button>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard icon={UsersRound} label="Total Memberships" value={summary.total} />
        <SummaryCard icon={CheckCircle2} label="Active Memberships" value={summary.active} />
        <SummaryCard icon={XCircle} label="Inactive Memberships" value={summary.inactive} />
      </section>

      <section className="overflow-hidden rounded-lg border border-[#123A5A] bg-[#061B2F]">
        <div className="flex flex-col gap-4 border-b border-[#123A5A] px-4 py-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-xl font-bold">Membership List</h2>
            <p className="mt-1 text-sm text-[#94A3B8]">
              Daftar Project Membership yang menjadi dasar Project Selector dan Workflow.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_170px_150px_150px_150px_96px]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
              <input
                className={[controlClassName, "w-full pl-9"].join(" ")}
                onChange={handleFilterChange(setSearchValue)}
                placeholder="Search memberships..."
                type="search"
                value={searchValue}
              />
            </label>
            <SelectDropdown
              className={controlClassName}
              onChange={handleFilterChange(setProjectFilter)}
              value={projectFilter}
            >
              <option value="">All Projects</option>
              {allProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.projectCode}
                </option>
              ))}
            </SelectDropdown>
            <SelectDropdown
              className={controlClassName}
              onChange={handleFilterChange(setOfficialRoleFilter)}
              value={officialRoleFilter}
            >
              <option value="">All Roles</option>
              {PROJECT_OFFICIAL_ROLE_OPTIONS.map((roleName) => (
                <option key={roleName} value={roleName}>
                  {roleName}
                </option>
              ))}
            </SelectDropdown>
            <SelectDropdown
              className={controlClassName}
              onChange={handleFilterChange(setStatusFilter)}
              value={statusFilter}
            >
              <option value="">All Status</option>
              {PROJECT_MEMBERSHIP_STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </SelectDropdown>
            <SelectDropdown
              className={controlClassName}
              onChange={handleFilterChange(setSortValue)}
              value={sortValue}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </SelectDropdown>
            <SelectDropdown
              className={controlClassName}
              onChange={handlePageSizeChange}
              value={pageSize}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </SelectDropdown>
          </div>
        </div>

        {errorMessage ? (
          <div className="border-b border-[#123A5A] bg-[#EF4444]/10 px-4 py-3 text-sm text-[#FCA5A5]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p>{errorMessage}</p>
              <button
                className={actionButtonClassName}
                onClick={() => refetchMemberships()}
                type="button"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>
            </div>
          </div>
        ) : null}

        <div className="max-h-[60vh] overflow-auto scroll-smooth">
          <table className="w-max min-w-full border-collapse text-left text-sm">
            <thead className="bg-[#08233B] text-xs uppercase text-[#CBD5E1]">
              <tr>
                <th className="sticky top-0 z-20 w-16 bg-[#08233B] px-4 py-3 font-bold">No</th>
                <th className="sticky top-0 z-20 min-w-56 bg-[#08233B] px-4 py-3 font-bold">Project</th>
                <th className="sticky top-0 z-20 min-w-56 bg-[#08233B] px-4 py-3 font-bold">User</th>
                <th className="sticky top-0 z-20 min-w-44 bg-[#08233B] px-4 py-3 font-bold">Official Role</th>
                <th className="sticky top-0 z-20 min-w-36 bg-[#08233B] px-4 py-3 font-bold">Status</th>
                <th className="sticky top-0 z-20 min-w-44 bg-[#08233B] px-4 py-3 font-bold">Created At</th>
                <th className="sticky right-0 top-0 z-30 min-w-56 bg-[#08233B] px-4 py-3 font-bold shadow-[-8px_0_16px_rgba(2,11,22,0.35)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className="px-4 py-8 text-center text-[#94A3B8]" colSpan={7}>
                    Loading Project Membership...
                  </td>
                </tr>
              ) : null}

              {!isLoading && rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-[#94A3B8]" colSpan={7}>
                    Tidak ada membership yang sesuai dengan search atau filter.
                  </td>
                </tr>
              ) : null}

              {!isLoading
                ? rows.map((membership, rowIndex) => (
                    (() => {
                      const isClosedProject =
                        membership.projectStatus === PROJECT_STATUS.CLOSED;

                      return (
                    <tr
                      className="group border-t border-[#123A5A] text-[#F8FAFC] transition-colors hover:bg-[#08233B]"
                      key={membership.id}
                    >
                      <td className="px-4 py-3 text-[#CBD5E1]">
                        {startIndex + rowIndex + 1}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[#00C8FF]">{membership.projectCode}</p>
                        <p className="mt-1 text-xs text-[#94A3B8]">{membership.projectName}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[#F8FAFC]">{membership.userName}</p>
                        <p className="mt-1 text-xs text-[#94A3B8]">{membership.username}</p>
                      </td>
                      <td className="px-4 py-3 text-[#CBD5E1]">
                        {membership.officialRole}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={
                            statusStyles[membership.status] ??
                            "border-[#123A5A] bg-[#08233B] text-[#CBD5E1]"
                          }
                        >
                          {membership.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-[#CBD5E1]">
                        {formatDateTime(membership.assignedDate)}
                      </td>
                      <td className="sticky right-0 z-10 bg-[#061B2F] px-4 py-3 shadow-[-8px_0_16px_rgba(2,11,22,0.28)] transition-colors group-hover:bg-[#08233B]">
                        <div className="flex flex-wrap gap-2">
                          {isClosedProject ? (
                            <span className="rounded-md border border-[#EF4444]/40 bg-[#450A0A] px-3 py-2 text-xs font-semibold text-[#FCA5A5]">
                              Read Only
                            </span>
                          ) : (
                            <>
                              <button
                                className={actionButtonClassName}
                                onClick={() => openEditForm(membership)}
                                type="button"
                              >
                                <Edit3 className="h-4 w-4" />
                                Edit
                              </button>
                              <button
                                className={[
                                  actionButtonClassName,
                                  membership.status === PROJECT_MEMBERSHIP_STATUS.INACTIVE
                                    ? "hover:border-[#22C55E] hover:text-[#86EFAC]"
                                    : "hover:border-[#EF4444] hover:text-[#FCA5A5]",
                                ].join(" ")}
                                onClick={() => setStatusTarget(membership)}
                                type="button"
                              >
                                {membership.status === PROJECT_MEMBERSHIP_STATUS.INACTIVE ? (
                                  <>
                                    <CheckCircle2 className="h-4 w-4" />
                                    Activate
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="h-4 w-4" />
                                    Deactivate
                                  </>
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                      );
                    })()
                  ))
                : null}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#123A5A] px-4 py-4 text-sm text-[#CBD5E1] md:flex-row md:items-center md:justify-between">
          <p>
            Page {pagination.page} of {pagination.totalPages} - {pagination.totalItems} memberships
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button
              className={paginationButtonClassName}
              disabled={pagination.page <= 1}
              onClick={() => setPageNumber(pagination.page - 1)}
              type="button"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            {pagination.totalPages > 1
              ? paginationItems.map((paginationItem) =>
                  typeof paginationItem === "number" ? (
                    <button
                      className={
                        paginationItem === pagination.page
                          ? activePaginationButtonClassName
                          : paginationButtonClassName
                      }
                      disabled={paginationItem === pagination.page}
                      key={paginationItem}
                      onClick={() => setPageNumber(paginationItem)}
                      type="button"
                    >
                      {paginationItem}
                    </button>
                  ) : (
                    <span
                      className="inline-flex h-9 min-w-9 items-center justify-center px-2 text-sm font-semibold text-[#94A3B8]"
                      key={paginationItem}
                    >
                      ...
                    </span>
                  ),
                )
              : (
                  <span className={activePaginationButtonClassName}>1</span>
                )}
            <button
              className={paginationButtonClassName}
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPageNumber(pagination.page + 1)}
              type="button"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {formMode ? (
        <MembershipFormModal
          activeProjects={activeProjects}
          activeUsers={activeUsers}
          errors={formErrors}
          form={formState}
          mode={formMode}
          onChange={handleFormChange}
          onClose={closeForm}
          onSubmit={handleFormSubmit}
          selectedMembership={selectedMembership}
          submitting={isSubmitting}
        />
      ) : null}

      {statusTarget ? (
        <StatusConfirmationModal
          membership={statusTarget}
          onCancel={() => setStatusTarget(null)}
          onConfirm={handleStatusConfirm}
          submitting={isSubmitting}
        />
      ) : null}
    </>
  );
};

export default ProjectMembershipManagementPage;
