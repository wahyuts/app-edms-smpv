# CHECKPOINT — PRIORITY 3E ESCALATION ALERT DEFERRED

## 1. Tujuan Dokumen Ini

Dokumen/rangkuman ini adalah **checkpoint untuk membuka kembali Priority 3E — Escalation Alert SQL Query & Dataset Optimization** di masa depan.

Jika pembahasan Priority 3E dilanjutkan pada chat baru, berikan checkpoint ini kepada ChatGPT sebagai konteks awal.

---

# 2. Status Roadmap Terakhir

Status resmi saat Priority 3E diputuskan untuk ditunda:

```text
Priority 3A — Audit Trail        = CLOSED
Priority 3B — Notification       = CLOSED
Priority 3C — Dashboard          = CLOSED
Priority 3D — SLA Monitoring     = CLOSED

Priority 3E — Escalation Alert
Assessment                       = COMPLETE
Implementation                   = NOT STARTED
Decision                         = DEFER / PENDING
```

Optimization boundary:

```text
Audit Trail      = OPTIMIZED
Notification     = OPTIMIZED
Dashboard        = OPTIMIZED
SLA Monitoring   = OPTIMIZED
Escalation Alert = LEGACY / DEFERRED
```

Priority 3E **BUKAN gagal** dan **BUKAN dibatalkan permanen**.

Priority 3E sengaja ditunda berdasarkan hasil technical performance assessment.

---

# 3. Latar Belakang Optimization Priority 3

Sebelumnya beberapa backend module menggunakan rich/general Document Register query:

```text
documentRepository.listProjectDocumentRegister()
```

Query tersebut membawa dataset relatif besar/rich dan kemudian sebagian aggregation/filtering dilakukan di Node.js.

Optimization dilakukan secara bertahap agar tidak menyebabkan regression lintas-domain.

Hasil akhirnya sebelum Priority 3E:

```text
Audit Trail
→ OPTIMIZED

Notification
→ OPTIMIZED

Dashboard
→ dashboard-specific SQL aggregate/projection
→ OPTIMIZED

SLA Monitoring
→ SLA-specific narrow projection
→ existing authoritative SLA calculation
→ OPTIMIZED

Escalation Alert
→ listProjectDocumentRegister()
→ LEGACY / DEFERRED
```

---

# 4. Priority 3C — Dashboard

Priority 3C sudah selesai dan telah melewati:

```text
Implementation
→ PASS

Local UAT
→ PASS

Online UAT
→ PASS

Final Status
→ CLOSED
```

Dashboard sebelumnya menggunakan:

```text
listProjectDocumentRegister()
```

untuk menghasilkan berbagai summary/statistics.

Setelah Priority 3C, Dashboard menggunakan query khusus seperti:

```text
getDashboardKpiSummaryByProject()

listDashboardSlaCandidateDocumentsByProject()

dan Dashboard-specific aggregate/projection lainnya
```

SQL sekarang menangani aggregation yang memang database-aggregatable.

Namun derived business calculation tetap menggunakan authoritative service/helper.

Contoh:

```text
SLA Overview
→ existing slaService/createSummary

Escalation Overview
→ existing escalationService/createEscalationItem
```

Dashboard sudah tidak bergantung pada `listProjectDocumentRegister()`.

---

# 5. Priority 3D — SLA Monitoring

Priority 3D juga sudah selesai dan telah melewati:

```text
Implementation
→ PASS

Local UAT
→ PASS

Online UAT
→ PASS

Final Status
→ CLOSED
```

Sebelumnya:

```text
GET /api/v1/sla
↓
sla.service
↓
listProjectDocumentRegister()
↓
rich Document Register DTO
↓
evaluateSla()
```

Setelah Priority 3D:

```text
GET /api/v1/sla
↓
sla.service
↓
listSlaMonitoringDocumentsByProject()
↓
SLA-specific narrow projection
↓
existing evaluateSla()
↓
response
```

Priority 3D menambahkan:

```text
mapSlaMonitoringDocumentRow
listSlaMonitoringDocumentsByProject
```

SLA business rule TIDAK dipindahkan ke SQL.

Authoritative:

```text
evaluateSla()
```

tetap digunakan.

Database Schema:

```text
UNCHANGED
```

Business Workflow:

```text
UNCHANGED
```

Frontend/UI:

```text
UNCHANGED
```

---

# 6. Dependency listProjectDocumentRegister() Setelah Priority 3D

Repository-wide search dilakukan setelah Priority 3D.

Hasilnya:

```text
Runtime consumer listProjectDocumentRegister():

Escalation Alert
→ escalation.service.js
```

Dashboard:

```text
NO LONGER DEPENDENT
```

SLA Monitoring:

```text
NO LONGER DEPENDENT
```

Scheduler SLA/Notification:

```text
NO LONGER / NOT DEPENDENT
```

Scheduler memiliki specialized path:

```text
listSlaNotificationCandidateDocuments()
```

Dengan demikian runtime consumer yang diketahui tersisa adalah:

```text
Escalation Alert
```

---

# 7. Alasan Priority 3E Tidak Langsung Diimplementasikan

Sebelum melakukan optimization, dibuat:

```text
Priority 3E Pre-Assessment
— Escalation Alert Performance & Optimization Necessity
```

Audit bersifat READ-ONLY.

Tidak ada source code yang diubah.

Tujuan audit:

```text
Apakah Escalation Alert benar-benar layak
dioptimisasi sekarang?
```

Hasil audit:

```text
RECOMMENDATION = DEFER / PENDING
CONFIDENCE     = HIGH
```

---

# 8. Current Escalation Architecture

Flow ketika assessment dilakukan:

```text
GET /api/v1/escalations
↓
escalation.routes.js
↓
escalation.controller.js
↓
escalation.service.listEscalations()
↓
slaService.resolveProjectId()
↓
documentRepository.listProjectDocumentRegister()
↓
documentRegisterSelect SQL
↓
mapDocumentRegisterRow()
↓
evaluateSla()
↓
createEscalationItem()
↓
filter Overdue + Escalation Level
↓
optional level/status/search filter
↓
summary
↓
response
```

Ini masih merupakan legacy/rich data path.

---

# 9. Query Cost Escalation

`listProjectDocumentRegister()` mengambil data cukup rich.

Kategori data meliputi:

```text
document core
project metadata
document type metadata
current assignee
creator/updater
active file metadata
uploaded file user
SLA fields
lifecycle/archive/restore metadata
unread comment count
```

JOIN yang ditemukan antara lain:

```text
INNER JOIN projects
LEFT JOIN document_types
LEFT JOIN users current_assignee
LEFT JOIN users created_by
LEFT JOIN users updated_by
LEFT JOIN stored_files
LEFT JOIN users uploaded_by
```

Juga terdapat correlated subquery untuk:

```text
unread_comment_count
```

yang menggunakan:

```text
workflow_comments
comment_read_receipts
```

SQL hanya melakukan project scope:

```text
documents.project_id = ?
```

Escalation filtering masih dilakukan setelah document project dibaca ke Node.js.

---

# 10. Node.js Processing

Processing pipeline ketika assessment:

```text
full project documents
↓
mapDocumentRegisterRow()
↓
evaluateSla() untuk semua row
↓
map(createEscalationItem)
↓
filter(Boolean)
↓
filter level/status/search jika ada
↓
reduce summary
```

Assessment:

```text
Node.js processing cost = MEDIUM
```

Alasannya:

* seluruh document project menjadi JS object;
* seluruh row dievaluasi SLA;
* hanya sebagian akhirnya menjadi Escalation;
* terdapat temporary arrays dari map/filter.

---

# 11. Dataset Measurement Saat Audit

Local development dataset terbesar yang diukur:

```text
Project: FF-FINAL-01

Total Documents     = 40
Active SLA          = 32
On Track            = 1
At Risk             = 13
Overdue             = 18

Level 1             = 3
Level 2             = 10
Level 3             = 4
Level 4             = 1

Final As-Built      = 8
```

Escalation ratio pada seed/dev dataset:

```text
18 / 40 = 45%
```

PENTING:

Angka tersebut berasal dari:

```text
LOCAL DEVELOPMENT / TEST DATA
```

Bukan representasi production/business workload.

Secara bisnis, Escalation justru diharapkan jauh lebih jarang.

---

# 12. Runtime Measurement Saat Audit

Local read-only measurement:

```text
40 rows

first run:
≈ 55.24 ms

warm run:
≈ 15.73 – 17.64 ms
```

Heap delta terlihat fluktuatif karena Garbage Collection:

```text
sekitar +/- 1.3 – 1.7 MB
```

Jangan memperlakukan angka heap tersebut sebagai fixed per-request RAM consumption.

Kesimpulan audit:

```text
Current dataset performance = ACCEPTABLE
```

---

# 13. Database Cost

Local EXPLAIN menemukan:

```text
projects
→ const / primary key

documents
→ ALL
→ estimated ~42 rows
→ Using where
→ Using filesort

other joins
→ mayoritas eq_ref

dependent unread-comment subquery
→ memakai idx_workflow_comments_project_document
```

Database query classification:

```text
MEDIUM
```

Query memang cukup rich tetapi pada dataset sekarang belum menjadi bottleneck serius.

---

# 14. Request Frequency

Temuan penting:

Escalation Alert BUKAN hanya melakukan fetch sekali.

Frontend memiliki:

```text
page-local auto refresh = 60 seconds
```

Pattern:

```text
user membuka Escalation Alert
↓
GET /api/v1/escalations
↓
refresh setiap 60 detik selama page aktif
```

Selain itu dapat terjadi manual refresh setelah workflow action.

Tetapi:

```text
Dashboard consumer       = NO
Background consumer      = NO
Scheduler consumer       = NO
Global polling           = NO
```

Frequency classification:

```text
LOW-MEDIUM
```

karena polling hanya terjadi selama Escalation page digunakan.

---

# 15. Business Usage Assumption

Keputusan defer juga mempertimbangkan business behavior.

Escalation Alert merupakan:

```text
EXCEPTION-BASED MONITORING PAGE
```

Idealnya document sudah ditangani sebelum mencapai Escalation.

Bahkan kondisi:

```text
At Risk
```

sudah merupakan warning serius dan seharusnya segera ditindak.

Secara operasional diharapkan:

```text
On Track
↓
At Risk
↓
segera ditangani

BUKAN:

At Risk
↓
Overdue
↓
Escalation
```

Karena itu Escalation Alert diperkirakan bukan halaman operasional yang dibuka terus-menerus oleh banyak user.

---

# 16. Cost × Frequency Assessment

Hasil audit:

```text
QUERY COST
= MEDIUM

REQUEST FREQUENCY
= LOW-MEDIUM

OVERALL SYSTEM RISK
= LOW-MEDIUM
```

Dengan kondisi sekarang, optimization belum dianggap urgent.

---

# 17. Benefit Jika Priority 3E Dilakukan

Audit memperkirakan specialized Escalation query akan memberikan:

```text
Column reduction
= HIGH

Join reduction
= MODERATE-HIGH

Payload reduction
= HIGH

Node.js object reduction
= MODERATE

RAM reduction
= MODERATE

Latency reduction at current small dataset
= LOW-MODERATE

Latency reduction at large scale
= potentially HIGH
```

Overall expected benefit:

```text
MODERATE
```

Artinya optimization tetap memiliki value.

Tetapi:

```text
VALUE EXISTS
≠
MUST IMPLEMENT NOW
```

---

# 18. Implementation Risk Jika 3E Dibuka

Expected implementation scope:

```text
Escalation-specific repository query
↓
narrow projection
↓
existing evaluateSla()
↓
existing createEscalationItem()
↓
same API contract
```

Risk assessment:

```text
Shared SLA risk
= LOW-MEDIUM

Dashboard risk
= LOW

Scheduler/Notification risk
= LOW

Frontend compatibility risk
= MEDIUM

Overall implementation risk
= LOW-MEDIUM
```

Optimization relatif memungkinkan, tetapi tetap memiliki regression surface.

---

# 19. Keputusan Resmi

Pada 10 Agustus 2026 diputuskan:

```text
PRIORITY 3E ESCALATION ALERT
= DEFER / PENDING
```

Bukan karena implementation tidak bisa dilakukan.

Alasannya:

```text
Current performance acceptable
+
Escalation usage expected low
+
Heavy query consumer tinggal Escalation
+
No scheduler/background dependency
+
3A–3D sudah menghilangkan major shared heavy paths
+
Expected optimization benefit hanya MODERATE saat ini
+
Tidak perlu menambah regression risk tanpa kebutuhan nyata
```

---

# 20. Trigger Membuka Kembali Priority 3E

Priority 3E harus dipertimbangkan kembali jika ditemukan salah satu kondisi berikut:

### Trigger 1 — API Latency

```text
/api/v1/escalations
```

mulai konsisten lambat di Railway.

### Trigger 2 — Railway RAM Pressure

Terlihat kenaikan RAM yang berkorelasi dengan penggunaan Escalation Alert.

### Trigger 3 — Dataset Growth

Jumlah document per project meningkat signifikan hingga rich query mulai terasa berat.

Jangan menggunakan threshold angka fiktif tanpa production baseline.

### Trigger 4 — Concurrent Usage

Banyak user mulai membuka Escalation Alert secara bersamaan.

### Trigger 5 — Polling Cost

Polling:

```text
60 seconds
```

terbukti memberikan backend/database pressure.

### Trigger 6 — Business Usage Changes

Escalation Alert berubah dari:

```text
exception page
```

menjadi:

```text
daily operational monitoring page
```

### Trigger 7 — Performance Monitoring Evidence

Production monitoring menunjukkan:

```text
high latency
high DB cost
high heap pressure
high query frequency
```

pada Escalation path.

---

# 21. Jika Priority 3E Dibuka Kembali

JANGAN langsung refactor.

Mulai dengan membaca checkpoint ini dan revalidate kondisi aktual karena codebase/dataset dapat berubah.

Urutan yang direkomendasikan:

```text
Revalidate Current Architecture
↓
Revalidate listProjectDocumentRegister Consumers
↓
Measure Current Railway Performance
↓
Compare dengan Baseline Audit
↓
Confirm Optimization Still Necessary
↓
Priority 3E Implementation
↓
Local UAT
↓
Online UAT
↓
CLOSE
```

Jika optimization tetap diperlukan, target architecture:

```text
GET /api/v1/escalations
↓
escalation.service
↓
Escalation-specific narrow repository query
↓
narrow candidate DTO
↓
existing authoritative evaluateSla()
↓
existing authoritative createEscalationItem()
↓
same response contract
```

---

# 22. Hard Rules Jika Priority 3E Dibuka

Priority 3E nantinya tetap WAJIB:

```text
DO NOT CHANGE DATABASE SCHEMA
DO NOT CHANGE BUSINESS WORKFLOW
DO NOT CHANGE FRONTEND UI
DO NOT CHANGE APPROVED UI
```

SLA calculation tetap authoritative.

Jangan membuat:

```text
duplicate SLA formula
SQL SLA calculator
duplicate Overdue formula
```

Escalation calculation juga tetap authoritative.

Jangan membuat:

```text
duplicate Escalation Level formula
SQL-only Level 1/2/3/4 calculator
persisted escalation level
```

Level tetap business-derived.

---

# 23. Escalation Business Semantics Yang Harus Dijaga

Known business semantics:

```text
Overdue
→ ketika SLA melewati Days Until Validation

Level 1
→ mulai pada first overdue period

Level 2
→ escalation berikutnya sesuai interval authoritative

Level 3
→ escalation berikutnya sesuai interval authoritative

Level 4
→ maximum escalation level
```

Project decision sebelumnya:

```text
Level tidak disimpan di database.
Level dihitung secara dynamic.
Maximum Level = 4.
```

Notification semantics:

```text
notify once ketika pertama menjadi Overdue
→ Current Assignee

tidak melakukan repeated notification spam
```

Approved document:

```text
tidak lagi menjadi active Escalation Alert
```

Jika Source of Truth pada saat Priority 3E dibuka kembali telah berubah secara resmi, gunakan Source of Truth terbaru.

---

# 24. listProjectDocumentRegister() Status

Saat checkpoint dibuat:

```text
Runtime consumer:
Escalation Alert ONLY
```

Definition/export masih ada pada:

```text
document.repository.js
```

Jangan menghapus method hanya berdasarkan checkpoint ini.

Ketika Priority 3E dibuka kembali:

```text
RUN REPOSITORY-WIDE DEPENDENCY SEARCH AGAIN
```

karena consumer dapat berubah seiring development.

---

# 25. Documentation Technical Debt

Audit menemukan documentation stale.

File yang diketahui:

```text
API-CONTRACT.md
DECISION-LOG.md
```

Masih terdapat statement yang menyebut:

```text
SLA Monitoring
+
Escalation Alert
→ listProjectDocumentRegister()
```

Padahal setelah Priority 3D:

```text
SLA Monitoring
→ listSlaMonitoringDocumentsByProject()

Escalation Alert
→ listProjectDocumentRegister()
```

Documentation tersebut perlu disinkronkan pada documentation closure/update yang sesuai.

Jangan mengubah business semantics saat memperbarui dokumentasi.

---

# 26. FINAL CHECKPOINT

Jika checkpoint ini diberikan kepada ChatGPT/Codex di masa depan, gunakan konteks berikut sebagai baseline:

```text
PRIORITY 3A AUDIT TRAIL
= CLOSED

PRIORITY 3B NOTIFICATION
= CLOSED

PRIORITY 3C DASHBOARD
= CLOSED + OPTIMIZED

PRIORITY 3D SLA MONITORING
= CLOSED + OPTIMIZED

PRIORITY 3E ESCALATION ALERT
= ASSESSMENT COMPLETE
= IMPLEMENTATION DEFERRED
= LEGACY QUERY RETAINED INTENTIONALLY
```

Current known architecture:

```text
Dashboard
→ optimized specific SQL path

SLA Monitoring
→ listSlaMonitoringDocumentsByProject()

SLA Notification Scheduler
→ listSlaNotificationCandidateDocuments()

Escalation Alert
→ listProjectDocumentRegister()
```

Audit result:

```text
Query Cost           = MEDIUM
Request Frequency    = LOW-MEDIUM
Overall Risk         = LOW-MEDIUM
Optimization Benefit = MODERATE
Implementation Risk  = LOW-MEDIUM

Decision             = DEFER
```

### IMPORTANT

Jangan menganggap `LEGACY / DEFERRED` sebagai bug.

Keputusan tersebut merupakan **intentional engineering trade-off berdasarkan audit performance**.

Priority 3E baru perlu dibuka kembali ketika actual evidence menunjukkan optimization sudah memberikan business/performance value yang cukup.

---

# 27. SHORT RECOVERY PROMPT

Jika membuka chat baru, cukup kirim checkpoint ini atau gunakan pesan singkat:

> **Sensei, buka kembali checkpoint Priority 3E Escalation Alert yang dulu kita DEFER setelah performance pre-assessment. Status terakhir: 3A–3D CLOSED, 3E Assessment COMPLETE, implementation DEFERRED. `listProjectDocumentRegister()` saat itu tinggal dipakai Escalation Alert. Audit menghasilkan Query Cost MEDIUM, Frequency LOW-MEDIUM, Overall Risk LOW-MEDIUM, Expected Benefit MODERATE. Tolong recall checkpoint dan kita revalidate kondisi aktual sebelum memutuskan implementasi 3E.**

JANGAN langsung membuat prompt implementation hanya dari pesan tersebut.

Langkah pertama ketika kasus dibuka kembali adalah:

```text
RECALL CHECKPOINT
↓
REVALIDATE CURRENT CODEBASE
↓
REVALIDATE PERFORMANCE
↓
DECIDE
```
