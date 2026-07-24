import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Eye,
  FolderKanban,
  LockKeyhole,
  Plus,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AuthService } from "@/features/auth/services/auth.service";
import {
  PROJECT_STATUS,
  PROJECT_STATUS_OPTIONS,
} from "@/features/project/constants/project.constants";
import {
  ProjectService,
  ProjectValidationError,
} from "@/features/project/services/project.service";
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
  description: "",
  projectCode: "",
  projectName: "",
  status: PROJECT_STATUS.ACTIVE,
};

const sortOptions = [
  { direction: "asc", label: "Code A-Z", sortBy: "projectCode", value: "projectCode-asc" },
  { direction: "asc", label: "Name A-Z", sortBy: "projectName", value: "projectName-asc" },
  { direction: "desc", label: "Newest First", sortBy: "createdDate", value: "createdDate-desc" },
  { direction: "asc", label: "Oldest First", sortBy: "createdDate", value: "createdDate-asc" },
];

const statusStyles = {
  [PROJECT_STATUS.ACTIVE]:
    "border-[#22C55E]/40 bg-[#22C55E]/15 text-[#86EFAC]",
  [PROJECT_STATUS.INACTIVE]:
    "border-[#64748B]/40 bg-[#64748B]/15 text-[#CBD5E1]",
  [PROJECT_STATUS.CLOSED]:
    "border-[#EF4444]/40 bg-[#EF4444]/15 text-[#FCA5A5]",
};

const editableProjectStatusOptions = PROJECT_STATUS_OPTIONS.filter(
  (status) => status !== PROJECT_STATUS.CLOSED,
);

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

  return error?.message ?? "Project Management request failed.";
};

const getEditForm = (project) => ({
  description: project.description ?? "",
  projectCode: project.projectCode ?? "",
  projectName: project.projectName ?? "",
  status: project.status ?? PROJECT_STATUS.ACTIVE,
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

const TextField = ({
  disabled = false,
  error,
  label,
  name,
  onChange,
  placeholder,
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
      type="text"
      value={value}
    />
    <FieldError message={error} />
  </label>
);

const TextAreaField = ({ error, label, name, onChange, placeholder, value }) => (
  <label className="flex flex-col gap-2 text-sm font-medium text-[#CBD5E1] md:col-span-2">
    <span>{label}</span>
    <textarea
      className={[controlClassName, "min-h-28 py-2"].join(" ")}
      name={name}
      onChange={onChange}
      placeholder={placeholder}
      value={value}
    />
    <FieldError message={error} />
  </label>
);

const SelectField = ({ children, error, label, name, onChange, value }) => (
  <label className="flex flex-col gap-2 text-sm font-medium text-[#CBD5E1]">
    <span>{label}</span>
    <SelectDropdown
      className={controlClassName}
      name={name}
      onChange={onChange}
      value={value}
    >
      {children}
    </SelectDropdown>
    <FieldError message={error} />
  </label>
);

const ProjectFormModal = ({
  errors,
  form,
  mode,
  onChange,
  onClose,
  onSubmit,
  submitting,
}) => {
  const isCreate = mode === "create";

  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-[#020B16]/80 px-4 py-6">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-lg border border-[#123A5A] bg-[#061B2F] shadow-2xl">
        <div className="border-b border-[#123A5A] px-5 py-4">
          <h2 className="text-xl font-bold">
            {isCreate ? "Create Project" : "Edit Project"}
          </h2>
          <p className="mt-1 text-sm text-[#94A3B8]">
            {isCreate
              ? "Create Project Master Data and initial Admin membership."
              : "Update Project identity and lifecycle status."}
          </p>
        </div>

        <form className="min-h-0 overflow-y-auto px-5 py-4" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <TextField
              disabled={!isCreate}
              error={errors.projectCode}
              label="Project Code"
              name="projectCode"
              onChange={onChange}
              placeholder="Enter project code"
              value={form.projectCode}
            />
            <TextField
              error={errors.projectName}
              label="Project Name"
              name="projectName"
              onChange={onChange}
              placeholder="Enter project name"
              value={form.projectName}
            />
            <SelectField
              error={errors.status}
              label="Status"
              name="status"
              onChange={onChange}
              value={form.status}
            >
              {editableProjectStatusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </SelectField>
            {!isCreate ? (
              <p className="self-end text-xs font-medium text-[#94A3B8]">
                Project Code is read only from this form. Used Project Code cannot be changed.
              </p>
            ) : null}
            <TextAreaField
              error={errors.description}
              label="Description"
              name="description"
              onChange={onChange}
              placeholder="Enter project description"
              value={form.description}
            />
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
                  ? "Create Project"
                  : "Update Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const StatusConfirmationModal = ({
  onCancel,
  onConfirm,
  project,
  submitting,
}) => {
  const isActivate = project?.status === PROJECT_STATUS.INACTIVE;

  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-[#020B16]/80 px-4 py-6">
      <div className="w-full max-w-md rounded-lg border border-[#123A5A] bg-[#061B2F] p-5 shadow-2xl">
        <h2 className="text-xl font-bold">
          {isActivate ? "Activate Project" : "Deactivate Project"}
        </h2>
        <div className="mt-3 space-y-2 text-sm text-[#CBD5E1]">
          {isActivate ? (
            <p>Project Active dapat dipilih sebagai Active Project oleh member aktif.</p>
          ) : (
            <>
              <p>Project Inactive tidak akan muncul pada Active Project Selector.</p>
              <p>Data operasional Project tetap dipertahankan.</p>
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

const ProjectViewModal = ({ onClose, project }) => (
  <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-[#020B16]/80 px-4 py-6">
    <div className="w-full max-w-2xl rounded-lg border border-[#123A5A] bg-[#061B2F] p-5 shadow-2xl">
      <div className="flex items-start justify-between gap-4 border-b border-[#123A5A] pb-4">
        <div>
          <h2 className="text-xl font-bold">View Project</h2>
          <p className="mt-1 text-sm text-[#94A3B8]">Informasi Project read only.</p>
        </div>
        <Badge
          className={
            statusStyles[project.status] ??
            "border-[#123A5A] bg-[#08233B] text-[#CBD5E1]"
          }
        >
          {project.status}
        </Badge>
      </div>
      <dl className="mt-4 grid gap-4 md:grid-cols-2">
        {[
          ["Project Name", project.projectName],
          ["Project Code", project.projectCode],
          ["Created At", formatDateTime(project.createdDate)],
          ["Last Updated", formatDateTime(project.lastUpdated)],
        ].map(([label, value]) => (
          <div className="rounded-md border border-[#123A5A] bg-[#08233B] p-3" key={label}>
            <dt className="text-xs font-semibold uppercase text-[#94A3B8]">{label}</dt>
            <dd className="mt-1 text-sm font-semibold text-[#F8FAFC]">{value || "-"}</dd>
          </div>
        ))}
        <div className="rounded-md border border-[#123A5A] bg-[#08233B] p-3 md:col-span-2">
          <dt className="text-xs font-semibold uppercase text-[#94A3B8]">Description</dt>
          <dd className="mt-1 text-sm text-[#CBD5E1]">{project.description || "-"}</dd>
        </div>
      </dl>
      <div className="mt-5 flex justify-end border-t border-[#123A5A] pt-4">
        <button className={actionButtonClassName} onClick={onClose} type="button">
          Close
        </button>
      </div>
    </div>
  </div>
);

const CloseProjectWizard = ({
  confirmation,
  errors,
  onCancel,
  onChange,
  onCloseProject,
  onNext,
  onPrevious,
  project,
  step,
  submitting,
  summary,
  validationError,
}) => {
  const canConfirm =
    !submitting &&
    !validationError &&
    summary?.project?.status === PROJECT_STATUS.ACTIVE &&
    confirmation.projectCodeConfirmation.trim().toLowerCase() ===
      project.projectCode.trim().toLowerCase() &&
    confirmation.confirmationAccepted;

  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-[#020B16]/80 px-4 py-6">
      <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-lg border border-[#7F1D1D] bg-[#061B2F] shadow-2xl">
        <div className="border-b border-[#123A5A] px-5 py-4">
          <div className="flex items-start gap-3">
            <span className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#EF4444]/50 bg-[#450A0A] text-[#FCA5A5]">
              <LockKeyhole className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-xl font-bold">Tutup Project Secara Permanen</h2>
              <p className="mt-1 text-sm text-[#94A3B8]">
                Wizard Close Project wajib diselesaikan berurutan.
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-2 text-xs font-bold uppercase md:grid-cols-3">
            {["1. Project Validation", "2. Summary & Impact", "3. Confirmation"].map((label, index) => (
              <div
                className={[
                  "rounded-md border px-3 py-2",
                  step === index + 1
                    ? "border-[#0F7BFF] bg-[#0F7BFF]/15 text-[#7DD3FC]"
                    : "border-[#123A5A] bg-[#08233B] text-[#94A3B8]",
                ].join(" ")}
                key={label}
              >
                {label}
              </div>
            ))}
          </div>
        </div>

        <div className="min-h-0 overflow-y-auto px-5 py-4">
          {step === 1 ? (
            <div className="space-y-4">
              <div className="rounded-md border border-[#123A5A] bg-[#08233B] p-4">
                <p className="text-sm font-semibold text-[#F8FAFC]">{project.projectName}</p>
                <p className="mt-1 text-sm text-[#94A3B8]">{project.projectCode}</p>
              </div>
              {validationError ? (
                <div className="rounded-md border border-[#EF4444]/50 bg-[#450A0A] p-4 text-sm text-[#FCA5A5]">
                  <p className="font-bold">Project tidak dapat ditutup.</p>
                  {validationError === "Masih terdapat Document yang belum menyelesaikan Workflow." ? (
                    <>
                      <p className="mt-2">Masih terdapat Document yang belum menyelesaikan Workflow.</p>
                      <p className="mt-2">
                        Selesaikan seluruh Workflow Document terlebih dahulu sebelum menutup Project.
                      </p>
                    </>
                  ) : (
                    <p className="mt-2 whitespace-pre-line">{validationError}</p>
                  )}
                </div>
              ) : (
                <div className="rounded-md border border-[#22C55E]/40 bg-[#052E16] p-4 text-sm text-[#86EFAC]">
                  Validasi Project berhasil. Project dapat dilanjutkan ke ringkasan dampak.
                </div>
              )}
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-5">
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  ["Total Document", summary.totalDocument],
                  ["Approved Document", summary.approvedDocument],
                  ["Archived Document", summary.archivedDocument],
                  ["Active Workflow Document", summary.activeWorkflowDocument],
                ].map(([label, value]) => (
                  <div className="rounded-md border border-[#123A5A] bg-[#08233B] p-3" key={label}>
                    <p className="text-xs font-semibold uppercase text-[#94A3B8]">{label}</p>
                    <p className="mt-2 text-2xl font-bold text-[#F8FAFC]">{value}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-md border border-[#123A5A] bg-[#08233B] p-4 text-sm text-[#CBD5E1]">
                <p>
                  {summary.approvedDocument > 0
                    ? `${summary.approvedDocument} Approved Document akan di-Archive secara otomatis.`
                    : "Tidak ada Approved Document yang perlu di-Archive."}
                </p>
                <p className="mt-2">
                  {summary.archivedDocument > 0
                    ? `${summary.archivedDocument} Archived Document tetap Archived.`
                    : "Tidak ada Document Archived pada Project ini."}
                </p>
              </div>
              <div className="rounded-md border border-[#FACC15]/40 bg-[#422006] p-4 text-sm text-[#FDE68A]">
                <p>Project akan berubah menjadi Closed secara permanen.</p>
                <p>Project tidak dapat menjadi Active Project kembali.</p>
                <p>Archived Document tidak dapat di-Restore setelah Project Closed.</p>
                <p>Seluruh histori tetap dipertahankan.</p>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-5">
              <div className="rounded-md border border-[#EF4444]/50 bg-[#450A0A] p-4 text-sm text-[#FCA5A5]">
                <p className="font-bold">Anda akan menutup Project ini secara permanen.</p>
                <p className="mt-3">Nama Project: {project.projectName}</p>
                <p>Kode Project: {project.projectCode}</p>
                <ul className="mt-3 list-disc space-y-1 pl-5">
                  <li>Project berubah menjadi Closed secara permanen.</li>
                  <li>Project hilang dari Active Project Selector.</li>
                  <li>Dashboard Project tidak lagi dapat diakses.</li>
                  <li>Seluruh aktivitas operasional berhenti.</li>
                  <li>Approved Document akan di-Archive otomatis.</li>
                  <li>Archived Document tetap Archived.</li>
                  <li>Archived Document tidak dapat di-Restore.</li>
                  <li>Project tidak dapat dibuka kembali.</li>
                </ul>
                <p className="mt-3">
                  Apabila Project masih akan digunakan di masa mendatang gunakan Deactivate, bukan Close Project.
                </p>
              </div>
              <label className="flex flex-col gap-2 text-sm font-medium text-[#CBD5E1]">
                <span>Masukkan Project Code</span>
                <input
                  className={controlClassName}
                  name="projectCodeConfirmation"
                  onChange={onChange}
                  placeholder={project.projectCode}
                  value={confirmation.projectCodeConfirmation}
                />
                <FieldError message={errors.projectCodeConfirmation} />
              </label>
              <label className="flex items-start gap-3 text-sm font-medium text-[#CBD5E1]">
                <input
                  checked={confirmation.confirmationAccepted}
                  className="mt-1 h-4 w-4 accent-[#EF4444]"
                  name="confirmationAccepted"
                  onChange={onChange}
                  type="checkbox"
                />
                <span>Saya memahami bahwa Project yang sudah Closed tidak dapat dibuka kembali.</span>
              </label>
              <FieldError message={errors.confirmationAccepted} />
            </div>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-[#123A5A] px-5 py-4 sm:flex-row sm:justify-end">
          <button className={actionButtonClassName} disabled={submitting} onClick={onCancel} type="button">
            Cancel
          </button>
          {step > 1 ? (
            <button className={actionButtonClassName} disabled={submitting} onClick={onPrevious} type="button">
              Previous
            </button>
          ) : null}
          {step < 3 ? (
            <button
              className={primaryButtonClassName}
              disabled={submitting || Boolean(validationError) || !summary}
              onClick={onNext}
              type="button"
            >
              Continue
            </button>
          ) : (
            <button
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#DC2626] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#B91C1C] disabled:cursor-not-allowed disabled:bg-[#123A5A] disabled:text-[#94A3B8]"
              disabled={!canConfirm}
              onClick={onCloseProject}
              type="button"
            >
              <Ban className="h-4 w-4" />
              {submitting ? "Menutup Project..." : "Tutup Project Secara Permanen"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const ProjectManagementPage = () => {
  const navigate = useNavigate();
  const [closeConfirmation, setCloseConfirmation] = useState({
    confirmationAccepted: false,
    projectCodeConfirmation: "",
  });
  const [closeErrors, setCloseErrors] = useState({});
  const [closeStep, setCloseStep] = useState(1);
  const [closeSummary, setCloseSummary] = useState(null);
  const [closeTarget, setCloseTarget] = useState(null);
  const [closeValidationError, setCloseValidationError] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [formMode, setFormMode] = useState(null);
  const [formState, setFormState] = useState(initialForm);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchValue, setSearchValue] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [viewProject, setViewProject] = useState(null);
  const [sortValue, setSortValue] = useState("createdDate-desc");
  const [statusFilter, setStatusFilter] = useState("");
  const [statusTarget, setStatusTarget] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();
  const { setProjectContext, setProjectContextError } = useProjectContextStore();

  const {
    data: allProjects = [],
    error: loadError,
    isLoading,
    refetch: refetchProjects,
  } = useQuery({
    queryFn: ProjectService.getProjects,
    queryKey: ["project-management", "projects"],
  });
  const errorMessage = loadError ? getErrorMessage(loadError) : "";
  const sortOption = sortOptions.find((option) => option.value === sortValue) ?? sortOptions[0];
  const queryResult = useMemo(
    () =>
      ProjectService.queryProjects(allProjects, {
        direction: sortOption.direction,
        page: pageNumber,
        pageSize,
        search: searchValue,
        sortBy: sortOption.sortBy,
        status: statusFilter,
      }),
    [
      allProjects,
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
      active: allProjects.filter((project) => project.status === PROJECT_STATUS.ACTIVE).length,
      closed: allProjects.filter((project) => project.status === PROJECT_STATUS.CLOSED).length,
      inactive: allProjects.filter((project) => project.status === PROJECT_STATUS.INACTIVE).length,
      total: allProjects.length,
    }),
    [allProjects],
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
    setSelectedProject(null);
  };

  const openCreateForm = () => {
    setFormMode("create");
    setFormErrors({});
    setSelectedProject(null);
    setFormState(initialForm);
  };

  const openEditForm = (project) => {
    setFormMode("edit");
    setFormErrors({});
    setSelectedProject(project);
    setFormState(getEditForm(project));
  };

  const closeCloseWizard = () => {
    setCloseConfirmation({
      confirmationAccepted: false,
      projectCodeConfirmation: "",
    });
    setCloseErrors({});
    setCloseStep(1);
    setCloseSummary(null);
    setCloseTarget(null);
    setCloseValidationError("");
  };

  const openCloseWizard = async (project) => {
    setCloseTarget(project);
    setCloseStep(1);
    setCloseErrors({});
    setCloseConfirmation({
      confirmationAccepted: false,
      projectCodeConfirmation: "",
    });
    setCloseValidationError("");

    try {
      setIsSubmitting(true);
      const summary = await ProjectService.validateProjectClose(project.id);
      setCloseSummary(summary);
    } catch (error) {
      setCloseSummary(null);
      setCloseValidationError(getErrorMessage(error));
      showToast({
        message: getErrorMessage(error),
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseConfirmationChange = (event) => {
    const { checked, name, type, value } = event.target;
    setCloseConfirmation((currentConfirmation) => ({
      ...currentConfirmation,
      [name]: type === "checkbox" ? checked : value,
    }));
    setCloseErrors((currentErrors) => ({
      ...currentErrors,
      [name]: null,
    }));
  };

  const handleCloseProject = async () => {
    if (!closeTarget || !closeSummary) return;
    setIsSubmitting(true);
    setCloseErrors({});

    try {
      const result = await ProjectService.closeProject({
        confirmationAccepted: closeConfirmation.confirmationAccepted,
        projectCodeConfirmation: closeConfirmation.projectCodeConfirmation,
        projectId: closeTarget.id,
        projectStatusSnapshot: closeSummary.validation.projectStatus,
      });
      const currentUser = AuthService.getCurrentUser();
      const nextContext = await ProjectService.resolveProjectContextAfterClosure(currentUser);
      setProjectContext(nextContext);
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["audit-trail"] });
      queryClient.invalidateQueries({ queryKey: ["sla-monitoring"] });
      queryClient.invalidateQueries({ queryKey: ["escalation"] });
      showToast({
        message: `Project closed. ${result.autoArchivedDocumentCount} Approved Document di-Archive otomatis.`,
        variant: "success",
      });
      closeCloseWizard();
      await refetchProjects();
      navigate(nextContext.accessibleProjects.length > 0 ? "/select-project" : "/dashboard");
    } catch (error) {
      setCloseErrors(getErrorMap(error));
      showToast({
        message: getErrorMessage(error),
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
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
        await ProjectService.createProject(formState);
        showToast({
          message: "Project created successfully.",
          variant: "success",
        });
      } else if (formMode === "edit" && selectedProject) {
        await ProjectService.updateProject(selectedProject.id, formState);
        showToast({
          message: "Project updated successfully.",
          variant: "success",
        });
      }

      closeForm();
      await refetchProjects();
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
      if (statusTarget.status === PROJECT_STATUS.INACTIVE) {
        await ProjectService.activateProject(statusTarget.id);
        showToast({
          message: "Project activated successfully.",
          variant: "success",
        });
      } else {
        await ProjectService.deactivateProject(statusTarget.id);
        showToast({
          message: "Project deactivated successfully.",
          variant: "success",
        });
      }

      setStatusTarget(null);
      await refetchProjects();
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
          <h1 className="mt-2 text-3xl font-bold">Project Management</h1>
          <p className="mt-2 max-w-3xl text-sm text-[#CBD5E1]">
            Kelola Project Master Data dan lifecycle Active / Inactive / Closed untuk Multi Project EDMS.
          </p>
        </div>
        <button
          className={primaryButtonClassName}
          disabled={isLoading}
          onClick={openCreateForm}
          type="button"
        >
          <Plus className="h-4 w-4" />
          Create Project
        </button>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <SummaryCard icon={FolderKanban} label="Total Projects" value={summary.total} />
        <SummaryCard icon={CheckCircle2} label="Active Projects" value={summary.active} />
        <SummaryCard icon={XCircle} label="Inactive Projects" value={summary.inactive} />
        <SummaryCard icon={AlertTriangle} label="Closed Projects" value={summary.closed} />
      </section>

      <section className="overflow-hidden rounded-lg border border-[#123A5A] bg-[#061B2F]">
        <div className="flex flex-col gap-4 border-b border-[#123A5A] px-4 py-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-xl font-bold">Project List</h2>
            <p className="mt-1 text-sm text-[#94A3B8]">
              Daftar Project Master Data yang digunakan oleh Project Context.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1fr)_150px_150px_96px]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
              <input
                className={[controlClassName, "w-full pl-9"].join(" ")}
                onChange={handleFilterChange(setSearchValue)}
                placeholder="Search projects..."
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
              {PROJECT_STATUS_OPTIONS.map((status) => (
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
                onClick={() => refetchProjects()}
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
                <th className="sticky top-0 z-20 min-w-40 bg-[#08233B] px-4 py-3 font-bold">Project Code</th>
                <th className="sticky top-0 z-20 min-w-64 bg-[#08233B] px-4 py-3 font-bold">Project Name</th>
                <th className="sticky top-0 z-20 min-w-80 bg-[#08233B] px-4 py-3 font-bold">Description</th>
                <th className="sticky top-0 z-20 min-w-32 bg-[#08233B] px-4 py-3 font-bold">Status</th>
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
                    Loading Project Management...
                  </td>
                </tr>
              ) : null}

              {!isLoading && rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-[#94A3B8]" colSpan={7}>
                    Tidak ada project yang sesuai dengan search atau filter.
                  </td>
                </tr>
              ) : null}

              {!isLoading
                ? rows.map((project, rowIndex) => (
                    <tr
                      className="group border-t border-[#123A5A] text-[#F8FAFC] transition-colors hover:bg-[#08233B]"
                      key={project.id}
                    >
                      <td className="px-4 py-3 text-[#CBD5E1]">
                        {startIndex + rowIndex + 1}
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#00C8FF]">
                        {project.projectCode}
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#F8FAFC]">
                        {project.projectName}
                      </td>
                      <td className="max-w-md px-4 py-3 text-[#CBD5E1]">
                        <span className="line-clamp-2">
                          {project.description || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          className={
                            statusStyles[project.status] ??
                            "border-[#123A5A] bg-[#08233B] text-[#CBD5E1]"
                          }
                        >
                          {project.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-[#CBD5E1]">
                        {formatDateTime(project.createdDate)}
                      </td>
                      <td className="sticky right-0 z-10 bg-[#061B2F] px-4 py-3 shadow-[-8px_0_16px_rgba(2,11,22,0.28)] transition-colors group-hover:bg-[#08233B]">
                        <div className="flex flex-wrap gap-2">
                          <button
                            className={actionButtonClassName}
                            onClick={() => setViewProject(project)}
                            type="button"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </button>
                          {project.status !== PROJECT_STATUS.CLOSED ? (
                            <button
                              className={actionButtonClassName}
                              onClick={() => openEditForm(project)}
                              type="button"
                            >
                              <Edit3 className="h-4 w-4" />
                              Edit
                            </button>
                          ) : null}
                          {project.status !== PROJECT_STATUS.CLOSED ? (
                            <button
                              className={[
                                actionButtonClassName,
                                project.status === PROJECT_STATUS.INACTIVE
                                  ? "hover:border-[#22C55E] hover:text-[#86EFAC]"
                                  : "hover:border-[#EF4444] hover:text-[#FCA5A5]",
                              ].join(" ")}
                              onClick={() => setStatusTarget(project)}
                              type="button"
                            >
                              {project.status === PROJECT_STATUS.INACTIVE ? (
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
                          ) : null}
                          {project.status === PROJECT_STATUS.ACTIVE ? (
                            <button
                              className={[
                                actionButtonClassName,
                                "border-[#7F1D1D] bg-[#450A0A] text-[#FCA5A5] hover:border-[#EF4444] hover:bg-[#7F1D1D] hover:text-white",
                              ].join(" ")}
                              onClick={() => openCloseWizard(project)}
                              type="button"
                            >
                              <Ban className="h-4 w-4" />
                              Close Project
                            </button>
                          ) : null}
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
            Page {pagination.page} of {pagination.totalPages} - {pagination.totalItems} projects
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

      {viewProject ? (
        <ProjectViewModal
          onClose={() => setViewProject(null)}
          project={viewProject}
        />
      ) : null}

      {formMode ? (
        <ProjectFormModal
          errors={formErrors}
          form={formState}
          mode={formMode}
          onChange={handleFormChange}
          onClose={closeForm}
          onSubmit={handleFormSubmit}
          submitting={isSubmitting}
        />
      ) : null}

      {statusTarget ? (
        <StatusConfirmationModal
          onCancel={() => setStatusTarget(null)}
          onConfirm={handleStatusConfirm}
          project={statusTarget}
          submitting={isSubmitting}
        />
      ) : null}

      {closeTarget ? (
        <CloseProjectWizard
          confirmation={closeConfirmation}
          errors={closeErrors}
          onCancel={closeCloseWizard}
          onChange={handleCloseConfirmationChange}
          onCloseProject={handleCloseProject}
          onNext={() => setCloseStep((currentStep) => Math.min(3, currentStep + 1))}
          onPrevious={() => setCloseStep((currentStep) => Math.max(1, currentStep - 1))}
          project={closeTarget}
          step={closeStep}
          submitting={isSubmitting}
          summary={closeSummary}
          validationError={closeValidationError}
        />
      ) : null}
    </>
  );
};

export default ProjectManagementPage;
