# Local MariaDB Email Optional - Final Execution

Date: 2026-10-20 (Asia/Bangkok, UTC+07:00)

Status: LOCAL MIGRATION COMPLETE - VERIFICATION & UAT PASS

## A. Environment

- Target: XAMPP lokal, `edms_smpv_dev`, MariaDB `10.4.32-MariaDB`, `127.0.0.1:3306`.
- Hostname: `DESKTOP-3DFA1TA`. Executable/configuration/PID/basedir dicocokkan dengan XAMPP lokal.
- Backend EDMS dan nodemon dihentikan sebelum backup. Tidak ada transaksi lain atau database event aktif pada gate backup.
- Dedicated migration connection ID: `98`, sama untuk session mode, preflight, migration dan verification.
- Session SQL mode: `IGNORE_SPACE,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION`.
- Seluruh mode sesi existing dipertahankan. Global mode tetap `NO_ZERO_IN_DATE,NO_ZERO_DATE,NO_ENGINE_SUBSTITUTION`.
- Waktu migration/verification: 2026-10-20 12:28:19 - 12:28:20 Asia/Bangkok.

## B. Backup

- Status: PASS; mysqldump XAMPP exit 0 tanpa stderr, mencakup seluruh 24 tabel, data, routines/events/triggers.
- Lokasi: `D:\Project\app-edms-smpv\tmp\local-db-backups\email-optional-2026-10-20T05-27-28-569Z\edms_smpv_dev_before_email_optional.sql`.
- Ukuran: 337746 byte.
- Waktu: 2026-10-20 12:27:28 Asia/Bangkok.
- SHA-256: `1cd08862fe1de6535855ca8255219d4257eb8973003eaa88a517027ba637a2a6`.
- Pemeriksaan isi: 24 CREATE TABLE cocok dengan jumlah tabel, data users tersedia, penanda dump selesai tersedia. Checksum diperiksa ulang sebelum ALTER.
- Direktori `tmp/` diabaikan Git. Backup mengandung data sensitif dan tidak dimasukkan version control.
- Restore test: NOT RUN; tidak ada server/database sementara terisolasi yang terverifikasi. Validasi dump bukan bukti restore berhasil.

## C. Migration

| Tahap | Hasil |
|---|---|
| Preflight existing | BASELINE PASS; 21/21 statement selesai |
| Snapshot user / metadata | Lengkap: 1598 / 14414 byte |
| MariaDB migration existing | PASS; satu ALTER, 2/2 statement selesai, SHOW WARNINGS kosong |
| Verification Phase C1.1 | PASS; 31/31 statement selesai |
| Structure | STRUCTURE PASS |
| Data integrity | PASS - ORIGINAL USER ROWS AND EMAIL BYTES UNCHANGED |
| Other metadata | PASS - OTHER COLUMNS, INDEXES AND CONSTRAINTS UNCHANGED |
| Final verification | VERIFICATION PASS - RUNTIME UAT STILL REQUIRED |
| Jumlah user sebelum / sesudah migration | 7 / 7 |

`users.email` nullable; `email_uniqueness_key` PERSISTENT dengan expression yang sesuai; `uq_users_email_uniqueness_key` dan `idx_users_email` tersedia; `uq_users_email` telah digantikan. Tidak ditemukan duplicate ordinary key atau mismatch generated value pada verification. Tidak ada retry ALTER, perubahan schema lain, foreign_key_checks override atau perubahan data existing.

## D. UAT

Metode: validator/service aplikasi existing dengan MariaDB lokal nyata; recovery melalui controller existing dan provider dummy dalam proses UAT. Tidak ada mock repository/database. Pengujian ini tidak mengklaim manual browser UAT.

| No. | Skenario | Hasil |
|---|---|---|
| 1 | Create User tanpa email -> SQL NULL | PASS |
| 2 | Create User whitespace-only -> SQL NULL | PASS |
| 3 | Dua user shared email pertama, trim/case-insensitive | PASS |
| 4 | Dua user shared email kedua, trim/case-insensitive | PASS |
| 5 | Email biasa pertama berhasil | PASS |
| 6 | Email biasa duplikat ditolak service | PASS |
| 7 | Email biasa duplikat beda case ditolak | PASS |
| 8 | Edit User mempertahankan email sendiri | PASS |
| 9 | Edit User menghapus email -> SQL NULL | PASS |
| 10 | Edit Profile menghapus email -> SQL NULL | PASS |
| 11 | Email leading/trailing whitespace dinormalisasi | PASS |
| 12 | Email invalid ditolak Create/Edit/Profile validators | PASS |
| 13 | Forgot Password dua username dengan shared email -> token masing-masing + dummy outbox | PASS |
| 14 | Forgot Password username/email tidak cocok -> generic response, tanpa token/email baru | PASS |
| 15 | Forgot Password user NULL email -> tanpa reset token/email | PASS |
| 16 | Concurrent database insert ordinary email -> satu sukses, satu ER_DUP_ENTRY | PASS |
| 17 | Edit User email ordinary milik user lain ditolak | PASS |
| 18 | Edit Profile email ordinary milik user lain ditolak | PASS |
| 19 | Edit User ke shared email diperbolehkan | PASS |
| 20 | Edit Profile ke shared email diperbolehkan | PASS |

- Total: 20 skenario, 20 PASS, 0 FAIL.
- Concurrent insert memakai dua insert database nyata; tepat satu berhasil, satu ER_DUP_ENTRY, dan helper existing memetakan field email dengan benar.
- Dua email recovery masuk dummy dev outbox di memori; tidak ada email sungguhan dikirim. Provider hanya diatur untuk proses UAT, tanpa mengubah .env atau kode aplikasi.
- Cleanup PASS: 9 fixture users, credential dan reset token miliknya dibersihkan berdasarkan ID serta kepemilikan username tepat. Tidak ada cleanup massal berdasarkan email.
- Jumlah user sesudah cleanup: 7. Seluruh row user existing, credential dan reset token existing dibandingkan dan tetap identik.
- Fingerprint agregat row user setelah cleanup: `efa6287b07d40afed4bb4f583282f69900ff88974677ecab51610fd4bad9fb36`.
- Nilai AUTO_INCREMENT dapat maju akibat insert/rollback fixture; tidak direset dan tidak mengubah id user existing.
- Manual browser UAT dan backup restore test tidak dijalankan.

## E. Safety

- Railway: NOT ACCESSED.
- Global SQL Mode / my.ini: UNCHANGED.
- Frontend/backend, Forgot Password, RBAC, Business Workflow dan canonical schema: UNCHANGED selama eksekusi ini.
- Schema database selain perubahan users yang disetujui: UNCHANGED.
- Migration MySQL: NOT EXECUTED.
- Seed/reset: NOT EXECUTED.
- Deployment/commit/push: NOT PERFORMED.
- Backend lokal dinyalakan kembali setelah verification dan cleanup UAT PASS; frontend existing tetap berjalan.
- Tidak ada password, token reset, credential atau row personal user disimpan pada laporan ini.

## F. Final Verdict

**LOCAL MIGRATION COMPLETE — VERIFICATION & UAT PASS**

Eksekusi selesai khusus XAMPP lokal. Tidak dilanjutkan ke Railway.
