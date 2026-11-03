export const AuthService = { getCurrentUser: () => ({ id: 1, fullName: 'Synthetic Admin' }) };
export const usePermission = () => ({ hasProjectPermission: () => true });
export const useToast = () => ({ showToast: (toast) => window.dispatchEvent(new CustomEvent('fixture-toast', { detail: toast })) });
const reply = async (method) => {
  window.dispatchEvent(new CustomEvent('fixture-call', { detail: method }));
  await new Promise((resolve) => setTimeout(resolve, 700));
  const status = window.__fixtureOutcome || 'COMPLETED';
  return { data: { data: { status, operationId: 'SYNTHETIC-OP', message: status === 'COMPLETED' ? 'Dokumen berhasil dihapus permanen.' : 'Penghapusan belum selesai.' } } };
};
export const apiClient = {
  delete: () => reply('DELETE'), get: () => reply('GET'), post: () => { throw new Error('Unexpected fixture POST'); },
  patch: () => { throw new Error('Unexpected fixture PATCH'); },
};
