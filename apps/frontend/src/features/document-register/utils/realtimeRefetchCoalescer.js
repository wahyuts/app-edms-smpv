export const createRealtimeRefetchCoalescer = ({
  delayMs = 500,
  onFlush,
} = {}) => {
  let timerId = null;
  let latestContext = null;

  const cancel = () => {
    if (timerId) {
      globalThis.clearTimeout(timerId);
      timerId = null;
    }
    latestContext = null;
  };

  const flush = () => {
    const context = latestContext;
    timerId = null;
    latestContext = null;
    onFlush?.(context);
  };

  const schedule = (context = {}) => {
    latestContext = context;
    if (timerId) {
      globalThis.clearTimeout(timerId);
    }
    timerId = globalThis.setTimeout(flush, delayMs);
  };

  return {
    cancel,
    schedule,
  };
};

export default createRealtimeRefetchCoalescer;
