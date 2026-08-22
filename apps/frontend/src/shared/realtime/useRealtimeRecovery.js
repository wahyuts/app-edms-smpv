import { useEffect } from "react";

import realtimeEventDispatcher from "./realtime-event-dispatcher";

export const useRealtimeRecovery = (listener) => {
  useEffect(() => realtimeEventDispatcher.subscribeRecovery(listener), [listener]);
};

export default useRealtimeRecovery;
