const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const path = require('node:path');
const { STORAGE_DIRECTORIES } = require('../../constants/storage.constants');
const { resolveStorageKeyPath, getStorageRootPath, getTemporaryRootPath, getProjectsRootPath } = require('../../utils/storagePath');
const { StorageError, normalizeStorageError } = require('../storage.errors');

class LocalStorageDriver {
  constructor(config) {
    this.name = 'local';
    this.config = config;
  }

  async initialize() {
    try {
      await fs.mkdir(getStorageRootPath(), { recursive: true });
      await fs.mkdir(getTemporaryRootPath(), { recursive: true });
      await fs.mkdir(getProjectsRootPath(), { recursive: true });
    } catch (error) {
      throw normalizeStorageError(error, 'initialize local storage');
    }
  }

  async putTemporary(storageKey, content) {
    if (!storageKey.startsWith(`${STORAGE_DIRECTORIES.TEMPORARY}/`)) {
      throw new StorageError('[STORAGE] temporary storage key must be under temporary/', 'STORAGE_INVALID_KEY');
    }

    return this.put(storageKey, content);
  }

  async finalize(temporaryStorageKey, permanentStorageKey) {
    return this.move(temporaryStorageKey, permanentStorageKey);
  }

  async put(storageKey, content) {
    const targetPath = resolveStorageKeyPath(storageKey);

    try {
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.writeFile(targetPath, content, { flag: 'wx' });

      return { storageKey };
    } catch (error) {
      throw normalizeStorageError(error, 'write local storage object');
    }
  }

  async get(storageKey) {
    try {
      return await fs.readFile(resolveStorageKeyPath(storageKey));
    } catch (error) {
      throw normalizeStorageError(error, 'read local storage object');
    }
  }

  getStream(storageKey) {
    try {
      return fsSync.createReadStream(resolveStorageKeyPath(storageKey));
    } catch (error) {
      throw normalizeStorageError(error, 'stream local storage object');
    }
  }

  async exists(storageKey) {
    try {
      await fs.access(resolveStorageKeyPath(storageKey));
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return false;
      }

      throw normalizeStorageError(error, 'check local storage object');
    }
  }

  async copy(sourceStorageKey, targetStorageKey) {
    const sourcePath = resolveStorageKeyPath(sourceStorageKey);
    const targetPath = resolveStorageKeyPath(targetStorageKey);

    try {
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.copyFile(sourcePath, targetPath, fsSync.constants.COPYFILE_EXCL);

      return { storageKey: targetStorageKey };
    } catch (error) {
      throw normalizeStorageError(error, 'copy local storage object');
    }
  }

  async move(sourceStorageKey, targetStorageKey) {
    const sourcePath = resolveStorageKeyPath(sourceStorageKey);
    const targetPath = resolveStorageKeyPath(targetStorageKey);

    try {
      if (await this.exists(targetStorageKey)) {
        throw new StorageError('[STORAGE] target storage key already exists', 'STORAGE_TARGET_EXISTS');
      }

      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.rename(sourcePath, targetPath);

      return { storageKey: targetStorageKey };
    } catch (error) {
      throw normalizeStorageError(error, 'move local storage object');
    }
  }

  async delete(storageKey) {
    try {
      await fs.unlink(resolveStorageKeyPath(storageKey));
      return true;
    } catch (error) {
      if (error.code === 'ENOENT') {
        return false;
      }

      throw normalizeStorageError(error, 'delete local storage object');
    }
  }

  async deleteTemporary(storageKey) {
    if (!storageKey.startsWith(`${STORAGE_DIRECTORIES.TEMPORARY}/`)) {
      throw new StorageError('[STORAGE] temporary storage key must be under temporary/', 'STORAGE_INVALID_KEY');
    }

    return this.delete(storageKey);
  }
}

module.exports = LocalStorageDriver;
