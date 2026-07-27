# EDMS Backend

Backend foundation untuk Engineering Document Management System (EDMS) Rebuild.

## Monorepo Location

Backend berada di `apps/backend`.

## Technology Stack

- Node.js
- Express.js
- MySQL
- JWT
- bcrypt
- Multer

## Environment Setup

1. Install dependency:

```bash
npm install
```

2. Salin konfigurasi environment:

```bash
cp .env.example .env
```

3. Pastikan konfigurasi `.env` sesuai environment lokal.

File `.env` tidak boleh di-commit. File `.env.example` hanya berisi template tanpa secret asli.

## Cara Menjalankan Backend

Mode development:

```bash
npm run dev
```

Mode production:

```bash
npm start
```

## Database Requirements

- MySQL harus aktif sebelum backend dijalankan.
- Database `edms_smpv` harus sudah tersedia.
- Konfigurasi database berasal dari file `.env`.
- Backend akan gagal startup apabila koneksi database gagal.
- Jangan menulis credential asli ke `.env.example`, README, source code, atau log.

## Storage Requirements

- Storage backend dipilih melalui `STORAGE_DRIVER` (`local` atau `r2`).
- Local development dan Railway Volume memakai driver `local`; perbedaannya hanya `STORAGE_PATH`.
- Default local development adalah `./storage`.
- Backend harus memiliki izin read/write pada storage local atau credential R2 yang valid.
- Folder root storage, `temporary/`, dan `projects/` akan dibuat otomatis saat startup untuk driver local.
- File fisik tidak disimpan di database.
- Database hanya menyimpan relative storage key, bukan absolute path.
- Jangan commit isi storage atau logs ke Git.

## Temporary Upload Pipeline

- Temporary upload menggunakan `POST /api/v1/storage/temporary-uploads`.
- Field multipart wajib bernama `file`.
- Upload awal disimpan pada `temporary/{temporaryFileId}/{physicalFileName}` melalui Storage Service.
- Response hanya berisi metadata temporary upload; belum membuat Document, Revision, Workflow, atau metadata permanen database.
- Batas ukuran file dikonfigurasi melalui `UPLOAD_MAX_FILE_SIZE_BYTES`.
- Metadata temporary upload disimpan persisten di tabel `temporary_uploads` dan masa berlakunya dikonfigurasi melalui `UPLOAD_TEMPORARY_TTL_HOURS`.

## Document Foundation

- Create Document foundation menggunakan `POST /api/v1/documents`.
- Request memakai `temporaryFileId` dari temporary upload, lalu backend memanggil `StorageService.finalize()`.
- File permanent disimpan sebagai relative key `projects/{projectId}/documents/{documentId}/revisions/{revisionId}/{physicalFileName}`.
- Phase ini membuat Document, Stored File metadata, dan Revision pertama; belum menjalankan workflow review, viewer/download, SLA, notification, atau audit trail.

## Health Endpoint

```http
GET /api/v1/health
```

Endpoint health memeriksa API, database, dan storage.

## Startup Dependency Behavior

Backend hanya dianggap siap setelah:

- Environment tervalidasi.
- Database berhasil terkoneksi.
- Storage berhasil diinisialisasi.
- Storage write access berhasil diverifikasi.

Jika salah satu dependency gagal, backend tidak menjalankan HTTP server.

## Graceful Shutdown

Backend menangani `SIGINT` dan `SIGTERM` dengan menutup HTTP server dan MySQL connection pool.

## Foundation Scope

Phase foundation belum memiliki fitur bisnis. Belum ada authentication, authorization, upload/download endpoint, workflow, repository bisnis, migration, atau seeder.
