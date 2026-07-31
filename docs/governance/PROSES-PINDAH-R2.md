1. Jalankan PATCH — R2 Storage Hardening & Readiness Validation
   → tetap pakai STORAGE_DRIVER=local
   → data/database/storage lokal sekarang jangan disentuh

2. Review hasil Codex
   → pastikan workflow tetap aman
   → pastikan local storage regression PASS

3. Buat Cloudflare R2 Development
   → bucket
   → access key
   → secret
   → endpoint

4. Masukkan variable R2 ke Railway Development
   → tapi belum harus switch dulu kalau belum siap test

5. Baru tentukan titik cutover:
   a) preserve data lama → migrate file lokal ke R2
   atau
   b) start clean → reset DB + wipe local storage

6. Kalau pilih start clean:
   → drop/recreate/reseed database development
   → kosongkan storage lokal
   → switch STORAGE_DRIVER=r2
   → deploy/restart backend
   → mulai data baru langsung masuk R2