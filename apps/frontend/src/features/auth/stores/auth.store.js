import { create } from "zustand";

export const CURRENT_USER_STORAGE_KEY = "edms.currentUser";
export const AUTH_CONTEXT_STORAGE_KEY = "edms.authContext";
export const CURRENT_USER_CHANGED_EVENT = "edms.current-user.changed";

const canUseStorage = () =>
  typeof window !== "undefined" && Boolean(window.localStorage);

const readJsonStorage = (key, fallbackValue) => {
  if (!canUseStorage()) return fallbackValue;

  const storedValue = window.localStorage.getItem(key);
  if (!storedValue) return fallbackValue;

  try {
    return JSON.parse(storedValue);
  } catch {
    window.localStorage.removeItem(key);
    return fallbackValue;
  }
};

const writeJsonStorage = (key, value) => {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
};

const removeStorage = (key) => {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(key);
};

const notifyCurrentUserChanged = (currentUser) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(CURRENT_USER_CHANGED_EVENT, { detail: currentUser }),
  );
};

const storedAuthContext = readJsonStorage(AUTH_CONTEXT_STORAGE_KEY, {});
const storedCurrentUser = readJsonStorage(CURRENT_USER_STORAGE_KEY, null);

export const initialAuthState = {
  activeProject: storedAuthContext.activeProject ?? null,
  authenticated: Boolean(storedCurrentUser),
  error: null,
  loading: false,
  officialRole: storedAuthContext.officialRole ?? null,
  permissions: storedAuthContext.permissions ?? [],
  role: storedAuthContext.role ?? null,
  user: storedCurrentUser,
};

export const useAuthStore = create((set) => ({
  ...initialAuthState,
  clearAuth: () => {
    removeStorage(CURRENT_USER_STORAGE_KEY);
    removeStorage(AUTH_CONTEXT_STORAGE_KEY);
    notifyCurrentUserChanged(null);
    set({
      activeProject: null,
      authenticated: false,
      error: null,
      loading: false,
      officialRole: null,
      permissions: [],
      role: null,
      user: null,
    });
  },
  setAuthContext: ({
    activeProject = null,
    officialRole = null,
    permissions = [],
    role = null,
    user = null,
  } = {}) => {
    const nextState = {
      activeProject,
      authenticated: Boolean(user),
      error: null,
      loading: false,
      officialRole,
      permissions: Array.isArray(permissions) ? permissions : [],
      role,
      user,
    };

    if (user) {
      writeJsonStorage(CURRENT_USER_STORAGE_KEY, user);
      writeJsonStorage(AUTH_CONTEXT_STORAGE_KEY, {
        activeProject,
        officialRole,
        permissions: nextState.permissions,
        role,
      });
    } else {
      removeStorage(CURRENT_USER_STORAGE_KEY);
      removeStorage(AUTH_CONTEXT_STORAGE_KEY);
    }

    notifyCurrentUserChanged(user);
    set(nextState);
  },
  setAuthError: (error) => set({ error, loading: false }),
  setAuthLoading: (loading) => set({ loading }),
}));

export const getAuthState = () => useAuthStore.getState();

export default useAuthStore;
