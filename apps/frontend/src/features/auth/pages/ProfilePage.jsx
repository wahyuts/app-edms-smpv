import { Edit3 } from "lucide-react";
import { useEffect, useState } from "react";

import { AuthService } from "@/features/auth/services/auth.service";
import { useToast } from "@/shared/components/toast";
import { useProjectContextStore } from "@/shared/stores/project-context.store";

const controlClassName =
  "h-10 rounded-md border border-[#123A5A] bg-[#08233B] px-3 text-sm text-[#F8FAFC] outline-none transition-colors placeholder:text-[#64748B] focus:border-[#0F7BFF]";
const readOnlyControlClassName =
  "h-10 cursor-not-allowed rounded-md border border-[#123A5A] bg-[#031528] px-3 text-sm text-[#94A3B8] outline-none";
const actionButtonClassName =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md border border-[#123A5A] px-4 text-sm font-semibold text-[#CBD5E1] transition-colors hover:border-[#0F7BFF] hover:bg-[#0B2B47] hover:text-white disabled:cursor-not-allowed disabled:text-[#64748B]";
const primaryButtonClassName =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#0F7BFF] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0B63CC] disabled:cursor-not-allowed disabled:bg-[#123A5A] disabled:text-[#94A3B8]";

const NO_ACTIVE_PROJECT_OFFICIAL_ROLE = "No Official Role on Active Project";
const NO_ACTIVE_PROJECT_ACCESS = "No Project Access";

const getDisplayOfficialRole = ({ activeOfficialRole }) => {
  if (activeOfficialRole) {
    return activeOfficialRole;
  }

  return NO_ACTIVE_PROJECT_OFFICIAL_ROLE;
};

const getEditableOfficialRole = (displayOfficialRole) => {
  if (displayOfficialRole === NO_ACTIVE_PROJECT_OFFICIAL_ROLE) {
    return "";
  }

  return displayOfficialRole;
};

const getProfileForm = (currentUser, displayOfficialRole) => ({
  department: currentUser?.department ?? "",
  email: currentUser?.email ?? "",
  fullName: currentUser?.fullName ?? currentUser?.name ?? "",
  officialRole: getEditableOfficialRole(displayOfficialRole),
  status: currentUser?.status ?? (currentUser?.isActive ? "Active" : "Inactive"),
  username: currentUser?.username ?? "",
});

const getErrorMap = (errors = []) =>
  Object.fromEntries(
    errors.map((item) => [
      item.field === "name" ? "fullName" : item.field,
      item.message,
    ]),
  );

const FieldError = ({ message }) =>
  message ? <p className="text-xs font-medium text-[#FCA5A5]">{message}</p> : null;

const TextField = ({
  error,
  label,
  name,
  onChange,
  readOnly = false,
  type = "text",
  value,
}) => (
  <label className="flex flex-col gap-2 text-sm font-medium text-[#CBD5E1]">
    <span>{label}</span>
    <input
      className={readOnly ? readOnlyControlClassName : controlClassName}
      disabled={readOnly}
      name={name}
      onChange={onChange}
      readOnly={readOnly}
      type={type}
      value={value}
    />
    <FieldError message={error} />
  </label>
);

const EditProfileModal = ({
  errors,
  form,
  officialRole,
  onChange,
  onClose,
  onSubmit,
  submitting,
}) => (
  <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-[#020B16]/80 px-4 py-6">
    <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-[#123A5A] bg-[#061B2F] shadow-2xl">
      <div className="border-b border-[#123A5A] px-5 py-4">
        <h2 className="text-xl font-bold">Edit Profile</h2>
      </div>

      <form className="min-h-0 overflow-y-auto px-5 py-4" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <TextField
            error={errors.fullName}
            label="Full Name"
            name="fullName"
            onChange={onChange}
            value={form.fullName}
          />
          <TextField
            error={errors.email}
            label="Email"
            name="email"
            onChange={onChange}
            type="email"
            value={form.email}
          />
          <TextField
            label="Username"
            name="username"
            readOnly
            value={form.username}
          />
          <TextField
            label="Official Role"
            name="officialRole"
            readOnly
            value={officialRole}
          />
          <TextField
            label="Department"
            name="department"
            readOnly
            value={form.department}
          />
          <TextField
            label="Status"
            name="status"
            readOnly
            value={form.status}
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
            {submitting ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  </div>
);

const ProfilePage = () => {
  const [currentUser, setCurrentUser] = useState(() => AuthService.getCurrentUser());
  const [formErrors, setFormErrors] = useState({});
  const [formState, setFormState] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();
  const activeOfficialRole = useProjectContextStore(
    (state) => state.activeOfficialRole,
  );
  const activeProject = useProjectContextStore((state) => state.activeProject);
  const displayOfficialRole = getDisplayOfficialRole({
    activeOfficialRole,
  });
  const profileItems = [
    {
      label: "Full Name",
      value: currentUser?.fullName ?? "-",
    },
    {
      label: "Username",
      value: currentUser?.username ?? "-",
    },
    {
      label: "Email",
      value: currentUser?.email ?? "-",
    },
    {
      label: "Department",
      value: currentUser?.department ?? "-",
    },
    {
      label: "Official Role",
      value: displayOfficialRole,
    },
    {
      label: "Active Project",
      value: activeProject?.projectName ?? activeProject?.name ?? NO_ACTIVE_PROJECT_ACCESS,
    },
    {
      label: "Status",
      value: currentUser?.isActive ? "Active" : "Inactive",
    },
  ];

  useEffect(() => {
    return AuthService.subscribeCurrentUserChange(setCurrentUser);
  }, []);

  const openEditProfile = () => {
    setFormErrors({});
    setFormState(getProfileForm(currentUser, displayOfficialRole));
  };

  const closeEditProfile = () => {
    setFormErrors({});
    setFormState(null);
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

    const response = await AuthService.updateCurrentProfile({
      email: formState?.email,
      fullName: formState?.fullName,
    });

    if (response.success) {
      setCurrentUser(response.data.user);
      closeEditProfile();
      showToast({
        message: response.message,
        variant: "success",
      });
    } else {
      setFormErrors(getErrorMap(response.data?.errors));
      showToast({
        message: response.message,
        variant: "error",
      });
    }

    setIsSubmitting(false);
  };

  return (
    <>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#0F7BFF]">
            User Profile
          </p>
          <h1 className="mt-2 text-3xl font-bold">My Profile</h1>
          <p className="mt-2 text-sm text-[#CBD5E1]">
            Account information for the current logged-in user.
          </p>
        </div>
        <button
          className={primaryButtonClassName}
          onClick={openEditProfile}
          type="button"
        >
          <Edit3 className="h-4 w-4" />
          Edit Profile
        </button>
      </header>

      <div className="rounded-lg border border-[#123A5A] bg-[#061B2F] p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {profileItems.map((item) => (
            <div
              className="rounded-md border border-[#123A5A] bg-[#08233B] px-4 py-3"
              key={item.label}
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">
                {item.label}
              </p>
              <p className="mt-2 text-sm font-medium text-[#F8FAFC]">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {formState ? (
        <EditProfileModal
          errors={formErrors}
          form={formState}
          officialRole={getEditableOfficialRole(displayOfficialRole)}
          onChange={handleFormChange}
          onClose={closeEditProfile}
          onSubmit={handleFormSubmit}
          submitting={isSubmitting}
        />
      ) : null}
    </>
  );
};

export default ProfilePage;
