import { useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";

import { queryClient } from "@/shared/api/query-client";
import { useToast } from "@/shared/components/toast";
import { usePermission } from "@/shared/hooks/usePermission";
import { useProjectContextStore } from "@/shared/stores/project-context.store";

import { CreateDocumentModal } from "../components/DocumentActionModal";
import DocumentRegisterTable from "../components/DocumentRegisterTable";
import {
  DOCUMENT_REGISTER_PERMISSION,
  DRAWING_CONTEXT,
} from "../constants/document.constants";
import useDocumentRegisterTable from "../hooks/useDocumentRegisterTable";
import { DocumentApiService } from "../services/document-api.service";
import { getDrawingContextFromPathname } from "../utils/drawingContext";

const pageDescriptions = {
  [DRAWING_CONTEXT.PFD]:
    "Kelola seluruh Engineering Document berdasarkan Drawing PFD.",
  [DRAWING_CONTEXT.PID]:
    "Kelola seluruh Engineering Document berdasarkan Drawing P&ID.",
};

const DocumentRegisterPage = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { hasProjectPermission } = usePermission();
  const { showToast } = useToast();
  useProjectContextStore((state) => state.activeOfficialRole);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const drawingContext =
    getDrawingContextFromPathname(location.pathname) ?? DRAWING_CONTEXT.PFD;
  const directDocumentNumber = searchParams.get("documentNumber")?.trim() ?? "";
  const tableState = useDocumentRegisterTable({
    directSearchValue: directDocumentNumber,
    drawingContext,
    enableControls: true,
  });
  const canCreateDocument = hasProjectPermission(DOCUMENT_REGISTER_PERMISSION.CREATE);

  const tableStateWithUrlSearchSync = {
    ...tableState,
    setSearchValue: (nextSearchValue) => {
      tableState.setSearchValue(nextSearchValue);

      setSearchParams((currentSearchParams) => {
        const nextSearchParams = new URLSearchParams(currentSearchParams);
        const normalizedSearchValue = String(nextSearchValue ?? "").trim();

        if (normalizedSearchValue) {
          nextSearchParams.set("documentNumber", normalizedSearchValue);
        } else {
          nextSearchParams.delete("documentNumber");
        }

        return nextSearchParams;
      }, { replace: true });
    },
  };

  const handleCreateDocument = async (formValue) => {
    try {
      const temporaryUpload = await DocumentApiService.uploadTemporaryFile(formValue.file);

      await DocumentApiService.createDocument({
        area: formValue.area,
        daysUntilValidation: formValue.daysUntilValidation,
        description: formValue.description,
        documentNumber: formValue.documentNumber,
        drawing: formValue.drawing,
        temporaryFileId: temporaryUpload.temporaryFileId,
      });

      setIsCreateModalOpen(false);
      await queryClient.invalidateQueries({ queryKey: ["documents"] });
      showToast({
        message: "Document berhasil dibuat.",
        variant: "success",
      });
    } catch (error) {
      showToast({
        message:
          error instanceof Error
            ? error.message
            : "Upload file gagal. Document tidak disimpan.",
        variant: "error",
      });
      throw error;
    }
  };

  return (
    <>
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          {/* <p className="text-sm font-semibold uppercase tracking-wide text-[#0F7BFF]">
            APP Engineering
          </p> */}
          <h1 className="mt-2 text-3xl font-bold">Document Register</h1>
          <div className="mt-2">
            <h2 className="text-xl font-semibold">{drawingContext}</h2>
            <p className="mt-1 text-sm text-[#CBD5E1]">
              {pageDescriptions[drawingContext]}
            </p>
          </div>
        </div>
        {canCreateDocument ? (
          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#0F7BFF] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#0B63CC] focus:outline-none focus:ring-2 focus:ring-[#0F7BFF]/30"
            onClick={() => setIsCreateModalOpen(true)}
            type="button"
          >
            <Plus className="h-4 w-4" />
            Create Document
          </button>
        ) : null}
      </header>

      <DocumentRegisterTable {...tableStateWithUrlSearchSync} />
      {isCreateModalOpen ? (
        <CreateDocumentModal
          drawing={drawingContext}
          onCancel={() => setIsCreateModalOpen(false)}
          onValidationFailed={(message) =>
            showToast({
              message,
              variant: "warning",
            })
          }
          onSubmit={handleCreateDocument}
        />
      ) : null}
    </>
  );
};

export default DocumentRegisterPage;
