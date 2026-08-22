import { useEffect } from "react";

import realtimeEventDispatcher from "./realtime-event-dispatcher";

export const useRealtimeEvent = (listener) => {
  useEffect(() => realtimeEventDispatcher.subscribe(listener), [listener]);
};

export default useRealtimeEvent;
