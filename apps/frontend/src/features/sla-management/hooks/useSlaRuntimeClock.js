import { useEstimatedServerTimeClock } from "@/shared/hooks/useEstimatedServerTimeClock";

export const useSlaRuntimeClock = () => {
  const {
    estimatedServerNow,
  } = useEstimatedServerTimeClock();

  return estimatedServerNow;
};

export default useSlaRuntimeClock;
