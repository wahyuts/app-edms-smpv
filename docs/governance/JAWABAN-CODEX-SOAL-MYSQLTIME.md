saya ingin tanya, apakah source code kita sudah menggunakan waktu server time dan MySQL Time ?






9:18 PM






Worked for 20s



Ya, tapi jawabannya perlu dibedakan antara penyimpanan waktu canonical dan perhitungan/display runtime.
Yang Sudah Menggunakan MySQL Time
Untuk data persisted/canonical, backend banyak memakai MySQL UTC time lewat UTC_TIMESTAMP(3).
Contoh penting:
Create Document mengisi sla_started_at dengan UTC_TIMESTAMP(3).
Workflow transition reset SLA memakai sla_started_at = UTC_TIMESTAMP(3).
Approved/Final memakai sla_stopped_at = UTC_TIMESTAMP(3).
Temporary upload, audit-ish timestamp tertentu, auth token, read marker, dan metadata lain juga banyak memakai UTC_TIMESTAMP(3).
Database connection juga diset:
timezone: 'Z'
di [database.js](D:/Project/app-edms-smpv/apps/backend/src/config/database.js), jadi MySQL driver membaca timestamp sebagai UTC.
Yang Masih Menggunakan Server Time
Backend masih memakai new Date() untuk beberapa kebutuhan runtime/non-canonical, misalnya:
menghitung slaTimer.display saat response dibuat di repository;
membuat nama file canonical berdasarkan submit date;
logging/request timestamp;
healthcheck/storage metadata;
audit identity basis tertentu.
Untuk SLA display backend, source memakai:
const calculatedAt = new Date();
di [document.repository.js](D:/Project/app-edms-smpv/apps/backend/src/repositories/document.repository.js), lalu menghitung elapsed dari sla_started_at.
Jadi:
SLA baseline = MySQL time / sla_started_at
SLA response calculation time = server time / new Date()
Frontend live end time = browser time / Date.now()
Kesimpulan Singkat
Untuk waktu canonical SLA: ya, sudah menggunakan MySQL UTC time.
Untuk perhitungan runtime/display: masih ada kombinasi server time dan browser time.
Untuk frontend live timer: memakai Date.now() sebagai end time, tetapi baseline-nya sekarang diarahkan ke slaStartedAt.
Kalau target arsitektur kita adalah “semua SLA elapsed harus 100% berbasis server/MySQL time”, maka frontend live timer perlu diberi serverNow dari backend sebagai anchor, bukan memakai murni Date.now().


9:19 PM








bagian mana saja yang masih menggunakan browser time ?






9:20 PM






Worked for 13s



Bagian yang masih menggunakan browser time ada beberapa, tapi tidak semuanya berbahaya. Saya pisahkan berdasarkan fungsi.
1. SLA Live Timer Frontend
Ini yang paling relevan untuk kasus SLA Timer.
File:
[useSlaRuntimeClock.js](D:/Project/app-edms-smpv/apps/frontend/src/features/sla-management/hooks/useSlaRuntimeClock.js)
[sla-timer-display.js](D:/Project/app-edms-smpv/apps/frontend/src/features/sla-management/utils/sla-timer-display.js)
Pemakaian:
Date.now()
dipakai untuk membuat currentTimestamp setiap 1 detik.
Lalu:
calculationEnd = new Date(currentTimestamp)
dipakai sebagai waktu akhir perhitungan live timer.
Artinya saat ini:
SLA start = dari backend/MySQL, yaitu slaStartedAt
SLA end untuk live display = browser time
2. Frontend SLA Engine Lama / Fallback Lokal
File:
[sla-engine.service.js](D:/Project/app-edms-smpv/apps/frontend/src/features/sla-management/services/sla-engine.service.js)
[sla-monitoring.service.js](D:/Project/app-edms-smpv/apps/frontend/src/features/sla-monitoring/services/sla-monitoring.service.js)
[document.service.js](D:/Project/app-edms-smpv/apps/frontend/src/features/document-register/services/document.service.js)
[escalation.service.js](D:/Project/app-edms-smpv/apps/frontend/src/features/escalation-alert/services/escalation.service.js)
Contoh:
evaluate(document, now = new Date())
dan:
SlaEngineService.evaluate(document, now ?? new Date())
Ini adalah sisa engine/fallback frontend. Kalau flow sudah backend-first, bagian ini idealnya tidak lagi menjadi source of truth runtime utama.
3. Formatter / Parser Tanggal
Ini normal dan tidak berarti browser menentukan business time.
Contoh file:
DocumentRegisterTable.jsx
DocumentActionModal.jsx
AuditTrailTable.jsx
NotificationTable.jsx
ProjectManagementPage.jsx
Pemakaian:
new Date(value)
Untuk format tanggal, sorting, atau parsing timestamp dari backend.
Ini relatif aman karena hanya membaca/memformat data.
4. Local/Legacy Repository dan Mock/Browser Storage
Masih ada beberapa service lokal yang memakai browser time untuk data lokal/mock:
[document.service.js](D:/Project/app-edms-smpv/apps/frontend/src/features/document-register/services/document.service.js)
[file.service.js](D:/Project/app-edms-smpv/apps/frontend/src/features/document-register/services/file.service.js)
[workflow-attachment.service.js](D:/Project/app-edms-smpv/apps/frontend/src/features/document-register/services/workflow-attachment.service.js)
browser-file-storage.service.js
beberapa seed/demo/reset service
Contoh:
new Date().toISOString()
Date.now()
Ini kemungkinan sisa local runtime sebelum backend integration. Selama tidak dipakai sebagai runtime source of truth, tidak langsung memengaruhi backend flow.
Kesimpulan paling penting:
SLA Timer live display masih memakai browser time sebagai “now”.
Yang sudah canonical dari backend/MySQL adalah:
slaStartedAt
slaStoppedAt
workflow status
daysUntilValidation
sla status backend
Jadi saat ini modelnya hybrid:
elapsed = browser Date.now() - backend slaStartedAt
Kalau ingin SLA Timer sepenuhnya server-based, perlu server time anchor dari API, misalnya serverNow, lalu frontend menghitung:
serverNow + elapsed browser sejak response diterima - slaStartedAt
Itu akan mengurangi risiko perbedaan jam browser.