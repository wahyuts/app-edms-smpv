# Optional Email and Selective Uniqueness - MariaDB Local Package

Status: PREPARED ONLY / PREFLIGHT AND MIGRATION NOT EXECUTED

Date: 2026-10-20

Target: XAMPP lokal, MariaDB 10.4.32, database `edms_smpv_dev`.

## 1. Scope dan Urutan Environment

Paket ini hanya menyiapkan file. Eksekusi preflight dan migration memerlukan persetujuan terpisah. Jangan menjalankan folder migration secara keseluruhan.

Urutan resmi:

1. XAMPP Lokal - MariaDB 10.4.32.
2. Railway Development - MySQL.
3. Railway Staging - MySQL.
4. Railway Production - MySQL.

Setiap environment mengikuti Preflight -> Approval -> Backup sesuai kebutuhan -> Migration -> Verification -> UAT. Environment berikutnya menunggu verification dan UAT sebelumnya berhasil. File MySQL existing dipertahankan, tetapi urutan lokal dalam dokumen ini berlaku sebelum langkah Railway.

## 2. Compatibility Assessment

| Area | Keputusan dan batasan |
|---|---|
| Generated column | Gunakan `GENERATED ALWAYS AS (...) PERSISTENT`. MariaDB mendukung `STORED` sebagai alias, sehingga canonical schema tetap setara tanpa diedit. |
| Unique index | `uq_users_email_uniqueness_key` mengindeks seluruh `VARCHAR(255)` generated column. Banyak NULL diterima; ordinary key tetap dilindungi database saat concurrent writes. |
| Expression | `CASE`, `LOWER`, `TRIM`, dan `COLLATE` menggunakan nilai dalam row dan fungsi deterministik. Tidak ada UDF, subquery, waktu, atau variabel sesi dalam expression. Input VARCHAR dan TRIM menghindari ketergantungan padding CHAR. |
| Collation | Key biasa tetap `utf8mb4_unicode_ci`, termasuk semantik accent-insensitive existing. Pencocokan dua email khusus memakai `utf8mb4_bin` setelah lowercase/trim, sehingga alamat dengan aksen tidak mendapat pengecualian. |
| Normalisasi | Aturan tetap sama dengan MySQL: NULL/blank/shared email menghasilkan NULL, ordinary email menghasilkan LOWER(TRIM(email)). Aplikasi melakukan trim whitespace sebelum penyimpanan; preflight menolak whitespace pada data existing untuk review manual. |
| Panjang index | Maksimum 1020 byte untuk 255 karakter utf8mb4. Preflight mensyaratkan InnoDB Dynamic/Compressed dan page size minimal 8192 byte; page 8K menyediakan limit 1536 byte dan 16K menyediakan 3072 byte. Page 4K/Compact tidak diterima paket ini. |
| ALTER | Satu ALTER dengan `ALGORITHM=COPY, LOCK=EXCLUSIVE`; penambahan PERSISTENT dan penggantian index dapat membangun ulang tabel. Tidak memaksakan INSTANT/INPLACE atau LOCK=NONE. |
| DDL failure | MariaDB 10.4 belum memiliki jaminan crash-atomic DDL yang diperkenalkan pada 10.6. Implicit commit berlaku; transaksi ROLLBACK tidak membatalkan ALTER. |
| Snapshot | Tidak memakai JSON_OBJECTAGG/JSON_ARRAYAGG yang baru tersedia pada 10.5. Menggunakan GROUP_CONCAT terurut atas token HEX, dengan pemeriksaan ukuran untuk mendeteksi truncation. |

Ini penilaian berdasarkan referensi dan source code, bukan hasil eksekusi SQL pada server XAMPP. Versi aktual, konfigurasi, storage, privilege, dan error message driver tetap perlu diverifikasi setelah persetujuan.

## 3. Preflight Read-Only

File: `20261020_0001_email_optional_mariadb_preflight.sql`.

- Pastikan koneksi menuju XAMPP lokal, bukan Railway. Database aktif wajib `edms_smpv_dev`; versi diwajibkan tepat `10.4.32-MariaDB` dengan suffix distribusi diperbolehkan. Versi lain membutuhkan review baru, meskipun mungkin mendukung sintaksnya.
- Setelah persetujuan preflight, hentikan seluruh writer aplikasi pada database lokal selama snapshot sampai verification. Gunakan akun yang dapat melihat seluruh metadata constraint, dependency, dan trigger yang relevan. Missing privileges atau SQL error berarti STOP, bukan hasil kosong yang dianggap aman.
- Inspeksi SHOW CREATE TABLE dan result set kolom/index/constraint/FK/trigger. Baseline users terdiri dari 12 kolom existing, email VARCHAR(255) NOT NULL tanpa default/comment khusus, dan satu full unique index uq_users_email. Schema yang sudah dimigrasikan harus STOP, bukan migration ulang.
- Preflight menolak trigger, FK yang memakai email, CHECK yang mereferensikan email, index unique email tambahan, konflik ordinary email, nilai invalid/whitespace, serta konfigurasi storage/mode yang tidak sesuai. Tidak ada perbaikan data otomatis.
- Verdict wajib `BASELINE PASS`. Jika `STOP - BASELINE INCOMPATIBLE` (ditampilkan dengan tanda pemisah panjang dalam SQL), telusuri hasil diagnostik dan hentikan rencana migration. Jangan mengubah konfigurasi/data untuk memaksa PASS tanpa review.
- Snapshot menyimpan semua nilai 12 kolom user dalam token HEX, termasuk NULL marker; snapshot metadata merekam kolom selain email, index/constraint selain penggantian email, CHECK, FK masuk/keluar, serta atribut tabel. Perbandingan bersifat binary agar tidak mengabaikan perubahan huruf/case/whitespace.
- GROUP_CONCAT memiliki batas `group_concat_max_len`. Snapshot hanya valid bila panjang hasil tepat sama dengan jumlah byte yang dihitung dan tidak melampaui batas. Jika terlalu besar, verdict STOP. Jangan menaikkan setting secara diam-diam; rencanakan export comparison terpisah untuk persetujuan.
- Pertahankan koneksi yang sama dan export hasil diagnostik secara aman. Semua variabel `@memail_*` hanya berada dalam memori koneksi; disconnect menghilangkan bukti. Snapshot bukan backup dan tidak memberi izin migration.

## 4. Backup dan Migration Setelah Persetujuan

File: `20261020_0001_email_optional_mariadb.sql`.

1. Review hasil preflight dan dapatkan approval migration terpisah.
2. Siapkan backup logical schema/data yang dapat direstore. Karena users direferensikan banyak tabel, backup database lokal lengkap lebih mudah direkonsiliasi dibanding restore users saja. Jangan mengambil filesystem copy InnoDB saat server masih aktif sebagai pengganti backup yang konsisten.
3. Catat lokasi backup, target server/database, jumlah user, dan hasil SHOW CREATE TABLE sebelum tindakan. Backup belum dibuat oleh fase persiapan ini.
4. Pastikan writer masih berhenti, koneksi snapshot tetap sama, disk cukup untuk tabel/index salinan, dan proses lain tidak menahan metadata lock. Tidak ada jaminan ALTER akan selesai cepat atau tanpa lock.
5. Jalankan hanya file MariaDB yang sudah disetujui. Satu ALTER memasang unique key pengganti bersama penghapusan index lama, sehingga tidak ada interval terpisah DROP-only yang committed. LOCK=EXCLUSIVE juga menahan akses selama rebuild. Ini tidak membuat MariaDB 10.4 menjadi crash-safe.
6. Inspeksi SHOW WARNINGS. Jangan menjalankan seed, reset, UPDATE email massal, atau menonaktifkan foreign_key_checks.

## 5. Verification dan UAT

File: `20261020_0001_email_optional_mariadb_verify.sql`.

- Jalankan setelah approval/migration, sebelum writer diaktifkan, dalam koneksi dan sql_mode yang sama.
- Verifikasi target, nullable email, PERSISTENT generated column, expression, unique index penuh, penghapusan uq_users_email, dan idx_users_email. Phase C1.1 mengganti normalisasi teks global dengan grammar CASE tetap menggunakan PCRE named subroutines MariaDB. Grammar mengizinkan LOWER/LCASE, case keyword, whitespace antartoken, identifier email dengan backtick, dan pasangan parentheses seimbang hanya pada subexpression yang dikenali. Isi literal tidak diubah; operator, kondisi, urutan branch, tepat dua shared email, utf8mb4_bin, hasil NULL dan LOWER(TRIM(email)) wajib sesuai.
- Introducer _utf8mb4 hanya diterima pada literal kosong dan dua alamat ASCII yang persis sesuai, sehingga byte literal tetap sama dan COLLATE utf8mb4_bin pada operand kiri tetap menentukan perbandingan. Introducer lain, literal dengan case/whitespace berbeda, atau COLLATE tambahan ditolak. Ini whitelist representasi yang terbukti setara, bukan general-purpose SQL equivalence checker. Expression NULL/kosong, lebih dari 8192 byte, atau representasi lain tetap fail-closed; hasil yang mungkin ekuivalen tetapi belum dikenali harus direview berdasarkan metadata runtime, tanpa melonggarkan pemeriksaan otomatis.
- Grammar memakai REGEXP, named subroutine dan recursive grouping yang didokumentasikan MariaDB; anchor absolut dibentuk dengan CHAR(92), sehingga tidak bergantung pada backslash escaping sql_mode. Pencocokan subject binary mempertahankan case literal dan membedakan nama collation. Error regex atau statement apa pun tetap berarti STOP. Pengujian PCRE lokal merupakan validasi statis, bukan bukti runtime MariaDB 10.4.32. Snapshot dan seluruh gate final verification tetap berlaku.
- Bandingkan seluruh row user dan metadata constraint/index/kolom lain dengan snapshot preflight. Jumlah user, id, user_code, username, full_name, email, status, role, department dan timestamp existing harus tetap sama.
- Snapshot yang hilang, truncated, atau berasal dari koneksi/mode berbeda wajib NOT VERIFIED. Jika koneksi terputus, hentikan kelanjutan otomatis dan rencanakan perbandingan export/backup secara terpisah; jangan menganggap data utuh hanya dari jumlah row.
- Query diagnostik duplicate ordinary email dan mismatch key harus kosong. Key dibandingkan melalui HEX, bukan hanya collation case-insensitive.
- Verification tidak membuat user uji. Setelah verification PASS, UAT memerlukan tindakan terpisah: banyak NULL, kedua shared email, mixed case, whitespace, ordinary duplicate, concurrent insert, Create/Edit/Profile, dan regression Forgot Password. Uji juga error 1062 melalui mysql2 agar field email tetap dipetakan dengan benar.
- Backend memilih generated column secara eksplisit, bukan meminta optimizer mengenali expression secara otomatis. INSERT/UPDATE memakai daftar kolom existing dan tidak menulis generated column; nama kolom/index dan ER_DUP_ENTRY tetap sesuai. Tidak diperlukan perubahan kode aplikasi dari pemeriksaan statis ini.

## 6. Failure dan Rollback

Jika ALTER gagal, koneksi terputus, XAMPP berhenti atau listrik mati:

1. Hentikan writer dan jangan ulangi migration atau menjalankan reverse ALTER secara buta.
2. Catat error dan keadaan server. Setelah server dapat diakses dengan approval, inspeksi SHOW CREATE TABLE, COLUMNS, STATISTICS, constraints/FK, dan keterbacaan user; bandingkan dengan baseline/backup.
3. Jangan mengasumsikan semua perubahan diterapkan atau semuanya dibatalkan. MariaDB 10.4 tidak menjamin crash-atomic DDL. Jika struktur/data tidak dapat dibuktikan konsisten, pemulihan DBA/backup perlu approval tersendiri.
4. Forward fix umumnya lebih aman setelah fitur mulai digunakan. Restore backup dapat menghilangkan perubahan setelah backup dan harus direkonsiliasi bersama tabel terkait.

Rollback ke schema lama hanya dapat dipertimbangkan dengan backup, approval, writer berhenti, semua Email non-NULL, dan seluruh Email unik menggunakan collation email lama, termasuk kedua shared email. Periksa juga perubahan schema/data setelah migration. Backend versi lama harus dipasangkan dengan schema yang kompatibel; backend prepared saat ini membutuhkan email_uniqueness_key.

Jika ada Email NULL atau beberapa user memakai shared email, rollback langsung ke NOT NULL + uq_users_email tidak aman dan dapat gagal. Tidak boleh menghapus akun atau mengganti email untuk memaksanya. Keputusan remediasi manual memerlukan persetujuan pemilik data/bisnis. Tidak disediakan rollback SQL otomatis.

## 7. Status dan Referensi

Static review selesai; preflight runtime, backup, migration, verification runtime, concurrency, crash recovery dan UAT: NOT RUN / PENDING APPROVAL. Tidak ada database yang diakses atau dimodifikasi pada Phase C1.

- [MariaDB Generated Columns](https://mariadb.com/docs/server/reference/sql-statements/data-definition/create/generated-columns)
- [MariaDB ALTER TABLE algorithm and lock](https://mariadb.com/docs/server/reference/sql-statements/data-definition/alter/alter-table)
- [MariaDB InnoDB DYNAMIC index limits](https://mariadb.com/docs/server/server-usage/storage-engines/innodb/innodb-row-formats/innodb-dynamic-row-format)
- [MariaDB GROUP_CONCAT](https://mariadb.com/docs/server/reference/sql-functions/aggregate-functions/group_concat)
- [MariaDB 10.5 JSON aggregate introduction](https://mariadb.com/docs/release-notes/community-server/old-releases/10.5/what-is-mariadb-105)
- [MariaDB crash-safe DDL introduced in 10.6](https://mariadb.com/resources/blog/crash-safe-ddl-of-innodb-tables-in-mariadb-server-10-6/)
- [MariaDB Error 1062](https://mariadb.com/docs/server/reference/error-codes/mariadb-error-codes-1000-to-1099/e1062)
- [MariaDB PCRE subroutines and recursive patterns](https://mariadb.com/docs/server/reference/sql-functions/string-functions/regular-expressions-functions/pcre)
