# STAGE 2 – UNIFIED TIME INFRASTRUCTURE
## PART 1 – Architecture & Infrastructure Design
### ReBuild Engineering Document Management System (EDMS)

---

# 1. Context

Stage 1 (Architecture Readiness Audit) telah selesai dilaksanakan dan menghasilkan kesimpulan bahwa proyek **belum memiliki Unified Time Authority end-to-end**.

Walaupun sebagian besar timestamp bisnis sudah menggunakan **MySQL UTC (`UTC_TIMESTAMP(3)`)** sebagai sumber kanonik, masih terdapat beberapa area runtime yang menggunakan **Browser Time (`Date.now()`)** sebagai acuan perhitungan.

Kondisi tersebut menyebabkan kemungkinan inkonsistensi antar perangkat apabila jam sistem pengguna berbeda.

Dokumen ini mendefinisikan arsitektur target yang akan menjadi fondasi seluruh fitur berbasis waktu.

---

# 2. Background

Selama investigasi SLA Timer ditemukan bahwa:

- Business Timestamp sudah menggunakan MySQL UTC.
- Backend masih memiliki beberapa runtime timestamp menggunakan `new Date()`.
- Frontend masih menggunakan Browser Time untuk sebagian runtime SLA.
- Belum terdapat **Server Time API**.
- Belum terdapat **Shared Time Infrastructure**.

Karena itu diputuskan membangun **Unified Time Authority**.

---

# 3. Objective

Tujuan Stage 2 Part 1 adalah merancang fondasi arsitektur waktu yang:

- memiliki satu sumber waktu bisnis resmi;
- reusable;
- scalable;
- backward compatible;
- siap digunakan seluruh modul EDMS.

---

# 4. Scope

Termasuk:

- Enterprise Time Architecture
- Backend Time Service
- Server Time API
- Frontend Shared Time Infrastructure
- Synchronization Strategy
- Integration Principle

Tidak termasuk:

- Migrasi consumer (Stage 3)
- SSE / Realtime
- Perubahan Business Workflow
- Perubahan Database Schema

---

# 5. Enterprise Architecture

```text
LEVEL 1
MySQL UTC
↓
Authoritative Business Clock

LEVEL 2
Backend
↓
Time Service
↓
Server Time API

LEVEL 3
Frontend
↓
Shared Estimated Server Time
↓
Shared Hook

LEVEL 4
Consumer
↓
SLA Runtime
Escalation
Notification Relative Time
Dashboard
Future Feature
```

---

# 6. Design Principles

1. Single Source of Truth.
2. Authoritative Business Clock.
3. Separation of Business Time dan Runtime Time.
4. Shared Infrastructure.
5. Backward Compatibility.
6. Enterprise Scalability.
7. Low Coupling.
8. Reusable Components.
9. Production Ready.

---

# 7. Architectural Decision Record (ADR)

Bagian ini mendokumentasikan keputusan arsitektur utama yang menjadi dasar implementasi Unified Time Infrastructure.

## ADR-001 — Authoritative Business Clock

**Decision**

Seluruh Business Timestamp menggunakan **MySQL UTC (`UTC_TIMESTAMP(3)`)** sebagai satu-satunya sumber waktu resmi.

**Reason**

- Menghindari perbedaan waktu antar perangkat.
- Menjamin konsistensi Business Time.
- Menjadi Single Source of Truth untuk seluruh modul EDMS.

---

## ADR-002 — Server Time API

**Decision**

Backend menyediakan **Server Time API** sebagai sumber waktu resmi yang dikonsumsi oleh frontend.

**Reason**

- Frontend tidak lagi menggunakan Browser Time sebagai Business Time.
- Seluruh runtime menggunakan waktu server yang sama.

---

## ADR-003 — Estimated Server Time

**Decision**

Frontend membangun **Estimated Server Time** menggunakan hasil sinkronisasi awal dengan server dan runtime monotonic (`performance.now()`).

**Reason**

- Menghindari request setiap detik.
- Tetap menjaga sinkronisasi dengan waktu server.
- Mengurangi dampak clock drift pada perangkat client.

---

## ADR-004 — Consumer Architecture

**Decision**

Seluruh consumer runtime (SLA, Dashboard, Notification Relative Time, Escalation, dan fitur berikutnya) wajib menggunakan Shared Time Infrastructure.

**Reason**

- Menghilangkan implementasi waktu yang terpisah.
- Menjamin konsistensi runtime.
- Mempermudah maintenance di masa depan.

---

# 8. Unified Time Authority

## Authoritative Business Clock

Sumber resmi waktu bisnis:

```text
MySQL UTC_TIMESTAMP(3)
```

Semua timestamp bisnis harus berasal dari clock tersebut.

## Server Time API

Backend bertugas meneruskan waktu resmi kepada frontend.

## Estimated Server Time

Frontend tidak menjadi sumber waktu.

Frontend hanya menjaga estimasi waktu server agar UI dapat berjalan secara realtime tanpa melakukan request setiap detik.

---

# 9. Backend Requirements

Backend wajib menyediakan:

- Shared Time Service.
- Server Time API.
- Pembacaan waktu resmi dari MySQL UTC.
- Stateless endpoint.
- Kontrak API konsisten.
- Tidak mengubah timestamp canonical yang telah ada.

---

# 10. Frontend Requirements

Frontend wajib menyediakan:

- Shared Time Store.
- Shared Hook.
- Shared Synchronization Service.
- Offset Management.
- Monotonic Runtime menggunakan `performance.now()`.

Browser Time tidak boleh menjadi Business Time.

---

# 11. Synchronization Strategy

Sinkronisasi wajib memperhitungkan:

- Request send time.
- Response receive time.
- Round Trip Time (RTT).
- Offset server-client.

Runtime setelah sinkronisasi menggunakan:

```text
EstimatedServerNow =
ServerEpochAtSync +
(performance.now() - PerformanceAtSync)
```

---

# 12. Failure Strategy

Apabila sinkronisasi gagal:

- jangan crash aplikasi;
- gunakan retry yang wajar;
- jangan mengubah Business Timestamp;
- dokumentasikan fallback.

---

# 13. Quality Attributes

Unified Time Infrastructure wajib memenuhi karakteristik berikut.

| Quality Attribute | Target |
|-------------------|--------|
| Consistency | Seluruh perangkat menghasilkan Business Time yang sama. |
| Reliability | Runtime tetap berjalan walaupun browser aktif dalam waktu lama. |
| Availability | Sinkronisasi waktu tetap tersedia selama backend aktif. |
| Maintainability | Seluruh consumer menggunakan Shared Time Infrastructure. |
| Scalability | Infrastruktur dapat digunakan oleh modul baru tanpa membuat Time Engine baru. |
| Performance | Sinkronisasi tidak menghasilkan polling berlebihan. |

---

# 14. Security Principles

Server Time API tidak boleh membocorkan:

- credential;
- konfigurasi internal;
- informasi database;
- secret.

Endpoint hanya mengembalikan informasi waktu yang diperlukan.

---

# 15. Risk Register

| Risk | Dampak | Mitigasi |
|------|--------|----------|
| Browser Clock Drift | SLA Timer tidak konsisten | Estimated Server Time |
| Network Latency | Offset waktu tidak akurat | RTT Compensation |
| Server Restart | Offset menjadi usang | Auto Re-Synchronization |
| Sleep / Resume Device | Runtime berhenti sementara | Re-Sync setelah Resume |
| Kehilangan Koneksi | Runtime tidak mendapat sinkronisasi baru | Retry Strategy |
| Deploy Backend | Offset lama menjadi tidak valid | Sinkronisasi ulang setelah koneksi kembali |

---

# 16. Deliverables

Implementasi Part 1 harus menghasilkan:

- Backend Time Service.
- Server Time API Design.
- Frontend Shared Time Infrastructure Design.
- Diagram Arsitektur.
- Technical Decision.

---

# 17. Definition of Done

Part 1 dianggap selesai apabila:

- Arsitektur Unified Time terdokumentasi.
- Seluruh design principle telah ditetapkan.
- Target Architecture telah disepakati.
- Scope dan Non Scope jelas.
- Tidak ada perubahan Business Workflow.
- Tidak ada perubahan Database Schema.
- Belum ada migrasi consumer (akan dilakukan pada Part 2).

---

# 18. Catatan Implementasi

Part ini hanya mendefinisikan arsitektur dan fondasi implementasi.

Migrasi seluruh consumer (SLA, Dashboard, Notification Relative Time, Escalation, dan modul lain) dilakukan pada **Stage 2 – Part 2**.

---

## PART 2 – Integration, Migration, Validation & Regression
### ReBuild Engineering Document Management System (EDMS)

---

# 1. Context

Dokumen ini merupakan lanjutan dari **Stage 2 – Part 1**.

Part 1 mendefinisikan arsitektur Unified Time Authority.

Part 2 mendefinisikan bagaimana arsitektur tersebut diintegrasikan ke seluruh sistem, divalidasi, serta dipastikan tidak menimbulkan regresi.

---

# 2. Objective

Tujuan utama:

- Mengintegrasikan Unified Time Infrastructure ke consumer yang menjadi target.
- Memastikan seluruh runtime bisnis menggunakan Shared Server Time.
- Melakukan validasi enterprise sebelum dinyatakan siap memasuki tahap berikutnya.

---

# 3. Integration Scope

Consumer yang menjadi target integrasi:

- SLA Runtime
- Dashboard Runtime
- Notification Relative Time
- Escalation Runtime (jika sudah memakai runtime clock)

Consumer di luar scope tidak boleh diubah tanpa justifikasi teknis.

---

# 4. Migration Strategy

Migrasi dilakukan secara bertahap.

Prinsip:

1. Tidak mengubah Business Workflow.
2. Tidak mengubah Database Schema.
3. Tidak mengubah kontrak bisnis.
4. Seluruh perubahan harus backward compatible.

---

# 5. Browser Time Classification

## Tetap diperbolehkan menggunakan Browser Time

- UI Formatter
- Date Picker
- Calendar Component
- Local Mock Data
- Preview lokal

## Wajib menggunakan Unified Time

- SLA Runtime
- Notification Relative Time
- Dashboard Runtime
- Escalation Runtime
- Future Business Runtime

---

# 6. Technical Guardrails

Selama implementasi:

DILARANG:

- membuat business timestamp dari browser
- membuat SLA berdasarkan Date.now()
- mengubah canonical timestamp database
- membuat time engine baru di luar Shared Time Infrastructure

---

# 7. Enterprise Design Constraints

Selama implementasi Unified Time Infrastructure:

## DILARANG

- Mengubah Business Workflow.
- Mengubah Database Schema.
- Mengubah SLA Rules.
- Mengubah Notification Rules.
- Mengubah Authentication Flow.
- Mengubah RBAC.
- Mengubah Audit Trail.
- Mengubah Routing.
- Mengubah Storage Strategy.
- Mengubah Cloudflare R2 Integration.
- Membuat Time Engine baru di luar Shared Time Infrastructure.

Seluruh perubahan harus tetap berada pada ruang lingkup Unified Time Infrastructure.

---

# 8. Integration Rules

Seluruh consumer harus memperoleh waktu melalui Shared Time Infrastructure.

Tidak diperbolehkan melakukan implementasi server time secara terpisah pada masing-masing modul.

---

# 9. Multi Environment Validation

Validasi minimal dilakukan pada:

## Local

Frontend + Backend + XAMPP MySQL

## Development

Vercel + Railway Backend + Railway MySQL

Pastikan perilaku konsisten.

---

# 10. Multi Browser Validation

Simulasikan minimal:

- Browser A
- Browser B

Dengan kondisi:

- jam perangkat sama
- jam perangkat berbeda

Expected:

Seluruh consumer runtime tetap konsisten.

---

# 11. E2E Validation

## Authentication

- Login
- Refresh
- Logout

## Document

- Create
- Upload Revision
- Approval A
- Approval B
- Approval C

## SLA

- Timer berjalan
- Reset
- Approved
- Overdue
- At Risk

## Notification

- Generate
- Read
- Relative Time

## Dashboard

- Counter
- Summary
- SLA Overview

---

# 12. Regression Checklist

Pastikan:

- Business Workflow tetap sama.
- Database Schema tetap sama.
- Notification Rules tetap sama.
- SLA Rules tetap sama.
- UI Visual tetap sama.
- Authentication tetap sama.
- RBAC tetap sama.
- Routing tetap sama.
- Storage tetap sama.

---

# 13. Performance Validation

Pastikan:

- tidak terjadi polling berlebihan
- tidak terjadi memory leak
- tidak terjadi duplicate timer
- tidak terjadi duplicate synchronization
- tidak terjadi peningkatan request yang tidak diperlukan

---

# 14. Rollback Strategy

Apabila implementasi gagal:

- rollback hanya pada Unified Time Infrastructure
- jangan mengubah canonical timestamp
- jangan mengubah data bisnis
- dokumentasikan penyebab rollback

---

# 15. Reporting Format

Laporan implementasi wajib memuat:

- Executive Summary
- Architecture Overview
- Files Changed
- Files Not Changed
- API Added
- Components Added
- Integration Result
- E2E Result
- Regression Result
- Performance Result
- Known Limitation
- Rollback Plan
- Final Status

---

# 16. Acceptance Criteria

Implementasi dinyatakan diterima apabila:

- Unified Time Infrastructure berhasil digunakan consumer target.
- Browser Time tidak lagi menjadi sumber Business Runtime.
- Local dan Development menghasilkan perilaku yang konsisten.
- Multi Browser konsisten.
- Tidak ditemukan regresi pada workflow utama.

---

# 17. Final Status

Gunakan salah satu status berikut:

- READY FOR STAGE 3
- REQUIRES REVISION
- IMPLEMENTATION BLOCKED

Apabila memilih selain READY FOR STAGE 3, jelaskan penyebabnya beserta rekomendasi teknis.

---

# 18. Definition of Done

Task dianggap selesai apabila:

- Integrasi consumer selesai.
- Validasi E2E selesai.
- Regression PASS.
- Build PASS.
- Lint PASS.
- Tidak ada perubahan di luar scope.
- Siap memasuki Stage 3 (Realtime Synchronization / SSE).

