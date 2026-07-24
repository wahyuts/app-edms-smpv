Proposal Infrastruktur Production EDMS ReBuild v1.0
1. Tujuan

Membangun infrastruktur production yang memenuhi kriteria:

biaya operasional rendah
mudah di-maintain
minim DevOps
mudah di-scale
mendukung CI/CD
cocok untuk aplikasi Enterprise skala kecil–menengah
mudah dipindahkan apabila suatu saat diperlukan
2. Infrastruktur yang dipilih
Komponen	Platform
Frontend	Hostinger Business Web Hosting
Backend	Railway
Database	Railway MySQL
File Storage	Cloudflare R2
Source Code	GitHub
3. Estimasi biaya

Catatan: angka di bawah adalah estimasi awal. Railway menggunakan model usage-based sehingga biaya backend dan database dapat berubah sesuai pemakaian.

Komponen	Estimasi
Hostinger Business	± USD 20/tahun (harga promo tahun pertama; perpanjangan biasanya lebih tinggi)
Railway Backend	mulai USD 5/bulan (Hobby)
Railway MySQL	mengikuti penggunaan resource Railway
Cloudflare R2	Free tier 10 GB, setelah itu ± USD 0.015/GB-bulan

Estimasi awal ketika user masih sedikit:

Komponen	Perkiraan
Frontend	± USD 1.7/bulan (dibayar tahunan)
Backend	± USD 5/bulan
Storage	Gratis (selama masih dalam free tier R2)
Total	sekitar USD 7–10/bulan

Menurut saya ini sangat murah untuk aplikasi enterprise internal.

4. Benefit tiap komponen
Frontend — Hostinger Business
Benefit

✅ Auto Deploy dari Git

✅ React dapat di-host

✅ SSL

✅ Domain & Subdomain

✅ Cocok untuk website company profile + EDMS

✅ Biaya jauh lebih rendah dibanding Vercel Pro

Kekurangan
Tidak memiliki Preview Deployment sekuat Vercel.
Build pipeline tidak sefleksibel Vercel.
Backend — Railway
Benefit

✅ GitHub Auto Deploy

✅ Sangat cocok untuk Express.js

✅ Environment Development/Staging/Production

✅ Railway Volume

✅ MySQL tersedia

✅ Sangat sedikit konfigurasi server

Kekurangan
Usage-based billing.
Tidak memiliki kontrol server penuh seperti VPS.
Database — Railway MySQL
Benefit

✅ Tidak perlu mengelola MySQL sendiri

✅ Backup lebih mudah

✅ Integrasi langsung dengan backend

Kekurangan
Terikat dengan Railway.
Bila suatu saat pindah platform perlu migrasi database.
Storage — Cloudflare R2
Benefit

✅ Murah

✅ Object Storage

✅ File aman dari proses redeploy backend

✅ Tidak membebani Railway

✅ S3 Compatible

Kekurangan
Perlu sedikit implementasi tambahan di backend (storage adapter), tetapi ini sudah sesuai dengan rencana arsitektur kita.
5. Perbandingan dengan kompetitor
Frontend
| Provider           |                                                        Biaya | Kelebihan                                                              | Kekurangan                                  | Rekomendasi |
| ------------------ | -----------------------------------------------------------: | ---------------------------------------------------------------------- | ------------------------------------------- | ----------- |
| Vercel Pro         |                                   USD 20/bulan ([Vercel][1]) | Pengalaman deploy terbaik, preview deployment, CDN global              | Mahal untuk kebutuhan frontend React statis | ⭐⭐⭐⭐☆       |
| Hostinger Business | ± USD 20/tahun promo (renewal lebih tinggi) ([TechRadar][2]) | Sangat hemat, auto deploy, cocok karena client sudah memakai Hostinger | Fitur deployment tidak selengkap Vercel     | ⭐⭐⭐⭐⭐       |
| Netlify            |                                   Mulai sekitar USD 19/bulan | Mirip Vercel                                                           | Lebih mahal dibanding kebutuhan kita        | ⭐⭐⭐☆☆       |

[1]: https://vercel.com/pricing?utm_source=chatgpt.com "Vercel Pricing: Hobby, Pro, and Enterprise plans"
[2]: https://www.techradar.com/reviews/hostinger?utm_source=chatgpt.com "Hostinger review 2026"


Backend
| Provider                             | Kelebihan                                          | Kekurangan                                                        | Rekomendasi |
| ------------------------------------ | -------------------------------------------------- | ----------------------------------------------------------------- | ----------- |
| Railway                              | Sangat mudah, cocok Express.js, minim DevOps       | Usage-based                                                       | ⭐⭐⭐⭐⭐       |
| Render                               | Stabil dan mudah digunakan                         | Paket awal biasanya lebih mahal                                   | ⭐⭐⭐⭐☆       |
| VPS (Hostinger/Hetzner/DigitalOcean) | Kontrol penuh, biaya bisa efisien pada skala besar | Perlu mengelola server sendiri (OS, Nginx, PM2, keamanan, backup) | ⭐⭐⭐⭐☆       |
| AWS EC2                              | Sangat fleksibel                                   | Kompleks untuk proyek ini                                         | ⭐⭐⭐☆☆       |

Storage
| Provider          | Kelebihan                                                                        | Kekurangan                                                      | Rekomendasi |
| ----------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------- | ----------- |
| Cloudflare R2     | Murah, tanpa biaya egress langsung dari R2, S3 compatible ([Cloudflare Docs][1]) | Perlu adapter di backend                                        | ⭐⭐⭐⭐⭐       |
| AWS S3            | Sangat matang                                                                    | Lebih kompleks dan bisa lebih mahal                             | ⭐⭐⭐⭐☆       |
| Railway Volume    | Sangat mudah dipakai                                                             | Kurang ideal untuk arsip dokumen jangka panjang                 | ⭐⭐⭐☆☆       |
| Local Storage VPS | Murah                                                                            | Risiko lebih tinggi jika tidak dikelola dengan backup yang baik | ⭐⭐☆☆☆       |

[1]: https://developers.cloudflare.com/r2-sql/platform/pricing/?utm_source=chatgpt.com "R2 SQL - Pricing · R2 SQL docs"

6. Kenapa saya tidak memilih VPS sekarang?

Banyak orang berkata:

"Production harus VPS."

Menurut saya itu tidak selalu benar.

VPS memberi kontrol lebih besar, bukan otomatis lebih baik.

Kalau memakai VPS, kamu juga bertanggung jawab atas:

update sistem operasi;
Nginx;
PM2 atau Docker;
firewall;
SSL;
monitoring;
backup;
recovery.

Untuk proyek dengan satu aplikasi seperti EDMS ini, Railway menghilangkan banyak pekerjaan operasional tersebut. Nanti ketika kebutuhan benar-benar berkembang (misalnya ratusan user aktif atau kebutuhan jaringan khusus), barulah migrasi ke VPS bisa dipertimbangkan.

7. Keputusan yang saya rekomendasikan
Development
Frontend : Vercel
Backend  : Railway
Database : Railway MySQL
Storage  : Railway Volume

Staging
Frontend : Vercel
Backend  : Railway
Database : Railway MySQL
Storage  : Railway Volume

Production
Frontend : Hostinger Business
Backend  : Railway
Database : Railway MySQL
Storage  : Cloudflare R2

Penilaian Sensei

Kalau saya memberikan nilai berdasarkan kondisi proyek EDMS kita saat ini, hasilnya seperti ini:

Aspek	Nilai
Biaya	⭐⭐⭐⭐⭐ (5/5)
Kemudahan Maintenance	⭐⭐⭐⭐⭐ (5/5)
Kemudahan Deployment	⭐⭐⭐⭐⭐ (5/5)
Kemudahan Belajar	⭐⭐⭐⭐⭐ (5/5)
Skalabilitas	⭐⭐⭐⭐☆ (4.5/5)
Keamanan Arsitektur	⭐⭐⭐⭐⭐ (5/5)
Kesesuaian dengan EDMS	⭐⭐⭐⭐⭐ (5/5)

Kesimpulan saya: untuk fase awal hingga operasional normal EDMS, kombinasi Hostinger Business + Railway + Railway MySQL + Cloudflare R2 memberikan keseimbangan yang sangat baik antara biaya, kemudahan operasional, dan kemampuan berkembang di masa depan. Jika suatu hari kebutuhan meningkat, backend dan database masih bisa dipindahkan ke VPS atau layanan lain tanpa perlu mengubah frontend atau mekanisme penyimpanan file karena arsitektur kita memang sudah memisahkan setiap komponen.