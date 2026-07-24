import {
  EDMS_STORE,
  runEdmsTransaction,
  runStoreRequest,
} from "@/shared/services/indexeddb.service";

const cloneValue = (value) => JSON.parse(JSON.stringify(value));

export const PasswordResetTokenRepository = {
  getAll: () => runStoreRequest(
    EDMS_STORE.PASSWORD_RESET_TOKENS,
    "readonly",
    (store) => store.getAll(),
  ),
  getByToken: async (token) => (
    await runStoreRequest(
      EDMS_STORE.PASSWORD_RESET_TOKENS,
      "readonly",
      (store) => store.get(token),
    )
  ) ?? null,
  update: (tokenRecord) => runStoreRequest(
    EDMS_STORE.PASSWORD_RESET_TOKENS,
    "readwrite",
    (store) => store.put(tokenRecord),
  ),
};

export const MockEmailRepository = {
  getAll: async () => cloneValue(await runStoreRequest(
    EDMS_STORE.MOCK_EMAILS,
    "readonly",
    (store) => store.getAll(),
  )),
  getById: async (emailId) => (
    await runStoreRequest(
      EDMS_STORE.MOCK_EMAILS,
      "readonly",
      (store) => store.get(emailId),
    )
  ) ?? null,
};

export const PasswordResetRepository = {
  createRequest: ({ email, tokenRecord }) => runEdmsTransaction(
    [EDMS_STORE.PASSWORD_RESET_TOKENS, EDMS_STORE.MOCK_EMAILS],
    "readwrite",
    (stores) => {
      stores[EDMS_STORE.PASSWORD_RESET_TOKENS].put(tokenRecord);
      stores[EDMS_STORE.MOCK_EMAILS].put(email);
    },
  ),
  revokeActiveTokensForUser: async (userId, now) => {
    const tokens = await PasswordResetTokenRepository.getAll();
    const activeTokens = tokens.filter((tokenRecord) =>
      tokenRecord.userId === userId &&
      !tokenRecord.usedAt &&
      !tokenRecord.revokedAt &&
      new Date(tokenRecord.expiresAt).getTime() > new Date(now).getTime(),
    );

    if (activeTokens.length === 0) return;

    await runEdmsTransaction(
      [EDMS_STORE.PASSWORD_RESET_TOKENS],
      "readwrite",
      (stores) => {
        activeTokens.forEach((tokenRecord) => {
          stores[EDMS_STORE.PASSWORD_RESET_TOKENS].put({
            ...tokenRecord,
            revokedAt: now,
          });
        });
      },
    );
  },
};

export default PasswordResetRepository;
