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
  };
};
const nodes = (node) => !node ? [] : Array.isArray(node) ? node.flatMap(nodes)
  : typeof node === 'object' ? [node, ...nodes(node.props?.children)] : [];
const uploadField = (tree) => nodes(tree).find((node) => typeof node.props?.onFileChange === 'function');
const submit = (tree) => tree.props.footer.props.children[1].props.onClick();

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
