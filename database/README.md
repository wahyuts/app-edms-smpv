Development

schema/schema.sql

↓

seed/seed-base.sql

↓

seed/seed-demo.sql

----------------------------------

Staging

schema/schema.sql

↓

seed/seed-base.sql

↓

seed/seed-staging.sql

----------------------------------

Production

schema/schema.sql

↓

seed/seed-base.sql

----------------------------------

Database Compatibility Policy

Seluruh migration dan canonical schema backend wajib kompatibel dengan database engine resmi proyek:

- MariaDB 10.4.32+
- MySQL 8.x

Hindari fitur SQL vendor-specific apabila tersedia solusi portable yang memenuhi kebutuhan arsitektural. Validasi teknis seperti batas ukuran upload wajib tetap dijalankan pada backend validator/service layer ketika constraint database lintas-engine tidak portable.

----------------------------------

Migration Guide

Fresh Installation

1. Import canonical schema sesuai environment.
2. Jalankan seed-base.
3. Jalankan backend.

Existing Development Database

1. Backup database.
2. Jalankan migration:
   database/migration/20260727_1533a_create_temporary_uploads.sql
3. Jangan menjalankan ulang canonical schema.
4. Jangan menjalankan ulang seed-base kecuali memang diminta.
5. Verifikasi tabel temporary_uploads.
6. Jalankan backend.

Existing Railway Database

1. Backup atau snapshot database apabila tersedia.
2. Jalankan migration yang sama.
3. Jangan import ulang schema-prod.sql.
4. Verifikasi migration berhasil.
5. Restart atau redeploy backend hanya jika diperlukan.
