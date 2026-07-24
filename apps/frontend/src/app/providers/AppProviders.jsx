import QueryProvider from "./QueryProvider";
import { ToastProvider } from "@/shared/components/toast";

const AppProviders = ({ children }) => {
  return (
    <ToastProvider>
      <QueryProvider>
        {children}
      </QueryProvider>
    </ToastProvider>
  );
};

export default AppProviders;
