import { useEffect, useState } from "react";

const SLA_RUNTIME_CLOCK_INTERVAL_MS = 1000;

export const useSlaRuntimeClock = () => {
  const [currentTimestamp, setCurrentTimestamp] = useState(() => Date.now());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTimestamp(Date.now());
    }, SLA_RUNTIME_CLOCK_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  return currentTimestamp;
};

export default useSlaRuntimeClock;
