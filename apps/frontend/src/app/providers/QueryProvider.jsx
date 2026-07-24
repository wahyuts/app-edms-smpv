import { QueryClientProvider } from "@tanstack/react-query";

import { queryClient } from "@/shared/api/query-client";

const QueryProvider = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

export default QueryProvider;