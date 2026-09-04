import { create } from "zustand";

const initialState = {
  isCompleting: false,
  isRealtimeModalOpen: false,
};

export const useSessionTakeoverStore = create((set) => ({
  ...initialState,
  closeRealtimeModal: () => set({ isRealtimeModalOpen: false }),
  markCompleting: () => set({ isCompleting: true }),
  openRealtimeModal: () => set({ isRealtimeModalOpen: true }),
  resetSessionTakeoverState: () => set(initialState),
}));

export default useSessionTakeoverStore;
