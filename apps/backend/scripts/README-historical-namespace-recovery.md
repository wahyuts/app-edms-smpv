# Historical Namespace Binding Recovery

Helper **offline**, bukan migration, startup task, atau executor database. Satu tool untuk `development`, `staging`, dan `production`; mode default `preflight`. Tidak mengimpor pool/server, membaca `.env`, membuat koneksi database, atau mengakses R2. `apply` hanya **menghasilkan SQL** untuk review dan eksekusi manual melalui DBeaver.

## 1. Configuration dan Evidence

Simpan config, export, backup, evidence dan output di direktori private di luar Git, misalnya `tmp/historical-binding/`. Pada Windows, permission `0600` bukan pengganti ACL folder yang benar. Jangan memasukkan password, access key, token, atau secret. Namespace descriptor berisi identitas nonsecret account/endpoint/bucket.

Gunakan config JSON dengan struktur berikut. Isi nilai dari koneksi dan konfigurasi runtime environment yang **benar-benar diverifikasi owner**, bukan dari nama bucket yang ditebak. Jangan memakai placeholder untuk eksekusi.

```json
{
  "version": 1,
  "profiles": {
    "development": {
      "database": {
        "name": "ACTUAL_SCHEMA",
        "serverUuid": "ACTUAL_SERVER_UUID",
        "hostname": "ACTUAL_SERVER_HOSTNAME",
        "port": 3306,
        "versionPrefix": "ACTUAL_MAJOR.MINOR."
      },
      "r2": {
        "accountId": "ACTUAL_ACCOUNT",
        "endpoint": "https://ACTUAL_ACCOUNT.r2.cloudflarestorage.com",
        "bucketName": "ACTUAL_DEVELOPMENT_BUCKET"
      },
      "maxRows": 10000,
      "maxAgeMinutes": 60
    },
    "staging": null,
    "production": null
  }
}
```

Isi profile Staging/Production dengan struktur yang sama sebelum digunakan. Target database `(serverUuid, schema)` dan namespace antar-profile harus berbeda. `serverUuid`, hostname, schema, port internal server dan versi berasal dari `SELECT DATABASE(), @@server_uuid, @@hostname, @@port, VERSION();` pada koneksi yang direview. Port proxy eksternal bukan `@@port`. Runtime R2 harus sesuai profile. Tool menghitung descriptor/digest menggunakan `r2Namespace()` existing dan menampilkan `targetDigest`; digest bukan tanda tangan atau bukti environment dengan sendirinya.

Gunakan Oracle MySQL 8.0.16+ dengan InnoDB. Metadata direct schema/global `SELECT` dan `TRIGGER` harus terlihat; grant hanya melalui role/table tidak diasumsikan cukup. Tool tidak memberi/mengubah privilege. Trigger pada tiga tabel write ditolak. Schema Permanent Delete harus sudah tersedia; **jangan menjalankan migration ulang**.

Metadata SQL saja tidak membuktikan file historis berasal dari suatu namespace. Apply membutuhkan **laporan DRY_RUN read-only dari inspector existing** `reconcile-legacy-files.cjs` yang sudah direview owner, bukan daftar file hasil SQL yang diberi label VERIFIED secara manual. Lihat `README-legacy-reconciliation.md`. Report harus memuat namespace tunggal environment tersebut, proof size/SHA-256 hasil inspeksi exact object, target yang cocok, digest valid dan database snapshot unchanged. Tool ini tidak menjalankan inspector atau melakukan R2 IO. Jika report tersebut belum tersedia/otoritatif, preflight tetap berguna tetapi apply ditolak.

Bungkus report yang sudah ada dalam evidence JSON:

```json
{
  "version": 1,
  "source": "OWNER_REVIEWED_STORAGE_INVENTORY",
  "environment": "development",
  "targetDigest": "TARGET_DIGEST_DARI_TOOL",
  "runtimeNamespaceVerified": true,
  "storageWritersStopped": true,
  "inspectedAt": "WAKTU_INSPEKSI_AKTUAL_DALAM_UTC_ISO",
  "namespace": { "id": "COPY_DARI_REPORT", "encoded": "COPY_DARI_REPORT", "descriptor": {} },
  "inspectionReportPath": "REPORT_INSPECTOR_YANG_DIREVIEW.json"
}
```

Copy **seluruh objek namespace**, termasuk descriptor, dari report; jangan membuat digest/descriptor sendiri. Path report relatif terhadap evidence JSON. `inspectedAt` adalah waktu inspeksi yang sebenarnya, bukan waktu mengedit envelope. Kedua boolean adalah attestation owner; jangan menetapkan `true` tanpa bukti. Validitas proof maksimal 60 menit (bisa dipersingkat); perubahan R2 out-of-band tidak dapat dideteksi helper offline. Hentikan seluruh writer aplikasi, job/admin, dan writer storage eksternal sejak inspeksi sampai commit/verify. Jangan menganggap hash report sebagai bukti autentisitas inspeksi.

## 2. Preflight - Read Only

Jalankan dari root repository. Contoh PowerShell berikut memakai prefix direktori per environment; nama output wajib baru dan tidak ditimpa tool.

```powershell
$envName = 'development'
$dir = "tmp/historical-binding/$envName"
node apps/backend/scripts/historical-namespace-recovery.cjs --environment $envName --config tmp/historical-binding/config.json --out "$dir/preflight.sql"
```

Di DBeaver pilih **koneksi environment yang sama**. Jalankan query identity dahulu, lanjut hanya jika PASS. Jalankan SELECT snapshot dan ekspor nilai **satu cell `snapshot_json`** sebagai UTF-8 `snapshot-before.json`, tanpa CSV escaping atau wrapper array DBeaver. Pastikan export tidak terpotong. Snapshot memuat metadata identitas user Admin untuk Audit Trail, tidak memuat credential; tetap simpan private. Snapshot bukan backup.

```powershell
node apps/backend/scripts/historical-namespace-recovery.cjs --environment $envName --config tmp/historical-binding/config.json --snapshot "$dir/snapshot-before.json" --evidence "$dir/evidence.json" --out "$dir/plan.json"
```

Tanpa `--evidence`, analisis missing/conflict tetap dapat dijalankan, tetapi file missing proof BLOCKED. Report plan memuat counts, setiap file dan reason, `targetDigest`, `approvalDigest`, dan expiry. Reuse inventory/ownership Permanent Delete dan folder resolver existing. File tanpa exact `document_id`, key noncanonical, konflik namespace/binding, sharing, alias salah, pending Delete/manifest, writer/IO aktif atau evidence kurang tidak di-approve otomatis. Binding existing lengkap tidak ditimpa; provisional/conflicting binding memerlukan review terpisah. Tidak ada cutoff historis atau daftar ID manual.

## 3. Backup dan Approved SQL Generation

Owner review seluruh plan. Apply all-or-nothing untuk satu batch environment; satu blocker menolak seluruh batch. Backup logical **full database** wajib dibuat setelah snapshot quiescent, saat writer tetap berhenti. Simpan dump di luar Git. Siapkan receipt JSON:

```json
{
  "version": 1,
  "targetDigest": "TARGET_DIGEST_DARI_TOOL",
  "scope": "FULL_DATABASE",
  "reviewedByOwner": true,
  "dumpPath": "ABSOLUTE_PATH_BACKUP_SQL",
  "sha256": "SHA256_BACKUP_AKTUAL",
  "createdAt": "WAKTU_BACKUP_AKTUAL_DALAM_UTC_ISO",
  "restoreTest": "NOT_TESTED"
}
```

Tool membaca dump secara streaming, memeriksa SHA-256, nonempty, dan keberadaan definisi tabel yang dibutuhkan. Ini **bukan restore test** atau bukti independen bahwa dump lengkap/konsisten/berasal dari target tersebut; attestation owner wajib benar. Isi `restoreTest=PASS` hanya setelah restore test nyata yang terisolasi. Receipt tidak membuat backup. Jika backup tidak dapat dipercaya, jangan generate/apply.

```powershell
node apps/backend/scripts/historical-namespace-recovery.cjs --mode apply --environment $envName --config tmp/historical-binding/config.json --snapshot "$dir/snapshot-before.json" --evidence "$dir/evidence.json" --plan "$dir/plan.json" --backup-receipt "$dir/backup-receipt.json" --approval-digest APPROVED_PLAN_DIGEST --confirm-environment $envName --confirm-target APPROVED_TARGET_DIGEST --confirm APPLY_HISTORICAL_NAMESPACE_BINDINGS --maintenance-confirmed --actor-user-id ACTIVE_PROJECT_ADMIN_ID --out "$dir/apply-reviewed.sql"
```

Ini **belum menulis database**. Actor harus user aktif dengan Official Role Admin pada setiap project terkait. Snapshot/evidence/approval yang berubah, expired, wrong-target, atau backup gagal ditolak sebelum SQL diterbitkan.

## 4. DBeaver Apply - Owner Execution Only

Gunakan koneksi SQL dedicated yang fresh, tanpa transaksi sebelumnya, **tanpa auto-commit per statement dan tanpa auto-reconnect**. Atur script execution **STOP ON FIRST ERROR**; jangan memilih continue/ignore errors. Review script sebelum menjalankannya.

Jalankan SELECT `identity_gate` pertama secara terpisah; lanjutkan sisa script hanya pada PASS. Identity memakai perbandingan biner, termasuk nama schema. Locking reads juga dipagari identitas target; jangan menggunakan hasil STOP sebagai alasan untuk mengganti target/approval pada SQL secara manual.

Script memakai REPEATABLE READ, locking read seluruh primary-index range tabel snapshot (termasuk gap saat tabel kosong) dan recheck identity, snapshot row count/hash, dependency metadata, engine serta trigger sebelum write. Ini **global maintenance locks**, bukan operasi online per-dokumen; review jumlah rows/kapasitas/lock duration terutama Production. `maxRows` default 10000, hard limit 100000. Deadlock/timeout adalah STOP, bukan izin retry otomatis. Tidak membuat/mengubah coordinator atau Delete ledger.

Write dibatasi ke `storage_namespaces`, `stored_file_namespace_bindings`, dan `audit_trail`; evidence memakai format canonical `OWNER_REVIEWED_STORAGE_INVENTORY`. Tidak ada overwrite binding, upsert metadata file, revision/workflow/SLA mutation, atau R2 IO. Tiap write dipagari hasil precondition dan row count. SQL tidak berisi COMMIT otomatis.

- Jika ada SQL error, STOP, target mismatch, count mismatch, atau hasil selain `READY TO COMMIT`: jalankan `ROLLBACK;` pada **koneksi yang sama**, jangan lanjutkan/commit. Database disconnect sebelum commit menyebabkan rollback oleh server; periksa status koneksi sebelum mengambil kesimpulan.
- Jika **seluruh statement berhasil tanpa error** dan final row `READY TO COMMIT`: owner boleh menjalankan `COMMIT;` secara terpisah pada koneksi tersebut. Jangan meninggalkan transaksi/lock terbuka.
- Jika acknowledgement COMMIT hilang: hasil UNKNOWN, bukan dianggap rollback. Jangan retry script; lakukan verify dan review evidence.
- Setelah commit tidak ada rollback otomatis/destruktif. Jangan menghapus binding/Audit Trail atau restore dump secara otomatis; persetujuan owner baru diperlukan untuk pemulihan.

Old SQL/plan yang diulang setelah commit akan ditolak karena snapshot berubah. Preflight baru mengklasifikasikan binding identik `ALREADY_BOUND`; apply tanpa kandidat menghasilkan komentar NO CHANGES, tanpa transaction/write. Jangan memodifikasi plan untuk memaksa rerun.

## 5. Verify dan Urutan Environment

```powershell
node apps/backend/scripts/historical-namespace-recovery.cjs --mode verify --environment $envName --config tmp/historical-binding/config.json --plan "$dir/plan.json" --out "$dir/verify.sql"
```

Jalankan manual di DBeaver setelah commit. Periksa count approved bindings vs expected, remaining missing/conflicts, dan duplicate query. Ekspor snapshot cell sebagai `snapshot-after.json`, lalu:

```powershell
node apps/backend/scripts/historical-namespace-recovery.cjs --mode verify --environment $envName --config tmp/historical-binding/config.json --snapshot "$dir/snapshot-after.json" --baseline "$dir/snapshot-before.json" --plan "$dir/plan.json" --out "$dir/verification.json"
```

Report memvalidasi namespace/digest/provenance dan expected recordId, counts, ownership, remaining blockers, serta perbandingan metadata nonbinding yang diekspor. Tanpa baseline, integrity tetap UNVERIFIED. Verdict metadata bukan bukti R2 object existence dan bukan izin Permanent Delete.

Urutan wajib: **Development preflight -> owner-approved apply -> verify -> UAT terpisah**, kemudian ulangi workflow sama dengan `$envName='staging'`, terakhir `$envName='production'`, profile/directory/report/backup milik masing-masing. Tidak perlu mengubah source code atau file-ID/count untuk environment berikutnya. Jangan melanjutkan environment berikutnya sebelum hasil sebelumnya direview dan diverifikasi.

## 6. Validation Scope

Test generator/ownership memakai snapshot sintetis, canonical inventory/binding helper, dan fixture backup lokal. Tidak membuka database atau R2. SQL generated belum dieksekusi pada server MySQL; semantik locking, transaksi, commit/rollback dan hasil JSON export harus diverifikasi di Development sebelum apply Staging/Production. Tidak ada klaim live recovery atau restore test PASS dari test fixture.
