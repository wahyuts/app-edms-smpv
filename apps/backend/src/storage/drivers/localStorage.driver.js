const fs = require('node:fs/promises');
const fsSync = require('node:fs');
const path = require('node:path');
const logger = require('../../config/logger');
const { STORAGE_DIRECTORIES } = require('../../constants/storage.constants');
const { resolveStorageKeyPath, getStorageRootPath, getTemporaryRootPath, getProjectsRootPath } = require('../../utils/storagePath');
const { StorageError, normalizeStorageError } = require('../storage.errors');

const UUID_DIRECTORY_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

  getTemporaryParentDirectoryPath(storageKey) {
    if (!storageKey.startsWith(`${STORAGE_DIRECTORIES.TEMPORARY}/`)) {
      throw new StorageError('[STORAGE] temporary storage key must be under temporary/', 'STORAGE_INVALID_KEY');
    }

    const temporaryRootPath = getTemporaryRootPath();
    const parentDirectoryPath = path.dirname(resolveStorageKeyPath(storageKey));
    const relativeParentPath = path.relative(temporaryRootPath, parentDirectoryPath);
    const isOutsideTemporaryRoot = relativeParentPath.startsWith('..') || path.isAbsolute(relativeParentPath);

    if (!relativeParentPath) {
      return null;
    }

    if (isOutsideTemporaryRoot || relativeParentPath.includes(path.sep)) {
      return null;
    }

    return parentDirectoryPath;
  }

  async removeDirectoryIfEmpty(directoryPath, { requireUuidName = false } = {}) {
    const temporaryRootPath = getTemporaryRootPath();
    const resolvedDirectoryPath = path.resolve(directoryPath);
    const relativeDirectoryPath = path.relative(temporaryRootPath, resolvedDirectoryPath);
    const isOutsideTemporaryRoot = relativeDirectoryPath.startsWith('..') || path.isAbsolute(relativeDirectoryPath);

    if (!relativeDirectoryPath || isOutsideTemporaryRoot || relativeDirectoryPath.includes(path.sep)) {
      return false;
    }

    if (requireUuidName && !UUID_DIRECTORY_PATTERN.test(path.basename(resolvedDirectoryPath))) {
      return false;
    }

    try {
      const stat = await fs.stat(resolvedDirectoryPath);
      if (!stat.isDirectory()) {
        return false;
      }

      await fs.rmdir(resolvedDirectoryPath);
      return true;
    } catch (error) {
      if (['ENOENT', 'ENOTEMPTY', 'EEXIST'].includes(error.code)) {
        return false;
      }

      logger.error(
        '[STORAGE]',
        'event=temporary_empty_directory_cleanup_failed',
        `errorCode=${error.code || error.name || 'StorageDirectoryCleanupError'}`
      );
      return false;
    }
  }

  async cleanupTemporaryParentDirectory(storageKey) {
    try {
      const parentDirectoryPath = this.getTemporaryParentDirectoryPath(storageKey);
      if (!parentDirectoryPath) {
        return false;
      }

      return await this.removeDirectoryIfEmpty(parentDirectoryPath);
    } catch (error) {
      logger.error(
        '[STORAGE]',
        'event=temporary_parent_directory_cleanup_failed',
        `errorCode=${error.code || error.name || 'StorageParentDirectoryCleanupError'}`
      );
      return false;
    }
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
      if (sourceStorageKey.startsWith(`${STORAGE_DIRECTORIES.TEMPORARY}/`)) {
        await this.cleanupTemporaryParentDirectory(sourceStorageKey);
      }

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

    const deleted = await this.delete(storageKey);

    if (deleted) {
      await this.cleanupTemporaryParentDirectory(storageKey);
    }

    return deleted;
  }

  async cleanupEmptyTemporaryDirectories({ limit = 100 } = {}) {
    const temporaryRootPath = getTemporaryRootPath();
    const safeLimit = Math.min(1000, Math.max(1, Number.parseInt(limit, 10) || 100));
    const summary = {
      deletedDirectories: 0,
      driver: this.name,
      failed: 0,
      scannedDirectories: 0,
      skippedDirectories: 0,
    };

    let directoryEntries;

    try {
      directoryEntries = await fs.readdir(temporaryRootPath, { withFileTypes: true });
    } catch (error) {
      if (error.code === 'ENOENT') {
        await fs.mkdir(temporaryRootPath, { recursive: true });
        return summary;
      }

      throw normalizeStorageError(error, 'list local temporary directories');
    }

    const candidateEntries = directoryEntries
      .filter((entry) => entry.isDirectory())
      .sort((firstEntry, secondEntry) => firstEntry.name.localeCompare(secondEntry.name))
      .slice(0, safeLimit);

    for (const entry of candidateEntries) {
      summary.scannedDirectories += 1;

      try {
        const deleted = await this.removeDirectoryIfEmpty(
          path.join(temporaryRootPath, entry.name)
        );

        if (deleted) {
          summary.deletedDirectories += 1;
        } else {
          summary.skippedDirectories += 1;
        }
      } catch (error) {
        summary.failed += 1;
        logger.error(
          '[STORAGE]',
          'event=temporary_empty_directory_cleanup_item_failed',
          `errorCode=${error.code || error.name || 'StorageDirectoryCleanupError'}`
        );
      }
    }

    return summary;
  }
}

module.exports = LocalStorageDriver;
