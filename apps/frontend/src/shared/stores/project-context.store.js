import { create } from "zustand";

const initialState = {
  accessibleProjects: [],
  activeOfficialRole: null,
  activeMembership: null,
  activeProject: null,
  error: null,
  isInitialized: false,
  isLoading: false,
};

export const useProjectContextStore = create((set) => ({
  ...initialState,
  clearProjectContext: () => set({ ...initialState, isInitialized: true }),
  setProjectContext: ({
    accessibleProjects = [],
    activeMembership = null,
    activeProject = null,
  } = {}) => set({
    accessibleProjects,
    activeOfficialRole: activeMembership?.officialRole ?? null,
    activeMembership,
    activeProject,
    error: null,
    isInitialized: true,
    isLoading: false,
  }),
  setProjectContextError: (error) => set({
    error,
    isInitialized: true,
    isLoading: false,
  }),
  setProjectContextLoading: (isLoading) => set({ isLoading }),
}));

export const getActiveProjectId = () =>
  useProjectContextStore.getState().activeProject?.id ?? null;

export const getActiveProjectMembership = () =>
  useProjectContextStore.getState().activeMembership ?? null;

export const getActiveOfficialRole = () =>
  useProjectContextStore.getState().activeOfficialRole ?? null;

export default useProjectContextStore;
