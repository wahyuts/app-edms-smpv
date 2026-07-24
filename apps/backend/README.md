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

- Storage backend dikonfigurasi melalui `STORAGE_PATH`.
- Default local development adalah `./storage`.
- Backend harus memiliki izin read/write pada storage.
- Folder root storage dan `projects/` akan dibuat otomatis saat startup.
- File fisik tidak disimpan di database.
- Jangan commit isi storage atau logs ke Git.

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
