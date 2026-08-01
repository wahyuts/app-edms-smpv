import { useEffect, useState } from "react";

const SLA_RUNTIME_CLOCK_INTERVAL_MS = 1000;
const SLA_DIAG_CLOCK_HEARTBEAT_INTERVAL_MS = 60 * 1000;
const isSlaDiagnosticsEnabled =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_SLA_DIAGNOSTICS === "true";

let slaRuntimeClockInstanceSequence = 0;

const logSlaClockDiagnostic = (payload) => {
  if (!isSlaDiagnosticsEnabled) return;

  console.info("[SLA_DIAG_CLOCK]", payload);
};

export const useSlaRuntimeClock = () => {
  const [currentTimestamp, setCurrentTimestamp] = useState(() => Date.now());

  useEffect(() => {
    const instanceId = `sla-clock-${++slaRuntimeClockInstanceSequence}`;
    let tickCount = 0;
    let lastLoggedAt = Date.now();

    logSlaClockDiagnostic({
      currentTimestamp: lastLoggedAt,
      event: "mount",
      instanceId,
      iso: new Date(lastLoggedAt).toISOString(),
      tickCount,
    });

    const intervalId = window.setInterval(() => {
      const nextTimestamp = Date.now();
      tickCount += 1;
      setCurrentTimestamp(nextTimestamp);

      if (nextTimestamp - lastLoggedAt >= SLA_DIAG_CLOCK_HEARTBEAT_INTERVAL_MS) {
        lastLoggedAt = nextTimestamp;
        logSlaClockDiagnostic({
          currentTimestamp: nextTimestamp,
          elapsedSeconds: tickCount,
          event: "heartbeat",
          instanceId,
          iso: new Date(nextTimestamp).toISOString(),
          tickCount,
        });
      }
    }, SLA_RUNTIME_CLOCK_INTERVAL_MS);

    return () => {
      logSlaClockDiagnostic({
        currentTimestamp: Date.now(),
        event: "unmount",
        instanceId,
        iso: new Date().toISOString(),
        tickCount,
      });
      window.clearInterval(intervalId);
    };
  }, []);

  return currentTimestamp;
};

export default useSlaRuntimeClock;
