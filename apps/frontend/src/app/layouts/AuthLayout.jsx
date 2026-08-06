import { Outlet, useLocation } from "react-router-dom";

const AuthLayout = () => {
  const location = useLocation();
  const isWideRecoveryScreen =
    location.pathname === "/check-email" ||
    location.pathname.startsWith("/mock-email");

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#020B16] px-6 py-8 text-[#F8FAFC]">
      <section
        className={[
          "flex w-full flex-col items-center text-center",
          isWideRecoveryScreen ? "max-w-4xl" : "max-w-md",
        ].join(" ")}
      >
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#0F7BFF]">
            APP
          </p>
          <p className="text-[2rem] font-extrabold leading-none text-white">
            EDMS
          </p>
        </div>

        <div className="w-full rounded-lg border border-[#123A5A] bg-[#061B2F] p-6">
          <Outlet />
        </div>

        <footer className="mt-8 text-sm text-[#94A3B8]">
          <p>(c) 2026 APP Engineering EDMS</p>
          <p>Seluruh Hak Dilindungi</p>
        </footer>
      </section>
    </main>
  );
};

export default AuthLayout;
