import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { SourceTextModule, SyntheticModule } from 'node:vm';
import { transformWithOxc } from 'vite';
import * as constants from '../src/features/document-register/constants/document.constants.js';

const { DOCUMENT_STATUS, getDocumentStatusLabel } = constants;
const base = new URL('../src/', import.meta.url);
const element = (type, props) => ({ type, props });
const state = initial => [typeof initial === 'function' ? initial() : initial, () => {}];
const nodes = value => !value ? [] : Array.isArray(value) ? value.flatMap(nodes)
  : typeof value === 'object' ? typeof value.type === 'function' ? nodes(value.type(value.props))
    : [value, ...nodes(value.props?.children)] : [];
const text = value => value == null ? '' : Array.isArray(value) ? value.map(text).join(' ')
  : typeof value === 'object' ? typeof value.type === 'function' ? text(value.type(value.props))
    : text(value.props?.children) : String(value);
const load = async (file, extra = {}) => {
  const source = await readFile(new URL(file, base), 'utf8');
  const code = (await transformWithOxc(source, 'fixture.jsx', { jsx: { runtime: 'automatic' } })).code;
  const imports = {
    react: { useState: state, useCallback: fn => fn, useEffect() {}, useRef: current => ({ current }), useId: () => 'fixture-id' },
    'react/jsx-runtime': { jsx: element, jsxs: element, Fragment: 'fragment' },
    'react-dom': { createPortal: children => children },
    'lucide-react': Object.fromEntries(['ChevronLeft', 'ChevronRight', 'ClipboardList', 'Download', 'Eye', 'FileText',
      'FileUp', 'History', 'Loader2', 'Paperclip', 'Trash2', 'X', 'RefreshCw', 'AlertTriangle', 'CheckCircle2',
      'Clock3', 'Folder', 'MessageCircle', 'MessagesSquare', 'UsersRound'].map(name => [name, name])),
    '@/shared/components/form/SelectDropdown': { default: props => element('select', props) },
    '@/shared/hooks/usePermission': { usePermission: () => ({ hasProjectPermission: () => true }) },
    '@/shared/stores/project-context.store': { useProjectContextStore: selector => selector({ activeProject: { id: 'P1' } }) },
    '../constants/document.constants': constants,
    '@/features/document-register/constants/document.constants': constants,
    './DocumentActionGroup': { default: 'DocumentActionGroup' },
    '@/features/document-register/components/DocumentActionGroup': { default: 'DocumentActionGroup' },
    '@/features/sla-management/utils/sla-timer-display': {
      getSlaTimerTextClassName: () => 'unchanged', getSlaTimerTooltip: () => 'unchanged',
      formatTimeForReview: () => '1d', resolveCurrentAssigneeRoleDisplay: () => 'Document Owner',
    },
    ...extra,
  };
  const module = new SourceTextModule(code);
  await module.link(name => {
    assert.ok(imports[name], `Unexpected dependency: ${name}`);
    return new SyntheticModule(Object.keys(imports[name]), function () {
      for (const [key, value] of Object.entries(imports[name])) this.setExport(key, value);
    });
  });
  await module.evaluate();
  return module.namespace;
};

for (const [status, label] of [[DOCUMENT_STATUS.PROCESS_COMMENT, 'IFR Approved With Comment'],
  [DOCUMENT_STATUS.PROJECT_COMMENT, 'IFA Approved With Comment']]) {
  test(`presentation maps ${status} without changing internal values`, () => {
    assert.equal(getDocumentStatusLabel(status), label);
    assert.ok(Object.values(DOCUMENT_STATUS).includes(status));
    assert.equal(Object.values(DOCUMENT_STATUS).includes(label), false);
  });
}
for (const value of ['Process Review', 'Project Review', 'Process Reject', 'Project Reject', 'Approved',
  'Unrecognized status', '__proto__', null, undefined, '']) {
  test(`unmapped status is preserved: ${String(value)}`, () => assert.equal(getDocumentStatusLabel(value), value));
}

const item = status => ({ id: 'SYNTHETIC-D', projectId: 'P1', documentNumber: 'SYNTHETIC-1',
  status, lifecycle: 'Active', description: 'Unchanged', area: 'A', revision: 'IFA-Submitted', rev: '01',
  fileMetadata: {}, currentAssignee: {}, slaTimer: {}, slaStatus: 'On Track' });
for (const [file, component, extra] of [
  ['features/document-register/components/DocumentRegisterTable.jsx', 'DocumentRegisterTable', {}],
  ['features/sla-monitoring/components/SlaMonitoringTable.jsx', 'SlaMonitoringTable', {}],
  ['features/escalation-alert/components/EscalationAlertTable.jsx', 'EscalationAlertTable', {}],
]) {
  for (const isDashboard of component === 'DocumentRegisterTable' ? [false, true] : [false]) {
    test(`${component} dashboard=${isDashboard}: labels, filter values, filtering and badge styles are preserved`, async () => {
      const module = await load(file, extra);
      const rows = [item('Process Comment'), { ...item('Project Comment'), id: 'SYNTHETIC-D2' }];
      const original = JSON.stringify(rows);
      let selected;
      const tree = module[component]({ rows, pageNumber: 1, pageSize: 10, totalPages: 1, startIndex: 0,
        statusFilter: '', statusOptions: ['Process Comment', 'Project Comment'], slaStatusOptions: [], levelOptions: [],
        areaOptions: [], isDashboard, setStatusFilter: value => { selected = value; } });
      const all = nodes(tree);
      for (const status of ['Process Comment', 'Project Comment']) {
        const option = all.find(node => node.type === 'option' && node.props.value === status);
        assert.equal(text(option), getDocumentStatusLabel(status));
        const select = all.find(node => node.type === 'select' && nodes(node).includes(option));
        select.props.onChange({ target: { value: option.props.value } });
        assert.equal(selected, status);
        assert.equal(rows.filter(row => row.status === selected).length, 1);
        assert.ok(all.some(node => node.type === 'span' && text(node) === getDocumentStatusLabel(status)
          && node.props.className.includes('whitespace-nowrap')));
      }
      assert.equal(JSON.stringify(rows), original);
    });
  }
}

test('shared document summary and workflow history map structured statuses without rewriting stored messages', async () => {
  const module = await load('features/document-register/components/DocumentActionModal.jsx', {
    '../constants/upload.constants': { MAX_UPLOAD_FILE_SIZE_MB: 100 },
    '../services/file.service': { FILE_VALIDATION_CONFIG: {}, FileService: {} },
    '../services/workflow-attachment.service': { WORKFLOW_ATTACHMENT_VALIDATION_CONFIG: {}, WorkflowAttachmentService: {} },
    './PreviewCanvas': { default: props => element('div', props) }, './SpreadsheetPreview': { default: 'SpreadsheetPreview' },
    '../utils/documentDateTime': { formatCommentDateTime: () => 'unchanged' },
  });
  assert.match(text(module.DocumentSummary({ documentItem: item('Process Comment') })), /IFR Approved With Comment/);
  const timeline = [{ id: 'H1', status: 'Project Comment', activity: 'Approval B', workflowEvent: 'Process Comment',
    createdDate: '2026-11-24T00:00:00Z', revision: 'IFA-Submitted' }];
  const history = module.HistoryModal({ documentItem: item('Project Comment'), timeline });
  // Inspect children without mounting the portal or running browser effects.
  assert.match(text(history.props.children), /IFA Approved With Comment/);
  assert.match(text(history.props.children), /Process Comment/);
  assert.match(text(history.props.children), /Approval B/);
  assert.equal(timeline[0].status, 'Project Comment');
  assert.equal(timeline[0].workflowEvent, 'Process Comment');
});

test('Dashboard KPI labels change while counts, combined categories, breakdown and click filters stay intact', async () => {
  let selected;
  const summary = { kpiSummary: { totalDocuments: 48, processReview: 8, projectReview: 9, approved: 13, finalAsBuilt: 13,
    processCommentReject: 7, projectCommentReject: 11,
    processComment: 3, processReject: 4, projectComment: 5, projectReject: 6 } };
  const original = JSON.stringify(summary);
  const module = await load('features/dashboard/pages/DashboardPage.jsx', {
    '@tanstack/react-query': { useQuery: () => ({ data: summary }), useQueryClient: () => ({}) },
    'react-router-dom': { Link: 'a' },
    '@/features/document-register': { DashboardDocumentRegisterTable: 'Register',
      useDocumentRegisterTable: () => ({ statusFilter: '', setStatusFilter: value => { selected = value; } }) },
    '../services/dashboard-api.service': { DashboardApiService: {} },
  });
  const tree = nodes(module.default());
  for (const [label, statuses, value, breakdown, stage] of [
    ['IFR Approved With Comment / Reject', ['Process Comment', 'Process Reject'], 7, [3, 4], 'IFR'],
    ['IFA Approved With Comment / Reject', ['Project Comment', 'Project Reject'], 11, [5, 6], 'IFA'],
  ]) {
    const button = tree.find(node => node.type === 'button' && node.props['aria-label']?.startsWith(label));
    assert.ok(button);
    assert.match(button.props['aria-label'], new RegExp(`${value} documents`));
    assert.ok(nodes(button).some(node => node.type === 'p' && text(node) === `${stage} review results`));
    const normalizedText = text(button).replace(/\s+/g, ' ').replace(/\s+:/g, ':');
    assert.ok(normalizedText.includes(`${stage} Approved Comment: ${breakdown[0]} | Reject: ${breakdown[1]}`));
    const labels = nodes(button).filter(node => node.type === 'span').map(node => text(node).trim());
    assert.equal(labels.includes(`Approved: ${breakdown[0]}`), false);
    assert.equal(labels.includes(`Comment: ${breakdown[0]}`), false);
    const breakdownContainer = nodes(button).find(node => node.type === 'div' && node.props.className?.includes('flex-wrap'));
    assert.ok(breakdownContainer);
    assert.equal(nodes(breakdownContainer).some(node => node.props?.className?.includes('whitespace-nowrap')), false);
    const rejectValue = nodes(breakdownContainer).find(node => node.type === 'span' && text(node) === String(breakdown[1]));
    assert.equal(rejectValue.props.className, 'text-[#EF4444]');
    button.props.onClick();
    assert.deepEqual(Array.from(selected), statuses);
  }
  for (const [label, count] of [['Total Documents', 48], ['Process Review', 8], ['Project Review', 9], ['Approved / Final As-Built', 13]]) {
    const button = tree.find(node => node.type === 'button' && node.props['aria-label']?.startsWith(`${label}.`));
    assert.ok(button);
    assert.match(button.props['aria-label'], new RegExp(`${count} documents`));
    assert.equal(nodes(button).some(node => node.props.className?.includes('flex-wrap')), false);
    if (label === 'Approved / Final As-Built') {
      assert.ok(nodes(button).some(node => node.type === 'p' && node.props.className === 'whitespace-nowrap'));
    }
  }
  assert.equal(JSON.stringify(summary), original);
});

test('presentation patch leaves existing CSS classes and internal workflow constants unchanged', async () => {
  for (const file of ['features/document-register/components/DocumentRegisterTable.jsx',
    'features/document-register/components/DocumentActionModal.jsx', 'features/document-register/components/PermanentDeleteAction.jsx',
    'features/sla-monitoring/components/SlaMonitoringTable.jsx', 'features/escalation-alert/components/EscalationAlertTable.jsx',
    'features/dashboard/pages/DashboardPage.jsx']) {
    const current = await readFile(new URL(file, base), 'utf8');
    const previous = execFileSync('git', ['show', `HEAD:apps/frontend/src/${file}`], { encoding: 'utf8' });
    // Only these two local breakdown attributes have an approved wrapping exception.
    const classes = source => source
      .replace(/className=\{isReviewResultCard \? "mt-3 flex flex-wrap[^\n]+?\}/, 'className="mt-3 flex items-center justify-center gap-6 text-center text-sm font-semibold text-[#CBD5E1]"')
      .replace('className={isReviewResultCard ? "min-w-0" : "whitespace-nowrap"}', 'className="whitespace-nowrap"')
      .match(/className=(?:"[^"]*"|\{[^}\n]*\})/g);
    assert.deepEqual(classes(current), classes(previous), file);
  }
  const file = 'features/document-register/constants/document.constants.js';
  const current = await readFile(new URL(file, base), 'utf8');
  const previous = execFileSync('git', ['show', `HEAD:apps/frontend/src/${file}`], { encoding: 'utf8' });
  const withoutLabels = source => source.replace(/export const DOCUMENT_STATUS_LABELS = \{[\s\S]*?: status;\r?\n\r?\n/, '').replace(/\r/g, '');
  assert.equal(withoutLabels(current), withoutLabels(previous));
});
