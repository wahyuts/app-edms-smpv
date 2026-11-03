const confirmations = new Map();

// Keep the initiating row mounted until Sprint A finishes its own success flow.
// Other tabs/users have independent state and do not wait for this confirmation.
export const beginPermanentDeleteConfirmation = (projectId) => {
  let resolve;
  const pending = new Promise((done) => { resolve = done; });
  confirmations.set(pending, String(projectId));
  return () => { confirmations.delete(pending); resolve(); };
};

export const waitForPermanentDeleteConfirmations = async (projectId) => {
  for (;;) {
    const pending = [...confirmations].filter(([, scope]) => scope === String(projectId)).map(([promise]) => promise);
    if (!pending.length) return;
    await Promise.all(pending);
  }
};
