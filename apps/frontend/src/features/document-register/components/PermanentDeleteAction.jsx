import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Loader2, RefreshCw, Trash2 } from "lucide-react";
import DocumentActionModal from "./DocumentActionModal";
import { useProjectContextStore } from "@/shared/stores/project-context.store";
import { useToast } from "@/shared/components/toast";
import { queryClient } from "@/shared/api/query-client";
import { synchronizeDocumentRuntimeQueries } from "../utils/documentRuntimeQuerySync";
import { PermanentDeleteService } from "../services/permanent-delete.service";
import { reconcilePermanentDelete } from "../utils/permanentDeleteReconciliation";

const secondary = "inline-flex h-9 items-center justify-center rounded-md border border-[#123A5A] px-4 text-sm font-semibold text-[#CBD5E1] transition-colors hover:border-[#0F7BFF] hover:bg-[#0B2B47] hover:text-white disabled:opacity-50";
const danger = "inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#EF4444] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#B91C1C] disabled:opacity-50";

export const DeleteDocumentModal = ({ documentItem, reason, onReasonChange, busy, result, error, onCancel, onConfirm, onRefresh }) => {
  const body = useRef(null);
  const cancel = useRef(onCancel);
  const titleId = useId();
  useEffect(() => { cancel.current = () => { if (!busy) onCancel(); }; }, [busy, onCancel]);
  useEffect(() => {
    const dialog = body.current.closest("section");
    const previous = document.activeElement;
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", titleId);
    dialog.tabIndex = -1;
    dialog.querySelector("h2").id = titleId;
    dialog.querySelector("[data-delete-cancel]")?.focus();
    const keyboard = (event) => {
      if (event.key === "Escape") { event.preventDefault(); cancel.current(); }
      if (event.key !== "Tab") return;
      const controls = [...dialog.querySelectorAll("button,textarea,[tabindex='0']")].filter((control) => !control.disabled);
      const first = controls[0]; const last = controls.at(-1);
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog)) { event.preventDefault(); first?.focus(); }
      if (!controls.length) event.preventDefault();
    };
    dialog.addEventListener("keydown", keyboard);
    return () => { dialog.removeEventListener("keydown", keyboard); if (previous?.isConnected) previous.focus(); };
  }, [titleId]);
  useEffect(() => { if (busy) body.current?.closest("section")?.focus(); }, [busy]);
  const blocked = ["PENDING", "UNKNOWN", "CONFLICT", "COMPLETED"].includes(result?.status);
  return (
    <DocumentActionModal title="Delete Document" onClose={onCancel} isCloseDisabled={busy} footer={<>
      <button className={secondary} data-delete-cancel disabled={busy} onClick={onCancel} type="button">Cancel</button>
      <button className={danger} disabled={busy || blocked} onClick={onConfirm} type="button">
        {busy ? <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" /> : <Trash2 aria-hidden="true" className="h-4 w-4" />}Delete
      </button>
    </>}>
      <div className="space-y-4" ref={body}>
        <div className="grid grid-cols-2 gap-3">
          {[['DOCUMENT NUMBER', documentItem.documentNumber], ['CURRENT STATUS', documentItem.status]].map(([label, value]) => (
            <div className="min-w-0 rounded-md bg-[#08233B] p-3" key={label}>
              <p className="text-xs font-semibold uppercase text-[#94A3B8]">{label}</p>
              <p className="mt-1 break-words text-sm font-semibold text-[#F8FAFC]">{value}</p>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-[#64748B]/40 bg-[#061B2F] p-4 text-sm leading-6 text-[#CBD5E1]">
          <p>This document will be <strong>PERMANENTLY</strong> removed from active operations.</p>
          <p className="mt-3 font-semibold text-[#F8FAFC]">Deleted documents:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Related document and attachments will be removed</li>
            <li>Delete activity can be seen in Audit Trail</li>
            <li>Cannot be viewed again</li><li>Cannot be downloaded</li><li>Cannot be restored</li>
          </ul>
        </div>
        <label className="block"><span className="text-xs font-semibold uppercase text-[#94A3B8]">REASON (OPTIONAL)</span>
          <textarea className="mt-2 min-h-24 w-full rounded-md border border-[#123A5A] bg-[#08233B] px-3 py-2 text-sm text-[#F8FAFC] outline-none placeholder:text-[#64748B] focus:border-[#0F7BFF]"
            disabled={busy} maxLength={1000} value={reason} onChange={(event) => onReasonChange(event.target.value)} placeholder="Add delete reason..." />
        </label>
        {result ? <div className="flex items-center justify-between gap-3 text-sm text-[#FACC15]" role="status">
          <p className="min-w-0 break-words">{result.message}</p>
          <button className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-[#123A5A] text-[#CBD5E1] disabled:opacity-50"
            aria-label="Periksa status penghapusan" title="Periksa status penghapusan" type="button" disabled={busy} onClick={onRefresh}><RefreshCw className="h-4 w-4" /></button>
        </div> : null}
        {error ? <p className="text-sm font-semibold text-[#FCA5A5]" role="alert">{error}</p> : null}
      </div>
    </DocumentActionModal>
  );
};

const DeleteActionState = ({ documentItem, disabled, onRunAction, onComplete, projectId, role }) => {
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const running = useRef(false);
  const identity = useRef(null);
  const generation = useRef(0);
  const mounted = useRef(true);
  const reconciliation = useRef(null);
  const completed = useRef(false);
  const submitted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; generation.current += 1; reconciliation.current?.abort(); };
  }, []);
  const cancel = useCallback(() => { if (!running.current) setOpen(false); }, []);
  const isCurrent = (scope, token) => {
    const current = useProjectContextStore.getState();
    return mounted.current && generation.current === token && current.activeProject?.id === scope && current.activeMembership?.officialRole === "Admin";
  };
  const run = async (refreshOnly = false) => {
    if (running.current || completed.current || disabled || role !== "Admin" || !projectId) return;
    const token = generation.current; const scope = projectId;
    if (!isCurrent(scope, token)) return;
    if (!refreshOnly && submitted.current) return;
    if (!refreshOnly && ["PENDING", "UNKNOWN", "CONFLICT", "COMPLETED"].includes(result?.status)) return;
    running.current = true; setBusy(true); setError("");
    const controller = new AbortController();
    reconciliation.current = controller;
    try {
      await onRunAction(async () => {
        let response;
        try {
          identity.current ||= crypto.randomUUID();
          if (!refreshOnly) submitted.current = true;
          response = await (refreshOnly ? PermanentDeleteService.status({ documentId: documentItem.id, projectId: scope, operationId: result?.operationId, signal: controller.signal, timeout: 5000 })
            : PermanentDeleteService.remove({ documentId: documentItem.id, projectId: scope, reason: reason.trim(), requestKey: identity.current }));
        } catch (failure) {
          if (!isCurrent(scope, token)) return;
          if ([401,403,404,422].includes(failure.status)) {
            if (!refreshOnly) submitted.current = false;
            setError(failure.message);
            if (refreshOnly && failure.status === 404) setResult({ status: "FAILED", message: "Permintaan penghapusan belum tercatat." });
            return;
          }
          response = { status: "UNKNOWN", operationId: result?.operationId, message: failure.message };
        }
        if (!isCurrent(scope, token)) return;
        if (!["COMPLETED", "FAILED"].includes(response.status)) {
          setResult(response);
          try {
            response = await reconcilePermanentDelete({
              status: PermanentDeleteService.status, documentId: documentItem.id, projectId: scope,
              operationId: response.operationId, signal: controller.signal, isCurrent: () => isCurrent(scope, token),
            });
          } catch (failure) {
            if (isCurrent(scope, token)) setError(failure.message);
            return;
          }
        }
        if (!response || !isCurrent(scope, token)) return;
        if (response.status !== "COMPLETED") {
          if (response.status === "FAILED") submitted.current = false;
          setResult(response); return;
        }
        if (completed.current) return;
        completed.current = true;
        setOpen(false);
        // Cache failures must not turn an acknowledged Delete into a retryable error.
        await Promise.allSettled([synchronizeDocumentRuntimeQueries({ refreshCurrentSurface: () => onComplete({ showLoading: true }) }),
          queryClient.invalidateQueries({ queryKey: ["notifications"] }), queryClient.invalidateQueries({ queryKey: ["audit-trail"] })]);
        if (useProjectContextStore.getState().activeProject?.id === scope) showToast({ message: "Dokumen berhasil dihapus permanen.", variant: "success" });
      });
    } finally {
      controller.abort();
      if (reconciliation.current === controller) reconciliation.current = null;
      running.current = false;
      if (isCurrent(scope, token)) setBusy(false);
    }
  };
  if (role !== "Admin") return null;
  return <>
    <button className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#123A5A] bg-[#0B1F38] text-[#EF4444] transition-colors hover:border-[#EF4444] hover:bg-[#450A0A] disabled:opacity-50"
      aria-label="Delete Document" title="Delete Document" type="button" disabled={disabled || busy} onClick={() => setOpen(true)}><Trash2 className="h-4 w-4" /></button>
    {open ? <DeleteDocumentModal documentItem={documentItem} reason={reason} onReasonChange={setReason} busy={busy} result={result} error={error}
      onCancel={cancel} onConfirm={() => run(false)} onRefresh={() => run(true)} /> : null}
  </>;
};

export const PermanentDeleteAction = (props) => {
  const projectId = useProjectContextStore((state) => state.activeProject?.id);
  const role = useProjectContextStore((state) => state.activeMembership?.officialRole);
  if (role !== "Admin" || !projectId || (props.documentItem.projectId && props.documentItem.projectId !== projectId)) return null;
  return <DeleteActionState {...props} projectId={projectId} role={role} key={`${projectId}:${role}:${props.documentItem.id}`} />;
};
