# Sprint B - Final Local Cleanup Resolution

Tanggal: 2 November 2026. Scope: local exact cleanup dan existing-file binding saja.

## A. Root Cause

Local cleanup sebelumnya selalu `LOCAL_SAFE_DELETE_UNAVAILABLE` karena API unlink Node menerima path, bukan handle file/direktori. Pemeriksaan realpath/lstat lalu unlink masih memiliki celah pergantian parent/target.

File existing tanpa binding tidak memiliki bukti root/bucket asal. `stored_files` menyimpan file ID, document/project, key, ukuran, dan checksum opsional, tetapi key saja tidak membuktikan account/bucket R2 atau identitas root lokal. Karena itu `FILE_NAMESPACE_UNVERIFIED` sebelumnya benar dan tetap berlaku bila provenance belum cukup.

## B. Selected Solution

### Local Windows/NTFS

Helper C# kecil menggunakan API Windows secara langsung, tanpa dependency npm/native package baru, download, service, atau elevation:

1. Node mengompilasi source lokal menggunakan compiler .NET Framework 64-bit yang tersedia pada Windows aktual. Binary berada dalam direktori temp unik dengan ACL dibatasi untuk akun pelaksana, SYSTEM, dan Administrators.
2. Helper hanya menerima root dan relative key melalui stdin; tidak menggunakan shell interpolation atau argument perintah dari nama file.
3. Root wajib berada pada fixed local drive NTFS. UNC/network/removable filesystem dan namespace/path alias yang tidak dapat diverifikasi ditolak.
4. Handle setiap ancestor dari drive sampai parent file dipertahankan. Non-drive directories dibuka tanpa write/delete sharing. Setiap handle diverifikasi bukan reparse point dan final path-nya sesuai komponen yang diharapkan.
5. File dibuka dengan read/delete access, tanpa write/delete sharing. Directory, reparse point, hard link dengan link count bukan satu, DOS device name, ADS, trailing-dot alias, dan unsafe key ditolak.
6. Identitas persisten meliputi root identity, file identity (volume/file ID/creation time), SHA-256, dan ukuran. Penggantian file dengan byte identik tetapi identitas berbeda tetap ditolak.
7. Identitas dibandingkan ketika handle masih terbuka. Disposition diterapkan pada handle tersebut, bukan unlink path yang diperiksa sebelumnya. Handle file ditutup sebelum helper mengirim acknowledgement; ancestor tetap ditahan sampai proses pelepasan tersebut selesai.
8. Jika target memang sudah tidak ada dalam namespace terverifikasi dan ada expected identity yang sah, operasi exact-key tetap idempotent. Ini bukan izin menghapus file pengganti.
9. Error/timeout/crash setelah perintah DELETE dikirim dianggap outcome Unknown. Metadata dokumen tidak dihapus berdasarkan dugaan bahwa proses helper berhenti.

Dasar API: [CreateFile sharing dan reparse handling](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createfilea) serta [SetFileInformationByHandle / FileDispositionInfo](https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-setfileinformationbyhandle). Pengujian race menjadi bukti tambahan terhadap implementasi, bukan pengganti kontrak API.

PowerShell script sempat dicoba, tetapi execution policy menolak file script. Pendekatan tersebut tidak digunakan; tidak ada perubahan/bypass execution policy. Source akhir menggunakan executable C# yang dikompilasi lokal dan berjalan dengan akun biasa.

Safety boundary: OS/kernel dan source/runtime aplikasi harus tepercaya; helper tidak melindungi dari administrator/kernel yang sengaja memodifikasi proses atau kode. Tidak mengandalkan storage root otomatis privat. Sebaliknya, jika chain handle tidak dapat dipin karena ACL/sharing/reparse state, operasi berhenti fail-closed. Tidak melonggarkan sharing untuk memaksa keberhasilan. Disposition adalah penghapusan file normal Windows, bukan secure erasure; existing read handles dapat memengaruhi waktu pelepasan resource oleh OS.

### Existing-File Namespace Binding

`createBindingService(...).bind(...)` merupakan entry point internal, bukan endpoint atau startup task. Binding dilakukan satu file per panggilan, setelah reservation dan quiescence terkonfirmasi, menggunakan advisory claim yang sama dengan cleanup engine dan transaksi yang memasang gate/operation lock.

Trusted caller wajib membawa inventory provenance yang telah direview owner, berisi `recordId`, file/document/project ID, exact key, namespace eksplisit, ukuran, dan SHA-256. Untuk lokal, wajib ada native root/file identity yang direview. Data ini bukan payload yang boleh dipercaya langsung dari frontend. Record ID merupakan referensi persetujuan operasional, bukan tanda tangan kriptografis atau bukti otomatis bahwa sejarah storage telah diverifikasi.

Service memverifikasi Admin aktif pada project target, seluruh relasi ownership/shared reference/legacy alias, metadata size/checksum yang tersedia, dan namespace adapter. Namespace tidak ditentukan hanya dari current environment atau object key yang sama. Pembacaan storage exact-key digunakan untuk memeriksa hash/size, bukan untuk menebak provenance historis.

Sidecar `storage_namespaces` dan `stored_file_namespace_bindings` existing digunakan kembali. Binding tidak mengubah stored-file content, lokasi, atau business metadata. Snapshot upload yang kompatibel boleh diperkaya dengan bukti reviewed secara eksplisit, sebelum manifest difinalisasi. Binding identik idempotent; conflicting binding dan perubahan setelah manifest final ditolak.

R2 development dan production tetap namespace berbeda. Cleanup namespace dipin ke account/endpoint/bucket saat adapter dibuat, sesuai endpoint SDK client; perubahan object config kemudian tidak mengalihkan cleanup. Inspection melakukan streaming SHA-256 tanpa mengumpulkan seluruh file ke buffer. Pengujian R2 hanya menggunakan adapter palsu.

Asumsi R2 existing tetap berlaku: immutable exact keys dan tidak ada out-of-band writer yang melewati application admission/ownership boundary. Pengujian ini tidak mengesahkan bucket nyata atau provenance file nyata.

## C. Implementation

| File | Alasan |
| --- | --- |
| apps/backend/src/storage/native/WindowsExactFile.cs | Handle pinning, reparse/identity/link checks, hash, exact disposition, protocol acknowledgement |
| apps/backend/src/storage/windowsExactFile.js | Compiler lokal/private binary, stdin protocol, bounded helper lifecycle dan outcome Unknown |
| apps/backend/src/storage/drivers/localStorage.driver.js | Read-only inspection dan exact cleanup dengan durable localIdentity |
| apps/backend/src/storage/drivers/r2Storage.driver.js | Explicit-namespace streaming inspection dan immutable cleanup namespace snapshot |
| apps/backend/src/services/storage.service.js | Meneruskan evidence ke adapter; expose inspection internal |
| apps/backend/src/services/existingFileBinding.service.js | Reviewed per-file binding, Admin/gate/ownership validation, transaksi dan idempotency |
| apps/backend/src/repositories/documentDelete.repository.js | Reuse inventory untuk validasi binding; sertakan localIdentity dalam durable manifest |
| apps/backend/src/services/documentDelete.service.js | Teruskan manifest evidence; klasifikasikan pre-IO rejection terverifikasi, bukan Unknown palsu |
| apps/backend/tests/helpers/deleteStorageDrivers.cjs | Izinkan helper native yang direview dalam driver sandbox loader |
| apps/backend/tests/unit/localExactCleanup.test.js | Native sandbox/race/replacement checks, runtime forwarding, immutable R2 namespace inspection |
| apps/backend/tests/integration/sprintBDatabaseValidation.cjs | Pertahankan baseline; tambah sembilan integration scenario, report fase baru, sandbox filesystem terpisah |
| apps/backend/tests/integration/sprintADatabaseValidation.cjs | Pilihan report fase baru, tanpa mengubah assertion Sprint A |
| apps/backend/tests/integration/finalizeSprintBInstance.cjs | Final verification/shutdown untuk evidence fase baru |

Tidak ada migration baru, schema canonical change, backfill massal, atau perubahan upload/approval/revision/SLA behavior. Perubahan Sprint A/B yang sebelumnya sudah berada di dirty working tree tidak direvert.

## D. Validation

| Validasi | Hasil | Evidence |
| --- | --- | --- |
| Seluruh backend unit tests | 302 PASS, 0 FAIL, 1 SKIP; 303 total | node --require ./apps/backend/tests/helpers/isolatedHttpRegression.cjs --test seluruh unit test |
| Native local sandbox | 10 PASS, 1 SKIP | localExactCleanup.test.js; ditambah dua technical unit checks yang PASS |
| Sprint A MariaDB regression | 18 PASS, 0 FAIL | 20261102_0004_sprint_a_isolated_results.json |
| Sprint B MariaDB integration | 30 PASS, 0 FAIL | 20261102_0004_sprint_b_isolated_results.json |
| Syntax JavaScript/CJS | 47 file PASS | node --check pada modified/untracked JavaScript/CJS |
| C# compilation | PASS | Compiler aktual dan execution pada native sandbox/integration |
| Diff whitespace | PASS | git diff --check |
| Final isolated integrity/shutdown | PASS | 20261102_0004_isolated_final_verification.json |

Seluruh 290 unit baseline dipertahankan; ditambah 12 PASS dan satu symlink privilege SKIP. Seluruh 18 Sprint A dan 21 Sprint B baseline tetap PASS.

Local coverage:

| Skenario | Hasil |
| --- | --- |
| Satu target file, missing file, exact retry | PASS |
| Beberapa revisions, attachment, direct-owned file | PASS |
| Dokumen lain dan protected outside-sandbox fixture | PASS, tetap utuh |
| Shared metadata reference dan filesystem hard link | PASS, ditolak |
| Traversal, absolute path, ADS, DOS alias, trailing dot | PASS, ditolak |
| Junction/reparse escape | PASS, ditolak |
| File symlink escape | SKIP: akun Windows tidak memiliki privilege membuat file symlink |
| Parent replacement setelah pin | PASS, rename ditolak OS |
| File replacement/write setelah pin | PASS, ditolak OS |
| File diganti sebelum open, termasuk byte identik | PASS, identity mismatch |
| Partial cleanup, target pengganti tidak dihapus | PASS, Pending; recovery memakai original inode |
| Crash setelah storage sebelum database commit | PASS, recovery tanpa duplicate physical delete |
| Crash setelah physical disposition sebelum durable evidence | PASS, Unknown/Pending, tanpa auto-repeat |
| Namespace mismatch | PASS, tidak menghapus target |
| Concurrent Delete/native attempts | PASS, tidak mengalihkan target |

Binding coverage: reviewed local provenance, explicit fake R2 development, explicit fake R2 production, missing/ambiguous provenance, conflicting metadata/project/namespace, shared ownership, repeated binding, read-only inspection/no unintended storage mutation, unauthorized actor, manifest-finalized rejection, dan unrelated-document preservation semuanya PASS.

Satu assertion pada run awal gagal karena test mengasumsikan urutan upload. Manifest dibaca berdasarkan ID, sehingga fault injection diperbaiki untuk mengambil urutan durable manifest, bukan mengubah engine atau mengendurkan assertion. Evidence awal dipertahankan di `20261102_0004_sprint_b_initial_results.json`; hasil akhir berasal dari full rerun setelah perbaikan.

Instance test tetap MariaDB 10.4.32, `127.0.0.1:13317`, server ID 13317, datadir `tmp/mariadb-sprint-b-20261102/data`. Semua destructive test hanya pada `edms_sprint_b_isolated` dan filesystem fixture sintetis. Tiga database restore masing-masing tetap 24 tabel/1.231 baris, dengan per-table counts tidak berubah. Akun test tetap tidak dapat membaca database restore. Backup original checksum tetap sama.

Final verification menyatakan tidak ada active command lain sebelum shutdown. Instance terisolasi dihentikan normal; tidak mengubah proses/konfigurasi XAMPP original. Fixture dan data instance test dipertahankan, bukan direset.

## E. Remaining Limitations

1. Uji file symlink langsung belum dijalankan: privilege pembuatan symlink tidak tersedia. Junction/reparse branch dan rejection code sudah diuji, tetapi tidak diklaim sebagai runtime PASS untuk symlink file.
2. Dukungan local cleanup saat ini khusus Windows fixed NTFS dengan compiler .NET Framework 64-bit dan permission untuk mempin seluruh ancestor. Unsupported OS/filesystem, busy/incompatible handle, atau helper unavailable tetap Pending.
3. Local binding lama/baru yang belum memiliki reviewed native localIdentity tetap Pending. Identitas tidak dibuat otomatis dari key/current environment saat cleanup; pengayaan dilakukan per-file dengan approval/provenance yang sah sebelum manifest final.
4. Historical provenance tidak dapat diciptakan dari metadata yang tidak ada. File tanpa inventory approval yang dapat dipertanggungjawabkan, ambiguous namespace, conflicting/shared ownership, atau checksum/identity mismatch tetap Pending.
5. Outcome Unknown setelah physical side effect tidak diretry otomatis dan tidak membenarkan penghapusan database. Recovery outcome tak pasti tetap memerlukan keputusan/evidence terpisah.
6. Live R2, Railway/MySQL, real-file binding, public endpoint, dan frontend activation tidak diuji atau diaktifkan.

Safety confirmation: `edms_smpv_dev`, `edms_db`, original XAMPP data/config, original SQL backup, dan real document storage tidak dimodifikasi. Railway/live R2 tidak diakses. Tidak ada schema migration pada database utama, perubahan workflow/UI, commit, push, atau deployment. Masalah fisik InnoDB original tidak diperbaiki atau dinyatakan selesai oleh pekerjaan ini.

## F. Final Verdict

**SPRINT B COMPLETE WITH CONDITIONS**

Local physical cleanup dan valid per-file namespace binding berfungsi pada supported Windows/NTFS sandbox, termasuk real isolated MariaDB integration dan fake R2 namespace terpisah. Klaim FULLY COMPLETE belum diberikan karena uji file symlink langsung belum dapat dijalankan dan operational provenance/enrichment requirements tetap harus dipenuhi untuk file nyata.

STOP setelah Sprint B. Jangan expose Permanent Delete, melakukan bulk binding, atau melanjutkan Sprint C/D/E/deployment tanpa persetujuan owner terpisah.
