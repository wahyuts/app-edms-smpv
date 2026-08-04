# STAGE 6.4 — FRONTEND REALTIME CLIENT
## PART 1A — Context, Objective, Source of Truth, Scope, Foundation Reuse, dan Technical Requirements

---

# 1. Context

Project ReBuild Engineering Document Management System (EDMS) telah menyelesaikan pembangunan pondasi Realtime Backend pada Stage 6.3.

Stage 6.3 telah dinyatakan PASS melalui:

- Static Validation
- Local Runtime UAT
- Railway Runtime UAT

Saat ini backend telah memiliki:

- SSE Endpoint
- Connection Registry
- Internal Event Bus
- Realtime Publisher
- Authentication Integration
- Active Project Validation
- Membership Validation
- Heartbeat
- Connection Cleanup
- Logout Cleanup
- Graceful Shutdown

Implementasi tersebut telah menjadi bagian dari source code project dan dinyatakan stabil.

Stage 6.4 TIDAK membangun ulang Foundation Backend.

Stage ini hanya membangun Frontend Realtime Client agar frontend dapat memanfaatkan Foundation Backend yang telah tersedia.

---

# 2. Objective

Membangun Frontend Realtime Client yang:

- otomatis membuka koneksi SSE;
- otomatis menutup koneksi SSE;
- menangani reconnect secara aman;
- mengikuti lifecycle Authentication;
- mengikuti lifecycle Active Project;
- menyediakan Event Dispatcher;
- menyediakan Recovery Hook;
- tidak mengubah Business Workflow;
- tidak mengubah Database Schema;
- tidak mengubah REST API Existing;
- tidak mengubah UI Existing.

Stage ini hanya membangun jalur komunikasi realtime antara frontend dan backend.

Stage ini BELUM menghubungkan realtime dengan feature bisnis.

---

# 3. Source of Truth (WAJIB)

Seluruh implementasi WAJIB mengikuti dokumen berikut.

## Business

- BUSINESS-WORKFLOW.md

## Engineering

- ENGINEERING-FOUNDATION.md

## Product

- PRD.md

## Requirements

- SYSTEM-REQUIREMENTS.md

## Feature

- FEATURE-MAPPING.md

## Database

- DATABASE-SCHEMA.md

- DATABASE-DESIGN-DECISIONS.md

## Backend

- BACKEND-FOUNDATION.md

## Realtime Decision

- REALTIME-SCOPE-BEHAVIOUR-DECISION.md

## Governance

- DECISION-LOG.md

---

Selain dokumen di atas,

WAJIB menggunakan:

**Source Code hasil implementasi Stage 6.3 (Realtime Foundation Backend) yang telah dinyatakan PASS.**

Source code tersebut menjadi referensi implementasi Stage 6.4.

JANGAN menggunakan dokumen prompt Stage 6.3 sebagai dasar implementasi ulang.

Lakukan audit terhadap source code aktual sebelum melakukan perubahan apa pun.

Apabila terdapat perbedaan antara prompt Stage 6.3 dengan source code yang telah lolos UAT,

maka source code implementasi menjadi acuan Stage 6.4.

---

# 4. Foundation Reuse

Stage 6.4 WAJIB menggunakan Foundation Backend yang telah tersedia.

DILARANG membuat ulang:

- SSE Endpoint
- Event Bus
- Publisher
- Connection Registry
- Event Contract
- Heartbeat Mechanism
- Authentication Flow
- Logout Cleanup

Frontend hanya menjadi consumer terhadap Foundation Backend tersebut.

Apabila ditemukan defect pada Foundation Backend,

perubahan hanya boleh berupa bug fix.

Bukan implementasi ulang.

---

# 5. Scope

Stage ini hanya mencakup:

## 5.1 Frontend SSE Client

Bangun Frontend Realtime Client resmi.

JANGAN lagi menggunakan EventSource manual melalui DevTools.

Seluruh koneksi realtime harus berasal dari source code aplikasi.

---

## 5.2 Connection Lifecycle

Frontend wajib:

- membuka koneksi otomatis;
- menutup koneksi otomatis;
- melakukan reconnect;
- mengikuti lifecycle aplikasi.

---

## 5.3 Authentication Lifecycle

Connection hanya boleh dibuka apabila:

- user telah login;
- authentication valid;
- session masih aktif.

Connection wajib ditutup apabila:

- logout;
- session expired;
- authentication tidak lagi valid.

---

## 5.4 Active Project Lifecycle

Connection harus selalu mengikuti Active Project.

Ketika Active Project berubah:

- tutup connection lama;
- buka connection baru;
- abaikan event dari project sebelumnya.

---

## 5.5 Event Dispatcher

Bangun Event Dispatcher internal.

Dispatcher hanya bertugas:

- menerima event;
- memvalidasi event;
- meneruskan event kepada consumer.

Dispatcher BELUM menghubungkan event ke feature bisnis.

---

## 5.6 Recovery Hook

Sediakan Recovery Hook.

Recovery Hook digunakan ketika:

- reconnect berhasil;
- consumer Stage berikutnya membutuhkan recovery data.

Stage ini BELUM melakukan business refetch.

---

# 6. Connection Model

Gunakan model berikut.

```
1 Browser Tab

=

1 SSE Connection
```

Contoh:

```
Chrome

Tab Dashboard

↓

Connection A
```

```
Chrome

Tab Notification

↓

Connection B
```

```
Edge

Dashboard

↓

Connection C
```

Model ini telah disetujui untuk Stage 6.x.

Belum menggunakan:

- BroadcastChannel
- Shared Worker
- Leader Tab
- Shared Connection

---

# 7. Connection Lifecycle

Connection hanya boleh dibuka apabila:

- Authentication valid.
- Active Project tersedia.
- Protected Application telah aktif.
- AppShell telah selesai melakukan inisialisasi.

Connection harus ditutup apabila:

- logout;
- session expired;
- authentication hilang;
- active project berubah;
- browser ditutup;
- tab ditutup;
- AppShell di-unmount.

---

# 8. Reconnect Policy

Frontend wajib mendukung reconnect otomatis.

Gunakan:

- Exponential Backoff.
- Random Jitter ringan.
- Maksimum delay sekitar 30 detik.

DILARANG melakukan reconnect setiap beberapa detik tanpa batas.

Apabila backend mengembalikan:

- HTTP 401
- HTTP 403

Frontend wajib:

- menghentikan reconnect;
- menunggu Authentication kembali valid.

JANGAN melakukan reconnect spam.

---

# 9. Event Validation

Seluruh event yang diterima wajib divalidasi.

Minimal memeriksa:

- eventId
- version
- type
- scope
- projectId
- resourceType
- resourceId

Event yang tidak valid wajib diabaikan.

Event tidak boleh langsung dianggap sebagai Business State.

REST API tetap menjadi sumber data final.

---

# 10. Technical Requirements

Gunakan arsitektur frontend yang telah ada.

Ikuti struktur project existing.

JANGAN membuat struktur baru apabila dapat menggunakan struktur yang tersedia.

Integrasikan dengan:

- Authentication Context
- Active Project Context
- AppShell
- Existing Service Layer
- Existing State Management
- Existing Query Layer

JANGAN menaruh logika SSE langsung pada:

- Dashboard
- Notification
- Workflow
- Document Register
- SLA
- Escalation
- Comment
- History

Seluruh logika realtime harus berada pada layer teknis yang terpisah.

---

# 11. Existing UI

DILARANG mengubah:

- Layout
- Sidebar
- Header
- Dashboard
- Notification
- Workflow
- Document Register
- Typography
- Icon
- Warna
- Spacing
- Responsive Layout

Stage ini hanya boleh mengubah layer teknis.

Tidak boleh mengubah visual aplikasi.

---

## PART 1B — Audit Requirement, Validation, UAT, Stage Boundary, Deliverables, Definition of Done

---

# 12. Audit Requirement (WAJIB)

Sebelum melakukan perubahan source code,

WAJIB melakukan audit terhadap implementasi Stage 6.3 yang saat ini berada pada repository.

Audit dilakukan terhadap source code aktual,

BUKAN terhadap dokumen prompt Stage 6.3.

Pastikan implementasi berikut benar-benar tersedia.

## Backend Foundation

- SSE Endpoint
- Event Contract
- Event Bus
- Realtime Publisher
- Connection Registry
- SSE Service
- Authentication Integration
- Active Project Validation
- Membership Validation
- Heartbeat
- Logout Cleanup
- Graceful Shutdown

---

## Frontend Readiness

Audit kesiapan frontend.

Minimal meliputi:

- Authentication Context
- Active Project Context
- AppShell Lifecycle
- Protected Route
- Existing Service Layer
- Existing State Management
- Existing Query Layer
- Existing API Layer
- Existing Environment Variable
- Existing Build Configuration

Pastikan seluruh pondasi tersebut siap digunakan.

---

## Blocker Policy

Apabila ditemukan blocker,

JANGAN langsung melakukan implementasi.

Laporkan terlebih dahulu:

- blocker;
- penyebab;
- dampak;
- rekomendasi.

Implementasi hanya boleh dimulai apabila hasil audit menyatakan source code siap.

---

# 13. Frontend Architecture Rules

Frontend Realtime Client hanya bertugas:

- membuka koneksi;
- menerima event;
- memvalidasi event;
- meneruskan event.

Frontend Realtime Client BUKAN tempat Business Logic.

JANGAN:

- memproses workflow;
- memproses SLA;
- memproses notification;
- memproses escalation;
- memproses dashboard.

Seluruh Business Logic tetap berada pada feature masing-masing.

---

# 14. Event Dispatcher Rules

Bangun satu Event Dispatcher.

Dispatcher bertugas:

- menerima event;
- memvalidasi event;
- menentukan consumer;
- meneruskan event.

Dispatcher tidak boleh:

- mengubah Business State;
- melakukan REST Mutation;
- melakukan Workflow Transition.

Dispatcher hanya menghubungkan:

Realtime

↓

Consumer

Consumer akan dibangun pada Stage berikutnya.

---

# 15. Validation

Lakukan validation berikut.

---

## Static Validation

Pastikan:

- Frontend Syntax PASS
- Frontend Lint PASS
- Frontend Production Build PASS

JANGAN melanjutkan apabila salah satu gagal.

---

## Local Runtime Validation

Pastikan:

### Login

```
Login

↓

Frontend otomatis membuka SSE
```

---

### Logout

```
Logout

↓

Connection ditutup otomatis
```

---

### Refresh Browser

```
Refresh

↓

Connection otomatis terbuka kembali
```

---

### Session Expired

```
Session Expired

↓

Connection ditutup

↓

Reconnect dihentikan
```

---

### Active Project Change

```
Project Lama

↓

Connection Lama Ditutup

↓

Project Baru

↓

Connection Baru Dibuka
```

---

### Railway Restart Simulation

Simulasikan:

Backend Restart

↓

Frontend kehilangan koneksi

↓

Frontend reconnect

↓

Connection kembali normal

---

### Multi Browser

Pastikan:

Chrome

↓

Connection A

Edge

↓

Connection B

Kedua browser dapat membuka connection masing-masing.

---

### Multi Tab

Pastikan:

Chrome

Tab 1

↓

Connection A

Chrome

Tab 2

↓

Connection B

Tidak boleh saling mengganggu.

---

# 16. Railway UAT

Deploy ke Railway.

Verifikasi:

GET /api/v1/events

Status:

200

Authentication:

PASS

Connection:

PASS

Heartbeat:

PASS

Reconnect:

PASS

Logout:

PASS

Session Expired:

PASS

Project Switch:

PASS

Tidak boleh menggunakan EventSource manual melalui DevTools.

Seluruh koneksi harus berasal dari source code frontend.

---

# 17. Stage Boundary

Stage ini hanya membangun Frontend Realtime Client.

Stage ini BELUM menghubungkan realtime ke feature bisnis.

DILARANG mengimplementasikan:

- Notification Realtime
- Notification Badge Realtime
- Dashboard Realtime
- Workflow Realtime
- Workflow Detail Realtime
- Document Register Realtime
- SLA Realtime
- Escalation Realtime
- Comment Realtime
- History Realtime

Apabila diperlukan,

cukup siapkan hook atau dispatcher.

JANGAN mengubah perilaku feature existing.

---

# 18. Existing Behaviour Protection

Pastikan seluruh feature existing tetap berjalan.

Minimal:

- Login
- Logout
- Dashboard
- Notification
- Workflow
- Upload Document
- Upload Revision
- Approval
- SLA
- Escalation Alert

Tidak boleh mengalami regression.

---

# 19. Deliverables

Codex WAJIB menampilkan laporan akhir.

## A.

Audit Result

---

## B.

Files Changed

---

## C.

Frontend Realtime Client

---

## D.

Connection Lifecycle

---

## E.

Authentication Lifecycle

---

## F.

Active Project Lifecycle

---

## G.

Reconnect Strategy

---

## H.

Event Dispatcher

---

## I.

Recovery Hook

---

## J.

Static Validation

---

## K.

Local Runtime Validation

---

## L.

Railway UAT

---

## M.

Regression Validation

---

## N.

Known Limitation

---

## O.

Final Status

Gunakan salah satu:

```
FRONTEND REALTIME CLIENT COMPLETED
```

atau

```
FRONTEND REALTIME CLIENT PARTIAL
```

---

# 20. Definition of Done

Stage 6.4 dinyatakan COMPLETE apabila:

✓ Audit source code PASS

✓ Frontend membuka SSE otomatis

✓ Frontend menutup SSE otomatis

✓ Authentication Lifecycle berjalan

✓ Active Project Lifecycle berjalan

✓ Reconnect berjalan

✓ Event Dispatcher tersedia

✓ Recovery Hook tersedia

✓ Existing UI tidak berubah

✓ Existing REST API tidak berubah

✓ Existing Business Workflow tidak berubah

✓ Local Runtime UAT PASS

✓ Railway UAT PASS

✓ Regression Test PASS

Setelah seluruh poin di atas terpenuhi,

STOP.

Tahap berikutnya akan dilanjutkan pada:

**Stage 6.5 — Notification Badge & Notification List Realtime**

---

# 21. Final Instruction

Bangun hanya Frontend Realtime Client.

JANGAN mengimplementasikan feature realtime.

JANGAN mengubah Business Workflow.

JANGAN mengubah Database Schema.

JANGAN mengubah REST API.

JANGAN mengubah UI Existing.

Gunakan Foundation Backend yang telah tersedia.

Seluruh implementasi harus menjaga prinsip:

**"Realtime hanya menginformasikan bahwa data berubah. REST API tetap menjadi sumber data final."**

Apabila seluruh Foundation Frontend selesai dan tervalidasi,

STOP.