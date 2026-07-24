import { useEffect, useState } from "react";

import RouterProvider from "@/app/providers/RouterProvider";
import { AuthService } from "@/features/auth/services/auth.service";
import { DocumentService } from "@/features/document-register/services/document.service";
import { ProjectService } from "@/features/project/services/project.service";

const App = () => {
  const [initializationState, setInitializationState] = useState({
    error: null,
    isReady: false,
  });

  useEffect(() => {
    let isActive = true;

    Promise.all([
      AuthService.initialize(),
      ProjectService.initialize(),
      DocumentService.initialize(),
    ])
      .then(() => {
        if (isActive) setInitializationState({ error: null, isReady: true });
      })
      .catch((error) => {
        if (isActive) {
          setInitializationState({
            error: error instanceof Error ? error.message : "Application initialization failed.",
            isReady: false,
          });
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  if (initializationState.error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#031528] p-6 text-center text-[#F8FAFC]">
        <div>
          <h1 className="text-lg font-bold">Unable to load local document data</h1>
          <p className="mt-2 text-sm text-[#CBD5E1]">{initializationState.error}</p>
        </div>
      </main>
    );
  }

  if (!initializationState.isReady) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#031528] text-sm font-semibold text-[#CBD5E1]">
        Loading document data...
      </main>
    );
  }

  return <RouterProvider />;
};

export default App;
