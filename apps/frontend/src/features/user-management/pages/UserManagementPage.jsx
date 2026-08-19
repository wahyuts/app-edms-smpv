import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import DepartmentManagementSection from "@/features/user-management/components/DepartmentManagementSection";
import { DEPARTMENT_STATUSES } from "@/features/user-management/constants/department.constants";
import { USER_QUERY_KEY } from "@/features/user-management/constants/user-query.constants";
import { USER_STATUSES } from "@/features/user-management/constants/user.constants";
import {
  createUserSchema,
  formatValidationIssues,
  updateUserSchema,
} from "@/features/user-management/schemas/user.schema";
import { DepartmentService } from "@/features/user-management/services/department.service";
import { DemoDataResetService } from "@/features/user-management/services/demo-data-reset.service";
import {
  UserService,
  UserValidationError,
} from "@/features/user-management/services/user.service";
import PasswordInput from "@/shared/components/form/PasswordInput";
import SelectDropdown from "@/shared/components/form/SelectDropdown";
import { queryClient } from "@/shared/api/query-client";
import { useToast } from "@/shared/components/toast";
import { AuthorizationService } from "@/shared/services/authorization.service";

const controlClassName =
  "h-10 rounded-md border border-[#123A5A] bg-[#08233B] px-3 text-sm text-[#F8FAFC] outline-none transition-colors placeholder:text-[#64748B] focus:border-[#0F7BFF]";
const actionButtonClassName =
  "inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#123A5A] px-3 text-sm font-semibold text-[#CBD5E1] transition-colors hover:border-[#0F7BFF] hover:bg-[#0B2B47] hover:text-white disabled:cursor-not-allowed disabled:text-[#64748B]";
const primaryButtonClassName =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#0F7BFF] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0B63CC] disabled:cursor-not-allowed disabled:bg-[#123A5A] disabled:text-[#94A3B8]";
const destructiveButtonClassName =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#DC2626] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#B91C1C] disabled:cursor-not-allowed disabled:bg-[#123A5A] disabled:text-[#94A3B8]";
const paginationButtonClassName =
  "inline-flex h-9 min-w-9 items-center justify-center gap-2 rounded-md border border-[#123A5A] px-3 text-sm font-semibold transition-colors hover:border-[#0F7BFF] hover:bg-[#0B2B47] disabled:cursor-not-allowed disabled:text-[#64748B]";
const activePaginationButtonClassName =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-[#0F7BFF] bg-[#0F7BFF] px-3 text-sm font-bold text-white";

const initialCreateForm = {
  confirmPassword: "",
  department: "",
  email: "",
  initialPassword: "",
  name: "",
  username: "",
};

const USER_MANAGEMENT_PERMISSION = "user-management.view";
const RESET_CONFIRMATION_TEXT = DemoDataResetService.CONFIRMATION_TEXT;
const ADMIN_ROLE_NAME = "Admin";
const NO_DEPARTMENT_NAME = "No Department";
const PROJECT_MEMBERSHIP_QUERY_KEY = ["project-membership-management", "memberships"];

const sortOptions = [
  { direction: "asc", label: "Name A-Z", sortBy: "name", value: "name-asc" },
  { direction: "desc", label: "Name Z-A", sortBy: "name", value: "name-desc" },
  { direction: "desc", label: "Newest First", sortBy: "createdAt", value: "createdAt-desc" },
  { direction: "asc", label: "Oldest First", sortBy: "createdAt", value: "createdAt-asc" },
];

const statusStyles = {
  [USER_STATUSES.ACTIVE]:
    "border-[#22C55E]/40 bg-[#22C55E]/15 text-[#86EFAC]",
  [USER_STATUSES.INACTIVE]:
    "border-[#EF4444]/40 bg-[#EF4444]/15 text-[#FCA5A5]",
};

const normalizeKey = (value) => String(value ?? "").trim().toLowerCase();
const prioritizeNoDepartment = (departments) =>
  [...departments].sort((firstDepartment, secondDepartment) => {
    const firstIsNoDepartment = normalizeKey(firstDepartment.name) === normalizeKey(NO_DEPARTMENT_NAME);
    const secondIsNoDepartment = normalizeKey(secondDepartment.name) === normalizeKey(NO_DEPARTMENT_NAME);

    if (firstIsNoDepartment === secondIsNoDepartment) return 0;
    return firstIsNoDepartment ? -1 : 1;
  });

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
  if (!(error instanceof UserValidationError) || !Array.isArray(error.errors)) {
    return {};
  }

  return Object.fromEntries(
    error.errors.map((item) => [item.field, item.message]),
  );
};

const getErrorMessage = (error) => {
  if (error instanceof UserValidationError && error.errors?.[0]?.message) {
    return error.errors[0].message;
  }

  return error?.message ?? "User Management request failed.";
};

const validateFormState = (mode, form) => {
  const schema = mode === "create" ? createUserSchema : updateUserSchema;
  const result = schema.safeParse(form);

  if (result.success) return result.data;

  throw new UserValidationError(
    "Data tidak valid.",
    formatValidationIssues(result.error.issues),
  );
};

const getEditForm = (user) => ({
  department: user.department ?? "",
  email: user.email ?? "",
  name: user.name ?? user.fullName ?? "",
  status: user.status ?? (user.isActive ? USER_STATUSES.ACTIVE : USER_STATUSES.INACTIVE),
  username: user.username ?? "",
});

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

const TextField = ({
  disabled = false,
  error,
  label,
  name,
  onChange,
  placeholder,
  readOnly = false,
  type = "text",
  value,
}) => (
  <label className="flex flex-col gap-2 text-sm font-medium text-[#CBD5E1]">
    <span>{label}</span>
    <input
      className={controlClassName}
      disabled={disabled}
      name={name}
      onChange={onChange}
      placeholder={placeholder}
      readOnly={readOnly}
      type={type}
      value={value}
    />
    <FieldError message={error} />
  </label>
);

const SelectField = ({
  children,
  disabled = false,
  error,
  label,
  name,
  onChange,
  value,
}) => (
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

const UserFormModal = ({
  departments,
  departmentError,
  departmentLoading,
  departmentStatusByName,
  errors,
  form,
  mode,
  onChange,
  onClose,
  onSubmit,
  statuses,
  submitLabel,
  submitting,
}) => {
  const isCreate = mode === "create";
  const selectedDepartmentKey = normalizeKey(form.department);
  const selectedDepartmentStatus = departmentStatusByName.get(selectedDepartmentKey);
  const selectedDepartmentIsInactive =
    !isCreate &&
    form.department &&
    selectedDepartmentStatus === DEPARTMENT_STATUSES.INACTIVE;
  const departmentOptions = selectedDepartmentIsInactive
    ? [
        {
          id: `current-${form.department}`,
          name: form.department,
          status: DEPARTMENT_STATUSES.INACTIVE,
        },
        ...departments.filter(
          (department) => normalizeKey(department.name) !== selectedDepartmentKey,
        ),
      ]
    : departments;
  const departmentUnavailable = !departmentLoading && departments.length === 0;

  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-[#020B16]/80 px-4 py-6">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-[#123A5A] bg-[#061B2F] shadow-2xl">
        <div className="border-b border-[#123A5A] px-5 py-4">
          <h2 className="text-xl font-bold">
            {isCreate ? "Create User" : "Edit User"}
          </h2>
          <p className="mt-1 text-sm text-[#94A3B8]">
            {isCreate
              ? "Create an active EDMS account with an initial password."
              : "Update user identity, department, and status."}
          </p>
        </div>

        <form
          className="min-h-0 overflow-y-auto px-5 py-4"
          onSubmit={onSubmit}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              error={errors.name}
              label="Name"
              name="name"
              onChange={onChange}
              placeholder="Enter name"
              value={form.name}
            />
            <TextField
              error={errors.username}
              label="Username"
              name="username"
              onChange={onChange}
              placeholder="Enter username"
              readOnly={!isCreate}
              value={form.username}
            />
            <TextField
              error={errors.email}
              label="Email"
              name="email"
              onChange={onChange}
              placeholder="Enter email"
              type="email"
              value={form.email}
            />
            <SelectField
              disabled={departmentLoading || Boolean(departmentError)}
              error={errors.department}
              label="Department"
              name="department"
              onChange={onChange}
              value={form.department}
            >
              <option value="">
                {departmentLoading ? "Loading departments..." : "Select Department"}
              </option>
              {departmentOptions.map((department) => (
                <option key={department.id ?? department.name} value={department.name}>
                  {department.name}
                  {department.status === DEPARTMENT_STATUSES.INACTIVE
                    ? " (Inactive)"
                    : ""}
                </option>
              ))}
            </SelectField>
            {departmentError ? (
              <p className="md:col-span-2 text-xs font-medium text-[#FCA5A5]">
                Department Master Data tidak dapat dimuat. Retry dari halaman User Management.
              </p>
            ) : null}
            {departmentUnavailable ? (
              <p className="md:col-span-2 text-xs font-medium text-[#FCA5A5]">
                Tidak ada Department aktif yang tersedia. Tambahkan atau aktifkan Department melalui Department Management.
              </p>
            ) : null}
            {!isCreate ? (
              <SelectField
                error={errors.status}
                label="Status"
                name="status"
                onChange={onChange}
                value={form.status}
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </SelectField>
            ) : null}
            {isCreate ? (
              <>
                <label className="flex flex-col gap-2 text-sm font-medium text-[#CBD5E1]">
                  <span>Password</span>
                  <PasswordInput
                    autoComplete="new-password"
                    name="initialPassword"
                    onChange={onChange}
                    placeholder="Enter initial password"
                    value={form.initialPassword}
                  />
                  <FieldError message={errors.initialPassword} />
                </label>
                <label className="flex flex-col gap-2 text-sm font-medium text-[#CBD5E1]">
                  <span>Confirm Password</span>
                  <PasswordInput
                    autoComplete="new-password"
                    hideLabel="Hide confirm password"
                    name="confirmPassword"
                    onChange={onChange}
                    placeholder="Confirm initial password"
                    showLabel="Show confirm password"
                    value={form.confirmPassword}
                  />
                  <FieldError message={errors.confirmPassword} />
                </label>
              </>
            ) : null}
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
              disabled={
                submitting ||
                departmentLoading ||
                Boolean(departmentError) ||
                (isCreate && departmentUnavailable)
              }
              type="submit"
            >
              {submitting ? "Saving..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CreateUserConfirmationModal = ({
  form,
  onCancel,
  onConfirm,
  submitting,
}) => (
  <div className="fixed inset-0 z-[9100] flex items-center justify-center bg-[#020B16]/80 px-4 py-6">
    <div className="w-full max-w-md rounded-lg border border-[#123A5A] bg-[#061B2F] p-5 shadow-2xl">
      <h2 className="text-xl font-bold">Konfirmasi Username</h2>
      <div className="mt-3 space-y-3 text-sm text-[#CBD5E1]">
        <p>Username yang dipilih tidak dapat diubah setelah akun dibuat.</p>
        <div className="rounded-md border border-[#123A5A] bg-[#08233B] px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
            Username
          </p>
          <p className="mt-1 font-mono text-base font-bold text-[#F8FAFC]">
            {form.username}
          </p>
        </div>
        <p>Pastikan username sudah benar sebelum melanjutkan.</p>
        <p>Apakah Anda yakin ingin membuat user ini?</p>
      </div>
      <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          className={actionButtonClassName}
          disabled={submitting}
          onClick={onCancel}
          type="button"
        >
          Batal
        </button>
        <button
          className={primaryButtonClassName}
          disabled={submitting}
          onClick={onConfirm}
          type="button"
        >
          {submitting ? "Saving..." : "Buat User"}
        </button>
      </div>
    </div>
  </div>
);

const StatusConfirmationModal = ({
  onCancel,
  onConfirm,
  submitting,
  targetUser,
}) => {
  const isActivate = targetUser?.status === USER_STATUSES.INACTIVE;

  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-[#020B16]/80 px-4 py-6">
      <div className="w-full max-w-md rounded-lg border border-[#123A5A] bg-[#061B2F] p-5 shadow-2xl">
        <h2 className="text-xl font-bold">
          {isActivate ? "Activate User" : "Deactivate User"}
        </h2>
        <div className="mt-3 space-y-2 text-sm text-[#CBD5E1]">
          {isActivate ? (
            <p>User ini akan dapat login kembali setelah diaktifkan.</p>
          ) : (
            <>
              <p>User ini tidak akan dapat login setelah dinonaktifkan.</p>
              <p>Riwayat dan data terkait tetap dipertahankan.</p>
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

const ResetDemoDataConfirmationModal = ({
  confirmationValue,
  errorMessage,
  onCancel,
  onChange,
  onConfirm,
  submitting,
}) => {
  const canConfirm = confirmationValue === RESET_CONFIRMATION_TEXT;

  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-[#020B16]/85 px-4 py-6">
      <div className="w-full max-w-2xl rounded-lg border border-[#7F1D1D] bg-[#061B2F] p-5 shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[#EF4444]/50 bg-[#EF4444]/15 text-[#FCA5A5]">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#F8FAFC]">
              Reset All Demo Data
            </h2>
            <p className="mt-2 text-sm text-[#CBD5E1]">
              Seluruh data demo akan dihapus permanen. Proses ini tidak dapat dibatalkan.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-2 rounded-md border border-[#7F1D1D] bg-[#450A0A]/25 p-4 text-sm text-[#FECACA]">
          <p>Seluruh Project akan dihapus.</p>
          <p>Seluruh User selain deny akan dihapus.</p>
          <p>Seluruh Document, Workflow Activity, SLA, Escalation, Notification, dan Audit Trail demo akan dihapus.</p>
          <p>Hanya akun Admin deny dan dependency minimum Department yang dipertahankan.</p>
        </div>

        <label className="mt-5 flex flex-col gap-2 text-sm font-medium text-[#CBD5E1]">
          <span>Ketik teks konfirmasi berikut secara persis:</span>
          <span className="font-mono text-xs font-bold text-[#F8FAFC]">
            {RESET_CONFIRMATION_TEXT}
          </span>
          <input
            className={controlClassName}
            onChange={onChange}
            placeholder={RESET_CONFIRMATION_TEXT}
            value={confirmationValue}
          />
        </label>

        {errorMessage ? (
          <p className="mt-3 rounded-md border border-[#EF4444]/40 bg-[#EF4444]/10 px-3 py-2 text-sm text-[#FCA5A5]">
            {errorMessage}
          </p>
        ) : null}

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
            className={destructiveButtonClassName}
            disabled={!canConfirm || submitting}
            onClick={onConfirm}
            type="button"
          >
            {submitting ? "Resetting..." : "Confirm Reset"}
          </button>
        </div>
      </div>
    </div>
  );
};

const UserManagementPage = () => {
  const [activeSection, setActiveSection] = useState("users");
  const [formErrors, setFormErrors] = useState({});
  const [formMode, setFormMode] = useState(null);
  const [formState, setFormState] = useState(initialCreateForm);
  const [createConfirmationForm, setCreateConfirmationForm] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchValue, setSearchValue] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [sortValue, setSortValue] = useState("createdAt-desc");
  const [statusFilter, setStatusFilter] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [resetConfirmationValue, setResetConfirmationValue] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();
  const currentRole = AuthorizationService.getCurrentRole();
  const canResetDemoData =
    DemoDataResetService.isFeatureEnabled() &&
    currentRole?.name === ADMIN_ROLE_NAME &&
    AuthorizationService.hasPermission(USER_MANAGEMENT_PERMISSION);
  const canManageDepartments = AuthorizationService.hasPermission(
    USER_MANAGEMENT_PERMISSION,
  );

  const statuses = useMemo(() => UserService.getStatuses(), []);
  const {
    data: allUsers = [],
    error: loadError,
    isLoading,
    refetch: refetchUsers,
  } = useQuery({
    queryFn: UserService.getUsers,
    queryKey: USER_QUERY_KEY,
  });
  const {
    data: allDepartments = [],
    error: departmentLoadError,
    isLoading: isDepartmentLoading,
    refetch: refetchDepartments,
  } = useQuery({
    queryFn: DepartmentService.getAllDepartments,
    queryKey: ["user-management", "departments"],
  });
  const errorMessage = loadError ? getErrorMessage(loadError) : "";

  const activeDepartments = useMemo(
    () => prioritizeNoDepartment(
      allDepartments.filter(
        (department) => department.status === DEPARTMENT_STATUSES.ACTIVE,
      ),
    ),
    [allDepartments],
  );
  const departmentStatusByName = useMemo(
    () => new Map(
      allDepartments.map((department) => [
        normalizeKey(department.name),
        department.status,
      ]),
    ),
    [allDepartments],
  );
  const departmentFilterOptions = useMemo(() => {
    const usedDepartmentKeys = new Set(
      allUsers.map((user) => normalizeKey(user.department)).filter(Boolean),
    );

    return allDepartments
      .filter((department) =>
        department.status === DEPARTMENT_STATUSES.ACTIVE ||
        usedDepartmentKeys.has(normalizeKey(department.name)),
      )
      .sort((firstDepartment, secondDepartment) =>
        normalizeKey(firstDepartment.name) > normalizeKey(secondDepartment.name)
          ? 1
          : -1,
      );
  }, [allDepartments, allUsers]);

  const resetPage = () => {
    setPageNumber(1);
  };

  const sortOption = sortOptions.find((option) => option.value === sortValue) ?? sortOptions[0];
  const queryResult = useMemo(
    () =>
      UserService.queryUsers(allUsers, {
        department: departmentFilter,
        direction: sortOption.direction,
        page: pageNumber,
        pageSize,
        search: searchValue,
        sortBy: sortOption.sortBy,
        status: statusFilter,
      }),
    [
      allUsers,
      departmentFilter,
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
      active: allUsers.filter((user) => user.status === USER_STATUSES.ACTIVE).length,
      inactive: allUsers.filter((user) => user.status === USER_STATUSES.INACTIVE).length,
      total: allUsers.length,
    }),
    [allUsers],
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
    setCreateConfirmationForm(null);
    setFormMode(null);
    setFormErrors({});
    setFormState(initialCreateForm);
    setSelectedUser(null);
  };

  const openCreateForm = () => {
    setFormMode("create");
    setFormErrors({});
    setCreateConfirmationForm(null);
    setSelectedUser(null);
    setFormState(initialCreateForm);
  };

  const openEditForm = (user) => {
    setFormMode("edit");
    setFormErrors({});
    setCreateConfirmationForm(null);
    setSelectedUser(user);
    setFormState(getEditForm(user));
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;

    setFormState((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
    setCreateConfirmationForm(null);
    setFormErrors((currentErrors) => ({
      ...currentErrors,
      [name]: null,
    }));
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    let requestStarted = false;
    setFormErrors({});

    try {
      const validatedForm = validateFormState(formMode, formState);

      if (isDepartmentLoading || departmentLoadError) {
        throw new UserValidationError("Validation failed.", [
          {
            field: "department",
            message: "Department Master Data is not ready.",
          },
        ]);
      }

      if (formMode === "create" && activeDepartments.length === 0) {
        throw new UserValidationError("Validation failed.", [
          {
            field: "department",
            message: "Tidak ada Department aktif yang tersedia. Tambahkan atau aktifkan Department melalui Department Management.",
          },
        ]);
      }

      if (formMode === "create") {
        setCreateConfirmationForm(validatedForm);
        return;
      }

      setIsSubmitting(true);
      requestStarted = true;

      if (formMode === "edit" && selectedUser) {
        await UserService.updateUser(selectedUser.id, validatedForm);
        showToast({
          message: "User updated successfully.",
          variant: "success",
        });
      }

      closeForm();
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: PROJECT_MEMBERSHIP_QUERY_KEY }),
      ]);
    } catch (error) {
      setFormErrors(getErrorMap(error));
      showToast({
        message: getErrorMessage(error),
        variant: "error",
      });
    } finally {
      if (requestStarted) {
        setIsSubmitting(false);
      }
    }
  };

  const handleCreateUserConfirm = async () => {
    if (!createConfirmationForm || isSubmitting) return;

    setIsSubmitting(true);

    try {
      await UserService.createUser(createConfirmationForm);
      showToast({
        message: "User created successfully.",
        variant: "success",
      });
      setCreateConfirmationForm(null);
      setFormMode(null);
      setFormErrors({});
      setFormState(initialCreateForm);
      setSelectedUser(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: PROJECT_MEMBERSHIP_QUERY_KEY }),
      ]);
    } catch (error) {
      setFormErrors(getErrorMap(error));
      setCreateConfirmationForm(null);
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
      if (statusTarget.status === USER_STATUSES.INACTIVE) {
        await UserService.activateUser(statusTarget.id);
        showToast({
          message: "User activated successfully.",
          variant: "success",
        });
      } else {
        await UserService.deactivateUser(statusTarget.id);
        showToast({
          message: "User deactivated successfully.",
          variant: "success",
        });
      }

      setStatusTarget(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: USER_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: PROJECT_MEMBERSHIP_QUERY_KEY }),
      ]);
    } catch (error) {
      showToast({
        message: getErrorMessage(error),
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openResetModal = () => {
    setResetConfirmationValue("");
    setResetError("");
    setResetModalOpen(true);
  };

  const closeResetModal = () => {
    if (isSubmitting) return;
    setResetConfirmationValue("");
    setResetError("");
    setResetModalOpen(false);
  };

  const handleResetAllDemoData = async () => {
    setIsSubmitting(true);
    setResetError("");

    try {
      await DemoDataResetService.resetAllDemoData({
        confirmationText: resetConfirmationValue,
      });
      showToast({
        message: "Demo data reset successfully. Please login again as deny.",
        variant: "success",
      });
      setResetModalOpen(false);
      navigate("/login", { replace: true });
    } catch (error) {
      const message = error?.message ?? "Reset All Demo Data failed.";
      setResetError(message);
      showToast({
        message,
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
          <h1 className="mt-2 text-3xl font-bold">User Management</h1>
          <p className="mt-2 max-w-3xl text-sm text-[#CBD5E1]">
            Manage account identities, departments, and the active/inactive lifecycle.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          {canResetDemoData ? (
            <button
              className={destructiveButtonClassName}
              disabled={isSubmitting}
              onClick={openResetModal}
              type="button"
            >
              <Trash2 className="h-4 w-4" />
              Reset All Demo Data
            </button>
          ) : null}
          <button
            className={primaryButtonClassName}
            disabled={
              isLoading ||
              isDepartmentLoading ||
              Boolean(departmentLoadError)
            }
            onClick={openCreateForm}
            type="button"
          >
            <Plus className="h-4 w-4" />
            Create User
          </button>
        </div>
      </header>

      <nav className="flex flex-wrap gap-2 border-b border-[#123A5A] pb-3">
        <button
          className={
            activeSection === "users"
              ? activePaginationButtonClassName
              : paginationButtonClassName
          }
          onClick={() => setActiveSection("users")}
          type="button"
        >
          Users
        </button>
        {canManageDepartments ? (
          <button
            className={
              activeSection === "departments"
                ? activePaginationButtonClassName
                : paginationButtonClassName
            }
            onClick={() => setActiveSection("departments")}
            type="button"
          >
            Departments
          </button>
        ) : null}
      </nav>

      {activeSection === "users" ? (
        <>
      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard icon={Users} label="Total Users" value={summary.total} />
        <SummaryCard icon={UserCheck} label="Active Users" value={summary.active} />
        <SummaryCard icon={UserX} label="Inactive Users" value={summary.inactive} />
      </section>

      <section className="overflow-hidden rounded-lg border border-[#123A5A] bg-[#061B2F]">
        <div className="flex flex-col gap-4 border-b border-[#123A5A] px-4 py-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-xl font-bold">User List</h2>
            <p className="mt-1 text-sm text-[#94A3B8]">
              List of user accounts stored in the Authentication data source.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_180px_150px_150px_96px]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
              <input
                className={[controlClassName, "w-full pl-9"].join(" ")}
                onChange={handleFilterChange(setSearchValue)}
                placeholder="Search users..."
                type="search"
                value={searchValue}
              />
            </label>
            <SelectDropdown
              className={controlClassName}
              onChange={handleFilterChange(setDepartmentFilter)}
              value={departmentFilter}
            >
              <option value="">All Departments</option>
              {departmentFilterOptions.map((department) => (
                <option key={department.id ?? department.name} value={department.name}>
                  {department.name}
                  {department.status === DEPARTMENT_STATUSES.INACTIVE
                    ? " (Inactive)"
                    : ""}
                </option>
              ))}
            </SelectDropdown>
            <SelectDropdown
              className={controlClassName}
              onChange={handleFilterChange(setStatusFilter)}
              value={statusFilter}
            >
              <option value="">All Status</option>
              {statuses.map((status) => (
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
                onClick={() => refetchUsers()}
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
                <th className="sticky top-0 z-20 min-w-48 bg-[#08233B] px-4 py-3 font-bold">Name</th>
                <th className="sticky top-0 z-20 min-w-44 bg-[#08233B] px-4 py-3 font-bold">Username</th>
                <th className="sticky top-0 z-20 min-w-60 bg-[#08233B] px-4 py-3 font-bold">Email</th>
                <th className="sticky top-0 z-20 min-w-56 bg-[#08233B] px-4 py-3 font-bold">Department</th>
                <th className="sticky top-0 z-20 min-w-32 bg-[#08233B] px-4 py-3 font-bold">Status</th>
                <th className="sticky right-0 top-0 z-30 min-w-56 bg-[#08233B] px-4 py-3 font-bold shadow-[-8px_0_16px_rgba(2,11,22,0.35)]">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td className="px-4 py-8 text-center text-[#94A3B8]" colSpan={7}>
                    Loading User Management...
                  </td>
                </tr>
              ) : null}

              {!isLoading && rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-[#94A3B8]" colSpan={7}>
                    Tidak ada user yang sesuai dengan search atau filter.
                  </td>
                </tr>
              ) : null}

              {!isLoading
                ? rows.map((user, rowIndex) => (
                    <tr
                      className="group border-t border-[#123A5A] text-[#F8FAFC] transition-colors hover:bg-[#08233B]"
                      key={user.id}
                    >
                      <td className="px-4 py-3 text-[#CBD5E1]">
                        {startIndex + rowIndex + 1}
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#F8FAFC]">
                        {user.name ?? user.fullName}
                      </td>
                      <td className="px-4 py-3 text-[#00C8FF]">{user.username}</td>
                      <td className="px-4 py-3 text-[#CBD5E1]">{user.email}</td>
                      <td className="px-4 py-3 text-[#CBD5E1]">{user.department}</td>
                      <td className="px-4 py-3">
                        <Badge
                          className={
                            statusStyles[user.status] ??
                            "border-[#123A5A] bg-[#08233B] text-[#CBD5E1]"
                          }
                        >
                          {user.status}
                        </Badge>
                      </td>
                      <td className="sticky right-0 z-10 bg-[#061B2F] px-4 py-3 shadow-[-8px_0_16px_rgba(2,11,22,0.28)] transition-colors group-hover:bg-[#08233B]">
                        <div className="flex flex-wrap gap-2">
                          <button
                            className={actionButtonClassName}
                            onClick={() => openEditForm(user)}
                            type="button"
                          >
                            <Edit3 className="h-4 w-4" />
                            Edit
                          </button>
                          <button
                            className={[
                              actionButtonClassName,
                              user.status === USER_STATUSES.INACTIVE
                                ? "hover:border-[#22C55E] hover:text-[#86EFAC]"
                                : "hover:border-[#EF4444] hover:text-[#FCA5A5]",
                            ].join(" ")}
                            onClick={() => setStatusTarget(user)}
                            type="button"
                          >
                            {user.status === USER_STATUSES.INACTIVE ? (
                              <>
                                <UserCheck className="h-4 w-4" />
                                Activate
                              </>
                            ) : (
                              <>
                                <UserX className="h-4 w-4" />
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
            Page {pagination.page} of {pagination.totalPages} - {pagination.totalItems} users
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
        </>
      ) : null}

      {activeSection === "departments" && canManageDepartments ? (
        <DepartmentManagementSection
          departments={allDepartments}
          error={departmentLoadError}
          isLoading={isDepartmentLoading}
          onDepartmentsChanged={refetchDepartments}
          onRetry={() => refetchDepartments()}
          onUsersChanged={refetchUsers}
        />
      ) : null}

      {formMode ? (
        <UserFormModal
          departmentError={departmentLoadError}
          departmentLoading={isDepartmentLoading}
          departments={activeDepartments}
          departmentStatusByName={departmentStatusByName}
          errors={formErrors}
          form={formState}
          mode={formMode}
          onChange={handleFormChange}
          onClose={closeForm}
          onSubmit={handleFormSubmit}
          statuses={statuses}
          submitLabel={formMode === "create" ? "Create User" : "Update User"}
          submitting={isSubmitting}
        />
      ) : null}

      {createConfirmationForm ? (
        <CreateUserConfirmationModal
          form={createConfirmationForm}
          onCancel={() => setCreateConfirmationForm(null)}
          onConfirm={handleCreateUserConfirm}
          submitting={isSubmitting}
        />
      ) : null}

      {statusTarget ? (
        <StatusConfirmationModal
          onCancel={() => setStatusTarget(null)}
          onConfirm={handleStatusConfirm}
          submitting={isSubmitting}
          targetUser={statusTarget}
        />
      ) : null}

      {resetModalOpen ? (
        <ResetDemoDataConfirmationModal
          confirmationValue={resetConfirmationValue}
          errorMessage={resetError}
          onCancel={closeResetModal}
          onChange={(event) => {
            setResetConfirmationValue(event.target.value);
            setResetError("");
          }}
          onConfirm={handleResetAllDemoData}
          submitting={isSubmitting}
        />
      ) : null}
    </>
  );
};

export default UserManagementPage;
