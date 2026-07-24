Nah, rencana deploy dulu itu masuk akal untuk membuat environment staging yang bersih, tetapi ada satu hal yang perlu diluruskan:

Deploy tidak otomatis menyelesaikan persoalan arsitektur IndexedDB versus REST API. Deploy hanya membuat IndexedDB baru untuk origin/domain baru.

Data IndexedDB yang sekarang ada di:

http://localhost:5173

tidak ikut terbawa ke domain deployment, misalnya:

https://edms-staging.example.com

Jadi saat pertama dibuka, IndexedDB pada domain staging memang kosong. Namun bila frontend memiliki proses bootstrap yang mengisi IndexedDB dari Mock JSON, data dummy dapat muncul kembali setelah aplikasi dijalankan.

Rekomendasi utama untuk proyek EDMS ini

Untuk tahap development dan staging, saya menyarankan:

GitHub Private Repository
        │
        ▼
Railway
├── Frontend React + Vite
├── Backend Node.js + Express
├── MySQL
└── Persistent Volume untuk storage dokumen

Railway mendukung deployment dari GitHub untuk React dan Express, penyediaan MySQL, serta persistent volume untuk data filesystem.

Mengapa Railway paling praktis untuk Anda?

Karena stack proyek Anda terdiri dari:

React + Vite
Express.js
MySQL
backend-managed local file storage
monorepo apps/frontend dan apps/backend

Railway bisa menampung semuanya dalam satu project deployment. Anda tidak perlu mengelola server VPS, instalasi Nginx, SSL, MySQL, dan deployment script secara manual.

Yang sangat penting: backend EDMS Anda menyimpan file pada local filesystem. Tanpa persistent volume, file upload bisa hilang saat redeploy atau container restart. Railway menyediakan volume yang dipasang ke service backend untuk kebutuhan tersebut.

Alternatif yang juga bagus

Arsitektur kedua:

Frontend : Vercel
Backend  : Railway
Database : Railway MySQL
Storage  : Railway Volume

Vercel mendukung deployment Vite secara langsung dan dapat membangun frontend dari GitHub.

Namun untuk tahap pertama, kombinasi ini sedikit lebih rumit karena frontend dan backend berada pada domain berbeda:

Frontend:
https://edms.vercel.app

Backend:
https://edms-api.up.railway.app

Dengan authentication berbasis HttpOnly Cookie, Anda harus menangani dengan benar:

CORS origin
credentials: true
Axios withCredentials: true
cookie Secure
cookie SameSite
domain cookie
preflight request
kemungkinan pembatasan third-party cookie oleh browser

Semua itu dapat diselesaikan, tetapi meningkatkan jumlah variabel saat integrasi pertama.

Pilihan paling aman untuk Phase 2.4

Untuk mengurangi risiko, staging pertama sebaiknya memakai satu public origin:

https://edms-staging.example.com
├── /                 → React
└── /api/v1/*         → Express

Ada dua cara:

Cara A — Express menyajikan hasil build React
Browser
   │
   ├── GET /
   │      └── React build
   │
   └── POST /api/v1/auth/login
          └── Express API

Frontend dan backend berada pada satu domain. Authentication cookie menjadi jauh lebih sederhana karena tidak terjadi komunikasi lintas-origin.

Konsekuensinya, backend perlu menyajikan folder hasil:

apps/frontend/dist

Cara ini cocok untuk staging integrasi awal.

Cara B — Frontend dan backend tetap service terpisah
Frontend service
Backend service
MySQL service

Ini lebih modular, tetapi Anda perlu mengonfigurasi CORS dan cookie cross-origin secara presisi.

Untuk kondisi Anda saat ini, saya lebih menyarankan Cara A untuk staging awal. Setelah authentication teruji stabil, frontend dan backend dapat dipisah jika memang dibutuhkan.

Apa yang akan terjadi pada IndexedDB?

Pada deployment pertama:

IndexedDB localhost
→ tetap ada di komputer Anda
→ tidak dikirim ke server
→ tidak dapat dibaca domain staging

Domain staging mempunyai IndexedDB sendiri:

IndexedDB staging
→ awalnya kosong

Namun hasil layar bergantung pada implementasi frontend saat ini.

Kondisi 1 — IndexedDB mempunyai bootstrap dari Mock JSON
Aplikasi dibuka
↓
IndexedDB kosong terdeteksi
↓
Mock JSON dimasukkan
↓
Project dan dokumen dummy muncul

Dalam kondisi ini, deployed frontend tetap akan terlihat berisi.

Kondisi 2 — IndexedDB hanya berisi hasil penggunaan lokal
Aplikasi dibuka
↓
IndexedDB kosong
↓
Tidak ada bootstrap
↓
Project dan dokumen tidak tampil

Dalam kondisi ini, staging benar-benar kosong.

Jadi pernyataan:

“Kalau sudah deploy pasti kosong.”

belum tentu. Kita harus memeriksa apakah frontend mempunyai fungsi seperti:

initializeDatabase()
seedIndexedDb()
bootstrapMockData()
ensureInitialData()

atau proses serupa.

Apakah deployment membantu Phase 2.4?

Ya, sangat membantu sebagai environment pengujian bersih.

Anda bisa mempunyai dua environment:

LOCAL DEVELOPMENT
Frontend : localhost
Backend  : localhost
Database : XAMPP
IndexedDB: data lama lengkap
STAGING
Frontend : public URL
Backend  : public URL
Database : cloud MySQL
IndexedDB: baru dan terpisah

Dengan demikian:

Local tetap aman dan dapat dipakai sebagai referensi UI lama.
Staging dipakai untuk menguji authentication REST API.
Data IndexedDB lokal tidak disentuh.
Anda dapat membandingkan local dan staging.
Kesalahan integrasi tidak merusak data pengembangan lokal.

Tetapi Phase 2.4 tetap harus menentukan batas integrasi:

Auth Service
→ REST API asli

Project Service
→ tetap Fake API/IndexedDB

Document Service
→ tetap Fake API/IndexedDB

Workflow, SLA, Dashboard
→ tetap Fake API/IndexedDB

Deployment tidak menggantikan keputusan tersebut.

Perbandingan pilihan deployment
Pilihan	Frontend	Backend	MySQL	File persisten	Tingkat kesulitan
Railway semua	✅	✅	✅	✅ Volume	Paling sederhana
Vercel + Railway	✅ Vercel	✅ Railway	✅ Railway	✅ Volume	Menengah
Render semua	✅	✅	MySQL self-hosted	Disk berbayar	Menengah
VPS sendiri	✅	✅	✅	✅	Paling rumit

Render dapat menjalankan Express dan menyediakan persistent disk, tetapi filesystem service secara default bersifat ephemeral; persistent disk tersedia untuk service berbayar. Render juga menyediakan panduan self-host MySQL dengan persistent disk.

Untuk proyek ini saya tidak merekomendasikan VPS dahulu. Kita belum perlu menambah pekerjaan berupa:

konfigurasi Linux
Nginx
SSL
firewall
backup MySQL
process manager
deployment pipeline
monitoring server
Keputusan yang saya rekomendasikan
Platform staging:
Railway

Repository:
GitHub Private

Deployment awal:
React dan Express melalui satu public origin

Database:
Railway MySQL khusus staging

File storage:
Railway Persistent Volume

Local environment:
Tetap memakai XAMPP dan IndexedDB lama

Production:
Belum dilakukan sekarang

Sebelum push ke GitHub, pastikan file berikut tidak pernah masuk repository:

.env
.env.*
storage/*
node_modules/
dist/

Kecualikan .env.example, karena file itu memang boleh berisi nama variabel tanpa secret.

Jadi, deploy ke Railway merupakan pilihan paling cocok untuk staging EDMS saat ini. Data IndexedDB lokal Anda tetap aman, sementara domain staging memberikan lingkungan browser baru untuk menguji integrasi authentication tanpa merusak frontend lokal.