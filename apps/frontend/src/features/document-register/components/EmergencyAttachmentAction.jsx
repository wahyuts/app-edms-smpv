import { useEffect, useRef, useState } from "react";
import { Paperclip } from "lucide-react";
import { env } from "@/app/config/env";
import { useProjectContextStore } from "@/shared/stores/project-context.store";
import { useToast } from "@/shared/components/toast";
import { DocumentApiService } from "../services/document-api.service";
import { ApprovalCommentModal } from "./DocumentActionModal";
import { canAddEmergencyAttachment } from "../utils/emergencyAttachmentEligibility";

export default function EmergencyAttachmentAction({ documentItem, disabled, Button, onComplete }) {
  const project = useProjectContextStore(state => state.activeProject);
  const role = useProjectContextStore(state => state.activeMembership?.officialRole);
  const { showToast } = useToast();
  const [document, setDocument] = useState(null);
  const [comment, setComment] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const alive = useRef(true);
  const pending = useRef(false);
  const draft = useRef(null);
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  const eligible = canAddEmergencyAttachment({ documentItem, project, role, flags: env });
  const isCurrent = () => {
    const state = useProjectContextStore.getState();
    return alive.current && state.activeProject?.id === project?.id && state.activeMembership?.officialRole === role;
  };
  const open = async () => {
    if (pending.current) return;
    pending.current = true; setBusy(true);
    try {
      const latest = await DocumentApiService.getDocumentById(documentItem.id);
      if (!isCurrent()) return;
      if (!canAddEmergencyAttachment({ documentItem: latest, project, role, flags: env })) throw new Error("Dokumen tidak lagi memenuhi syarat.");
      setDocument(latest); setComment(""); setAttachment(null); setError(""); draft.current = null;
    } catch (failure) { if (isCurrent()) showToast({ message: failure.message, variant: "error" }); }
    finally { pending.current = false; if (alive.current) setBusy(false); }
  };
  const submit = async () => {
    if (pending.current || !isCurrent()) return;
    if (!attachment?.file || attachment.errorMessage) {
      const message = "Workflow Attachment wajib diunggah sebelum Submit.";
      setError(message);
      showToast({ message, variant: "error" });
      return;
    }
    pending.current = true; setBusy(true); setError("");
    try {
      draft.current ??= { requestId: crypto.randomUUID(), projectId: project.id, comment,
        expectedActiveRevisionId: document.activeRevisionId, expectedWorkflowStatus: document.status, expectedSubmissionStage: document.revision };
      if (!draft.current.temporaryFileId) {
        const uploaded = await DocumentApiService.uploadEmergencyTemporaryFile(attachment.file);
        draft.current.temporaryFileId = uploaded.temporaryFileId;
      }
      if (!isCurrent()) return;
      await DocumentApiService.submitEmergencyAttachment(document.id, draft.current);
      if (!isCurrent()) return;
      setDocument(null); draft.current = null;
      showToast({ message: "Attachment berhasil ditambahkan.", variant: "success" });
      await onComplete?.();
    } catch (failure) { if (isCurrent()) setError(failure.message); }
    finally { pending.current = false; if (alive.current) setBusy(false); }
  };
  if (!eligible) return null;
  return <>
    <Button icon={Paperclip} label="Emergency Workflow Attachment" disabled={disabled || busy} isLoading={busy} onClick={open} />
    {document ? <ApprovalCommentModal title="Emergency Workflow Attachment" submitLabel="Submit"
      actionSummary="Add a workflow attachment." documentItem={document} comment={comment}
      isAttachmentRequired isSubmitting={busy} errorMessage={error}
      attachmentPreview={attachment?.preview} attachmentErrorMessage={attachment?.errorMessage}
      onCommentChange={value => { if (!draft.current && !pending.current) setComment(value); }}
      onAttachmentChange={value => {
        if (!draft.current && !pending.current) {
          setAttachment(value);
          if (value.file && !value.errorMessage) setError("");
        }
      }}
      onAttachmentRemove={() => { if (!draft.current && !pending.current) setAttachment(null); }}
      onCancel={() => { if (!pending.current) setDocument(null); }} onSubmit={submit} /> : null}
  </>;
}
