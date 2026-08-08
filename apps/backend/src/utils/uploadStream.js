const crypto = require('node:crypto');
const { Transform } = require('node:stream');
const env = require('../config/env');
const {
  UPLOAD_SIGNATURE_PREFIX_BYTES,
  validateUploadedFileSignature,
} = require('../validators/upload.validator');

const createUploadValidationError = (message, statusCode = 422, code = 'UPLOAD_VALIDATION_ERROR') => {
  const error = new Error('File upload tidak valid');
  error.statusCode = statusCode;
  error.code = code;
  error.errors = [{ field: 'file', message }];

  return error;
};

class UploadInspectionStream extends Transform {
  constructor({ extension, maxFileSizeBytes = env.upload.maxFileSizeBytes } = {}) {
    super();
    this.extension = extension;
    this.maxFileSizeBytes = maxFileSizeBytes;
    this.hash = crypto.createHash('sha256');
    this.fileSize = 0;
    this.prefixChunks = [];
    this.prefixLength = 0;
    this.signatureValidated = false;
    this.pendingChunks = [];
    this.checksum = null;
  }

  collectPrefix(chunk) {
    if (this.prefixLength >= UPLOAD_SIGNATURE_PREFIX_BYTES) return;

    const remaining = UPLOAD_SIGNATURE_PREFIX_BYTES - this.prefixLength;
    const prefixChunk = chunk.subarray(0, Math.min(remaining, chunk.length));
    this.prefixChunks.push(prefixChunk);
    this.prefixLength += prefixChunk.length;
  }

  validateSignatureIfReady({ final = false } = {}) {
    if (this.signatureValidated) return;
    if (!final && this.prefixLength < UPLOAD_SIGNATURE_PREFIX_BYTES) return;

    const prefixBuffer = Buffer.concat(this.prefixChunks, this.prefixLength);
    validateUploadedFileSignature({
      extension: this.extension,
      prefixBuffer,
    });
    this.signatureValidated = true;

    for (const pendingChunk of this.pendingChunks) {
      this.push(pendingChunk);
    }
    this.pendingChunks = [];
  }

  _transform(chunk, encoding, callback) {
    try {
      const bufferChunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk, encoding);
      this.fileSize += bufferChunk.length;

      if (this.fileSize > this.maxFileSizeBytes) {
        callback(createUploadValidationError(
          `Ukuran file melebihi batas ${this.maxFileSizeBytes} bytes`,
          413,
          'LIMIT_FILE_SIZE'
        ));
        return;
      }

      this.hash.update(bufferChunk);
      this.collectPrefix(bufferChunk);

      if (!this.signatureValidated) {
        this.pendingChunks.push(bufferChunk);
        this.validateSignatureIfReady();
      } else {
        this.push(bufferChunk);
      }

      callback();
    } catch (error) {
      callback(error);
    }
  }

  _flush(callback) {
    try {
      if (this.fileSize <= 0) {
        callback(createUploadValidationError('File kosong tidak diperbolehkan'));
        return;
      }

      this.validateSignatureIfReady({ final: true });
      this.checksum = this.hash.digest('hex');
      callback();
    } catch (error) {
      callback(error);
    }
  }

  getResult() {
    return {
      checksum: this.checksum,
      fileSize: this.fileSize,
    };
  }
}

module.exports = {
  UploadInspectionStream,
  createUploadValidationError,
};
