import {
  EDMS_STORE,
  runStoreRequest,
} from "./indexeddb.service";

const saveFile = async ({ file, metadata, storagePath }) => {
  await runStoreRequest(EDMS_STORE.FILES, "readwrite", (store) =>
    store.put({
      file,
      metadata,
      storagePath,
      storedAt: new Date().toISOString(),
    }),
  );

  return { storagePath };
};

const getFile = async (storagePath) => {
  const storedFile = await runStoreRequest(
    EDMS_STORE.FILES,
    "readonly",
    (store) => store.get(storagePath),
  );

  return storedFile ?? null;
};

const deleteFile = async (storagePath) => {
  await runStoreRequest(
    EDMS_STORE.FILES,
    "readwrite",
    (store) => store.delete(storagePath),
  );
};

const clearFiles = async () => {
  await runStoreRequest(EDMS_STORE.FILES, "readwrite", (store) => store.clear());
};

const updateFileMetadata = async (storagePath, metadata) => {
  const storedFile = await getFile(storagePath);

  if (!storedFile) {
    throw new Error("File tidak ditemukan.");
  }

  await saveFile({
    file: storedFile.file,
    metadata: { ...storedFile.metadata, ...metadata },
    storagePath,
  });
};

export const BrowserFileStorageService = {
  clearFiles,
  deleteFile,
  getFile,
  saveFile,
  updateFileMetadata,
};

export default BrowserFileStorageService;
