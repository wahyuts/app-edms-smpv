# Phase C2 - XAMPP Local MariaDB Read-Only Preflight

Status: PHASE C2 STOP - BASELINE INCOMPATIBLE

Tanggal pemeriksaan: 2026-10-20, 12:12:54 Asia/Bangkok (UTC+07:00).

Scope: preflight read-only Email Optional & Selective Email Uniqueness. Tidak ada persetujuan atau eksekusi migration.

## 1. Connection Verification

| Pemeriksaan | Hasil aktual |
|---|---|
| Environment | LOCAL DEVELOPMENT, XAMPP lokal |
| Database aktif | `edms_smpv_dev` |
| Engine/version | `10.4.32-MariaDB` |
| Host koneksi | `127.0.0.1` |
| Port | `3306` |
| Hostname server | `DESKTOP-3DFA1TA` |
| Connection ID preflight | `67` |
| Proses pemilik port | PID `15380`, `D:\xampp\mysql\bin\mysqld.exe` |
| Konfigurasi proses | `D:\xampp\mysql\bin\my.ini` |
| basedir / datadir server | `D:/xampp/mysql` / `D:\xampp\mysql\data\` |
| PID file server | `D:\xampp\mysql\data\mysql.pid`, cocok dengan PID proses lokal |
| SQL mode | `IGNORE_SPACE,NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION` |
| InnoDB page size | `16384` byte |
| InnoDB strict mode | `1` |
| group_concat_max_len | `1048576` byte |
| Metadata visibility | SHOW GRANTS mengonfirmasi global ALL PRIVILEGES; isi grant/credential tidak disimpan |
| Koneksi setelah pemeriksaan | Ditutup |

Identitas tidak hanya didasarkan pada localhost/nama database: konfigurasi backend, konfigurasi XAMPP, executable pemilik listener, basedir/datadir aktual, versi SQL dan PID file telah dicocokkan. Tidak ada koneksi Railway.

Preflight dijalankan pada satu koneksi dengan `START TRANSACTION READ ONLY`, isolation level `REPEATABLE-READ`, kemudian `ROLLBACK` dan koneksi ditutup. `@@session.tx_read_only` terbaca `0`; nilai tersebut tidak dipakai sebagai bukti standalone untuk transaksi aktif. Bukti pelaksanaan juga mencakup allowlist SELECT/SHOW/SET variabel user, tidak adanya DML/DDL, serta hasil SHOW CREATE TABLE yang identik sebelum/sesudah pemeriksaan.

## 2. Script dan Hasil Eksekusi

File: `database/migration/20261020_0001_email_optional_mariadb_preflight.sql`.

SHA-256 sebelum dan sesudah eksekusi:

`a3e94fa0af5087dca9ab202bfbe20b7db64e9f1a947fa67fb1dd962f1aa94f5a`

Script existing tidak dipatch. Seluruh 21 statement dieksekusi berurutan pada connection ID 67. Tidak digabung dengan migration atau verification. Tidak ada SQL error; warning status pada statement SET/SELECT INTO yang mengembalikan status adalah 0. Angka affectedRows dari SELECT INTO merupakan assignment variabel sesi, bukan perubahan row tabel.

| Statement | Pemeriksaan | Hasil |
|---|---|---|
| 1 | Identitas/configuration SQL | Sesuai target; strict SQL mode tidak aktif |
| 2 | SHOW CREATE TABLE users | Tertangkap; struktur existing belum dimigrasikan |
| 3 | Engine/row format/collation | InnoDB / Dynamic / utf8mb4_unicode_ci |
| 4 | Kolom | 12 kolom existing |
| 5 | Index | 7 index existing |
| 6 | Table constraints | 7 constraints |
| 7 | CHECK constraints | 1 CHECK, chk_users_status |
| 8 | Key column/dependency metadata | 31 row metadata |
| 9 | Referential constraints | 27 FK: 2 keluar dari users, 25 menuju users.id |
| 10 | Trigger users | 0 |
| 11 | Total user | 7 |
| 12 | Email invalid/NULL/kosong/whitespace | 0 row |
| 13 | Ordinary email duplicate setelah normalisasi | 0 grup |
| 14 | Identitas snapshot sesi | Tersimpan sementara pada connection 67 |
| 15-16 | Snapshot user dan kelengkapan | Lengkap, 1598 byte |
| 17-18 | Snapshot metadata dan kelengkapan | Lengkap, 14414 byte |
| 19 | Evaluasi baseline | @memail_baseline_pass = 0 |
| 20 | Verdict script | STOP - BASELINE INCOMPATIBLE |
| 21 | Evidence id/identity/email dalam HEX | 7 row dibaca di memori; data personal tidak disimpan dalam laporan |

Verdict aktual dari SQL menggunakan tanda pemisah panjang:

```text
STOP — BASELINE INCOMPATIBLE
```

## 3. Schema dan Existing Data

Struktur users terdiri dari id, user_code, username, full_name, email, department_id, department_name_snapshot, position, role_id, status, created_at, dan updated_at.

- Email: `VARCHAR(255) NOT NULL`, charset `utf8mb4`, collation `utf8mb4_unicode_ci`, default SQL NULL di metadata, tanpa comment/extra/generated expression.
- Index existing: PRIMARY(id), uq_users_user_code(user_code), uq_users_username(username), uq_users_email(email), idx_users_role_id(role_id), idx_users_department_id(department_id), idx_users_status(status). Semua BTREE; uq_users_email adalah full unique index tanpa prefix.
- email_uniqueness_key, uq_users_email_uniqueness_key dan idx_users_email belum tersedia, sesuai baseline sebelum migration.
- Constraint existing: PRIMARY, tiga UNIQUE di atas, chk_users_status, fk_users_department_id dan fk_users_role_id.
- Dua FK users keluar menuju departments.id dan roles.id. Seluruh 25 FK masuk mereferensikan users.id, bukan users.email. Tidak ditemukan FK atau CHECK yang menggunakan email dan tidak ada trigger users.
- Total user: 7. Invalid email: 0. Konflik ordinary email setelah normalisasi: 0 grup. Tidak ditemukan anomali email dalam pemeriksaan script ini.
- SHOW CREATE TABLE pada koneksi yang sama identik sebelum dan sesudah preflight; tidak ada perubahan schema dari operasi pemeriksaan.

## 4. Snapshot Assessment

| Evidence | User | Metadata |
|---|---|---|
| Jumlah token | 7 | 82 |
| Required bytes | 1598 | 14414 |
| Actual bytes | 1598 | 14414 |
| Complete flag | 1 | 1 |
| Terpotong | Tidak | Tidak |

Fingerprint agregat snapshot, tanpa isi data personal:

- User SHA-256: `ab950a8d65f146bd9c314785862aa38831869a7401c3c920af062749e529a1cc`.
- Metadata SHA-256: `9a7b61af68742531ec4766268bf601df8207991cfcc8654b33d8975bd7d2f1c2`.

```text
SESSION SNAPSHOT NOT PRESERVED FOR FUTURE MIGRATION
```

Koneksi 67 telah ditutup. Fingerprint dan laporan tidak menggantikan backup atau snapshot sesi untuk verification. Pada Phase C3, preflight/snapshot wajib diulang pada koneksi yang sama dengan migration/verification, atau menggunakan alternatif pembandingan yang sudah disetujui.

## 5. Blocker dan Diagnosis

Prasyarat yang gagal:

```sql
(@@sql_mode LIKE '%STRICT_TRANS_TABLES%' OR @@sql_mode LIKE '%STRICT_ALL_TABLES%')
```

Nilai SQL mode aktual tidak berisi keduanya. `innodb_strict_mode = 1` merupakan pemeriksaan berbeda dan tidak memenuhi prasyarat strict SQL mode tersebut.

Diagnosis tambahan berupa SELECT pada koneksi lokal terverifikasi ID 68 memeriksa predicate baseline non-snapshot secara terpisah: 24 dari 25 PASS; hanya predicate strict SQL mode di atas yang gagal. Kedua predicate kelengkapan snapshot telah terbukti bernilai 1 pada koneksi preflight 67. Script preflight tidak dijalankan ulang dan tidak diubah. Koneksi diagnostik juga menggunakan transaksi read-only dan ditutup.

Migration harus menunggu review/approval penanganan SQL mode dan preflight ulang yang memenuhi baseline. Tidak ada penyesuaian SQL mode, konfigurasi global, data atau schema untuk memaksa PASS.

## 6. Safety dan Keterbatasan Bukti

```text
XAMPP Database Access: READ-ONLY
XAMPP Schema Changes: NONE BY THIS TASK
XAMPP Data Changes: NONE BY THIS TASK
Migration SQL: NOT EXECUTED
Verification SQL: NOT EXECUTED
Seed/Reset: NOT EXECUTED
Railway Database: NOT ACCESSED
Frontend/Backend: UNCHANGED
Deployment: NOT PERFORMED
```

Tidak ada DML/DDL yang dikirim oleh runner; statement preflight dibatasi ke SELECT, SHOW dan SET variabel user. Operasi tambahan hanya identifikasi, pemeriksaan hak akses/predicate, serta pembukaan/penutupan transaksi read-only. Tidak ada pengaturan server/session SQL mode yang diubah.

Sesi aplikasi lain tidak dihentikan atau dibekukan dalam fase read-only ini. Karena itu, bukti tidak menyatakan bahwa seluruh database tidak mungkin berubah akibat aktivitas sesi lain. Pemeriksaan user menggunakan read-only consistent view, dan kesamaan schema terbukti pada SHOW CREATE TABLE sebelum/sesudah. Phase C3 tetap memerlukan penghentian writer, baseline/snapshot baru, approval dan backup yang sesuai.

Laporan ini bukan backup. Tidak ada password, token, credential, connection string sensitif atau row personal user yang disimpan di laporan.

## 7. Final Verdict

**PHASE C2 STOP — BASELINE INCOMPATIBLE**

Tidak ada migration yang dijalankan. Menunggu review hasil preflight dan persetujuan langkah berikutnya.
