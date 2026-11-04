const { createHash } = require('node:crypto');

const digest = (value) => createHash('sha256').update(value).digest('hex');
const serialize = (value) => JSON.stringify(value);
const namespace = (descriptor) => {
  const encoded = serialize(descriptor);
  return Object.freeze({ id: digest(encoded), descriptor: Object.freeze(descriptor), encoded });
};
const r2Namespace = (config) => {
  const endpoint = new URL(config.endpoint);
  if (endpoint.username || endpoint.password || endpoint.search || endpoint.hash
    || endpoint.protocol !== 'https:' || !config.bucketName || !config.accountId) {
    throw new Error('Storage namespace R2 tidak valid.');
  }
  return namespace({ version: 1, provider: 'r2', account: config.accountId,
    endpoint: endpoint.origin + endpoint.pathname.replace(/\/$/, ''), bucket: config.bucketName });
};
const sameNamespace = (left, right) => Boolean(left && right && left.id === right.id && left.encoded === right.encoded);
const pending = (code) => Object.assign(new Error('Penghapusan tertunda; bukti keamanan belum lengkap.'), { code, pending: true });
const isCancelledDelete = operation => {
  const metadata = operation?.pending_metadata;
  const value = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
  return value?.reservationRecovery?.state === 'CANCELLED_BEFORE_IO';
};

module.exports = { digest, serialize, namespace, r2Namespace, sameNamespace, pending, isCancelledDelete };
