import { useState } from "react";
import { Trash2, X } from "lucide-react";

import { useToast } from "@/shared/components/toast";

import AuditTrailDetailModal from "../components/AuditTrailDetailModal";
import AuditTrailSummary from "../components/AuditTrailSummary";
import AuditTrailTable from "../components/AuditTrailTable";
import useAuditTrailPage from "../hooks/useAuditTrailPage";

const getErrorMessage = (error, fallbackMessage) =>
  error?.message ?? fallbackMessage;

const modalButtonBaseClassName =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-70";
const secondaryButtonClassName = [
  modalButtonBaseClassName,
  "border border-[#123A5A] text-[#CBD5E1] hover:border-[#0F7BFF] hover:bg-[#0B2B47] hover:text-white",
].join(" ");
const dangerButtonClassName = [
  modalButtonBaseClassName,
  "border border-[#EF4444] bg-[#EF4444]/15 text-[#FCA5A5] hover:bg-[#EF4444] hover:text-white",
].join(" ");

const DeleteAuditTrailConfirmationModal = ({
  isDeleting,
  onCancel,
  onConfirm,
  selectedCount,
}) => (
  <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-[#020B16]/80 px-4 py-6">
    <section
      aria-labelledby="delete-audit-trail-title"
      aria-modal="true"
      className="w-full max-w-lg overflow-hidden rounded-lg border border-[#123A5A] bg-[#061B2F] shadow-2xl"
      role="dialog"
    >
      <header className="flex items-start justify-between gap-4 border-b border-[#123A5A] px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#EF4444]">
            Delete
          </p>
          <h2 className="mt-2 text-2xl font-bold" id="delete-audit-trail-title">
            Hapus Audit Trail
          </h2>
        </div>
        <button
          aria-label="Tutup konfirmasi hapus Audit Trail"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-[#123A5A] text-[#CBD5E1] transition-colors hover:border-[#0F7BFF] hover:bg-[#0B2B47] hover:text-white"
          disabled={isDeleting}
          onClick={onCancel}
          type="button"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="space-y-4 px-5 py-5 text-sm leading-6 text-[#CBD5E1]">
        <p>
          Audit Trail yang dipilih akan disembunyikan dari daftar Audit Trail.
        </p>
        <p>
          Tindakan ini hanya dapat dilakukan oleh Admin.
        </p>
        <p>
          Audit Trail tidak akan memengaruhi Document, Workflow, Notification maupun History.
        </p>
        <p className="font-semibold text-[#F8FAFC]">
          {selectedCount} Audit Trail dipilih.
        </p>
      </div>

      <footer className="flex flex-col gap-3 border-t border-[#123A5A] px-5 py-4 sm:flex-row sm:justify-end">
        <button
          className={secondaryButtonClassName}
          disabled={isDeleting}
          onClick={onCancel}
          type="button"
        >
          Batal
        </button>
        <button
          className={dangerButtonClassName}
          disabled={isDeleting}
          onClick={onConfirm}
          type="button"
        >
          <Trash2 className="h-4 w-4" />
          {isDeleting ? "Menyembunyikan..." : "Hapus Audit Trail"}
        </button>
      </footer>
    </section>
  </div>
);

export const AuditTrailPage = () => {
  const [selectedAuditRecord, setSelectedAuditRecord] = useState(null);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
  const { showToast } = useToast();
  const tableState = useAuditTrailPage();
  const shouldShowDeleteConfirmation =
    isDeleteConfirmationOpen && tableState.selectedCount > 0 && tableState.isAdmin;

  const handleBulkDeleteRequest = () => {
    if (!tableState.isAdmin || tableState.selectedCount === 0) return;
    setIsDeleteConfirmationOpen(true);
  };

  const handleBulkDeleteCancel = () => {
    if (tableState.isBulkDeletePending) return;
    setIsDeleteConfirmationOpen(false);
  };

  const handleBulkDeleteConfirm = async () => {
    try {
      const result = await tableState.softDeleteSelectedAuditTrails();
      setIsDeleteConfirmationOpen(false);
      showToast({
        message: result.deletedCount > 1
          ? `${result.deletedCount} Audit Trail berhasil disembunyikan.`
          : "Audit Trail berhasil disembunyikan.",
        variant: "success",
      });
    } catch (error) {
      showToast({
        message: getErrorMessage(error, "Audit Trail tidak dapat disembunyikan."),
        variant: "error",
      });
    }
  };

  return (
    <>
      <header>
        {/* <p className="text-sm font-semibold uppercase tracking-wide text-[#0F7BFF]">
          AUDIT TRAIL
        </p> */}
        <h1 className="mt-2 text-3xl font-bold">Audit Trail</h1>
        <p className="mt-2 max-w-3xl text-sm text-[#CBD5E1]">
          Riwayat read-only untuk seluruh Significant Activity yang dicatat oleh sistem.
        </p>
      </header>

      <AuditTrailSummary summary={tableState.summary} />
      <AuditTrailTable
        {...tableState}
        onBulkDeleteRequest={handleBulkDeleteRequest}
        onRetry={tableState.refetchActivity}
        onViewDetail={setSelectedAuditRecord}
      />
      <AuditTrailDetailModal
        auditRecord={selectedAuditRecord}
        onClose={() => setSelectedAuditRecord(null)}
      />
      {shouldShowDeleteConfirmation ? (
        <DeleteAuditTrailConfirmationModal
          isDeleting={tableState.isBulkDeletePending}
          onCancel={handleBulkDeleteCancel}
          onConfirm={handleBulkDeleteConfirm}
          selectedCount={tableState.selectedCount}
        />
      ) : null}
    </>
  );
};

export default AuditTrailPage;
