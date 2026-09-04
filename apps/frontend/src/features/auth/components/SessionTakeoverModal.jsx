import { SessionTakeoverService } from "../services/session-takeover.service";
import { useSessionTakeoverStore } from "../stores/session-takeover.store";

const SESSION_TAKEOVER_MESSAGE =
  "Your account has been signed in on another device. You will be logged out automatically.";

const SessionTakeoverModal = () => {
  const isCompleting = useSessionTakeoverStore((state) => state.isCompleting);
  const isOpen = useSessionTakeoverStore((state) => state.isRealtimeModalOpen);

  if (!isOpen) return null;

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/70 px-4"
      role="dialog"
    >
      <div className="w-full max-w-md rounded-lg border border-[#123A5A] bg-[#061B2F] px-6 py-6 text-center shadow-2xl">
        <p className="text-base font-semibold text-[#F8FAFC]">
          Session Replaced
        </p>
        <p className="mt-3 text-sm leading-6 text-[#CBD5E1]">
          {SESSION_TAKEOVER_MESSAGE}
        </p>
        <div className="mt-6 flex justify-center">
          <button
            autoFocus
            className="inline-flex min-h-10 min-w-24 items-center justify-center rounded-lg bg-[#0F7BFF] px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#2563EB] focus:outline-none focus:ring-2 focus:ring-[#93C5FD] focus:ring-offset-2 focus:ring-offset-[#061B2F] disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isCompleting}
            onClick={() => SessionTakeoverService.completeSessionTakeover()}
            type="button"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionTakeoverModal;
