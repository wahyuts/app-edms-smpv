# Historical Recovery - SSH Transport (Windows)

Runner mengelola OpenSSH sendiri; tidak memerlukan MySQL TLS certificate, Express, atau XAMPP. Mode TCP Proxy tetap memakai TLS ketat. Tidak ada SQL recovery otomatis atau fallback antarmode.

## Persiapan owner (sekali per environment)

1. Pastikan Windows OpenSSH sudah tersedia. Runner tidak menginstal software atau mendaftarkan key otomatis. Daftarkan public key melalui akun Railway; private key tetap lokal. Key ber-passphrase perlu tersedia melalui agent yang telah dibuka owner, karena runner memakai BatchMode.
2. Dari dashboard Railway yang terautentikasi, verifikasi project ID, environment ID, MySQL service ID, dan **Service Instance ID**. Service ID bukan username SSH. Tanpa domain, Railway mendukung Service Instance ID sebagai username relay. Simpan mapping yang direview sebagai `profiles.development.ssh` di config existing, mengikuti `historical-recovery-ssh.example.json`. Isi `mappingReviewedByOwner=true` hanya setelah verifikasi; jangan menimpa config existing.
3. Peroleh public host key relay `ssh.railway.com` beserta fingerprint SHA-256 melalui sumber Railway/support/admin yang terautentikasi dan independen dari koneksi yang belum dipercaya. Simpan file known-hosts khusus berisi **satu entry tanpa komentar**, format `ssh.railway.com ssh-ed25519 BASE64_PUBLIC_KEY` (ECDSA/RSA juga didukung). Jangan menerima fingerprint otomatis, memakai accept-new, atau menganggap hasil ssh-keyscan sebagai verifikasi independen. Jika fingerprint resmi/terpercaya belum tersedia: **STOP**.
4. Isi executable OpenSSH absolut, identity file, known-hosts file dan fingerprint yang sudah diverifikasi pada profile SSH. Pilih port lokal kosong >=1024, berbeda dari port MySQL internal, misalnya 13306. Lindungi ACL folder config/key/artefak. Host-key rotation membutuhkan review baru; tidak ada update otomatis.
5. Owner ubah hanya `.env` runner environment terpilih, bukan backend:

```dotenv
APP_ENV=development
MYSQL_TRANSPORT=SSH_TUNNEL
MYSQL_HOST=127.0.0.1
MYSQL_PORT=13306
```

Credential `MYSQL_DATABASE/USER/PASSWORD` dan `R2_*` tetap milik environment tersebut. MYSQL_PORT harus cocok dengan profile.ssh.localPort. TLS variables hanya digunakan mode TCP_PROXY; tidak perlu dihapus atau dilemahkan.

## Menjalankan dari root repository

```powershell
node apps/backend/scripts/historical-recovery-runner.cjs check --environment development
```

Konfirmasi target digest dan mapping SSH yang ditampilkan. **Tidak perlu menjalankan tunnel terpisah.** Runner membuka `ssh -N -L 127.0.0.1:LOCAL_PORT:127.0.0.1:MYSQL_PORT SERVICE_INSTANCE_ID@ssh.railway.com` dengan strict host-key checking, known-host snapshot private, konfigurasi SSH kosong, dan public-key authentication. Tidak menjalankan `railway connect --tunnel-only` atau mencetak password/URL; raw SSH stderr tidak dicetak. Jangan membuka port publik.

Keberhasilan membutuhkan proses SSH milik runner tetap aktif, log autentikasi publickey dan listener exact, serta UUID/schema/hostname/port/versi MySQL cocok. Mapping instance ke project/environment tetap berdasarkan review dashboard owner, bukan klaim inspeksi API otomatis. Listener localhost saja tidak cukup. Runner menolak port yang sudah terpakai; exit/drop membatalkan hasil query dan menutup DB. Tidak reconnect. Akun OS lokal yang compromised berada di luar trust boundary: loopback bukan isolasi dari proses lokal berbahaya.

Setelah check direview, prepare/generate-sql/verify memakai mode sama; maintenance/backup/approval tetap wajib. Runner menutup child SSH miliknya saat selesai. Jika proses runner dimatikan paksa, periksa orphan SSH milik run tersebut dan port lokal sebelum ulang; jangan membunuh proses lain. `ssh-session-*` menyimpan known-host snapshot publik/empty config, bukan private key; tidak menimpa checkpoint.

## Evidence dan batasan

[Railway SSH](https://docs.railway.com/cli/ssh) mendokumentasikan forwarding ke loopback container. [Source CLI](https://github.com/railwayapp/cli/blob/master/src/commands/ssh/native.rs) memakai service instance target dan forwarding tersebut, tetapi mengaktifkan accept-new; runner sengaja memakai OpenSSH strict secara langsung. Dukungan platform terbukti; akses instance/key/host fingerprint aktual dan versi OpenSSH lokal belum diuji live. Jika server menolak forwarding atau fingerprint tidak tersedia, STOP. Tidak ada klaim live PASS dari mock tests.
