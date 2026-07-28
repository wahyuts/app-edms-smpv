# STORAGE ARCHITECTURE ALIGNMENT PATCH
## Canonical Project / Document / Revision / Attachment Storage Structure

> **Execution Mode:** Architecture Alignment + Full Regression  
> **Target:** Codex / Coding Agent  
> **Priority:** CRITICAL — BEFORE MANUAL UAT  
> **UI Protection Mode:** STRICT  
> **Change Policy:** Minimal Architecture Patch + Mandatory End-to-End Regression  
> **Database Schema Changes:** FORBIDDEN unless absolutely proven necessary and explicitly approved  
> **Frontend UI Changes:** FORBIDDEN  
> **Documentation Update:** MANDATORY for all impacted Source of Truth documents

---

# 1. Context

Proyek adalah **ReBuild Engineering Document Management System (EDMS)**.

SECTION A sampai SECTION E telah selesai dan regression sebelumnya telah PASS.

Sebelum Manual UAT dimulai, ditemukan kebutuhan untuk menyelaraskan physical storage architecture agar:

1. mudah dibaca manusia;
2. mudah dikelola di local storage / NAS / Cloudflare R2;
3. tetap sinkron dengan database;
4. kompatibel dengan backend existing;
5. kompatibel dengan frontend existing;
6. tidak mengubah business workflow;
7. tidak mengubah UI;
8. tidak menyebabkan regression pada fitur lain.

Storage development saat ini berada dalam kondisi bersih, sehingga patch ini dapat dilakukan tanpa kebutuhan migration terhadap historical document files.

---

# 2. Core Objective

Ubah physical storage architecture dari pola berbasis internal project UUID seperti:

```text
storage/projects/
└── PRJ-e802f49b-0235-4766-8eb9-96145f8d47af/
```

menjadi pola business-readable:

```text
storage/projects/
└── FF-XIV-01/
```

dengan menggunakan:

```text
projects.project_code
```

sebagai nama physical project directory.

Database tetap menggunakan:

```text
projects.id
```

sebagai internal primary key / foreign key.

---

# 3. Critical Compatibility Rule

## STORAGE HARUS SINKRON DENGAN FRONTEND DAN BACKEND

Implementasi storage tidak boleh membangun vocabulary atau state sendiri.

Storage wajib menggunakan canonical business value yang sama dengan backend dan frontend.

Secara prinsip:

```text
Frontend Display
        ↕
Backend Business State
        ↕
Database State
        ↕
Storage Path Metadata
```

Semua harus merepresentasikan konsep yang sama.

DILARANG membuat mapping yang tidak perlu seperti:

```text
Frontend : IFR-Submitted
Backend  : IFR_SUBMITTED
Storage  : IFR
```

jika current canonical business revision sudah menggunakan:

```text
IFR-Submitted
IFA-Submitted
AS-Built
```

Storage harus mengikuti canonical revision value dari backend.

---

# 4. Canonical Revision Values

Revision business yang harus diselaraskan dengan implementation aktual adalah:

```text
IFR-Submitted
IFA-Submitted
AS-Built
```

Sebelum implementasi:

1. audit frontend;
2. audit backend;
3. audit database/read model;
4. audit constants/enums;
5. audit workflow transition;
6. audit revision service;
7. audit API response.

Pastikan ketiga value tersebut memang canonical value existing.

Jika ada perbedaan implementasi internal:

JANGAN langsung mengganti value.

Lakukan gap analysis terlebih dahulu dan pertahankan backward compatibility.

---

# 5. Revision vs Workflow Status

JANGAN mencampurkan Revision dan Workflow Status.

Contoh valid:

```text
Revision:
IFR-Submitted

Status:
Process Review
```

Kemudian:

```text
Revision:
IFR-Submitted

Status:
Process Comment
```

Physical revision directory tetap:

```text
revisions/IFR-Submitted/
```

Bukan:

```text
revisions/Process Review/
```

Rule:

```text
REVISION
≠
WORKFLOW STATUS
```

---

# 6. Canonical Physical Storage Structure

Gunakan struktur berikut sebagai target:

```text
storage/
│
├── projects/
│   │
│   └── {PROJECT_CODE}/
│       │
│       └── documents/
│           │
│           └── {DOCUMENT_NUMBER}/
│               │
│               ├── revisions/
│               │   │
│               │   ├── IFR-Submitted/
│               │   │   └── {PHYSICAL_FILE_NAME}
│               │   │
│               │   ├── IFA-Submitted/
│               │   │   └── {PHYSICAL_FILE_NAME}
│               │   │
│               │   └── AS-Built/
│               │       └── {PHYSICAL_FILE_NAME}
│               │
│               └── attachments/
│                   │
│                   ├── process-comments/
│                   │   └── {ATTACHMENT_FILE_NAME}
│                   │
│                   └── project-comments/
│                       └── {ATTACHMENT_FILE_NAME}
│
└── temporary/
    │
    └── {TEMPORARY_UPLOAD_ID}/
        └── {TEMPORARY_FILE}
```

---

# 7. Project Path Canonical Rule

Physical project path:

```text
storage/projects/{PROJECT_CODE}/
```

Contoh:

```text
storage/projects/FF-XIV-01/
storage/projects/SS-START-01/
storage/projects/FD-MID-02/
```

DILARANG menggunakan:

```text
storage/projects/{PROJECT_ID}/
```

sebagai physical folder name.

Namun:

```text
projects.id
```

tetap wajib digunakan untuk:

- database foreign key;
- project membership;
- API identity;
- permission enforcement;
- active project context;
- relational integrity.

Backend harus resolve:

```text
projectId
↓
projects.project_code
↓
physical storage project directory
```

---

# 8. Document Path Canonical Rule

Setiap Engineering Document memiliki satu folder berdasarkan:

```text
DOCUMENT_NUMBER
```

Canonical:

```text
storage/projects/
{PROJECT_CODE}/
documents/
{DOCUMENT_NUMBER}/
```

Contoh:

```text
storage/projects/
FF-XIV-01/
documents/
PFD-EDMS-1234/
```

Upload Revision tidak membuat document folder baru.

---

# 9. Revision Path Canonical Rule

Revision path:

```text
storage/projects/
{PROJECT_CODE}/
documents/
{DOCUMENT_NUMBER}/
revisions/
{REVISION}/
```

Contoh:

```text
storage/projects/
FF-XIV-01/
documents/
PFD-EDMS-1234/
revisions/
IFR-Submitted/
```

Revision berikutnya:

```text
revisions/IFA-Submitted/
```

Final:

```text
revisions/AS-Built/
```

---

# 10. Canonical Physical File Name

Final physical filename:

```text
{DOCUMENT_NUMBER}_{REVISION}_{SUBMIT_DATE_YYYYMMDD}_{SHORT_FILE_ID}_{SANITIZED_ORIGINAL_FILE_NAME}
```

Contoh initial submit:

```text
PFD-EDMS-1234_IFR-Submitted_20260728_a82f91_Process-Flow-Diagram.pdf
```

Contoh revision:

```text
PFD-EDMS-1234_IFA-Submitted_20260803_c291ab_Process-Flow-Diagram-Rev01.pdf
```

Contoh final:

```text
PFD-EDMS-1234_AS-Built_20260812_f729ca_Process-Flow-Diagram-Final.pdf
```

---

# 11. Submit Date Rule

`SUBMIT_DATE_YYYYMMDD` adalah tanggal file/revision tersebut benar-benar disubmit.

Gunakan backend timestamp.

Jangan menggunakan clock frontend sebagai source of truth.

Rule:

```text
Initial Create Document
→ initial submit timestamp

Upload Revision
→ revision submit timestamp
```

Format:

```text
YYYYMMDD
```

---

# 12. Original File Name Rule

Database harus tetap menyimpan:

```text
original_file_name
```

secara utuh.

Physical filename berbeda dari user-facing filename.

Canonical:

```text
Physical File Name
=
{DOCUMENT_NUMBER}_{REVISION}_{SUBMIT_DATE_YYYYMMDD}_{SHORT_FILE_ID}_{SANITIZED_ORIGINAL_FILE_NAME}
```

Tetapi saat user download:

```text
Download File Name
=
ORIGINAL_FILE_NAME
```

Jangan expose physical filename sebagai download filename.

---

# 13. Short File ID

Gunakan stable short identifier yang berasal dari file identity existing.

Jangan membuat random identifier tambahan yang tidak memiliki hubungan dengan stored file record.

Contoh:

```text
stored_file.id
→ shortFileId
```

Pastikan collision probability tetap aman.

---

# 14. Filename Sanitization

Sanitize hanya untuk filesystem safety.

Pertahankan extension.

Minimal tangani:

- slash;
- backslash;
- null byte;
- forbidden filesystem characters;
- excessive whitespace;
- unsafe path traversal;
- control characters.

Jangan mengubah original filename yang tersimpan di metadata.

---

# 15. Workflow Attachment Structure

Workflow attachment harus terpisah dari revision document.

Canonical:

```text
storage/projects/
{PROJECT_CODE}/
documents/
{DOCUMENT_NUMBER}/
attachments/
```

Process-side attachment:

```text
attachments/process-comments/
```

Project-side attachment:

```text
attachments/project-comments/
```

Jangan menyimpan workflow attachment di `revisions/`.

---

# 16. Attachment File Naming

Audit existing attachment naming implementation.

Gunakan identity yang stabil.

Contoh acceptable:

```text
{ATTACHMENT_ID}_{SANITIZED_ORIGINAL_FILE_NAME}
```

Jangan mengubah user-facing download name jika frontend/backend existing menggunakan original filename.

---

# 17. Temporary Upload Architecture

Temporary pipeline existing WAJIB dipertahankan.

Canonical:

```text
User Select File
↓
storage/temporary/{TEMPORARY_UPLOAD_ID}/
↓
Save / Submit
↓
Backend business validation
↓
Permanent promotion
↓
Permanent database relation
↓
Temporary cleanup
```

Berlaku untuk:

- Create Document;
- Upload Revision;
- Process Comment Attachment;
- Project Comment Attachment;
- workflow attachment flow existing.

---

# 18. Permanent Promotion — Create Document

Target:

```text
storage/projects/
{PROJECT_CODE}/
documents/
{DOCUMENT_NUMBER}/
revisions/
IFR-Submitted/
{PHYSICAL_FILE_NAME}
```

Backend harus resolve projectId → projectCode sebelum membentuk storage key.

---

# 19. Permanent Promotion — Upload Revision

Upload Revision harus menggunakan document existing.

Target:

```text
storage/projects/
{PROJECT_CODE}/
documents/
{DOCUMENT_NUMBER}/
revisions/
{NEW_REVISION}/
{PHYSICAL_FILE_NAME}
```

Jangan membuat document folder baru, project root baru, atau unrelated UUID storage root.

---

# 20. Permanent Promotion — Workflow Attachment

Target Process Comment:

```text
storage/projects/
{PROJECT_CODE}/
documents/
{DOCUMENT_NUMBER}/
attachments/
process-comments/
{ATTACHMENT_FILE_NAME}
```

Target Project Comment:

```text
storage/projects/
{PROJECT_CODE}/
documents/
{DOCUMENT_NUMBER}/
attachments/
project-comments/
{ATTACHMENT_FILE_NAME}
```

---

# 21. Backend Authority

Frontend tidak boleh menentukan physical path.

Frontend cukup mengirim business request existing seperti:

```text
temporaryFileId
documentNumber
comment
workflow action
```

Backend wajib menentukan:

```text
projectCode
documentNumber
canonicalRevision
submittedAt
fileId
physicalFileName
storageKey
```

---

# 22. Frontend Compatibility Rule

## DILARANG MENGUBAH UI FRONTEND

Patch storage tidak boleh mengubah Dashboard, Document Register, Revision display, Status display, Document Detail, View, Download, Comment, Approval A/B/C, History, Upload Revision UI, Comment Attachment UI, Sidebar, Header, modal, table, layout, colour, spacing, typography.

Frontend tetap menampilkan canonical revision existing:

```text
IFR-Submitted
IFA-Submitted
AS-Built
```

Storage harus menyesuaikan backend/frontend.

---

# 23. Backend Compatibility Rule

Patch tidak boleh merusak:

- Document Create;
- Document Detail;
- Document Register;
- Document Edit;
- Archive;
- Restore;
- Revision History;
- Upload Revision;
- Workflow;
- Approval A;
- Approval B;
- Approval C;
- Project Approval;
- View;
- Download;
- Workflow Attachment;
- SLA;
- Escalation;
- Notification;
- Audit Trail;
- Dashboard.

Jika perubahan storage membutuhkan API response change, pertahankan backward compatibility.

---

# 24. Database Compatibility Rule

Jangan mengubah relational identity.

Tetap gunakan:

```text
project_id
document_id
revision_id
file_id
```

untuk relationship.

Storage path bukan relational source of truth.

---

# 25. Storage Key Rule

Audit current `stored_files.storage_key` / equivalent.

Pastikan field tersebut menyimpan canonical relative path yang baru.

Contoh:

```text
projects/FF-XIV-01/documents/PFD-EDMS-1234/revisions/IFR-Submitted/PFD-EDMS-1234_IFR-Submitted_20260728_a82f91_original.pdf
```

Hindari absolute machine-specific path.

---

# 26. Storage Driver Compatibility

Path generation harus reusable untuk:

```text
Local Storage
NAS
Object Storage / Cloudflare R2
```

Gunakan storage key / relative path abstraction dan normalized path semantics.

---

# 27. Repository Reconnaissance

Sebelum patch, audit minimal backend storage manager/service, temporary upload, stored file repository, document service, revision service, workflow attachment service, file access service, project repository/service, document repository, constants, helpers, filename builder, dan path builder.

Frontend hanya diaudit untuk compatibility pada Document Register, Document Detail, Revision History, Upload Revision, View, Download, dan attachment actions.

Jangan redesign frontend.

---

# 28. Gap Analysis Required

Sebelum editing, identifikasi:

```text
Current Project Folder Source
Current Document Folder Source
Current Revision Folder Source
Current Physical Filename
Current Submit Timestamp Source
Current Attachment Storage Path
Current Download Filename Logic
Current View Logic
Current storage_key format
```

Bandingkan dengan target canonical.

---

# 29. Migration Rule

Development storage saat ini bersih.

Jika benar-benar tidak ada stored document runtime:

```text
No storage data migration required
```

Jika ternyata ada file legitimate, STOP dan jangan memindahkan tanpa explicit approval.

---

# 30. Regression Requirement — MANDATORY

SETELAH IMPLEMENTASI SELESAI, WAJIB MELAKUKAN FULL REGRESSION.

Tidak cukup hanya lint/build.

Wajib lakukan:

```text
Targeted Storage Validation
+
Cross-Service Regression
+
End-to-End Validation
```

---

# 31. Mandatory E2E Scenarios

Minimal validasi:

1. Create Document → temporary → permanent → Process Review.
2. Document Register tetap menampilkan `IFR-Submitted` dan status workflow yang benar.
3. View active file.
4. Download dengan `ORIGINAL_FILE_NAME`.
5. Approval B → Process Comment → Upload Revision.
6. Approval C → Process Reject → Upload Revision.
7. Approval A → Project Review.
8. Final Approval → Approved / Final As-Built.
9. Process Comment Attachment.
10. Project Comment Attachment.
11. Archive / Restore.
12. Multi-project storage isolation.
13. Dua dokumen pada project yang sama harus memakai root project yang sama.
14. Multiple revisions pada dokumen yang sama harus tetap berada di document folder yang sama.
15. Historical revision download.
16. Temporary cleanup.

---

# 32. Multi-Project Storage Isolation

WAJIB menggunakan minimal dua project.

Expected:

```text
storage/projects/
├── PROJECT-A-CODE/
│   └── documents/
│       └── DOCUMENT-A/
└── PROJECT-B-CODE/
    └── documents/
        └── DOCUMENT-B/
```

Pastikan tidak ada `storage/projects/PRJ-<UUID>/` baru.

---

# 33. Same Project Multiple Documents

Expected:

```text
PROJECT-CODE/
└── documents/
    ├── DOC-A/
    └── DOC-B/
```

Jangan membuat project root baru per upload.

---

# 34. Multiple Revisions Same Document

Expected:

```text
{DOCUMENT_NUMBER}/
└── revisions/
    ├── IFR-Submitted/
    ├── IFA-Submitted/
    └── AS-Built/
```

Semua tetap berada di document folder yang sama.

---

# 35. Supporting Services Regression

Setelah storage validation, ulangi validation terhadap:

- SLA;
- Escalation;
- Notification;
- Audit Trail;
- Dashboard.

Storage patch tidak boleh mengubah runtime state business.

---

# 36. Frontend Visual Regression

Unauthorized UI Changes harus:

```text
0
```

Smoke test minimal Dashboard, Document Register, Document Detail, Revision History, Upload Revision, SLA Monitoring, Escalation Alert, Notification, Audit Trail, Header, dan Sidebar.

DILARANG redesign.

---

# 37. API Regression

Validate existing API contracts yang terpengaruh:

- create document;
- document detail;
- document list;
- revision;
- view;
- download;
- workflow attachment;
- archive/restore.

Frontend existing harus tetap dapat memakai response tanpa breaking change.

---

# 38. Database Integrity Regression

Periksa:

```text
engineering_documents
document_revisions
stored_files
temporary_uploads
workflow_comments
workflow_attachments
document_history
notifications
audit_trail
```

Pastikan active_file_id, active_revision_id, revision-file relation, attachment relation, project relation benar dan tidak ada orphan.

---

# 39. Physical Filesystem Validation

Setelah E2E, tampilkan actual physical tree dan buktikan pola canonical dipakai.

Pastikan:

```text
storage/projects/PRJ-<UUID>/
```

tidak dibuat lagi.

---

# 40. Validation Artifact Convention

Gunakan prefix khusus yang mudah dibersihkan, misalnya:

```text
PFD-STORAGE-UAT-*
```

Jangan menggunakan legitimate document number.

---

# 41. Cleanup After Regression

Wajib bersihkan seluruh validation artifact: test documents, revisions, files, attachments, temporary uploads, notifications, audit entries, test memberships/users jika dibuat, dan physical storage test directories.

Jangan menghapus legitimate project.

## CRITICAL CLEANUP RULE

```text
PROJECT CONTAINS TEST DATA
≠
PROJECT IS TEST DATA
```

Project legitimate tetap dipertahankan. Hanya test artifacts di dalamnya yang boleh dihapus.

---

# 42. Project Identity Safety Rule

```text
projects.id
= internal technical identity

projects.project_code
= business identity / physical storage directory
```

JANGAN menentukan apakah project test hanya dari bentuk `PRJ-UUID`.

---

# 43. Documentation Update — MANDATORY

Setelah implementasi selesai dan sebelum menyatakan patch COMPLETE, update seluruh dokumentasi yang terdampak.

Minimal audit dan update jika relevan:

1. `docs/source-of-truth/DATABASE-DESIGN-DECISIONS.md`
2. `docs/source-of-truth/BACKEND-FOUNDATION.md`
3. `docs/source-of-truth/API-CONTRACT.md`
4. `docs/source-of-truth/PRD.md`
5. `docs/source-of-truth/SYSTEM-REQUIREMENTS.md`
6. `docs/source-of-truth/FEATURE-MAPPING.md`
7. `docs/source-of-truth/DECISION-LOG.md`
8. dokumentasi storage/file architecture lain yang sudah ada di repository.

Jika repository memiliki dokumentasi seperti `STORAGE-ARCHITECTURE.md`, `FILE-STORAGE.md`, `FILE-STRUCTURE.md`, `BACKEND-STORAGE.md`, atau nama sejenis, audit dan update juga dokumen tersebut.

JANGAN membuat duplicate Source of Truth jika dokumen canonical sudah tersedia.

---

# 44. Required Documentation Content

Dokumentasi terdampak minimal harus merekam:

## Project Storage Identity

```text
Database Project Identity = projects.id
Physical Storage Project Directory = projects.project_code
```

Canonical:

```text
storage/projects/{PROJECT_CODE}/
```

## Document Storage Path

```text
storage/projects/{PROJECT_CODE}/documents/{DOCUMENT_NUMBER}/
```

## Revision Storage Path

```text
storage/projects/{PROJECT_CODE}/documents/{DOCUMENT_NUMBER}/revisions/{REVISION}/
```

Canonical revision vocabulary:

```text
IFR-Submitted
IFA-Submitted
AS-Built
```

Dokumentasi harus menjelaskan bahwa Revision berbeda dengan Workflow Status.

## Physical Filename Convention

```text
{DOCUMENT_NUMBER}_{REVISION}_{SUBMIT_DATE_YYYYMMDD}_{SHORT_FILE_ID}_{SANITIZED_ORIGINAL_FILE_NAME}
```

`SUBMIT_DATE` harus berasal dari backend submit timestamp untuk file/revision terkait.

## Download Filename Convention

```text
Physical File Name ≠ User Download File Name
Download File Name = ORIGINAL_FILE_NAME
```

## Workflow Attachment Paths

```text
attachments/process-comments/
attachments/project-comments/
```

Attachment bukan document revision.

## Temporary Upload Lifecycle

```text
temporary upload
→ validation
→ permanent promotion
→ permanent relation
→ temporary cleanup
```

## Storage Driver Portability

`storage_key` harus berupa normalized relative path agar kompatibel dengan local filesystem, NAS, dan Cloudflare R2/Object Storage.

---

# 45. Documentation Safety Rule

Dokumentasi harus menggambarkan implementation aktual setelah patch.

JANGAN menulis desain yang belum diimplementasikan, mengubah business workflow, mengubah revision vocabulary tanpa evidence, menulis API baru yang tidak tersedia, atau membuat keputusan schema yang tidak dilakukan.

Jika dokumentasi existing bertentangan dengan canonical decision terbaru, update bagian yang terdampak secara terkontrol dan jangan rewrite seluruh dokumen tanpa kebutuhan.

---

# 46. Documentation Validation

Setelah update dokumentasi:

- search seluruh repository untuk pola storage lama;
- cari referensi `{PROJECT_ID}` sebagai physical project directory;
- cari contoh `PRJ-UUID` sebagai folder storage;
- cari filename convention lama;
- cari revision storage value lama seperti `IFR/IFA/AS-BUILT` jika bertentangan dengan canonical `IFR-Submitted/IFA-Submitted/AS-Built`.

Klasifikasikan hasil sebagai:

```text
VALID TECHNICAL REFERENCE
OUTDATED STORAGE REFERENCE
HISTORICAL REFERENCE
```

Update hanya outdated active documentation. Jangan mengubah archive/history hanya untuk menghilangkan string lama.

---

# 47. Static Validation

Jalankan:

```text
Backend syntax check
Frontend lint
Frontend production build
```

Semua harus PASS.

---

# 48. Severity Classification

## Critical

- cross-project storage leak;
- file corruption;
- wrong file served;
- unauthorized file access;
- data loss;
- legitimate project deletion.

## Major

- revision stored in wrong folder;
- wrong project code path;
- original filename download rusak;
- temporary promotion gagal;
- historical revision inaccessible;
- attachment menjadi active document file.

## Minor

- path normalization inconsistency;
- harmless naming inconsistency.

---

# 49. Patch Policy

Jika regression ditemukan setelah patch:

```text
Finding
↓
Evidence
↓
Root Cause
↓
Minimal Fix
↓
Targeted Re-test
↓
Full Relevant Regression
```

Jangan menambal error dengan workaround frontend.

---

# 50. Required Final Report

Berikan:

## Architecture Before
Current storage pattern.

## Architecture After
Canonical storage pattern.

## Compatibility Matrix

| Concept | Frontend | Backend | Storage |
|---|---|---|---|
| Project | Project Code Display | project.id + project_code | project_code |
| IFR | IFR-Submitted | IFR-Submitted | IFR-Submitted |
| IFA | IFA-Submitted | IFA-Submitted | IFA-Submitted |
| Final | AS-Built | AS-Built | AS-Built |

## Files Changed
Daftar seluruh source file yang berubah.

## Documentation Changed
Daftar seluruh dokumentasi yang diperbarui dan alasan perubahan.

## Storage Path Builder
Jelaskan canonical path resolution.

## Filename Builder
Jelaskan formula canonical physical filename.

## Create Document Result
Tampilkan actual DB + physical path.

## Revision Result
Tampilkan actual DB + physical path.

## Attachment Result
Tampilkan actual DB + physical path.

## Download Result
Tampilkan Physical Filename, Original Filename, dan Content-Disposition Filename.

## Multi-Project Result
Buktikan project isolation.

## Full Regression Matrix

Minimal:

| Area | Result |
|---|---|
| Authentication | PASS/FAIL |
| RBAC | PASS/FAIL |
| Project Context | PASS/FAIL |
| Document Create | PASS/FAIL |
| Document Register | PASS/FAIL |
| Detail | PASS/FAIL |
| View | PASS/FAIL |
| Download | PASS/FAIL |
| Revision | PASS/FAIL |
| Historical Download | PASS/FAIL |
| Workflow A | PASS/FAIL |
| Workflow B | PASS/FAIL |
| Workflow C | PASS/FAIL |
| Workflow Attachment | PASS/FAIL |
| Temporary Upload | PASS/FAIL |
| Archive/Restore | PASS/FAIL |
| SLA | PASS/FAIL |
| Escalation | PASS/FAIL |
| Notification | PASS/FAIL |
| Audit Trail | PASS/FAIL |
| Dashboard | PASS/FAIL |
| Project Isolation | PASS/FAIL |
| Storage Isolation | PASS/FAIL |
| DB Integrity | PASS/FAIL |
| Physical Storage Integrity | PASS/FAIL |
| Frontend Runtime | PASS/FAIL |
| UI Regression | PASS/FAIL |
| Backend Syntax | PASS/FAIL |
| Frontend Lint | PASS/FAIL |
| Frontend Build | PASS/FAIL |
| Documentation Alignment | PASS/FAIL |
| Cleanup | PASS/FAIL |

## Remaining Findings
Critical / Major / Minor / Suggestion.

---

# 51. Definition of Done

Patch hanya COMPLETE apabila:

- physical project directory menggunakan `PROJECT_CODE`;
- project UUID tidak lagi digunakan sebagai physical project folder;
- document folder menggunakan `DOCUMENT_NUMBER`;
- revision folder selaras dengan canonical backend/frontend revision;
- IFR-Submitted selaras di frontend/backend/storage;
- IFA-Submitted selaras di frontend/backend/storage;
- AS-Built selaras di frontend/backend/storage;
- physical filename menggunakan submit date;
- original filename tetap untuk download;
- attachments terpisah dari revisions;
- temporary promotion bekerja;
- multi-project isolation PASS;
- multiple-document same-project PASS;
- multiple-revision same-document PASS;
- historical revision download PASS;
- workflow attachment PASS;
- archive/restore PASS;
- SLA PASS;
- escalation PASS;
- notification PASS;
- audit PASS;
- dashboard PASS;
- API compatibility PASS;
- database integrity PASS;
- storage integrity PASS;
- frontend runtime PASS;
- UI Regression PASS;
- unauthorized UI changes = 0;
- backend syntax PASS;
- frontend lint PASS;
- frontend build PASS;
- seluruh dokumentasi terdampak sudah diperbarui;
- documentation alignment validation PASS;
- regression artifacts cleaned;
- Critical open = 0;
- Major open = 0.

---

# 52. Stop Condition

Setelah implementation + full regression + documentation update selesai:

STOP.

Jangan langsung menjalankan Manual UAT user.

Jangan membuat feature baru.

Jangan redesign UI.

Jangan melakukan schema redesign.

Jangan melakukan unrelated refactor.

Laporkan hasil kepada user terlebih dahulu.

Final expected result:

```text
STORAGE ARCHITECTURE
ALIGNED WITH FRONTEND ✅
ALIGNED WITH BACKEND ✅
ALIGNED WITH DATABASE ✅
DOCUMENTATION ALIGNED ✅

REVISION VOCABULARY
IFR-Submitted ✅
IFA-Submitted ✅
AS-Built ✅

PROJECT STORAGE
PROJECT_CODE ✅

PHYSICAL FILE NAMING
DOCUMENT_NUMBER
+ REVISION
+ SUBMIT_DATE
+ SHORT_FILE_ID
+ ORIGINAL_FILENAME ✅

FULL REGRESSION ✅

READY FOR MANUAL UAT
```

---

# 53. Permanent Safety Reminder

Selama validation dan cleanup:

```text
PROJECT CONTAINS TEST DATA
≠
PROJECT IS TEST DATA
```

Jangan pernah menghapus legitimate project hanya karena Codex membuat test document, test membership, notification, audit, atau file di dalam project tersebut.

`projects.id` adalah technical identity.

`projects.project_code` adalah business identity dan physical storage directory.

Cleanup hanya boleh menghapus validation artifacts yang dibuat untuk regression, bukan legitimate project/user/membership milik user.
