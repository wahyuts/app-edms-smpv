# Historical Recovery Runner - Operator

Standalone Node.js; tidak perlu XAMPP, Express, atau Vite. Runner hanya membaca MySQL/R2 dan menghasilkan artefak; **tidak menjalankan SQL recovery, apply, atau COMMIT**. Urutan: Development -> Staging -> Production, setelah hasil environment sebelumnya direview owner.

Alternatif tanpa MySQL certificate: [SSH transport Windows](README-historical-recovery-ssh.md). Mode harus eksplisit; tidak ada fallback otomatis dari TCP Proxy.

## Persiapan sebelum maintenance

Gunakan `tmp/historical-binding/config.json` sesuai `historical-recovery-runner.config.example.json`; jangan menimpa checkpoint existing. Schema/server UUID/hostname/port internal harus direview. Credential terpisah di `tmp/historical-binding/<environment>/.env`, mengikuti `historical-recovery-runner.env.example`. `MYSQL_HOST/PORT` adalah Public TCP Proxy. Tidak ada fallback ke backend `.env`. Pakai akses read-only.

TLS wajib: `MYSQL_TLS_MODE=VERIFY_IDENTITY`, `MYSQL_TLS_CA_FILE` path absolut CA PEM dari sumber tepercaya, dan `MYSQL_TLS_SERVER_NAME` yang **sama dengan MYSQL_HOST dan cocok dengan DNS SAN sertifikat MySQL aktual**. mysql2 memakai host koneksi untuk SNI/verifikasi; nama berbeda ditolak. TLS minimum 1.2, chain/hostname verification aktif, tanpa fallback plaintext. CA/nama yang benar belum dibuktikan di Railway: jangan menebak hostname proxy, mengunduh CA dari handshake tak terverifikasi, atau menonaktifkan verifikasi. Jika SAN tidak cocok, STOP; owner perlu endpoint/nama DNS bersertifikat yang benar atau desain akses private/tunnel terpisah. Sumber: [Railway TCP Proxy](https://docs.railway.com/networking/tcp-proxy), [MySQL](https://docs.railway.com/databases/mysql). TLS HTTP Railway bukan bukti TLS MySQL.

Jalankan dari root repository:

```powershell
node apps/backend/scripts/historical-recovery-runner.cjs check --environment development
```

Konfirmasi target digest. `check` menguji identitas DB, bukan object R2/backup/maintenance. Artefak private di `tmp/` diabaikan Git; lindungi ACL. Jangan kirim credential melalui chat.

## Maintenance dan recovery

1. Hentikan seluruh writer aplikasi, scheduler, admin tools, dan storage eksternal sampai verify selesai. Website idle tidak cukup; runner tidak menghentikan service.
2. Jalankan prepare, konfirmasi target, `WRITERS_STOPPED`, serta namespace ID yang sudah direview:

```powershell
node apps/backend/scripts/historical-recovery-runner.cjs prepare --environment development
```

Runner membuat `run-...` baru: snapshot, exact GET R2 + SHA-256/size, evidence, plan. Review counts/reasons, target/approval digest, dan expiry. Satu blocker: STOP. Digest bukan bukti asal historis namespace; konfirmasi owner wajib. Fingerprint membaca seluruh DB; GET R2 memerlukan waktu/biaya.

3. Buat **full logical backup** sesudah snapshot saat writer berhenti. Siapkan path dump dan waktu aktual UTC ISO. Jika expiry terlewati (maksimal 60 menit), ulang prepare/backup, jangan ubah timestamp/TTL. Runner tidak membuat backup/restore.
4. Jalankan generator; pilih nama run prepare, ketik approval digest dan confirmation, user ID Admin aktif, path backup, waktu, attestation backup, serta `PASS` atau `NOT_TESTED` untuk restore test nyata:

```powershell
node apps/backend/scripts/historical-recovery-runner.cjs generate-sql --environment development
```

Runner menghitung hash, memvalidasi backup/freshness, membuat `apply-reviewed.sql` di run baru. Tidak perlu JSON/digest manual. Hash/definisi tabel bukan bukti restore/konsistensi backup; attestation wajib direview.

5. Review SQL. DBeaver: koneksi dedicated, tanpa transaksi sebelumnya/auto-reconnect, **STOP ON FIRST ERROR**. Jalankan `identity_gate` terpisah; lanjut hanya PASS. Sesudah seluruh statement berhasil dan `READY TO COMMIT`: **COMMIT manual pada koneksi sama**. Error/STOP: ROLLBACK pada koneksi sama. Global locks memerlukan maintenance/kapasitas; bukan zero downtime. COMMIT ACK hilang: UNKNOWN, jangan retry SQL.
6. Jalankan verify dengan **run prepare**, bukan run SQL. Runner meminta nama run jika `--run` tidak diberikan:

```powershell
node apps/backend/scripts/historical-recovery-runner.cjs verify --environment development
```

Hasil di run baru: `PASS` (baseline/expected bindings/object cocok), `FAIL` (mismatch), `INCONCLUSIVE` (belum terbukti). PASS bukan izin Delete/bukti restore. Akhiri maintenance setelah hasil aman. Gunakan `--run run-NAMA` untuk checkpoint eksplisit; tidak ada pemilihan terbaru diam-diam. Ulang workflow dengan environment/config/credential Staging, lalu Production setelah tahap sebelumnya diverifikasi.

SQL locking/commit dan konektivitas live tetap memerlukan validasi Development yang diotorisasi terpisah; synthetic tests bukan live UAT.
