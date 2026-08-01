import { useEffect, useRef } from "react";

import { useEstimatedServerTimeClock } from "@/shared/hooks/useEstimatedServerTimeClock";

const SLA_DIAG_CLOCK_HEARTBEAT_INTERVAL_MS = 60 * 1000;
const isSlaDiagnosticsEnabled =
  import.meta.env.DEV || import.meta.env.VITE_ENABLE_SLA_DIAGNOSTICS === "true";

let slaRuntimeClockInstanceSequence = 0;

const createDiagnosticSnapshot = (payload) => JSON.parse(JSON.stringify(payload));

const logSlaClockDiagnostic = (payload) => {
  if (!isSlaDiagnosticsEnabled) return;

  console.info("[SLA_DIAG_CLOCK]", createDiagnosticSnapshot(payload));
};

export const useSlaRuntimeClock = () => {
  const {
    estimatedServerNow,
    isSynchronized,
    roundTripTimeMs,
    source,
    status,
  } = useEstimatedServerTimeClock();
  const clockDiagnosticRef = useRef({
    estimatedServerNow,
    isSynchronized,
    roundTripTimeMs,
    source,
    status,
  });

  useEffect(() => {
    clockDiagnosticRef.current = {
      estimatedServerNow,
      isSynchronized,
      roundTripTimeMs,
      source,
      status,
    };
  }, [
    estimatedServerNow,
    isSynchronized,
    roundTripTimeMs,
    source,
    status,
  ]);

  useEffect(() => {
    const instanceId = `sla-clock-${++slaRuntimeClockInstanceSequence}`;
    const mountedAt = performance.now();
    const initialDiagnostic = clockDiagnosticRef.current;

    logSlaClockDiagnostic({
      currentTimestamp: initialDiagnostic.estimatedServerNow,
      event: "mount",
      instanceId,
      isSynchronized: initialDiagnostic.isSynchronized,
      iso: initialDiagnostic.estimatedServerNow
        ? new Date(initialDiagnostic.estimatedServerNow).toISOString()
        : null,
      roundTripTimeMs: initialDiagnostic.roundTripTimeMs,
      source: initialDiagnostic.source,
      status: initialDiagnostic.status,
    });

    const intervalId = window.setInterval(() => {
      const currentDiagnostic = clockDiagnosticRef.current;

      logSlaClockDiagnostic({
        currentTimestamp: currentDiagnostic.estimatedServerNow,
        elapsedSeconds: Math.floor((performance.now() - mountedAt) / 1000),
        event: "heartbeat",
        instanceId,
        isSynchronized: currentDiagnostic.isSynchronized,
        iso: currentDiagnostic.estimatedServerNow
          ? new Date(currentDiagnostic.estimatedServerNow).toISOString()
          : null,
        roundTripTimeMs: currentDiagnostic.roundTripTimeMs,
        source: currentDiagnostic.source,
        status: currentDiagnostic.status,
      });
    }, SLA_DIAG_CLOCK_HEARTBEAT_INTERVAL_MS);

    return () => {
      const currentDiagnostic = clockDiagnosticRef.current;

      logSlaClockDiagnostic({
        currentTimestamp: currentDiagnostic.estimatedServerNow,
        event: "unmount",
        instanceId,
        isSynchronized: currentDiagnostic.isSynchronized,
        iso: currentDiagnostic.estimatedServerNow
          ? new Date(currentDiagnostic.estimatedServerNow).toISOString()
          : null,
        roundTripTimeMs: currentDiagnostic.roundTripTimeMs,
        source: currentDiagnostic.source,
        status: currentDiagnostic.status,
      });
      window.clearInterval(intervalId);
    };
  }, []);

  return estimatedServerNow;
};

export default useSlaRuntimeClock;
