# REALTIME-SCOPE-BEHAVIOUR-DECISION.md
**Status:** Final v1.0  
**Review Status:** Audited melalui Stage 6.1 dan Stage 6.1B
**Project:** ReBuild EDMS Kukuh

---

# 1. Pendahuluan

Dokumen ini merupakan **Architecture Decision Document (ADD)** yang mendefinisikan ruang lingkup (Scope) dan perilaku (Behaviour) Realtime Infrastructure pada EDMS.

Dokumen ini **bukan dokumen implementasi** dan **bukan dokumen teknologi**. Artinya, isi dokumen ini tetap berlaku meskipun di masa depan transport realtime berubah dari SSE menjadi WebSocket atau teknologi lain.

Dokumen ini akan menjadi acuan utama sebelum dilakukan Audit Readiness dan implementasi.

---

# 2. Tujuan

Realtime Infrastructure dibangun untuk:

- Menghilangkan kebutuhan refresh manual pada perubahan penting.
- Menjaga sinkronisasi antar pengguna.
- Memastikan Backend tetap menjadi Source of Truth.
- Meningkatkan User Experience tanpa mengubah Business Workflow.

---

# 3. Ruang Lingkup

## Masuk Scope

- Dashboard
- Document Register
- Workflow
- Notification
- SLA Monitoring
- Escalation Alert
- Document Detail
- Revision History
- Comment

## Tidak Masuk Scope Tahap Awal

- Audit Trail
- User Presence
- Document Locking
- Chat
- Collaborative Editing

---

# 4. Architecture Principles

1. Backend adalah Source of Truth untuk seluruh Business State.
2. Database adalah Canonical Data.
3. REST API tetap menjadi Command Channel dan jalur pengambilan data final.
4. Realtime hanya menjadi Event Channel yang memberi sinyal bahwa data telah berubah.
5. Frontend wajib melakukan refetch melalui REST API untuk memperoleh kondisi terbaru.
6. Browser tidak boleh menetapkan Business State.
7. Browser hanya boleh melakukan display projection yang tidak mengubah Business State.
8. Seluruh Business Rule tetap dijalankan oleh Backend.
9. Event hanya boleh dipublikasikan setelah transaction berhasil di-commit.
10. Kegagalan realtime tidak boleh membatalkan Business Transaction yang telah berhasil.

---

# 5. Behaviour Decision

## Dashboard

- KPI otomatis diperbarui.
- SLA Overview otomatis diperbarui.
- Escalation Widget otomatis diperbarui.
- Posisi filter, sorting, search, page size, dan pagination harus dipertahankan.

## Document Register

- Perubahan document terlihat otomatis.
- Revision aktif otomatis berubah.
- Archive/Restore otomatis tercermin.
- Highlight row merupakan Future Enhancement.

## Notification

- Notification Badge diperbarui secara realtime.
- Notification List diperbarui secara realtime.
- Notification bersifat User Scoped dan Active Project Scoped.
- Notification hanya boleh dikirim kepada recipient yang berhak.
- Notification milik user lain tidak boleh dikirim ke koneksi user yang tidak berkepentingan.
- Mark Read dan Mark All Read harus sinkron lintas perangkat untuk akun yang sama.
- Perubahan notification pada akun lain tidak boleh memengaruhi notification user saat ini.
- Title dan Message tetap berasal dari Notification Domain dan Message Dictionary.
- Realtime hanya memberi sinyal agar Notification List dan Badge mengambil data terbaru.

## Workflow

- Perubahan workflow harus langsung terlihat pada user lain dalam Active Project yang sama.
- Backend wajib menjadi penentu akhir terhadap seluruh Approval A/B/C.
- Approval berbasis data stale harus ditolak oleh Backend menggunakan optimistic concurrency.
- Request Approval minimal harus membawa:
  - expectedWorkflowStatus;
  - expectedActiveRevisionId.
- Backend wajib memeriksa:
  - workflow status terkini;
  - active revision terkini;
  - Current Assignee;
  - validitas action A/B/C.
- Jika kondisi dokumen telah berubah, Backend mengembalikan HTTP 409 Conflict.
- Frontend menutup modal stale.
- Frontend menampilkan pemberitahuan singkat:

  `Dokumen telah diperbarui oleh pengguna lain. Data dimuat ulang.`

- Frontend kemudian melakukan refetch terhadap Document Detail, Document Register, Dashboard, Workflow History, dan data terkait.
- Hanya satu dari dua Approval yang hampir bersamaan boleh berhasil.

## SLA

- Backend dan database tetap menjadi Source of Truth untuk SLA State.
- Browser tidak boleh menetapkan:
  - On Track;
  - At Risk;
  - Overdue;
  - Final As-Built;
  - Escalation Level;
  - SLA Notification.
- Browser hanya boleh melakukan display projection SLA Timer menggunakan:
  - slaStartedAt dari Backend;
  - Estimated Server Time dari Unified Time Authority.
- Unified Time Authority tetap menjadi mesin waktu resmi.
- Notification SLA tetap diproduksi oleh Backend.
- Realtime hanya memberi sinyal bahwa data SLA telah berubah.
- Frontend mengambil ulang data SLA final melalui REST API.

## Escalation

- Escalation Alert diperbarui secara realtime.
- Escalation mengikuti hasil evaluasi SLA dari Backend.
- Browser tidak boleh menghitung Escalation Level.
- Perubahan Escalation dipublikasikan oleh Backend setelah Business Transaction selesai.
- Perubahan Level Escalation dapat ditunda pada tahap awal apabila belum menjadi kebutuhan bisnis.

---

# 6. Matriks Scope

| Modul | Realtime |
|---|:---:|
| Dashboard | ✅ |
| Document Register | ✅ |
| Workflow | ✅ |
| Notification | ✅ |
| SLA Monitoring | ✅ |
| Escalation Alert | ✅ |
| Detail Document | ✅ |
| Revision History | ✅ |
| Comment | ✅ |
| Audit Trail | ❌ |
| User Presence | Future |
| Document Lock | Future |

---

# 7. Synchronization Scope

| Scope | Behaviour |
|---|---|
| User Scoped | Sinkronisasi notification pribadi untuk akun yang sama |
| User + Active Project Scoped | Notification Badge dan Notification List pada Active Project |
| Active Project Scoped | Dashboard |
| Active Project Scoped | Document Register |
| Active Project Scoped | Workflow |
| Active Project Scoped | SLA Monitoring |
| Active Project Scoped | Escalation Alert |
| Global Scoped | Tidak digunakan pada tahap awal |

### Scope Rules

- Backend wajib memeriksa active membership sebelum mengirim event.
- Frontend wajib mengabaikan event dengan projectId yang berbeda dari Active Project.
- Admin tidak otomatis menerima event seluruh project.
- REST API tetap wajib melakukan authorization ketika frontend melakukan refetch.
- Event realtime bukan pengganti authorization.

---

# 8. Failure Behaviour

Jika koneksi realtime gagal:

1. Sistem mencoba reconnect secara otomatis.
2. Reconnect menggunakan exponential backoff dan jitter.
3. Delay reconnect dimulai dari sekitar 1 detik dan dibatasi maksimal sekitar 30 detik.
4. Jika koneksi gagal karena HTTP 401 atau 403, reconnect dihentikan sampai Authentication Context atau Active Project kembali valid.
5. Setelah reconnect berhasil, frontend melakukan refetch terhadap query penting pada Active Project.
6. Query yang direfetch minimal:
   - Dashboard;
   - Document Register;
   - Notification;
   - SLA Monitoring;
   - Escalation Alert.
7. Bila koneksi gagal berkepanjangan, tampilkan indikator kecil:

   `Pembaruan langsung sedang terputus. Data tetap dapat dimuat ulang secara manual.`

8. REST API tetap berfungsi normal.
9. Create, Edit, Upload Revision, Approval, dan operasi bisnis lain tetap dapat digunakan.
10. Workflow tidak boleh gagal hanya karena realtime delivery gagal.
11. Event yang terlewat selama koneksi putus dipulihkan melalui REST refetch setelah reconnect.

---

# 9. Conflict Behaviour

Jika dua user memproses dokumen yang sama:

- Backend menjadi penentu akhir.
- Approval kedua berdasarkan data lama harus ditolak.
- Frontend menampilkan pemberitahuan.
- Data terbaru dimuat ulang.
- Modal stale ditutup.

---

# 10. Event Delivery Principles

- Event harus berukuran kecil.
- Event hanya memberi tahu bahwa data telah berubah.
- REST API tetap menjadi sumber data final.
- Frontend memperlakukan event sebagai idempotent invalidation signal.
- Event tidak boleh menjalankan Business Mutation.
- Event boleh diterima lebih dari satu kali tanpa menyebabkan perubahan bisnis ganda.
- Payload tidak boleh membawa:
  - token;
  - cookie;
  - credential;
  - isi attachment;
  - storage path;
  - isi komentar panjang;
  - data sensitif yang tidak diperlukan.
- Event wajib dipublikasikan setelah transaction berhasil di-commit.
- Realtime delivery failure tidak membatalkan Business Transaction.
- Frontend tidak boleh bergantung pada urutan kedatangan event.
- Duplicate event harus aman.
- Event yang datang berdekatan harus dapat digabung agar tidak menyebabkan refetch berlebihan.

## Canonical Event Envelope

Setiap event realtime v1 menggunakan struktur minimum berikut:

```json
{
  "eventId": "rt_evt_...",
  "type": "workflow.changed",
  "version": 1,
  "occurredAt": "2026-08-03T10:00:00.000Z",
  "scope": "project",
  "projectId": "PRJ...",
  "recipientUserId": null,
  "resourceType": "Document",
  "resourceId": "DOC...",
  "documentId": "DOC...",
  "reason": "approval_transition",
  "actorUserId": "USR...",
  "correlationId": "corr_..."
}
```
Field wajib:

- eventId;
- type;
- version;
- occurredAt;
- scope;
- resourceType;
- resourceId;
- reason;
- correlationId.

Field opsional sesuai jenis event:

- projectId;
- recipientUserId;
- documentId;
- actorUserId.

occurredAt wajib menggunakan UTC dari Backend atau Unified Time Authority, bukan browser time.

## Event Naming Convention

Nama event menggunakan lowercase dot notation.

Contoh:

- document.created
- document.updated
- workflow.changed
- revision.uploaded
- notification.created
- notification.read
- sla.changed
- escalation.changed

Event schema wajib memiliki field `version`.

Event schema version tidak boleh digunakan sebagai workflow version atau optimistic concurrency version.

## Event Coalescing

Frontend wajib menghindari refetch storm.

Rekomendasi awal:

- Notification: debounce 100–250 ms.
- Document Register: debounce sekitar 300 ms.
- Dashboard: debounce 300–500 ms.
- SLA Monitoring: debounce 300–500 ms.
- Escalation Alert: debounce 300–500 ms.

Event yang datang berdekatan untuk query family yang sama digabung menjadi satu proses invalidation/refetch.

---

# 11. Deployment Strategy

## Local Development

- Single Backend Instance.
- In-memory Event Bus dan Connection Registry diperbolehkan.
- Satu tab dapat membuka satu koneksi realtime.
- Multiple tab berarti multiple connection pada tahap v1.

## Development / UAT Railway

- Single Backend Instance.
- In-memory Event Infrastructure diperbolehkan.
- Reconnect dan REST refetch wajib tersedia.
- Railway Serverless/Sleep tidak ideal untuk koneksi realtime yang stabil.
- Heartbeat dapat membuat backend tetap aktif dan mengurangi manfaat serverless sleep.

## Production v1

- Single Backend Instance.
- Backend disarankan Always-On.
- In-memory Event Bus diperbolehkan selama hanya ada satu backend instance.
- Multi-instance tidak boleh diaktifkan selama Event Bus masih in-memory.
- Keterbatasan single-instance wajib didokumentasikan.

## Future Multi-Instance

Sebelum backend menggunakan lebih dari satu instance, sistem wajib menggunakan salah satu:

- Redis Pub/Sub;
- Outbox Pattern;
- Message Broker;
- Persistent Event Infrastructure.

Migrasi menjadi wajib apabila:

- backend menggunakan lebih dari satu instance;
- missed event harus dapat direplay;
- event tidak boleh hilang saat restart;
- jumlah koneksi meningkat secara signifikan;
- restart atau deploy menyebabkan synchronization gap yang tidak dapat diterima.

---

# 12. Connection Lifecycle

## Connection Start

Koneksi realtime dibuka setelah:

1. Login berhasil.
2. Authentication Context siap.
3. Active Project tersedia.
4. AppShell atau Protected Application aktif.

## Connection Stop

Koneksi realtime ditutup ketika:

- logout;
- session berakhir;
- user tidak lagi authenticated;
- Active Project berubah;
- tab ditutup;
- connection mengalami error permanen.

## Active Project Switch

Saat user berpindah project:

```text
Tutup koneksi Project lama
↓
Aktifkan Project baru
↓
Refetch data Project baru
↓
Buka koneksi realtime Project baru
```
Frontend wajib mengabaikan event dari project lama yang datang terlambat.

## Heartbeat
- Heartbeat dikirim sekitar setiap 25 detik.
- Heartbeat menggunakan SSE comment.
- Heartbeat tidak memiliki Business Logic.
- Heartbeat tidak perlu ditampilkan pada UI.
- Logging heartbeat hanya boleh aktif pada debug mode.

## Multiple Tabs

Pada tahap v1 berlaku aturan:

```text
1 Browser Tab
↓
1 Realtime Connection
```

Future Optimization:
- BroadcastChannel
- Leader Tab Architecture

---

# 13. Roadmap

1. Stage 6.0 — Realtime Scope Decision
2. Stage 6.1 — Realtime Readiness Audit
3. Stage 6.1B — Realtime Architecture Review
4. Stage 6.2 — Concurrency Hardening
5. Stage 6.3 — Realtime Foundation Backend
6. Stage 6.4 — Frontend Realtime Client
7. Stage 6.5 — Notification Badge & Notification List
8. Stage 6.6 — Document Register & Dashboard
9. Stage 6.7 — Workflow Detail, Modal, dan Conflict UX
10. Stage 6.8 — SLA Monitoring & Escalation Alert
11. Stage 6.9 — Comment & History
12. Regression Test
13. Multi-User UAT
14. Production Hardening

## Consumer Isolation Rule

Setiap consumer wajib mengikuti urutan:

```text
Implementasi
↓
Regression Test
↓
Local UAT
↓
Online UAT
↓
Baru lanjut ke consumer berikutnya
```
Seluruh consumer tidak boleh diimplementasikan dalam satu tahap besar.

---

# 14. Realtime Event Catalogue

| Event | Scope | Producer | Consumer | Current Runtime Status |
|---|---|---|---|---|
| document.created | Project | Document Service | Dashboard, Document Register | Active |
| document.updated | Project | Document Service | Dashboard, Document Register, Detail | Active |
| document.archived | Project | Document Service | Dashboard, Document Register | Active |
| document.restored | Project | Document Service | Dashboard, Document Register | Active |
| revision.uploaded | Project | Revision Service | Document Register, Detail, Revision History | Active |
| workflow.changed | Project | Approval / Workflow Service | Dashboard, Register, Detail, SLA | Active |
| comment.created | Project | Workflow / Comment Service | Document Detail / Comment Viewer | Active |
| history.changed | Project | Workflow / Revision Service | Detail, Revision History | Reserved / Not Published In Current Runtime |
| notification.created | User + Project | Notification Service | Badge, Notification List | Active |
| notification.read | User + Project | Notification Service | Badge, Notification List | Active |
| notification.read_all | User + Project | Notification Service | Badge, Notification List | Active |
| notification.deleted | User + Project | Notification Service | Badge, Notification List | Active |
| sla.changed | Project | SLA Producer | Dashboard, SLA Monitoring | Reserved / Not Published In Current Runtime |
| escalation.changed | Project | SLA / Escalation Producer | Dashboard, Escalation Alert | Reserved / Not Published In Current Runtime |

Event Catalogue ini merupakan catalogue v1.

Status `Reserved / Not Published In Current Runtime` berarti event name sudah menjadi bagian dari canonical contract dan constant source code, tetapi producer runtime belum mengirim event tersebut. Consumer yang membutuhkan update final tetap wajib melakukan REST refetch melalui event lain, recovery, polling terkontrol yang sudah ada, atau lifecycle query existing sampai producer resmi diaktifkan.

Event Audit Trail, User Presence, Document Locking, dan Collaborative Editing tidak termasuk scope awal.

---

# 15. Definition of Done

Dokumen ini dinyatakan **Final v1.0** apabila:

- Stage 6.1 Readiness Audit telah selesai.
- Stage 6.1B Realtime Architecture Review telah selesai.
- Seluruh revisi hasil audit telah dimasukkan.
- Tidak ada konflik dengan:
  - PRD;
  - BUSINESS-WORKFLOW.md;
  - Unified Time Authority;
  - Notification Domain;
  - Deployment Decision.
- Canonical Event Envelope telah ditetapkan.
- Event Naming Convention telah ditetapkan.
- User Scope dan Project Scope telah ditetapkan.
- Failure dan Reconnect Behaviour telah ditetapkan.
- Workflow Concurrency Boundary telah ditetapkan.
- SLA Browser Projection telah diperjelas.
- Deployment single-instance limitation telah didokumentasikan.
- Dokumen telah disetujui sebagai acuan implementasi Realtime Infrastructure.
- Seluruh keputusan pada dokumen ini telah menjadi acuan resmi sebelum implementasi Realtime Infrastructure dimulai.

Setelah dokumen ini berstatus Final v1.0, tahap berikutnya adalah:

```text
Stage 6.2 — Concurrency Hardening
```

---
