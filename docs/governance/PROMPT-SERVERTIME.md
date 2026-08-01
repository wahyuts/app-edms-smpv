Roadmap Implementasi Server Time
Stage 1 — Readiness Audit (WAJIB)

Tujuan:

Membuktikan apakah arsitektur backend dan frontend saat ini memang siap menggunakan Server Time.

Pada tahap ini DILARANG melakukan:

edit source code
refactor
fix
rename
optimasi
perubahan API
perubahan database

Hanya audit.

Output audit minimal harus menjawab:

Backend
apakah backend sudah mempunyai satu sumber waktu (single clock)?
apakah timestamp berasal dari MySQL atau Node.js?
apakah seluruh mutation menggunakan sumber waktu yang sama?
apakah ada endpoint yang cocok untuk Server Time?
kalau belum ada, apa impact membuat endpoint tersebut?
Frontend
siapa yang memakai Date.now()
siapa yang memakai new Date()
fitur apa saja yang bergantung pada browser time
apakah cukup mengganti hook clock saja
apakah ada area lain yang ikut terdampak
Arsitektur

Harus ada diagram:

Browser
↓

Backend

↓

Database

dan dijelaskan:

siapa source of truth
siapa consumer
siapa publisher
Stage 2 — Readiness Decision

Ini yang menurut saya paling penting.

Codex harus memilih salah satu.

READY

Kalau READY, maka harus menjelaskan:

alasan
risiko
area yang berubah
area yang tidak berubah

baru boleh lanjut.

NOT READY

Kalau ternyata belum siap, maka HARUS STOP.

Tidak boleh coding.

Harus menjelaskan:

kenapa belum siap
dependency apa yang kurang
file apa yang harus disiapkan
perubahan apa yang harus dilakukan terlebih dahulu

Baru selesai.

Tidak boleh lanjut implementasi.

Stage 3 — Implementation

Tahap ini baru boleh dilakukan kalau Stage 2 menghasilkan:

READY

Kalau hasil audit mengatakan:

NOT READY

maka Stage 3 otomatis batal.

Stage 4 — Regression Validation

Saya ingin ini lebih ketat dari biasanya.

Codex wajib melakukan E2E terhadap minimal:

Authentication
Login
Refresh
Logout
Document
Create
Upload Revision
Approval A
Approval B
Approval C
SLA
Timer berjalan
Reset timer
Overdue
At Risk
Approved
Notification
Notification muncul
Notification tetap berjalan
Dashboard
Counter
Summary
SLA Overview
Audit Trail
Timestamp
History
Multi Browser

Minimal simulasi:

Browser A

Browser B

untuk memastikan perubahan Server Time tidak menyebabkan perilaku berbeda.

Stage 5 — Regression Report

Saya ingin laporan akhirnya wajib berisi:

Files Changed
Files NOT Changed
API Changed
Database Changed
Migration
Breaking Change
Performance Impact
Rollback Plan
E2E Result
Regression Result
Final Status

Contoh:

READY FOR PRODUCTION

atau

READY FOR STAGING

atau

REQUIRES REVISION
Menurut saya ini akan menjadi template resmi kita

Saya justru ingin menjadikan prompt ini sebagai standar untuk semua perubahan besar berikutnya.

Misalnya nanti:

Server Time
SSE
WebSocket (jika suatu saat dipilih)
Storage Migration
Active Project
RBAC Refactor

Semuanya mengikuti pola yang sama:

Stage 1
Audit

↓

Stage 2
Readiness Decision

↓

Stage 3
Implementation

↓

Stage 4
Regression

↓

Stage 5
Final Report

Menurut saya workflow ini jauh lebih aman. Kita belajar dari kasus SLA Timer kemarin: kita menghabiskan waktu cukup lama karena beberapa hipotesis ternyata salah. Dengan adanya Stage Gate, Codex dipaksa membuktikan kesiapan arsitektur terlebih dahulu sebelum menyentuh satu baris kode pun. Itu akan mengurangi risiko perubahan yang ternyata tidak menyelesaikan akar masalah atau malah menimbulkan regresi di area lain.