const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');
const { STORAGE_DIRECTORIES } = require('../../constants/storage.constants');
const { StorageError, normalizeStorageError } = require('../storage.errors');

const streamToBuffer = async (stream) => {
  const chunks = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
};

const encodeCopySourceKey = (storageKey) => {
  return storageKey.split('/').map(encodeURIComponent).join('/');
};

class R2StorageDriver {
  constructor(config) {
    this.name = 'r2';
    this.config = config.r2;
    this.client = new S3Client({
      region: this.config.region,
      endpoint: this.config.endpoint,
      credentials: {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      },
      forcePathStyle: true,
    });
  }

  async initialize() {
    await this.exists('__edms-storage-initialization-probe__');
  }

  async putTemporary(storageKey, content) {
    if (!storageKey.startsWith(`${STORAGE_DIRECTORIES.TEMPORARY}/`)) {
      throw new StorageError('[STORAGE] temporary storage key must be under temporary/', 'STORAGE_INVALID_KEY');
    }

    return this.put(storageKey, content);
  }

  async finalize(temporaryStorageKey, permanentStorageKey) {
    if (!(await this.exists(temporaryStorageKey))) {
      throw new StorageError('[STORAGE] temporary source object does not exist', 'STORAGE_SOURCE_NOT_FOUND');
    }

    await this.copy(temporaryStorageKey, permanentStorageKey);

    if (!(await this.exists(permanentStorageKey))) {
      throw new StorageError('[STORAGE] permanent object verification failed after copy', 'STORAGE_FINALIZE_VERIFY_FAILED');
    }

    try {
      await this.deleteTemporary(temporaryStorageKey);
    } catch (error) {
      throw new StorageError(
        '[STORAGE] temporary object cleanup failed after successful R2 finalize copy',
        'STORAGE_TEMPORARY_CLEANUP_FAILED',
        error
      );
    }

    return { storageKey: permanentStorageKey };
  }

  async put(storageKey, content) {
    try {
      if (await this.exists(storageKey)) {
        throw new StorageError('[STORAGE] target storage key already exists', 'STORAGE_TARGET_EXISTS');
      }

      await this.client.send(
        new PutObjectCommand({
          Bucket: this.config.bucketName,
          Key: storageKey,
          Body: content,
        })
      );

      return { storageKey };
    } catch (error) {
      throw normalizeStorageError(error, 'write R2 object');
    }
  }

  async get(storageKey) {
    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.config.bucketName,
          Key: storageKey,
        })
      );

      return streamToBuffer(response.Body);
    } catch (error) {
      throw normalizeStorageError(error, 'read R2 object');
    }
  }

  async getStream(storageKey) {
    try {
      const response = await this.client.send(
        new GetObjectCommand({
          Bucket: this.config.bucketName,
          Key: storageKey,
        })
      );

      return response.Body;
    } catch (error) {
      throw normalizeStorageError(error, 'stream R2 object');
    }
  }

  async exists(storageKey) {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.config.bucketName,
          Key: storageKey,
        })
      );

      return true;
    } catch (error) {
      if (error.name === 'NotFound' || error.$metadata?.httpStatusCode === 404) {
        return false;
      }

      throw normalizeStorageError(error, 'check R2 object');
    }
  }

  async copy(sourceStorageKey, targetStorageKey) {
    try {
      if (await this.exists(targetStorageKey)) {
        throw new StorageError('[STORAGE] target storage key already exists', 'STORAGE_TARGET_EXISTS');
      }

      await this.client.send(
        new CopyObjectCommand({
          Bucket: this.config.bucketName,
          Key: targetStorageKey,
          CopySource: `${this.config.bucketName}/${encodeCopySourceKey(sourceStorageKey)}`,
        })
      );

      return { storageKey: targetStorageKey };
    } catch (error) {
      throw normalizeStorageError(error, 'copy R2 object');
    }
  }

  async move(sourceStorageKey, targetStorageKey) {
    await this.copy(sourceStorageKey, targetStorageKey);
    await this.delete(sourceStorageKey);

    return { storageKey: targetStorageKey };
  }

  async delete(storageKey) {
    try {
      await this.client.send(
        new DeleteObjectCommand({
          Bucket: this.config.bucketName,
          Key: storageKey,
        })
      );

      return true;
    } catch (error) {
      throw normalizeStorageError(error, 'delete R2 object');
    }
  }

  async deleteTemporary(storageKey) {
    if (!storageKey.startsWith(`${STORAGE_DIRECTORIES.TEMPORARY}/`)) {
      throw new StorageError('[STORAGE] temporary storage key must be under temporary/', 'STORAGE_INVALID_KEY');
    }

    return this.delete(storageKey);
  }
}

module.exports = R2StorageDriver;
