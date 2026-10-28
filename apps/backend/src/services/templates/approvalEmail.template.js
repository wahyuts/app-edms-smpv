const descriptions = Object.freeze({ A: 'Approved', B: 'Approved with Comment', C: 'Not Approved' });
const headerValue = (value) => String(value).replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]/g, ' ').trim();
const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

const buildApprovalEmail = (event) => {
  const description = descriptions[event.approvalCode];
  if (!description || !['Team Process', 'Team Project'].includes(event.approverRole)) {
    throw new Error('Invalid approval email identity');
  }
  for (const field of ['projectCode', 'projectName', 'documentNumber']) {
    if (typeof event[field] !== 'string' || !headerValue(event[field])) {
      throw new Error('Missing approval email identity');
    }
  }
  if (typeof event.approvalTimestamp !== 'string' || !/Z$/.test(event.approvalTimestamp)) {
    throw new Error('Missing explicit UTC approval timestamp');
  }
  const timestamp = new Date(event.approvalTimestamp);
  if (Number.isNaN(timestamp.getTime())) throw new Error('Invalid approval timestamp');
  const parts = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
    hourCycle: 'h23', timeZone: 'Asia/Jakarta',
  }).formatToParts(timestamp);
  const part = (type) => parts.find((item) => item.type === type).value;
  const approvalDate = `${part('day')} ${part('month')} ${part('year')}, ${part('hour')}:${part('minute')} WIB`;
  const comment = event.approvalCode === 'A' ? '' : String(event.approvalComment || '').trim();
  if (event.approvalCode === 'B' && !comment) throw new Error('Missing Approval B comment');
  const result = `${event.approvalCode} (${description})`;
  const separator = ' \u2014 ';
  const title = `EDMS${separator}Approval Notification`;
  const fields = [
    ['Project Code', event.projectCode], ['Project Name', event.projectName],
    ['Document Number', event.documentNumber], ['Approval Result', result],
    ['Approved By', event.approverRole], ['Approval Date', approvalDate],
    ...(comment ? [['Comment', comment]] : []),
  ];
  const introduction = 'Dokumen berikut telah mendapatkan keputusan approval terbaru:';
  const instruction = 'Silakan masuk ke EDMS untuk melihat detail dokumen, komentar, dan riwayat approval.';
  const signature = `EDMS${separator}Engineering Document Management System`;
  return {
    subject: `PROJECT CODE ${headerValue(event.projectCode)}${separator}${headerValue(event.documentNumber)}${separator}${result} By ${event.approverRole}`,
    text: [title, '', 'Halo,', '', introduction, '',
      ...fields.map(([label, value]) => `- ${label}: ${value}`), '', instruction, '', 'Terima kasih,', signature].join('\n'),
    html: `<h1>${title}</h1><p>Halo,</p><p>${introduction}</p><ul>${fields.map(([label, value]) =>
      `<li>${label}: ${escapeHtml(value).replace(/\r?\n/g, '<br>')}</li>`).join('')}</ul><p>${instruction}</p><p>Terima kasih,<br>${signature}</p>`,
  };
};

module.exports = { buildApprovalEmail };
