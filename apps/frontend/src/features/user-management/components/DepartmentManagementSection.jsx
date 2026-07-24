import {
  Building2,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Plus,
  RefreshCw,
  Search,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { useMemo, useState } from "react";

import {
  DEPARTMENT_STATUSES,
} from "@/features/user-management/constants/department.constants";
import {
  DepartmentService,
  DepartmentValidationError,
} from "@/features/user-management/services/department.service";
import { UserService } from "@/features/user-management/services/user.service";
import SelectDropdown from "@/shared/components/form/SelectDropdown";
import { useToast } from "@/shared/components/toast";

const controlClassName =
  "h-10 rounded-md border border-[#123A5A] bg-[#08233B] px-3 text-sm text-[#F8FAFC] outline-none transition-colors placeholder:text-[#64748B] focus:border-[#0F7BFF] disabled:cursor-not-allowed disabled:text-[#64748B]";
const actionButtonClassName =
  "inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#123A5A] px-3 text-sm font-semibold text-[#CBD5E1] transition-colors hover:border-[#0F7BFF] hover:bg-[#0B2B47] hover:text-white disabled:cursor-not-allowed disabled:text-[#64748B]";
const primaryButtonClassName =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#0F7BFF] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0B63CC] disabled:cursor-not-allowed disabled:bg-[#123A5A] disabled:text-[#94A3B8]";
const paginationButtonClassName =
  "inline-flex h-9 min-w-9 items-center justify-center gap-2 rounded-md border border-[#123A5A] px-3 text-sm font-semibold transition-colors hover:border-[#0F7BFF] hover:bg-[#0B2B47] disabled:cursor-not-allowed disabled:text-[#64748B]";
const activePaginationButtonClassName =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-[#0F7BFF] bg-[#0F7BFF] px-3 text-sm font-bold text-white";

const departmentSortOptions = [
  { direction: "asc", label: "Name A-Z", sortBy: "name", value: "name-asc" },
  { direction: "desc", label: "Name Z-A", sortBy: "name", value: "name-desc" },
  { direction: "desc", label: "Newest First", sortBy: "createdAt", value: "createdAt-desc" },
  { direction: "asc", label: "Oldest First", sortBy: "createdAt", value: "createdAt-asc" },
];

const statusStyles = {
  [DEPARTMENT_STATUSES.ACTIVE]:
    "border-[#22C55E]/40 bg-[#22C55E]/15 text-[#86EFAC]",
  [DEPARTMENT_STATUSES.INACTIVE]:
    "border-[#EF4444]/40 bg-[#EF4444]/15 text-[#FCA5A5]",
};

const initialDepartmentForm = {
  name: "",
};

const normalizeKey = (value) => String(value ?? "").trim().toLowerCase();

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
  if (!(error instanceof DepartmentValidationError) || !Array.isArray(error.errors)) {
    return {};
  }

  return Object.fromEntries(
    error.errors.map((item) => [item.field, item.message]),
  );
};

const getErrorMessage = (error) => {
  if (error instanceof DepartmentValidationError && error.errors?.[0]?.message) {
    return error.errors[0].message;
  }

  return error?.message ?? "Department Management request failed.";
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

const DepartmentFormModal = ({
  errors,
  form,
  mode,
  onChange,
  onClose,
  onSubmit,
  status,
  submitting,
}) => {
  const isCreate = mode === "create";
  const displayStatus = isCreate ? DEPARTMENT_STATUSES.ACTIVE : status;

  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-[#020B16]/80 px-4 py-6">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-lg border border-[#123A5A] bg-[#061B2F] shadow-2xl">
        <div className="border-b border-[#123A5A] px-5 py-4">
          <h2 className="text-xl font-bold">
            {isCreate ? "Add Department" : "Edit Department"}
          </h2>
        </div>

        <form className="min-h-0 overflow-y-auto px-5 py-4" onSubmit={onSubmit}>
          <div className="space-y-4">
            <label className="flex flex-col gap-2 text-sm font-medium text-[#CBD5E1]">
              <span>Department Name</span>
              <input
                className={controlClassName}
                name="name"
                onChange={onChange}
                placeholder="Enter department name"
                value={form.name}
              />
              <FieldError message={errors.name} />
            </label>
            <div className="flex flex-col gap-2 text-sm font-medium text-[#CBD5E1]">
              <span>Status</span>
              <div
                className={[
                  "flex h-10 items-center rounded-md border border-[#123A5A] bg-[#08233B] px-3 text-sm",
                  displayStatus === DEPARTMENT_STATUSES.INACTIVE
                    ? "text-[#FCA5A5]"
                    : "text-[#86EFAC]",
                ].join(" ")}
              >
                {displayStatus}
              </div>
            </div>
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
                  ? "Save Department"
                  : "Update Department"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DepartmentStatusConfirmationModal = ({
  onCancel,
  onConfirm,
  submitting,
  targetDepartment,
}) => {
  const isActivate = targetDepartment?.status === DEPARTMENT_STATUSES.INACTIVE;

  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-[#020B16]/80 px-4 py-6">
      <div className="w-full max-w-md rounded-lg border border-[#123A5A] bg-[#061B2F] p-5 shadow-2xl">
        <h2 className="text-xl font-bold">
          {isActivate ? "Activate Department" : "Deactivate Department"}
        </h2>
        <div className="mt-3 space-y-2 text-sm text-[#CBD5E1]">
          {isActivate ? (
            <p>Department ini akan tersedia kembali untuk assignment User baru.</p>
          ) : (
            <>
              <p>Department ini tidak akan tersedia untuk assignment User baru.</p>
              <p>User yang telah menggunakan Department ini tetap mempertahankan referensinya.</p>
            </>
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

const DepartmentManagementSection = ({
  departments,
  error,
  isLoading,
  onDepartmentsChanged,
  onRetry,
  onUsersChanged,
}) => {
  const [formErrors, setFormErrors] = useState({});
  const [formMode, setFormMode] = useState(null);
  const [formState, setFormState] = useState(initialDepartmentForm);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchValue, setSearchValue] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [sortValue, setSortValue] = useState("name-asc");
  const [statusFilter, setStatusFilter] = useState("");
  const [statusTarget, setStatusTarget] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();
  const errorMessage = error ? getErrorMessage(error) : "";

  const resetPage = () => {
    setPageNumber(1);
  };

  const sortOption = departmentSortOptions.find(
    (option) => option.value === sortValue,
  ) ?? departmentSortOptions[0];
  const queryResult = useMemo(
    () =>
      DepartmentService.queryDepartments(departments, {
        direction: sortOption.direction,
        page: pageNumber,
        pageSize,
        search: searchValue,
        sortBy: sortOption.sortBy,
        status: statusFilter,
      }),
    [
      departments,
      pageNumber,
      pageSize,
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
      active: departments.filter(
        (department) => department.status === DEPARTMENT_STATUSES.ACTIVE,
      ).length,
      inactive: departments.filter(
        (department) => department.status === DEPARTMENT_STATUSES.INACTIVE,
      ).length,
      total: departments.length,
    }),
    [departments],
  );

  const handleFilterChange = (setter) => (event) => {
    setter(event.target.value);
    resetPage();
  };

  const handlePageSizeChange = (event) => {
    setPageSize(Number(event.target.value));
    resetPage();
  };

  const closeForm = () => {
    if (isSubmitting) return;

    setFormMode(null);
    setFormErrors({});
    setFormState(initialDepartmentForm);
    setSelectedDepartment(null);
  };

  const openCreateForm = () => {
    setFormMode("create");
    setFormErrors({});
    setSelectedDepartment(null);
    setFormState(initialDepartmentForm);
  };

  const openEditForm = (department) => {
    setFormMode("edit");
    setFormErrors({});
    setSelectedDepartment(department);
    setFormState({ name: department.name ?? "" });
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
        await DepartmentService.createDepartment(formState);
        showToast({
          message: "Department created successfully.",
          variant: "success",
        });
      } else if (formMode === "edit" && selectedDepartment) {
        const previousName = selectedDepartment.name;
        const updatedDepartment = await DepartmentService.updateDepartment(
          selectedDepartment.id,
          formState,
        );

        if (normalizeKey(previousName) !== normalizeKey(updatedDepartment.name)) {
          await UserService.renameDepartmentReferences(
            previousName,
            updatedDepartment.name,
          );
          await onUsersChanged();
        }

        showToast({
          message: "Department updated successfully.",
          variant: "success",
        });
      }

      setFormMode(null);
      setFormErrors({});
      setFormState(initialDepartmentForm);
      setSelectedDepartment(null);
      await onDepartmentsChanged();
    } catch (submitError) {
      setFormErrors(getErrorMap(submitError));
      showToast({
        message: getErrorMessage(submitError),
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
      if (statusTarget.status === DEPARTMENT_STATUSES.INACTIVE) {
        await DepartmentService.activateDepartment(statusTarget.id);
        showToast({
          message: "Department activated successfully.",
          variant: "success",
        });
      } else {
        await DepartmentService.deactivateDepartment(statusTarget.id);
        showToast({
          message: "Department deactivated successfully.",
          variant: "success",
        });
      }

      setStatusTarget(null);
      await onDepartmentsChanged();
    } catch (submitError) {
      showToast({
        message: getErrorMessage(submitError),
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard icon={Building2} label="Total Departments" value={summary.total} />
        <SummaryCard icon={ToggleRight} label="Active Departments" value={summary.active} />
        <SummaryCard icon={ToggleLeft} label="Inactive Departments" value={summary.inactive} />
      </section>

      <section className="overflow-hidden rounded-lg border border-[#123A5A] bg-[#061B2F]">
        <div className="flex flex-col gap-4 border-b border-[#123A5A] px-4 py-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-xl font-bold">Department Management</h2>
            <p className="mt-1 text-sm text-[#94A3B8]">
              Kelola Department Master Data untuk pilihan Department pada User Management.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_150px_150px_96px_auto]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
              <input
                className={[controlClassName, "w-full pl-9"].join(" ")}
                onChange={handleFilterChange(setSearchValue)}
                placeholder="Search departments..."
                type="search"
                value={searchValue}
              />
            </label>
            <SelectDropdown
              className={controlClassName}
              onChange={handleFilterChange(setStatusFilter)}
              value={statusFilter}
            >
              <option value="">All Status</option>
              <option value={DEPARTMENT_STATUSES.ACTIVE}>Active</option>
              <option value={DEPARTMENT_STATUSES.INACTIVE}>Inactive</option>
            </SelectDropdown>
            <SelectDropdown
              className={controlClassName}
              onChange={handleFilterChange(setSortValue)}
              value={sortValue}
            >
              {departmentSortOptions.map((option) => (
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
            <button
              className={primaryButtonClassName}
              disabled={isLoading}
              onClick={openCreateForm}
              type="button"
            >
              <Plus className="h-4 w-4" />
              Add Department
            </button>
          </div>
        </div>

        {errorMessage ? (
          <div className="border-b border-[#123A5A] bg-[#EF4444]/10 px-4 py-3 text-sm text-[#FCA5A5]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p>{errorMessage}</p>
              <button
                className={actionButtonClassName}
                onClick={onRetry}
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
                <th className="sticky top-0 z-20 min-w-72 bg-[#08233B] px-4 py-3 font-bold">Department Name</th>
                <th className="sticky top-0 z-20 min-w-36 bg-[#08233B] px-4 py-3 font-bold">Status</th>
                <th className="sticky right-0 top-0 z-30 min-w-56 bg-[#08233B] px-4 py-3 font-bold shadow-[-8px_0_16px_rgba(2,11,22,0.35)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className="px-4 py-8 text-center text-[#94A3B8]" colSpan={4}>
                    Loading Department Management...
                  </td>
                </tr>
              ) : null}

              {!isLoading && rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-[#94A3B8]" colSpan={4}>
                    Tidak ada department yang sesuai dengan search atau filter.
                  </td>
                </tr>
              ) : null}

              {!isLoading
                ? rows.map((department, rowIndex) => (
                    <tr
                      className="group border-t border-[#123A5A] text-[#F8FAFC] transition-colors hover:bg-[#08233B]"
                      key={department.id}
                    >
                      <td className="px-4 py-3 text-[#CBD5E1]">
                        {startIndex + rowIndex + 1}
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#F8FAFC]">
                        {department.name}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={
                            statusStyles[department.status] ??
                            "border-[#123A5A] bg-[#08233B] text-[#CBD5E1]"
                          }
                        >
                          {department.status}
                        </Badge>
                      </td>
                      <td className="sticky right-0 z-10 bg-[#061B2F] px-4 py-3 shadow-[-8px_0_16px_rgba(2,11,22,0.28)] transition-colors group-hover:bg-[#08233B]">
                        <div className="flex flex-wrap gap-2">
                          <button
                            className={actionButtonClassName}
                            onClick={() => openEditForm(department)}
                            type="button"
                          >
                            <Edit3 className="h-4 w-4" />
                            Edit
                          </button>
                          <button
                            className={[
                              actionButtonClassName,
                              department.status === DEPARTMENT_STATUSES.INACTIVE
                                ? "hover:border-[#22C55E] hover:text-[#86EFAC]"
                                : "hover:border-[#EF4444] hover:text-[#FCA5A5]",
                            ].join(" ")}
                            onClick={() => setStatusTarget(department)}
                            type="button"
                          >
                            {department.status === DEPARTMENT_STATUSES.INACTIVE ? (
                              <>
                                <ToggleRight className="h-4 w-4" />
                                Activate
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="h-4 w-4" />
                                Deactivate
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                : null}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#123A5A] px-4 py-4 text-sm text-[#CBD5E1] md:flex-row md:items-center md:justify-between">
          <p>
            Page {pagination.page} of {pagination.totalPages} - {pagination.totalItems} departments
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
        <DepartmentFormModal
          errors={formErrors}
          form={formState}
          mode={formMode}
          onChange={handleFormChange}
          onClose={closeForm}
          onSubmit={handleFormSubmit}
          status={selectedDepartment?.status}
          submitting={isSubmitting}
        />
      ) : null}

      {statusTarget ? (
        <DepartmentStatusConfirmationModal
          onCancel={() => setStatusTarget(null)}
          onConfirm={handleStatusConfirm}
          submitting={isSubmitting}
          targetDepartment={statusTarget}
        />
      ) : null}
    </>
  );
};

export default DepartmentManagementSection;
