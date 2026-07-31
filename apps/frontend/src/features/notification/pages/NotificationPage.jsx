import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, X } from "lucide-react";

import { useToast } from "@/shared/components/toast";
import { useProjectContextStore } from "@/shared/stores/project-context.store";

import NotificationDetailModal from "../components/NotificationDetailModal";
import NotificationSummary from "../components/NotificationSummary";
import NotificationTable from "../components/NotificationTable";
import useNotificationPage from "../hooks/useNotificationPage";
import { NotificationService } from "../services/notification.service";

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

const DeleteNotificationConfirmationModal = ({
  isDeleting,
  onCancel,
  onConfirm,
  selectedCount,
}) => (
  <div className="fixed inset-0 z-[9000] flex items-center justify-center bg-[#020B16]/80 px-4 py-6">
    <section
      aria-labelledby="delete-notification-title"
      aria-modal="true"
      className="w-full max-w-lg overflow-hidden rounded-lg border border-[#123A5A] bg-[#061B2F] shadow-2xl"
      role="dialog"
    >
      <header className="flex items-start justify-between gap-4 border-b border-[#123A5A] px-5 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#EF4444]">
            Delete
          </p>
          <h2 className="mt-2 text-2xl font-bold" id="delete-notification-title">
            Hapus Notification
          </h2>
        </div>
        <button
          aria-label="Tutup konfirmasi hapus Notification"
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
          Notification yang dipilih akan dihapus dari daftar Notification Anda.
        </p>
        <p>
          Tindakan ini tidak menghapus Document, Workflow maupun Audit Trail.
        </p>
        <p className="font-semibold text-[#F8FAFC]">
          {selectedCount} Notification dipilih.
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
          {isDeleting ? "Menghapus..." : "Hapus Notification"}
        </button>
      </footer>
    </section>
  </div>
);

export const NotificationPage = () => {
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [openingNotificationId, setOpeningNotificationId] = useState(null);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const setProjectContext = useProjectContextStore((state) => state.setProjectContext);
  const tableState = useNotificationPage({
    onError: (error) => {
      showToast({
        message: getErrorMessage(error, "Aksi notifikasi gagal diproses."),
        variant: "error",
      });
    },
  });
  const hasActiveFilter = Boolean(
    tableState.searchValue.trim() ||
      tableState.readStatusFilter ||
      tableState.eventTypeFilter,
  );
  const shouldShowDeleteConfirmation =
    isDeleteConfirmationOpen && tableState.selectedCount > 0;

  const handleViewDetail = async (notification) => {
    setSelectedNotification(notification);

    if (!notification.read) {
      try {
        const updatedNotification = await tableState.markAsRead(notification.id);
        setSelectedNotification(updatedNotification);
      } catch (error) {
        showToast({
          message: getErrorMessage(error, "Status baca notifikasi gagal disimpan."),
          variant: "error",
        });
      }
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await tableState.markAsRead(notificationId);
      showToast({
        message: "Notifikasi ditandai sudah dibaca.",
        variant: "success",
      });
    } catch (error) {
      showToast({
        message: getErrorMessage(error, "Status baca notifikasi gagal disimpan."),
        variant: "error",
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await tableState.markAllAsRead();
      showToast({
        message: "Semua notifikasi sudah dibaca.",
        variant: "success",
      });
    } catch (error) {
      showToast({
        message: getErrorMessage(error, "Notifikasi gagal ditandai sudah dibaca."),
        variant: "error",
      });
    }
  };

  const handleBulkMarkAsRead = async () => {
    try {
      await tableState.markSelectedAsRead();
      showToast({
        message: "Notification terpilih ditandai sudah dibaca.",
        variant: "success",
      });
    } catch (error) {
      showToast({
        message: getErrorMessage(error, "Notifikasi gagal ditandai sudah dibaca."),
        variant: "error",
      });
    }
  };

  const handleBulkDeleteRequest = () => {
    if (tableState.selectedCount === 0) return;
    setIsDeleteConfirmationOpen(true);
  };

  const handleBulkDeleteCancel = () => {
    if (tableState.isBulkDeletePending) return;
    setIsDeleteConfirmationOpen(false);
  };

  const handleBulkDeleteConfirm = async () => {
    try {
      const result = await tableState.deleteSelectedNotifications();
      setIsDeleteConfirmationOpen(false);
      showToast({
        message: result.deletedCount > 1
          ? `${result.deletedCount} Notification berhasil dihapus.`
          : "Notification berhasil dihapus.",
        variant: "success",
      });
    } catch (error) {
      showToast({
        message: getErrorMessage(error, "Notifikasi gagal dihapus."),
        variant: "error",
      });
    }
  };

  const handleOpenTarget = async (notification) => {
    if (!notification || openingNotificationId) return;

    setOpeningNotificationId(notification.id);

    try {
      if (!notification.read) {
        await tableState.markAsRead(notification.id);
      }

      const target = await NotificationService.resolveDirectOpenTarget(notification);

      if (target.projectContext) {
        setProjectContext(target.projectContext);
      }

      setSelectedNotification(null);
      navigate(target.route);
    } catch (error) {
      showToast({
        message: getErrorMessage(
          error,
          "Dokumen tidak dapat dibuka dari Notification.",
        ),
        variant: error?.variant ?? "error",
      });
    } finally {
      setOpeningNotificationId(null);
    }
  };

  return (
    <>
      <header>
        {/* <p className="text-sm font-semibold uppercase tracking-wide text-[#0F7BFF]">
          NOTIFICATION
        </p> */}
        <h1 className="mt-2 text-3xl font-bold">Notifications</h1>
        <p className="mt-2 max-w-3xl text-sm text-[#CBD5E1]">
          Informasi tindakan yang memerlukan perhatian dari akun pengguna saat ini.
        </p>
      </header>

      <NotificationSummary summary={tableState.summary} />
      <NotificationTable
        {...tableState}
        hasActiveFilter={hasActiveFilter}
        onBulkDeleteRequest={handleBulkDeleteRequest}
        onBulkMarkAsRead={handleBulkMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onMarkAsRead={handleMarkAsRead}
        openingNotificationId={openingNotificationId}
        onOpenTarget={handleOpenTarget}
        onRetry={tableState.refetchNotifications}
        onViewDetail={handleViewDetail}
      />
      <NotificationDetailModal
        notification={selectedNotification}
        onClose={() => setSelectedNotification(null)}
        isOpening={openingNotificationId === selectedNotification?.id}
        onOpenTarget={handleOpenTarget}
      />
      {shouldShowDeleteConfirmation ? (
        <DeleteNotificationConfirmationModal
          isDeleting={tableState.isBulkDeletePending}
          onCancel={handleBulkDeleteCancel}
          onConfirm={handleBulkDeleteConfirm}
          selectedCount={tableState.selectedCount}
        />
      ) : null}
    </>
  );
};

export default NotificationPage;
