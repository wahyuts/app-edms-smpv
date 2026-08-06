import { useEffect, useState } from "react";

import { ServerTimeService } from "@/shared/services/server-time.service";

const DEFAULT_TICK_INTERVAL_MS = 1000;

export const useEstimatedServerTimeClock = ({
  tickIntervalMs = DEFAULT_TICK_INTERVAL_MS,
} = {}) => {
  const [clockTick, setClockTick] = useState(0);
  const [timeSnapshot, setTimeSnapshot] = useState(() => ServerTimeService.getSnapshot());

  useEffect(() => {
    const unsubscribe = ServerTimeService.subscribe(() => {
      setTimeSnapshot(ServerTimeService.getSnapshot());
    });

    ServerTimeService.startAutoSynchronization();

    return () => {
      ServerTimeService.stopAutoSynchronization();
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const tickIntervalId = window.setInterval(() => {
      setClockTick((currentTick) => currentTick + 1);
    }, tickIntervalMs);

    return () => {
      window.clearInterval(tickIntervalId);
    };
  }, [tickIntervalMs]);

  return {
    ...timeSnapshot,
    estimatedServerNow: ServerTimeService.getServerNowEpoch(),
    tick: clockTick,
  };
};

export default useEstimatedServerTimeClock;
