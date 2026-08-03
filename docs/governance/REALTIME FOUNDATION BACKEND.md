# STAGE 6.3 — REALTIME FOUNDATION BACKEND
## PART 1A — Context, Objective, Scope, Source of Truth, dan Architecture Principles

---

# 1. Context

Project ReBuild Engineering Document Management System (EDMS) telah menyelesaikan seluruh tahapan persiapan implementasi Realtime Foundation.

Tahapan yang telah selesai meliputi:

- Stage 6.0 — Realtime Scope Decision
- Stage 6.1 — Realtime Readiness Audit
- Stage 6.1B — Realtime Architecture Review
- Stage 6.2 — Concurrency Hardening

Selain itu seluruh pondasi backend yang berkaitan dengan realtime juga telah selesai divalidasi, antara lain:

- Authentication
- Authorization
- Active Project Context
- Project Membership
- Notification Domain
- SLA Engine
- Escalation Alert
- Unified Time Authority
- Railway Deployment
- Scheduler
- Upload Revision
- Approval Workflow
- Concurrency Protection
- Workflow Conflict Recovery
- Revision Conflict Recovery

Seluruh Local UAT dan Railway UAT untuk Stage 6.2 telah dinyatakan PASS.

Dengan demikian project memasuki tahap berikutnya yaitu membangun pondasi Realtime Backend.

Stage ini BUKAN bertujuan membuat seluruh aplikasi menjadi realtime.

Stage ini hanya membangun pondasi agar seluruh feature realtime berikutnya dapat dibangun secara konsisten.

---

# 2. Objective

Membangun fondasi backend realtime yang:

- scalable;
- maintainable;
- mudah dikembangkan;
- konsisten dengan Business Workflow;
- tidak mengubah Database Schema;
- tidak mengubah Business Logic;
- tidak mengubah REST API yang sudah ada.

Seluruh implementasi realtime harus tetap mempertahankan prinsip bahwa REST API merupakan sumber data final.

Realtime hanya berfungsi sebagai media pemberitahuan bahwa data telah berubah.

Frontend tetap mengambil data terbaru menggunakan REST API.

---

# 3. Primary Source of Truth

Seluruh implementasi Stage 6.3 WAJIB mengikuti keputusan yang telah disetujui sebelumnya.

Urutan prioritas Source of Truth adalah:

1.
REALTIME-SCOPE-BEHAVIOUR-DECISION.md

2.
BUSINESS-WORKFLOW.md

3.
PRD.md

4.
SYSTEM-REQUIREMENTS.md

5.
FEATURE-MAPPING.md

6.
DATABASE-SCHEMA.md

7.
DATABASE-DESIGN-DECISIONS.md

8.
BACKEND-FOUNDATION.md

9.
API-CONTRACT.md

10.
DECISION-LOG.md

Apabila source code saat ini bertentangan dengan Source of Truth di atas, implementasi wajib mengikuti Source of Truth.

JANGAN mengubah Source of Truth tanpa persetujuan user.

---

# 4. Architecture Principles

Seluruh implementasi wajib mengikuti prinsip berikut.

## 4.1 Backend adalah Source of Truth

Seluruh perubahan Business State hanya boleh berasal dari backend.

Frontend tidak boleh menentukan state akhir.

Frontend tidak boleh menganggap event realtime sebagai data final.

---

## 4.2 Database adalah Canonical Data

Seluruh data resmi sistem berasal dari Database.

Tidak boleh ada Business State yang hanya tersimpan di Connection Registry.

Tidak boleh ada Business State yang hanya tersimpan di Event Bus.

Connection Registry hanyalah media komunikasi.

---

## 4.3 REST API adalah Final Data Source

Realtime TIDAK mengirim data bisnis lengkap.

Realtime hanya mengirim sinyal bahwa suatu resource berubah.

Setelah menerima event realtime:

Frontend wajib melakukan refetch melalui REST API.

Dengan demikian:

REST tetap menjadi sumber data final.

---

## 4.4 Realtime adalah Event Channel

Realtime bukan pengganti REST API.

Realtime tidak bertanggung jawab mengirim keseluruhan Business State.

Realtime hanya mengirim event.

Contoh:

workflow.changed

↓

Frontend menerima event

↓

Frontend memanggil REST

↓

REST mengembalikan data terbaru

---

## 4.5 Publish After Commit

Event realtime hanya boleh dipublish setelah transaction database berhasil di-commit.

DILARANG:

Publish sebelum commit.

DILARANG:

Publish ketika transaction rollback.

Apabila transaction gagal:

Tidak boleh ada event realtime yang terkirim.

---

## 4.6 Business Transaction Independence

Keberhasilan realtime tidak boleh mempengaruhi keberhasilan transaksi bisnis.

Contoh:

Approval berhasil.

↓

Publish realtime gagal.

↓

Approval tetap SUCCESS.

Sebaliknya:

Approval tidak boleh di-rollback hanya karena realtime gagal.

---

## 4.7 Event Delivery Independence

Delivery realtime bukan bagian dari Business Transaction.

Business Success

≠

Realtime Delivery Success

Realtime Delivery Failure hanya boleh:

- dicatat ke log;
- dipantau;
- tidak mengubah Business Result.

---

# 5. Stage Scope

Stage ini hanya membangun pondasi backend.

Yang termasuk scope:

- Canonical Event Contract
- Event Constants
- Internal Event Bus
- Publisher
- Connection Registry
- SSE Service
- SSE Controller
- SSE Route
- Authentication Integration
- Active Project Scope
- Heartbeat
- Connection Cleanup
- Graceful Shutdown
- Structured Logging
- Local Validation
- Railway Validation

---

# 6. Out of Scope

Stage ini TIDAK boleh mengimplementasikan:

- Notification Realtime
- Dashboard Realtime
- Document Register Realtime
- Workflow Detail Realtime
- Comment Realtime
- History Realtime
- Escalation Realtime
- Presence
- Document Locking
- Redis
- Kafka
- RabbitMQ
- Outbox Pattern
- Multi Instance
- Sticky Session
- Offline Replay

Seluruh feature di atas akan dikerjakan pada Stage berikutnya.

---

# 7. Definition of Success

Stage 6.3 dianggap berhasil apabila:

- Backend mampu menerima koneksi realtime.
- Backend mampu menyimpan koneksi aktif.
- Backend mampu mengirim synthetic event.
- Backend mampu mengelola heartbeat.
- Backend mampu membersihkan koneksi.
- Backend mampu shutdown tanpa memory leak.
- Tidak ada perubahan Business Workflow.
- Tidak ada perubahan Database Schema.
- Tidak ada perubahan Frontend.
- Tidak ada perubahan Notification Behaviour.
- Tidak ada perubahan SLA Behaviour.
- Tidak ada perubahan REST Contract.

Apabila seluruh poin di atas terpenuhi maka Stage 6.3 dapat dinyatakan selesai dan siap digunakan oleh Stage 6.4.

---

# 8. Final Instruction

Seluruh implementasi harus mengikuti prinsip:

"Build the Foundation First."

Jangan mengimplementasikan consumer realtime.

Jangan mengimplementasikan feature realtime.

Bangun hanya pondasi backend yang akan digunakan oleh seluruh Stage berikutnya.

STOP setelah seluruh pondasi backend selesai dibangun dan tervalidasi.

---

## PART 1B — Event Architecture, Event Contract, Event Bus, Publisher, Connection Registry

---

# 9. Canonical Event Architecture

Seluruh arsitektur realtime WAJIB mengikuti alur berikut.

```
Business Request
        │
        ▼
REST API
        │
        ▼
Business Service
        │
        ▼
Database Transaction
        │
 Commit SUCCESS
        │
        ▼
Realtime Publisher
        │
        ▼
Internal Event Bus
        │
        ▼
Connection Registry
        │
        ▼
SSE Connection
        │
        ▼
Frontend
        │
        ▼
REST Refetch
```

Prinsip penting:

Realtime TIDAK mengirim Business State.

Realtime hanya mengirim Event.

REST API tetap menjadi sumber data final.

---

# 10. Canonical Event Contract

Seluruh event realtime WAJIB menggunakan struktur yang konsisten.

Minimal:

```json
{
  "eventId": "...",
  "type": "...",
  "version": 1,
  "occurredAt": "...",
  "scope": "...",
  "projectId": "...",
  "recipientUserId": null,
  "resourceType": "...",
  "resourceId": "...",
  "actorUserId": "...",
  "reason": "...",
  "correlationId": null
}
```

---

## 10.1 eventId

Harus unik.

Tidak perlu berasal dari database.

Dapat menggunakan UUID atau Entity ID Generator existing.

---

## 10.2 type

Menggunakan format:

```
domain.action
```

Contoh:

```
workflow.changed
```

```
document.updated
```

```
notification.created
```

Gunakan huruf kecil seluruhnya.

JANGAN menggunakan:

```
WorkflowChanged
```

```
DOCUMENT_UPDATED
```

---

## 10.3 version

Selalu:

```
1
```

Disiapkan untuk compatibility di masa depan.

---

## 10.4 occurredAt

Menggunakan UTC.

Mengikuti Unified Time Authority.

Bukan timestamp browser.

---

## 10.5 scope

Nilai yang diperbolehkan:

```
project
```

```
user
```

```
user-project
```

JANGAN menambah scope lain tanpa persetujuan.

---

## 10.6 projectId

Project tempat event terjadi.

Wajib ada untuk seluruh Project Scoped Event.

---

## 10.7 recipientUserId

Digunakan hanya untuk event User Scoped.

Project Event dapat bernilai:

```
null
```

---

## 10.8 resourceType

Contoh:

```
Document
```

```
Notification
```

```
Revision
```

---

## 10.9 resourceId

ID resource yang berubah.

---

## 10.10 actorUserId

User yang menyebabkan perubahan.

Untuk scheduler dapat bernilai:

```
null
```

---

## 10.11 reason

Menjelaskan penyebab event.

Contoh:

```
approval_transition
```

```
revision_uploaded
```

```
notification_created
```

---

## 10.12 correlationId

Opsional.

Digunakan apabila Request ID Middleware tersedia.

Bukan blocker Stage 6.3.

---

# 11. Event Naming Convention

Gunakan format:

```
domain.action
```

Contoh resmi:

```
document.created
```

```
document.updated
```

```
document.archived
```

```
document.restored
```

```
revision.uploaded
```

```
workflow.changed
```

```
notification.created
```

```
notification.read
```

```
notification.read_all
```

```
notification.deleted
```

```
sla.changed
```

```
escalation.changed
```

```
comment.created
```

```
history.changed
```

JANGAN menggunakan CamelCase.

JANGAN menggunakan snake_case.

---

# 12. Internal Event Bus

Stage 6.3 menggunakan:

Node.js EventEmitter.

Tidak menggunakan:

- Redis
- RabbitMQ
- Kafka
- Message Broker

---

## 12.1 Singleton

Event Bus WAJIB singleton.

Tidak boleh dibuat setiap request.

Tidak boleh dibuat setiap controller.

Tidak boleh dibuat setiap service.

---

## 12.2 Dependency

Gunakan dependency bawaan Node.js.

JANGAN menambah library baru apabila tidak diperlukan.

---

## 12.3 Listener Error Isolation

Listener yang gagal TIDAK boleh:

- mematikan Event Bus;
- mematikan backend;
- membatalkan Business Transaction.

Gunakan Safe Publish Pattern.

---

# 13. Realtime Publisher

Publisher menjadi satu-satunya pintu untuk mengirim event.

Business Service TIDAK boleh langsung memanggil Connection Registry.

Business Service

↓

Publisher

↓

Event Bus

↓

Registry

---

## 13.1 Publish After Commit

Publisher hanya boleh dipanggil setelah:

Transaction SUCCESS.

JANGAN publish sebelum commit.

---

## 13.2 Failure Behaviour

Jika publish gagal:

Business Transaction tetap SUCCESS.

Publisher hanya:

- log;
- hitung metric;
- lanjutkan eksekusi.

---

## 13.3 Retry

Stage 6.3:

Tidak ada retry.

Tidak ada persistence.

Tidak ada replay.

---

# 14. Connection Registry

Connection Registry adalah penyimpan seluruh koneksi aktif.

Registry BUKAN tempat menyimpan Business State.

---

## 14.1 Minimal Data

Registry minimal menyimpan:

```
connectionId
```

```
userId
```

```
projectId
```

```
response
```

```
connectedAt
```

```
lastHeartbeatAt
```

```
requestId
```

---

## 14.2 Jangan Menyimpan

JANGAN menyimpan:

- Official Role
- Workflow State
- SLA
- Document State
- Permission Snapshot

Seluruh data tersebut tetap berasal dari backend.

---

# 15. Routing Strategy

Connection Registry TIDAK menentukan siapa penerima event.

Recipient ditentukan lebih dahulu oleh Business Layer.

Contoh:

Approval A

↓

Workflow Service

↓

Hitung Recipient

↓

Publisher

↓

Registry

↓

Delivery

---

# 16. Delivery Strategy

Registry WAJIB mampu:

```
sendToUser()
```

```
sendToUsers()
```

```
sendToProject()
```

```
sendToUserInProject()
```

```
sendToUsersInProject()
```

Delivery TIDAK boleh berhenti pada satu koneksi.

Apabila:

1 User

memiliki

3 Browser

↓

Ketiga browser harus menerima event.

Apabila:

5 User

berada pada Project yang sama

↓

Kelima user harus menerima event sesuai recipient rule.

---

# 17. Scope Resolution

Project Scoped Event

↓

Semua connection pada Project tersebut.

---

User Scoped Event

↓

Seluruh connection milik user tersebut.

---

User Project Scoped Event

↓

Seluruh connection milik user tersebut

DAN

berada pada Project tersebut.

---

# 18. One-to-Many Delivery

Connection Registry WAJIB mendukung:

```
1 Event
```

↓

```
N Connection
```

Contoh:

Team Process

Approval A

↓

Workflow berubah menjadi Project Review

↓

Recipient Resolver menghasilkan:

```
5 User Team Project
```

↓

Registry mengirim event

ke

seluruh connection

milik

kelima user tersebut.

Bukan hanya satu user.

---

# 19. Multiple Browser Support

Stage 6.3 mengizinkan:

```
1 User
```

↓

```
Chrome
```

↓

```
Edge
```

↓

```
Firefox
```

↓

3 Connection aktif.

Seluruh connection tersebut harus menerima event.

---

# 20. Single Instance Rule

Stage 6.3 hanya berlaku untuk:

```
1 Backend Instance
```

In-memory Registry diperbolehkan.

In-memory Event Bus diperbolehkan.

Apabila backend berubah menjadi:

```
2 Instance
```

atau lebih,

implementasi WAJIB dimigrasikan ke:

- Redis Pub/Sub
- Outbox Pattern
- Message Broker

Sebelum Multi Instance diaktifkan.

---

# 21. Final Principle

Connection Registry hanyalah media pengiriman.

Business Layer tetap menentukan:

- siapa penerima;
- kapan event dipublish;
- alasan event dipublish.

Connection Registry hanya bertugas:

"Mengirim event kepada seluruh connection yang sesuai."

---

## PART 1C — SSE Endpoint, Authentication, Active Project, Heartbeat, Connection Lifecycle

---

# 22. SSE Endpoint

Stage 6.3 membangun satu endpoint resmi untuk koneksi realtime.

Rekomendasi endpoint:

```
GET /api/v1/events
```

Apabila struktur routing backend saat ini lebih sesuai menggunakan endpoint lain, diperbolehkan menyesuaikan selama tetap konsisten dengan REST API existing.

Endpoint ini hanya bertugas:

- membuka koneksi SSE;
- melakukan validasi;
- mendaftarkan connection;
- menjaga koneksi tetap hidup;
- mengirim event.

Endpoint ini BUKAN endpoint Business API.

---

# 23. Request Lifecycle

Urutan lifecycle WAJIB sebagai berikut.

```
Request Masuk
        │
        ▼
Authenticate User
        │
        ▼
Resolve Active Project
        │
        ▼
Validate Membership
        │
        ▼
Register Connection
        │
        ▼
Kirim Initial Connected Event
        │
        ▼
Heartbeat
        │
        ▼
Business Event
        │
        ▼
Client Disconnect
        │
        ▼
Cleanup Registry
```

Urutan ini tidak boleh dibalik.

---

# 24. Authentication

Endpoint SSE WAJIB menggunakan mekanisme Authentication yang sudah ada.

JANGAN membuat sistem authentication baru.

Gunakan:

- HttpOnly Cookie
- Authenticate Middleware existing
- Session Validation existing

---

## 24.1 Dilarang

JANGAN menggunakan:

```
?token=...
```

atau:

```
Authorization Bearer melalui query string
```

Token pada query string meningkatkan risiko kebocoran melalui:

- browser history;
- proxy log;
- server log;
- analytics.

---

## 24.2 Session

Apabila session:

- expired;
- logout;
- inactive;
- revoked;

backend WAJIB menutup koneksi SSE.

---

# 25. Active Project Context

Realtime WAJIB mengikuti Active Project yang sedang digunakan user.

Backend tidak boleh menganggap seluruh project sebagai satu ruang global.

---

## 25.1 Resolve Active Project

Gunakan mekanisme Active Project existing.

JANGAN membuat penyimpanan Active Project baru.

---

## 25.2 Membership Validation

Sebelum connection didaftarkan:

Backend WAJIB memastikan:

- user aktif;
- project aktif;
- membership aktif.

Apabila salah satu tidak valid:

Connection harus ditolak.

---

## 25.3 Project Switching

Apabila user berpindah Active Project:

Frontend akan membuka connection baru.

Backend harus:

- menutup connection lama;
- unregister registry lama;
- mendaftarkan connection baru.

Tidak boleh ada connection aktif pada project lama.

---

# 26. Initial Connected Event

Setelah koneksi berhasil dibuka:

Backend BOLEH mengirim satu event awal sebagai penanda bahwa koneksi berhasil dibuat.

Contoh:

```
connected
```

Event ini bukan Business Event.

Tujuannya hanya sebagai handshake.

---

# 27. SSE Headers

Endpoint SSE WAJIB mengirim header yang sesuai standar.

Minimal:

- text/event-stream
- no-cache
- keep-alive

Apabila terdapat middleware yang menambahkan buffering atau response wrapping, endpoint SSE harus dikecualikan dari mekanisme tersebut.

---

# 28. Connection Lifecycle

Setiap connection memiliki lifecycle berikut.

```
CONNECTING
        │
        ▼
CONNECTED
        │
        ▼
HEARTBEAT
        │
        ▼
EVENT DELIVERY
        │
        ▼
DISCONNECTED
```

Registry harus selalu mencerminkan kondisi aktual.

---

# 29. Heartbeat

Heartbeat digunakan untuk menjaga koneksi tetap hidup.

Heartbeat BUKAN Business Event.

Heartbeat tidak boleh memicu perubahan data.

---

## 29.1 Interval

Gunakan interval sekitar:

```
25 detik
```

Tidak perlu terlalu sering.

Tidak perlu terlalu jarang.

---

## 29.2 Format

Gunakan SSE Comment.

Contoh:

```
: heartbeat
```

Frontend tidak perlu memproses heartbeat.

---

## 29.3 Logging

Heartbeat tidak perlu dicatat ke log production.

Logging heartbeat hanya diperbolehkan pada mode debugging.

---

# 30. Broken Connection Detection

Apabila:

```
response.write(...)
```

gagal,

backend WAJIB:

- unregister connection;
- menghentikan heartbeat;
- membersihkan resource.

JANGAN membiarkan connection mati tetap berada di registry.

---

# 31. Connection Cleanup

Cleanup WAJIB dilakukan ketika:

- browser ditutup;
- tab ditutup;
- logout;
- session expired;
- network putus;
- process shutdown.

Cleanup harus menghapus:

- connection registry;
- heartbeat timer;
- referensi response.

Tidak boleh meninggalkan memory leak.

---

# 32. Multiple Browser

Stage 6.3 mendukung:

```
1 User
```

↓

```
Chrome
```

↓

```
Edge
```

↓

```
Firefox
```

↓

```
Mobile Browser
```

Setiap browser dianggap sebagai connection yang berbeda.

Seluruh connection tersebut harus menerima event sesuai scope.

---

# 33. Multiple Tab

Stage 6.3 mengizinkan:

```
1 Browser
```

↓

```
5 Tab
```

↓

```
5 Connection
```

Tidak perlu melakukan deduplikasi connection pada Stage 6.3.

---

# 34. Railway Compatibility

Implementasi harus kompatibel dengan Railway Production yang saat ini digunakan.

Asumsi yang digunakan:

- Single Backend Instance
- In-memory Registry
- Tidak ada Redis
- Tidak ada Message Broker

Restart Railway dianggap sebagai disconnect normal.

Frontend akan melakukan reconnect pada Stage 6.4.

---

# 35. Graceful Shutdown

Ketika backend menerima:

- SIGINT
- SIGTERM

backend WAJIB menjalankan urutan berikut.

```
Stop menerima connection baru
        │
        ▼
Stop Heartbeat
        │
        ▼
Tutup seluruh SSE Connection
        │
        ▼
Unregister Registry
        │
        ▼
Shutdown Scheduler (jika diperlukan)
        │
        ▼
Close Database Pool
        │
        ▼
Exit Process
```

Tidak boleh ada process yang menggantung karena connection SSE masih aktif.

---

# 36. Error Isolation

Business Transaction harus independen terhadap SSE.

Contoh:

```
Approval SUCCESS
```

↓

```
Publish Event Gagal
```

↓

```
Approval tetap SUCCESS
```

Realtime failure hanya boleh:

- dicatat;
- dipantau;
- tidak memengaruhi hasil transaksi bisnis.

---

# 37. Structured Logging

Minimal informasi yang boleh dicatat:

- connectionId
- userId
- projectId
- eventType
- scope
- connectedAt
- duration
- requestId
- correlationId (jika tersedia)

JANGAN mencatat:

- JWT
- Cookie
- Password
- Refresh Token
- Attachment
- Payload rahasia

---

# 38. Validation Stage 6.3

Codex WAJIB melakukan validasi berikut.

## Static Validation

- Backend Syntax PASS
- Backend Import PASS
- Bootstrap PASS

---

## Runtime Validation (Local)

- Unauthorized ditolak.
- Session valid berhasil connect.
- Membership invalid ditolak.
- Active Project invalid ditolak.
- Connection berhasil diregistrasi.
- Initial Connected Event diterima.
- Heartbeat diterima.
- Synthetic Event diterima.
- Browser ditutup → Cleanup berjalan.
- Logout → Connection ditutup.
- Multiple Browser → Seluruh connection aktif.
- Multiple Tab → Seluruh connection aktif.

---

## Railway Validation

Pastikan:

- Connection stabil.
- Heartbeat tidak terputus.
- Restart Railway memutus connection dengan bersih.
- Tidak ada memory leak.
- Tidak ada duplicate registry.
- Tidak ada cross-project event.

---

# 39. Deliverables

Codex WAJIB menampilkan laporan akhir:

## A. Files Changed

## B. SSE Endpoint

## C. Authentication Integration

## D. Active Project Integration

## E. Connection Registry

## F. Heartbeat

## G. Connection Lifecycle

## H. Graceful Shutdown

## I. Structured Logging

## J. Static Validation

## K. Runtime Validation

## L. Railway Validation

## M. Known Limitation

## N. Final Status

Gunakan salah satu:

```
REALTIME FOUNDATION BACKEND COMPLETED
```

atau

```
REALTIME FOUNDATION BACKEND PARTIAL
```

---

# 40. Definition of Done

Stage 6.3 dinyatakan selesai apabila:

- SSE Endpoint tersedia.
- Authentication menggunakan mekanisme existing.
- Active Project tervalidasi.
- Membership tervalidasi.
- Connection Registry berjalan.
- Initial Connected Event berjalan.
- Heartbeat berjalan.
- Cleanup berjalan.
- Graceful Shutdown berjalan.
- Tidak ada perubahan Database Schema.
- Tidak ada perubahan Business Workflow.
- Tidak ada perubahan REST Contract.
- Tidak ada perubahan Frontend.
- Local Validation PASS.
- Railway Validation PASS.

---

# 41. Final Instruction

Bangun hanya pondasi backend realtime.

Jangan mengimplementasikan consumer realtime.

Jangan mengimplementasikan Notification Realtime.

Jangan mengimplementasikan Dashboard Realtime.

Jangan mengimplementasikan Document Register Realtime.

Jangan mengimplementasikan Workflow Realtime.

Jangan mengimplementasikan Comment Realtime.

Jangan mengimplementasikan History Realtime.

Setelah seluruh foundation selesai dan tervalidasi:

STOP.

Tahap berikutnya akan dikerjakan pada:

**Stage 6.4 — Frontend Realtime Client.**