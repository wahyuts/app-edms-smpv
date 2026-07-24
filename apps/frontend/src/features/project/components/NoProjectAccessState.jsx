import { FolderX } from "lucide-react";

const NoProjectAccessState = () => (
  <section className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-6 py-10 text-center">
    <div className="max-w-md">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[#7F1D1D] bg-[#2A1118] text-[#FCA5A5]">
        <FolderX className="h-7 w-7" />
      </span>
      <h1 className="mt-5 text-2xl font-bold text-[#F8FAFC]">No Project Access</h1>
      <p className="mt-3 text-sm leading-6 text-[#CBD5E1]">
        Your account does not have an active Project Membership for an active Project.
      </p>
    </div>
  </section>
);

export default NoProjectAccessState;
