import { X } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";

import { ToastContext } from "./toast.context";

const TOAST_DURATION = 4000;
const TOAST_EXIT_DURATION = 180;

const variantStyles = {
  success: "border-[#22C55E] bg-[#22C55E]/15 text-[#F8FAFC]",
  error: "border-[#EF4444] bg-[#EF4444]/15 text-[#F8FAFC]",
  warning: "border-[#F59E0B] bg-[#F59E0B]/15 text-[#F8FAFC]",
  info: "border-[#00C8FF] bg-[#00C8FF]/15 text-[#F8FAFC]",
};

const variantLabels = {
  success: "Success",
  error: "Error",
  warning: "Warning",
  info: "Info",
};

const ToastViewport = ({ onClose, toasts }) => {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed left-1/2 top-5 z-[10000] flex w-full -translate-x-1/2 flex-col items-center gap-3 px-4"
    >
      <style>
        {`
          @keyframes edmsToastFadeIn {
            from { opacity: 0; transform: translateY(-8px); }
            to { opacity: 1; transform: translateY(0); }
          }

          @keyframes edmsToastFadeOut {
            from { opacity: 1; transform: translateY(0); }
            to { opacity: 0; transform: translateY(-8px); }
          }
        `}
      </style>

      {toasts.map((toast) => (
        <div
          className={[
            "pointer-events-auto flex w-full max-w-md items-start justify-between gap-4 rounded-lg border px-4 py-3 text-sm shadow-lg backdrop-blur",
            variantStyles[toast.variant],
          ].join(" ")}
          key={toast.id}
          role="status"
          style={{
            animation: toast.isClosing
              ? `edmsToastFadeOut ${TOAST_EXIT_DURATION}ms ease-in forwards`
              : "edmsToastFadeIn 180ms ease-out",
          }}
        >
          <div>
            <p className="font-semibold">{toast.title ?? variantLabels[toast.variant]}</p>
            <p className="mt-1 whitespace-pre-line text-[#CBD5E1]">{toast.message}</p>
          </div>

          <button
            aria-label="Close notification"
            className="rounded-md p-1 text-[#CBD5E1] transition-colors hover:bg-[#0B2B47] hover:text-[#F8FAFC]"
            onClick={() => onClose(toast.id)}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const toastTimeouts = useRef(new Map());

  const removeToast = useCallback((toastId) => {
    const timeoutId = toastTimeouts.current.get(toastId);

    if (timeoutId) {
      window.clearTimeout(timeoutId);
      toastTimeouts.current.delete(toastId);
    }

    setToasts((currentToasts) =>
      currentToasts.map((toast) =>
        toast.id === toastId ? { ...toast, isClosing: true } : toast,
      ),
    );

    window.setTimeout(() => {
      setToasts((currentToasts) =>
        currentToasts.filter((toast) => toast.id !== toastId),
      );
    }, TOAST_EXIT_DURATION);
  }, []);

  const showToast = useCallback(
    ({ message, title, variant = "info" }) => {
      const toastId = crypto.randomUUID();
      const nextToast = {
        id: toastId,
        message,
        title,
        variant,
        isClosing: false,
      };

      setToasts((currentToasts) => [...currentToasts, nextToast]);

      const timeoutId = window.setTimeout(() => {
        removeToast(toastId);
      }, TOAST_DURATION);

      toastTimeouts.current.set(toastId, timeoutId);
    },
    [removeToast],
  );

  const toastValue = useMemo(
    () => ({
      showToast,
    }),
    [showToast],
  );

  return (
    <ToastContext.Provider value={toastValue}>
      {children}
      <ToastViewport onClose={removeToast} toasts={toasts} />
    </ToastContext.Provider>
  );
};

export default ToastProvider;
