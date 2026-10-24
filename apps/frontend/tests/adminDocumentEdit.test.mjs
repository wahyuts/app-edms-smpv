import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { SourceTextModule, SyntheticModule } from 'node:vm';
import { transformWithOxc } from 'vite';
import * as constants from '../src/features/document-register/constants/document.constants.js';
import * as uploadConstants from '../src/features/document-register/constants/upload.constants.js';

const base = '../src/features/document-register/';
const synthetic = (exports) => new SyntheticModule(Object.keys(exports), function () {
  for (const [name, value] of Object.entries(exports)) this.setExport(name, value);
});
const load = async (path, imports, jsx = false) => {
  const source = await readFile(new URL(base + path, import.meta.url), 'utf8');
  const code = jsx ? (await transformWithOxc(source, 'test.jsx', { jsx: { runtime: 'automatic' } })).code : source;
  const module = new SourceTextModule(code);
  await module.link((specifier) => {
    assert.ok(imports[specifier], `Unexpected import: ${specifier}`);
    return synthetic(imports[specifier]);
  });
  await module.evaluate();
  return module.namespace;
};

const { FileService, FILE_VALIDATION_CONFIG } = await load('services/file.service.js', {
  '@/shared/services/browser-file-storage.service': { BrowserFileStorageService: {} },
  '@/features/audit-trail': { AUDIT_RESOURCE_TYPE: {}, AUDIT_TRAIL_ACTION: {}, AuditTrailService: {} },
  '../constants/upload.constants': uploadConstants,
});

const createModalHarness = async (overrides = {}) => {
  const state = [];
  let index = 0;
  const element = (type, props) => ({ type, props });
  const module = await load('components/DocumentActionModal.jsx', {
    react: {
      useEffect() {},
      useState(initial) {
        const slot = index++;
        if (!(slot in state)) state[slot] = typeof initial === 'function' ? initial() : initial;
        return [state[slot], (next) => { state[slot] = typeof next === 'function' ? next(state[slot]) : next; }];
      },
    },
    'react/jsx-runtime': { jsx: element, jsxs: element, Fragment: 'fragment' },
    'react-dom': { createPortal: element },
    'lucide-react': Object.fromEntries(['Download', 'Eye', 'FileText', 'FileUp', 'Loader2', 'Paperclip', 'Trash2', 'X'].map((name) => [name, name])),
    '../constants/document.constants': constants,
    '../constants/upload.constants': uploadConstants,
    '../services/file.service': { FileService, FILE_VALIDATION_CONFIG },
    '../services/workflow-attachment.service': { WORKFLOW_ATTACHMENT_VALIDATION_CONFIG: {}, WorkflowAttachmentService: {} },
    './PreviewCanvas': { default: 'PreviewCanvas' }, './SpreadsheetPreview': { default: 'SpreadsheetPreview' },
  }, true);
  const submissions = [];
  const warnings = [];
  const props = {
    allowUploadRevision: true, isProjectAdmin: true,
    documentItem: { id: 'DOC-1', documentNumber: 'PFD-1', status: 'Process Review', area: 'CDU', description: 'Test', daysUntilValidation: 5 },
    onCancel() {}, onSubmit: async (value) => submissions.push(value), onValidationFailed: (message) => warnings.push(message),
    ...overrides,
  };
  return {
    submissions, warnings,
    render() { index = 0; return module.EditDocumentModal(props); },
    renderView(documentItem, documentFile = {}) {
      return module.ViewDocumentModal({ documentItem, documentFile, onClose() {}, onDownload() {} });
    },
    renderComments(comments) {
      return module.CommentViewerModal({ comments, documentItem: { documentNumber: 'PFD-1' }, onClose() {} });
    },
  };
};
const nodes = (node) => !node ? [] : Array.isArray(node) ? node.flatMap(nodes)
  : typeof node === 'object' ? [node, ...nodes(node.props?.children)] : [];
const uploadField = (tree) => nodes(tree).find((node) => typeof node.props?.onFileChange === 'function');
const submit = (tree) => tree.props.footer.props.children[1].props.onClick();

const getUploadedDateField = (tree) => nodes(tree).find((node) =>
  node.type === 'div' && node.props?.children?.[0]?.props?.children === 'DATE UPLOADED');

test('Comment Viewer derives Approval A titles from role snapshots without changing B/C cards or ordering', async () => {
  const harness = await createModalHarness();
  const comments = [
    { id: 'A-project', workflowAction: 'Approval A', workflowComment: 'This document has been fully approved by Team Project.', createdBy: 'Full Project Name', createdByOfficialRole: 'Team Project' },
    { id: 'A-process', workflowAction: 'Approval A', workflowComment: 'This document has been approved by Team Process and can continue to the next workflow by Team Project', createdBy: 'Full Process Name', createdByOfficialRole: 'Team Process' },
    { id: 'B', workflowAction: 'Approval B', workflowComment: 'Manual B', createdBy: 'Reviewer', createdByOfficialRole: 'Team Process', attachment: { attachmentId: 'ATT-1', originalFileName: 'Attachment.pdf' } },
    { id: 'C', workflowAction: 'Approval C', workflowComment: 'Manual C', createdBy: 'Reviewer', createdByOfficialRole: 'Team Project' },
  ].map((comment) => ({ ...comment, createdDate: '2026-10-24T05:00:00.123Z' }));
  const tree = harness.renderComments(comments);
  const cards = nodes(tree).filter((node) => node.type === 'article');
  assert.equal(cards.length, 4);
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i]; const comment = comments[i];
    const header = card.props.children[0];
    assert.equal(header.props.children[0].props.children, comment.workflowAction === 'Approval A' ? `Approval A By ${comment.createdByOfficialRole}` : comment.workflowAction);
    assert.equal(header.props.children[1].props.children, '24 Oct 2026, 12:00');
    assert.equal(card.props.children[1].props.children, comment.workflowComment);
    assert.equal(card.props.children[2].props.children.join(''), `By ${comment.createdBy} (${comment.createdByOfficialRole})`);
    assert.equal(card.props.children[3].props.attachment, comment.attachment);
    assert.equal(card.props.className, cards[0].props.className);
  }
  assert.equal(tree.props.title, 'Comment Viewer');
  assert.equal(tree.props.footer.props.children, 'Close');
});

test('View Document renders active file upload date in Jakarta directly after Uploaded By', async () => {
  const harness = await createModalHarness();
  const { mapDocumentRecord } = await load('services/document-api.service.js', {
    '@/shared/api': { apiClient: {} }, './file.service': { FileService },
  });
  const initialFile = { fileId: 'FILE-1', originalFileName: 'Initial.pdf', extension: 'pdf', uploadedBy: 'Initial Uploader', uploadedAt: '2026-10-23T07:35:00.000Z' };
  const record = mapDocumentRecord({
    id: 'DOC-1', documentNumber: 'PFD-1', activeFileId: 'FILE-1', activeFile: initialFile,
    updatedAt: '2026-10-25T00:00:00.000Z',
  });
  const preview = { objectUrl: 'blob:active-file' };
  const tree = harness.renderView(record, preview);
  const dateField = getUploadedDateField(tree);
  assert.equal(dateField.props.children[1].props.children, '23 Oct 2026, 14:35');
  const panel = nodes(tree).find((node) => node.type === 'div' && node.props.children?.includes(dateField));
  assert.deepEqual(panel.props.children.map((field) => field.props.children[0].props.children), [
    'Active File ID', 'Original File Name', 'File Extension', 'MIME Type', 'File Size', 'Uploaded By', 'DATE UPLOADED',
  ]);
  const uploader = panel.props.children[5];
  assert.equal(dateField.props.children[0].props.className, uploader.props.children[0].props.className);
  assert.equal(dateField.props.children[1].props.className, uploader.props.children[1].props.className);
  assert.match(nodes(tree).find((node) => node.type === 'aside').props.className, /overflow-y-auto/);
  assert.equal(nodes(tree).find((node) => node.type === 'iframe').props.src, preview.objectUrl);
  assert.equal(tree.props.size, 'viewer');
  assert.equal(tree.props.footer.props.children[1].props.children, 'Close');

  const metadataOnly = mapDocumentRecord({ ...record, description: 'Metadata edited', updatedAt: '2026-10-26T10:00:00Z' });
  assert.equal(getUploadedDateField(harness.renderView(metadataOnly)).props.children[1].props.children, '23 Oct 2026, 14:35');
  assert.equal(metadataOnly.activeFileId, 'FILE-1');
  for (const status of Object.values(constants.DOCUMENT_STATUS)) {
    const revised = mapDocumentRecord({
      ...record, status, activeFileId: 'FILE-2',
      activeFile: { ...initialFile, fileId: 'FILE-2', originalFileName: 'Revision.pdf', uploadedBy: 'New Uploader', uploadedAt: '2026-10-24T02:15:00Z' },
      fileHistory: [{ fileMetadata: initialFile }],
    });
    const revisedTree = harness.renderView(revised, preview);
    assert.equal(getUploadedDateField(revisedTree).props.children[1].props.children, '24 Oct 2026, 09:15');
    assert.equal(revised.fileMetadata.uploadedBy, 'New Uploader');
    assert.equal(revised.status, status);
  }
});

test('View Document upload date handles missing/invalid timestamps and UTC day rollover', async () => {
  const harness = await createModalHarness();
  for (const [uploadedAt, expected] of [
    [undefined, '-'], [null, '-'], ['', '-'], ['not-a-date', '-'],
    ['2026-10-23T18:05:00Z', '24 Oct 2026, 01:05'],
    ['2026-10-23T00:00:00Z', '23 Oct 2026, 07:00'],
    ['2026-10-23T14:35:00+07:00', '23 Oct 2026, 14:35'],
  ]) {
    const tree = harness.renderView({ activeFileId: 'FILE-1', fileMetadata: { originalFileName: 'File.pdf', uploadedAt } });
    assert.equal(getUploadedDateField(tree).props.children[1].props.children, expected);
  }
});

for (const status of [...Object.values(constants.DOCUMENT_STATUS), 'Future Authorized Status']) {
  test(`Admin modal: optional upload and metadata-only submit in ${status}`, async () => {
    const harness = await createModalHarness({ documentItem: { status, documentNumber: 'PFD-1', description: 'Test', area: 'CDU', daysUntilValidation: 5 } });
    const tree = harness.render();
    assert.equal(uploadField(tree).props.required, false);
    await submit(tree);
    assert.equal(harness.warnings.length, 0);
    assert.equal(harness.submissions.length, 1);
    assert.equal(harness.submissions[0].file, null);
    assert.equal(harness.submissions[0].isUploadRevision, false);
  });
}

test('Admin modal passes a real selected file and keeps existing metadata validations', async () => {
  const harness = await createModalHarness();
  const file = new File(['PDF'], 'Drawing.pdf', { type: 'application/pdf' });
  await uploadField(harness.render()).props.onFileChange(file);
  await submit(harness.render());
  assert.equal(harness.submissions[0].file, file);
  const invalid = await createModalHarness({ documentItem: { status: 'Approved', description: '', area: '', daysUntilValidation: '' } });
  await submit(invalid.render());
  assert.equal(invalid.submissions.length, 0);
  assert.equal(invalid.warnings.length, 1);
});

test('Admin modal retains existing file type, size and MIME validation', async () => {
  const harness = await createModalHarness();
  for (const file of [
    { name: 'bad.exe', size: 1, type: 'application/octet-stream' },
    { name: 'big.pdf', size: uploadConstants.MAX_UPLOAD_FILE_SIZE_BYTES + 1, type: 'application/pdf' },
    { name: 'fake.pdf', size: 1, type: 'image/png' },
    { name: 'empty.pdf', size: 0, type: 'application/pdf' },
  ]) await uploadField(harness.render()).props.onFileChange(file);
  assert.equal(harness.warnings.length, 4);
  assert.ok(harness.warnings.every((message) => message.length > 0));
  assert.equal(uploadField(harness.render()).props.filePreview, null);
});

test('Non-Admin modal keeps required revision file for all four Comment/Reject statuses', async () => {
  for (const status of ['Process Comment', 'Process Reject', 'Project Comment', 'Project Reject']) {
    const harness = await createModalHarness({ isProjectAdmin: false, documentItem: { status, description: 'Test', area: 'CDU', daysUntilValidation: 5 } });
    assert.equal(uploadField(harness.render()).props.required, true);
    await submit(harness.render());
    assert.equal(harness.submissions.length, 0);
    assert.equal(harness.warnings.length, 1);
    await uploadField(harness.render()).props.onFileChange(new File(['PDF'], 'file.pdf', { type: 'application/pdf' }));
    await submit(harness.render());
    assert.equal(harness.submissions[0].isUploadRevision, true);
  }
  const harness = await createModalHarness({ isProjectAdmin: false });
  assert.equal(uploadField(harness.render()), undefined);
});

test('Modal keeps failed values, releases submitting state, and blocks buttons during submit', async () => {
  let release;
  const pending = new Promise((resolve) => { release = resolve; });
  const harness = await createModalHarness({ onSubmit: () => pending });
  const submitting = submit(harness.render());
  assert.ok(harness.render().props.footer.props.children.every((button) => button.props.disabled));
  release(); await submitting;
  assert.ok(harness.render().props.footer.props.children.every((button) => !button.props.disabled));
  const failed = await createModalHarness({ onSubmit: async () => { throw new Error('Gagal menyimpan.'); } });
  await submit(failed.render());
  assert.equal(failed.render().props.footer.props.children[1].props.disabled, false);
  assert.equal(nodes(failed.render()).find((node) => node.type === 'textarea').props.value, 'Test');
});

test('Document API uses one final PATCH, skips empty uploads and preserves non-Admin requests', async () => {
  const calls = [];
  let failure = null;
  const request = async (method, url, payload) => {
    calls.push({ method, url, payload });
    if (failure) throw failure;
    return { data: { data: url.includes('temporary-uploads') ? { temporaryFileId: 'TMP-1' } : { id: 'DOC-1', ...payload } } };
  };
  const { DocumentApiService } = await load('services/document-api.service.js', {
    '@/shared/api': { apiClient: { post: (...args) => request('POST', ...args), patch: (...args) => request('PATCH', ...args) } },
    './file.service': { FileService },
  });
  const expectedState = { activeRevisionId: 'REV-1', currentAssigneeUserId: null, workflowStatus: 'Approved' };
  await DocumentApiService.updateDocument('DOC-1', { description: 'Updated', expectedState });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, 'PATCH');
  assert.equal(calls[0].payload.expectedWorkflowStatus, 'Approved');
  assert.ok(!Object.hasOwn(calls[0].payload, 'temporaryFileId'));
  calls.length = 0;
  await DocumentApiService.updateDocument('DOC-1', { description: 'Updated', expectedState, file: new File(['PDF'], 'file.pdf') });
  assert.deepEqual(calls.map((call) => call.method), ['POST', 'PATCH']);
  assert.equal(calls[0].url, '/v1/storage/temporary-uploads');
  assert.equal(calls[1].url, '/v1/documents/DOC-1');
  assert.equal(calls[1].payload.temporaryFileId, 'TMP-1');
  calls.length = 0;
  await DocumentApiService.updateDocument('DOC-1', { description: 'Owner metadata', area: 'CDU', daysUntilValidation: 5 });
  assert.deepEqual(calls[0].payload, { description: 'Owner metadata', area: 'CDU', daysUntilValidation: 5 });
  failure = { response: { status: 409, data: { code: 'REVISION_CONFLICT', message: 'Dokumen telah diperbarui.' } } };
  await assert.rejects(DocumentApiService.updateDocument('DOC-1', { expectedState }), (error) => error.code === 'REVISION_CONFLICT' && error.status === 409);
  calls.length = 0;
  await assert.rejects(DocumentApiService.updateDocument('DOC-1', { expectedState, file: new File(['PDF'], 'file.pdf') }));
  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, 'POST');
});
