# Sprint B - Recovery & Isolated Validation

Tanggal pemeriksaan: 2 November 2026.

## A. Isolated Environment

- Engine: MariaDB 10.4.32, host DESKTOP-3DFA1TA, bind 127.0.0.1, port 13317, server ID 13317.
- Root instance: `D:\Project\app-edms-smpv\tmp\mariadb-sprint-b-20261102`.
- Datadir: `data` di bawah root tersebut; config, system tablespace, redo logs, PID file, scratch, dan log menggunakan root baru, bukan datadir XAMPP original.
- Binary XAMPP digunakan ulang tanpa mengubah binary/config/data original. Tidak mendaftarkan Windows service.
- PID pengujian: 32280. Instance dihentikan melalui SHUTDOWN setelah identitas port/datadir/PID diverifikasi. Log mencatat shutdown lengkap.
- Proses original PID 31688 tetap berjalan; tidak dihentikan, direstart, atau direpair oleh pekerjaan ini.
- Akun SQL pengujian dibatasi pada `edms_sprint_b_isolated`; pembacaan database restore ditolak dan diuji.
- Credential acak dan hasil restore berisi data nyata hanya berada dalam direktori lokal gitignored. Jangan memasukkan direktori tersebut ke version control atau membagikannya.

Database terpisah pada instance baru:

| Database | Tujuan | Pengujian destruktif |
| --- | --- | --- |
| edms_restore_validation | Restore pertama dan pemeriksaan ulang | Tidak |
| edms_restore_validation_confirmed | Pemeriksaan warning restore | Tidak |
| edms_restore_validation_reviewed | Restore final dengan warning gate spesifik | Tidak |
| edms_sprint_b_isolated | 34 tabel dari schema/migration dan fixture sintetis | Ya, hanya fixture pengujian |

## B. Backup Restore Validation

Backup original tidak diubah:

- Lokasi: `D:\EDMS-Database-Backup\20261102_201931_697ca290\edms_smpv_dev_20261102_201931.sql`.
- Ukuran: 1.001.967 byte.
- SHA-256: `3796876d7886d4623414997ada31d0efaba44328d888421fa40c7b58d945b56b`.
- Restore final: PASS, 24 tabel dan 1.231 baris.
- Struktur CREATE TABLE cocok dengan dump; perbandingan mengabaikan counter AUTO_INCREMENT, bukan definisi kolom/constraint.
- Metadata: 24 primary key, 22 unique constraint, 57 foreign key, 41 CHECK, dan 125 definisi index.
- Orphan foreign key: 0. Generated-value mismatch: 0.
- View, trigger, routine, event: masing-masing 0.
- Directive CREATE DATABASE/USE sumber tidak dijalankan; target restore dipilih secara eksplisit, tanpa mengganti isi data secara global.
- Ketiga database restore tetap memiliki jumlah baris per tabel yang sama setelah seluruh integration test.

Ada 23 warning 1906 karena dump menyertakan nilai generated column `users.email_uniqueness_key` dan `document_revisions.active_document_id`. MariaDB mengabaikan nilai tersebut dan menghitungnya ulang. Verifier hanya menerima kode/pesan yang cocok dengan dua kolom dan tabel tersebut; warning lain tetap menggagalkan restore. Nilai hasil perhitungan diperiksa secara independen.

Percobaan awal dipertahankan sebagai bukti, bukan dinyatakan PASS: checker pertama berbeda urutan nama tabel; percobaan kedua berhenti pada warning gate ketat. Restore ketiga menggunakan database baru dan gate warning yang telah direview, bukan overwrite database restore sebelumnya.

Bukti final: `20261102_0003_isolated_restore_results.json` dan `20261102_0003_isolated_final_verification.json`.

Restore ini memvalidasi pemulihan logical dump ke instance baru. Hasilnya bukan bukti kesehatan fisik InnoDB original atau bahwa masalah LSN original telah diperbaiki.

## C. Test Harness Changes

Perubahan fase recovery ini terbatas pada test infrastructure dan laporan:

| File | Perubahan |
| --- | --- |
| apps/backend/tests/helpers/isolatedMariaDb.cjs | Target eksplisit, identity gate, SQL scanner, bounded deadline, worker/signal race |
| apps/backend/tests/integration/prepareSprintBInstance.cjs | Inisialisasi instance terpisah, restore terarah, schema sintetis, akun terbatas |
| apps/backend/tests/integration/sprintADatabaseValidation.cjs | Wajib mode isolated, tanpa fallback .env/original, lifecycle dan deadline terikat |
| apps/backend/tests/integration/sprintBDatabaseValidation.cjs | Business/evidence/diagnostic pool independen, transaksi terlacak, fail-fast, bounded cleanup, negative probe |
| apps/backend/tests/integration/finalizeSprintBInstance.cjs | Pemeriksaan akhir restore/hasil/pool/backup, lalu shutdown hanya instance terverifikasi |
| apps/backend/tests/unit/isolatedHarness.test.js | Delapan pengujian helper, identity rejection, deadline, signal, dan batas API unlink |

Watchdog tidak lagi mengandalkan process.exit untuk menghentikan lifecycle. Query memiliki timeout; task/transaction/release/rollback failure dicatat. Failure menghentikan admission test baru, mengambil diagnostik melalui pool independen, dan menutup/destroy client milik harness secara terikat waktu. Tidak melakukan KILL query server sebagai fallback watchdog.

Negative probe sengaja menyisakan Promise JavaScript tanpa resolusi: exit 1 dengan TEST_DEADLINE, poolsClosed=true, unresolvedTasks=1 dan cleanup deadline tercatat. Ini keberhasilan deteksi kegagalan, bukan positive test PASS atau bukti task tersebut settled. Suite positif dijalankan ulang sesudahnya dan PASS tanpa unresolved task.

Menutup socket client tidak membuktikan query server langsung berhenti. Harness tetap melaporkan keadaan tidak pasti dan tidak menganggapnya aman untuk melanjutkan test. Root cause query stuck pada instance original tetap NOT CONFIRMED; tidak direproduksi pada instance bersih.

## D. Sprint B Validation

Semua 21 skenario integration pada MariaDB terisolasi PASS. Rincian aktual tersedia di `20261102_0003_sprint_b_isolated_results.json`.

| Skenario | Hasil | Bukti |
| --- | --- | --- |
| Migration empat tabel cleanup dan foreign key aktif | PASS | Integration MariaDB |
| Complete Archived, empat file, owned data, retained audit, final audit tunggal, dokumen lain utuh, repeat | PASS | Integration MariaDB + fake storage |
| Unbound file tetap Pending | PASS | Integration MariaDB |
| Shared reference lintas dokumen | PASS | Integration MariaDB |
| Legacy ambiguous ownership | PASS | Integration MariaDB |
| Crash setelah manifest, namespace salah, recovery namespace benar | PASS | Integration MariaDB |
| Manifest tamper | PASS | Integration MariaDB |
| Crash sebelum manifest | PASS | Integration MariaDB |
| Partial timeout menghasilkan Unknown tanpa auto-delete | PASS | Integration MariaDB + fake storage |
| Dua recovery worker | PASS | Integration MariaDB |
| Rollback metadata/audit dan retry tanpa duplicate storage IO | PASS | Integration MariaDB |
| Response loss setelah commit database | PASS | Integration MariaDB |
| Crash Inflight sebelum IO tetap Pending | PASS | Integration MariaDB |
| Crash setelah provider ACK sebelum evidence tetap unresolved | PASS | Integration MariaDB |
| Local file Pending, file/metadata tidak dihapus | PASS | Local sandbox + MariaDB |
| Evidence/diagnostic pool tersedia saat lima business slot penuh | PASS | Pool saturation assertion |
| Reservation concurrent idempotent/conflict | PASS | Integration MariaDB |
| Crash setelah storage sebelum database dan retry | PASS | Integration MariaDB + fake storage |
| Owned object sudah hilang, exact ACK idempotent | PASS | Integration MariaDB + fake storage |
| Normalized alias lintas dokumen | PASS | Integration MariaDB |
| Baseline sintetis dan global foreign key setting dipertahankan | PASS | Before/after assertions |

Seluruh destructive fixture berasal dari schema kosong/sintetis, bukan data restore. Fixture dipertahankan untuk pemeriksaan; tidak ada reset/cleanup massal.

## E. Local Storage Cleanup

Status: **PENDING - FAIL CLOSED**.

API portable Node pada lingkungan Windows ini tidak menyediakan unlink relatif terhadap directory handle yang memenuhi kebutuhan anti-race. FileHandle tidak diterima oleh fs.unlink (ERR_INVALID_ARG_TYPE); pemeriksaan path/realpath lalu unlink berdasarkan string masih membuka TOCTOU jika parent berubah. Tidak menambahkan native helper atau mengklaim jaminan yang tidak tersedia.

Pengujian sandbox memverifikasi file tetap ada dan status tidak berubah menjadi sukses palsu. Local physical cleanup dan file existing tanpa namespace binding tetap Pending. Tidak ada file di `apps/backend/storage/` yang dihapus atau digunakan sebagai fixture.

## F. Regression

| Validasi | Hasil | Evidence |
| --- | --- | --- |
| Backend unit suite, termasuk fake R2 dan local sandbox | 290 PASS, 0 FAIL | node --require ./apps/backend/tests/helpers/isolatedHttpRegression.cjs --test pada seluruh unit test |
| Sprint A real database regression | 18 PASS, 0 FAIL | 20261102_0003_sprint_a_isolated_results.json |
| Sprint B real database integration | 21 PASS, 0 FAIL | 20261102_0003_sprint_b_isolated_results.json |
| Watchdog negative probe | Expected failure terdeteksi | 20261102_0003_sprint_b_watchdog_probe.json |
| Syntax check perubahan JavaScript/CJS | PASS | node --check, 44 file |
| Whitespace diff | PASS | git diff --check |
| Final restore/identity/access/shutdown verification | PASS | 20261102_0003_isolated_final_verification.json |

Tidak melemahkan assertion existing. Query KILL pada regression Sprint A hanya menyasar koneksi test milik sendiri pada instance 13317 sebagai fault injection, bukan instance original.

## G. Safety Confirmation

- Tidak mengakses SQL instance original, mengubah `edms_smpv_dev`/`edms_db`, atau memodifikasi config/datadir original.
- Tidak menjalankan stop/restart/repair pada XAMPP original; tidak mengaktifkan innodb_force_recovery.
- Backup SQL original tetap sama berdasarkan checksum.
- Tidak mengubah real document storage, tidak mengakses Railway atau live Cloudflare R2.
- Tidak mengubah frontend, workflow, production application source, atau migration canonical pada fase recovery ini. Perubahan Sprint A/B yang sudah ada di working tree dipertahankan, tidak direvert.
- Tidak menambah public Delete endpoint; tidak commit, push, atau deploy.
- Instance test baru dihentikan normal; datadir dan fixture lokal tidak dihapus.

## H. Final Verdict

**SPRINT B COMPLETE WITH CONDITIONS**

Blocker validation MariaDB lokal terisolasi telah ditutup. Kondisi yang tetap berlaku:

1. Local physical cleanup tetap Pending karena batas race safety Windows/Node; bukan dukungan penghapusan lokal lengkap.
2. File existing yang belum bound ke namespace tetap Pending.
3. Live R2, MySQL deployment, dan operasi production belum divalidasi melalui pengujian ini.
4. Root cause/kesehatan InnoDB original belum dipastikan atau diperbaiki; hasil instance baru tidak menggantikan pekerjaan preservation/recovery terpisah.
5. Permanent Delete belum boleh diekspos publik berdasarkan laporan ini saja.

STOP setelah Sprint B. Sprint C/D/E, aktivasi publik, dan deployment memerlukan persetujuan owner terpisah.
