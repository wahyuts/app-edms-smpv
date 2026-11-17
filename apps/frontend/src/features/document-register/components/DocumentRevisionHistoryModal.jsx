import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, CalendarClock, CircleHelp, Download, Eye, FileCheck, FileText, GitBranch, Loader2, RefreshCw, UserRound } from "lucide-react";
import SelectDropdown from "@/shared/components/form/SelectDropdown";
import { useDocumentRevisionHistory } from "../hooks/useDocumentRevisionHistory";
import { DocumentApiService } from "../services/document-api.service";
import DocumentActionModal from "./DocumentActionModal";
import { formatCommentDateTime } from "../utils/documentDateTime";
import PreviewCanvas from "./PreviewCanvas";
import SpreadsheetPreview from "./SpreadsheetPreview";

const secondary = "inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#123A5A] px-4 text-sm font-semibold text-[#CBD5E1] transition-colors hover:border-[#0F7BFF] hover:bg-[#0B2B47] disabled:opacity-50";
const iconButton = "inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#123A5A] bg-[#0B1F38] text-[#CBD5E1] hover:border-[#0F7BFF] hover:text-white disabled:opacity-50";
const labelClass = "text-xs font-semibold uppercase text-[#94A3B8]";
const valueClass = "mt-1 break-words text-sm font-semibold text-[#F8FAFC] [overflow-wrap:anywhere]";
const stages = ["All", "IFR-Submitted", "IFA-Submitted", "As-Built"];
const unknownExplanation = "Historical upload stage could not be verified.";
const uploaderExplanation = "Informasi Pengunggah\n\nIdentitas pengguna tidak dapat diverifikasi dari data historis yang tersedia.";
const unknownUploadExplanation = "Informasi Pengunggah\n\nKarena dokumen ini sudah ada sebelum fitur Document Revision History diimplementasikan, Identitas pengguna yang mengunggah file ini tidak dapat diverifikasi. Namun, Admin dan Document Owner merupakan role yang memiliki izin untuk mengunggah dokumen.";
const safeMessage = (error, fallback) => error?.status === 401 || error?.status === 403
  ? "Akses revisi ditolak."
  : error?.status === 404 ? "File atau dokumen tidak ditemukan." : fallback;

const UploadedBy = ({ revision }) => {
  const username = typeof revision.actorUsername === "string" && revision.actorUsername.trim()
    ? revision.actorUsername : "Unknown";
  const role = revision.actorRole || "Unknown";
  const approval = revision.eventType === "APPROVAL_A";
  if (username !== "Unknown") return <>{approval ? "Approval A " : ""}{username} ({role})</>;
  if (approval && ["Team Process", "Team Project"].includes(role)) return <>Approval A ({role})</>;
  const unknownUpload = revision.eventType === "UPLOAD";
  const explanation = unknownUpload ? unknownUploadExplanation : uploaderExplanation;
  return <span className="inline-flex items-center gap-1 text-[#FDE68A]">
    {unknownUpload ? "Admin / Document Owner" : "Unknown"}
    <span tabIndex={0} role="img" aria-label={explanation} title={explanation}>
      <CircleHelp aria-hidden="true" className="h-3.5 w-3.5" />
    </span>
  </span>;
};

const RevisionMetadata = ({ revision }) => (
  <dl className="grid gap-3 sm:grid-cols-3">
    <div className="sm:col-span-3">
      <dt className={`${labelClass} inline-flex items-center gap-1.5`}><FileText aria-hidden="true" className="h-3 w-3 shrink-0" />Original File Name</dt>
      <dd className={valueClass}>{revision.originalFileName || "-"}</dd>
    </div>
    <div>
      <dt className={`${labelClass} inline-flex items-center gap-1.5`}><GitBranch aria-hidden="true" className="h-3 w-3 shrink-0" />Stage at Upload</dt>
      <dd className={`${valueClass} flex items-center gap-1`}>
        {revision.documentStage ?? "Unknown"}
        {(!revision.documentStage || revision.documentStage === "Unknown") ? (
          <span tabIndex={0} role="img" aria-label={unknownExplanation} title={unknownExplanation}>
            <CircleHelp aria-hidden="true" className="h-3.5 w-3.5 text-[#94A3B8]" />
          </span>
        ) : null}
      </dd>
    </div>
    <div>
      <dt className={`${labelClass} inline-flex items-center gap-1.5`}><CalendarClock aria-hidden="true" className="h-3 w-3 shrink-0" />Upload Date &amp; Time</dt>
      <dd className={valueClass}>{formatCommentDateTime(revision.eventTimestamp)}</dd>
    </div>
    <div>
      <dt className={`${labelClass} inline-flex items-center gap-1.5`}><UserRound aria-hidden="true" className="h-3 w-3 shrink-0" />Uploaded By</dt>
      <dd className={valueClass}>
        <UploadedBy revision={revision} />
      </dd>
    </div>
    <div className="sm:col-span-3">
      <dt className={`${labelClass} inline-flex items-center gap-1.5`}><FileCheck aria-hidden="true" className="h-3 w-3 shrink-0" />File Indicator</dt>
      <dd className={valueClass}>{revision.isCurrentFile ? <span className="inline-flex whitespace-nowrap rounded-md border px-2 py-1 text-xs font-semibold border-[#22C55E]/40 bg-[#22C55E]/15 text-[#86EFAC]">Current File Active</span> : "Previous File"}</dd>
    </div>
  </dl>
);

export const DocumentRevisionHistoryModal = ({
  documentId, projectId, userId, canView, canDownload, onClose, onReturnFocus, manageBodyScroll = false,
}) => {
  const [stage, setStage] = useState("All");
  const [selected, setSelected] = useState(null);
  const [preview, setPreview] = useState(null);
  const [downloadId, setDownloadId] = useState(null);
  const [downloadError, setDownloadError] = useState("");
  const body = useRef(null);
  const titleId = useId();
  const close = useRef(onClose);
  const returnFocus = useRef(onReturnFocus);
  const request = useRef({ generation: 0, controller: null, objectUrl: null });
  const download = useRef(null);
  const listScroll = useRef(0);
  const query = useDocumentRevisionHistory({ open: true, canView, userId, projectId, documentId, stage });
  const renderedRevisions = query.isPending || query.isFetching || query.isError ? [] : query.revisions;
  const accessBlocked = query.isError && [401, 403, 404, 409].includes(query.error?.status);
  const selectedRevision = accessBlocked ? null : query.revisions.find(revision => revision.entryId === selected?.entryId) ?? selected;

  useEffect(() => { close.current = onClose; returnFocus.current = onReturnFocus; }, [onClose, onReturnFocus]);
  useEffect(() => {
    const dialog = body.current.closest("section");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", titleId);
    dialog.querySelector("h2").id = titleId;
    dialog.tabIndex = -1;
    dialog.querySelector("[data-revision-close]")?.focus();
    const keyboard = (event) => {
      if (event.defaultPrevented) return;
      if (event.key === "Escape") {
        event.preventDefault(); event.stopPropagation(); close.current(); return;
      }
      if (event.key !== "Tab") return;
      const controls = [...dialog.querySelectorAll("button,select,input,a[href],iframe,[tabindex='0']")]
        .filter(control => !control.disabled && control.getClientRects().length > 0);
      const first = controls[0], last = controls.at(-1);
      if (!first) { event.preventDefault(); dialog.focus(); }
      else if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog)) {
        event.preventDefault(); first.focus();
      }
    };
    dialog.addEventListener("keydown", keyboard);
    return () => {
      dialog.removeEventListener("keydown", keyboard);
      // Wait for the parent portal's inert attribute to be removed by the same commit.
      window.setTimeout(() => returnFocus.current?.(), 0);
    };
  }, [titleId]);

  const releasePreview = useCallback(() => {
    request.current.generation += 1;
    request.current.controller?.abort();
    request.current.controller = null;
    if (request.current.objectUrl) window.URL.revokeObjectURL(request.current.objectUrl);
    request.current.objectUrl = null;
  }, []);

  useEffect(() => () => {
    releasePreview();
    download.current?.abort();
    download.current = null;
  }, [releasePreview, userId, projectId, documentId]);

  useEffect(() => {
    if (accessBlocked) releasePreview();
    if (accessBlocked || !canDownload) download.current?.abort();
  }, [accessBlocked, canDownload, releasePreview]);

  useEffect(() => {
    if (!selected && body.current?.parentElement) body.current.parentElement.scrollTop = listScroll.current;
    if (selected) body.current?.closest("section")?.focus();
  }, [selected]);

  const openRevision = async (revision) => {
    if (!canView || !revision.file?.fileId) return;
    if (!selected) listScroll.current = body.current?.parentElement?.scrollTop ?? 0;
    releasePreview();
    const generation = request.current.generation;
    const controller = new AbortController();
    request.current.controller = controller;
    setSelected(revision); setPreview({ loading: true }); setDownloadError("");
    try {
      const result = await DocumentApiService.getRevisionPreview({ documentId, revision, signal: controller.signal });
      if (controller.signal.aborted || generation !== request.current.generation) return;
      const objectUrl = window.URL.createObjectURL(result.file);
      request.current.objectUrl = objectUrl;
      setPreview({ ...result, objectUrl });
    } catch (error) {
      if (controller.signal.aborted || generation !== request.current.generation) return;
      setPreview({ error: safeMessage(error, "Preview revisi tidak dapat dimuat. Silakan coba lagi.") });
    }
  };

  const downloadRevision = async (revision) => {
    if (!canDownload || !revision.file?.fileId || download.current) return;
    const controller = new AbortController();
    download.current = controller;
    setDownloadId(revision.entryId); setDownloadError("");
    try {
      await DocumentApiService.downloadRevisionFile({ documentId, revision, signal: controller.signal });
    } catch (error) {
      if (!controller.signal.aborted) setDownloadError(safeMessage(error, "File revisi tidak dapat diunduh. Silakan coba lagi."));
    } finally {
      if (download.current === controller) {
        download.current = null;
        setDownloadId(null);
      }
    }
  };

  const backToList = () => { releasePreview(); setPreview(null); setSelected(null); };
  const extension = preview?.metadata?.fileExtension?.toLowerCase();
  const spreadsheet = ["xls", "xlsx"].includes(extension);
  const fallback = preview && !preview.loading && !preview.error &&
    !["pdf", "image", "docx"].includes(preview.viewerType) && !spreadsheet;

  return (
    <DocumentActionModal
      title="Document Revision History"
      titleClassName="text-[#FDE68A]"
      onClose={onClose}
      size={selectedRevision ? "viewer" : "default"}
      layer={9100}
      manageBodyScroll={manageBodyScroll}
      footer={<>
        <span className="mr-auto self-center text-sm text-[#94A3B8]">Total File: {renderedRevisions.length}</span>
        {selectedRevision ? <button className={secondary} onClick={backToList} type="button"><ArrowLeft className="h-4 w-4" />Back</button> : null}
        <button className="inline-flex h-9 items-center justify-center rounded-md bg-[#0F7BFF] px-4 text-sm font-semibold text-white hover:bg-[#0B63CC]"
          data-revision-close onClick={onClose} type="button">Close</button>
      </>}
    >
      <div ref={body} className={selectedRevision ? "grid h-full min-h-0 grid-rows-[minmax(0,240px)_minmax(0,1fr)] gap-5 lg:grid-cols-[360px_minmax(0,1fr)] lg:grid-rows-none" : "space-y-4"}>
        {selectedRevision ? <>
          <aside className="min-h-0 space-y-4 overflow-y-auto rounded-lg border border-[#123A5A] bg-[#031528] p-4">
            <RevisionMetadata revision={selectedRevision} />
            {canDownload ? <button className={secondary} disabled={downloadId !== null} onClick={() => downloadRevision(selectedRevision)} type="button">
              {downloadId === selectedRevision.entryId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}Download
            </button> : null}
            {downloadError ? <p className="text-sm text-[#FCA5A5]" role="alert">{downloadError}</p> : null}
          </aside>
          <PreviewCanvas isPdf={preview?.viewerType === "pdf" && !preview.error}>
            {preview?.loading ? <p className="flex items-center gap-2 p-4 text-sm text-[#94A3B8]" role="status"><Loader2 className="h-4 w-4 animate-spin" />Memuat preview...</p> : null}
            {preview?.error ? <div className="space-y-3 p-4" role="alert"><p className="text-sm text-[#FCA5A5]">{preview.error}</p>
              <button className={secondary} onClick={() => openRevision(selectedRevision)} type="button"><RefreshCw className="h-4 w-4" />Retry</button></div> : null}
            {preview?.viewerType === "pdf" && !preview.error ? <iframe className="h-full w-full bg-white" src={preview.objectUrl} title={`${selectedRevision.originalFileName} PDF Viewer`} /> : null}
            {preview?.viewerType === "image" && !preview.error ? <img className="rounded-md object-contain" src={preview.objectUrl} alt={selectedRevision.originalFileName || "Revision file"}
              onError={() => setPreview(current => ({ ...current, error: "Preview gambar tidak dapat ditampilkan." }))} /> : null}
            {preview?.viewerType === "docx" && !preview.error ? <div className="w-[min(82vw,960px)] bg-white p-6 text-sm leading-6 text-[#0F172A]" dangerouslySetInnerHTML={{ __html: preview.previewHtml }} /> : null}
            {spreadsheet && !preview?.error ? <SpreadsheetPreview file={preview.file} /> : null}
            {fallback ? <p className="p-4 text-sm text-[#94A3B8]">Preview tidak tersedia. Gunakan Download untuk membuka file.</p> : null}
          </PreviewCanvas>
        </> : <>
          <label className="block text-xs font-semibold text-[#94A3B8]">Stage at Upload
            <SelectDropdown className="mt-2 h-10 w-full rounded-md border border-[#123A5A] bg-[#08233B] px-3 text-sm text-[#F8FAFC]" value={stage}
              onChange={event => { setStage(event.target.value); setDownloadError(""); }}>
              {stages.map(value => <option key={value} value={value}>{value}</option>)}
            </SelectDropdown>
          </label>
          <p className="text-xs text-[#94A3B8]">File diurutkan berdasarkan tanggal upload, dari terbaru hingga terlama.</p>
          {query.isPending || query.isFetching ? <p className="flex items-center gap-2 text-sm text-[#94A3B8]" role="status"><Loader2 className="h-4 w-4 animate-spin" />Memuat riwayat revisi...</p>
            : query.isError ? <div className="space-y-3" role="alert"><p className="text-sm text-[#FCA5A5]">{safeMessage(query.error, "Riwayat revisi tidak dapat dimuat.")}</p>
              <button className={secondary} onClick={() => query.refetch()} type="button"><RefreshCw className="h-4 w-4" />Retry</button></div>
              : renderedRevisions.length === 0 ? <p className="text-sm text-[#94A3B8]">Tidak ada revisi untuk tahap ini.</p>
                : renderedRevisions.map(revision => <article className="space-y-3 rounded-lg border border-[#123A5A] bg-[#08233B] p-4" key={revision.entryId}>
                  <RevisionMetadata revision={revision} />
                  <div className="flex justify-end gap-2">
                    {canView ? <button className={iconButton} disabled={!revision.file?.fileId} onClick={() => openRevision(revision)} title="View" aria-label={`View ${revision.originalFileName || "revision"}`} type="button"><Eye className="h-4 w-4" /></button> : null}
                    {canDownload ? <button className={iconButton} disabled={!revision.file?.fileId || downloadId !== null} onClick={() => downloadRevision(revision)} title="Download" aria-label={`Download ${revision.originalFileName || "revision"}`} type="button">
                      {downloadId === revision.entryId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}</button> : null}
                  </div>
                </article>)}
          {downloadError ? <p className="text-sm text-[#FCA5A5]" role="alert">{downloadError}</p> : null}
        </>}
      </div>
    </DocumentActionModal>
  );
};
