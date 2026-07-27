# MILESTONE 3 --- CORE EDMS

# PART B --- PHASE 3.5--3.14

## Enterprise Backend Sprint Prompt v5 (Final)

> Prompt ini adalah pedoman implementasi resmi untuk seluruh backend
> business EDMS. Seluruh phase dikerjakan dalam satu sprint, namun
> **setiap phase wajib selesai, tervalidasi, dan lulus quality gate**
> sebelum melanjutkan ke phase berikutnya.

------------------------------------------------------------------------

# 1. Execution Strategy

Untuk **setiap phase (3.5--3.14)** WAJIB mengikuti alur berikut:

``` text
Repository Reconnaissance
        ↓
Frontend Compatibility Analysis
        ↓
Gap Analysis
        ↓
Architecture Decision
        ↓
Implement Backend
        ↓
Phase Validation
        ↓
Phase Completion Gate
        ↓
PASS
        ↓
Next Phase
```

Setelah seluruh phase selesai:

-   Full Regression Test
-   End-to-End Validation
-   Final Implementation Report

------------------------------------------------------------------------

# 2. Repository Reconnaissance (WAJIB)

Sebelum coding pada setiap phase, lakukan analisis repository.

## Backend

-   Controllers
-   Routes
-   Services
-   Repositories
-   Validators
-   Middlewares
-   Constants
-   Storage Service
-   Authentication
-   Authorization
-   Permission Matrix
-   Database Schema
-   Migration
-   Seed
-   API Contract
-   Helpers
-   Utilities

## Frontend

-   API Service
-   Axios
-   React Query
-   Zustand
-   Pages
-   Components
-   Forms
-   Tables
-   Search
-   Filter
-   Sorting
-   Pagination
-   Payload
-   Response Structure

## Output Reconnaissance

Laporkan: - reusable code - dependency - gap analysis - potensi
konflik - rencana implementasi

------------------------------------------------------------------------

# 3. Source of Truth

WAJIB menggunakan:

-   BUSINESS-WORKFLOW.md
-   PRD.md
-   DATABASE-SCHEMA.md
-   DATABASE-DESIGN-DECISIONS.md
-   BACKEND-FOUNDATION.md
-   STORAGE-STRATEGY.md
-   API-CONTRACT.md

------------------------------------------------------------------------

# 4. Frontend Compatibility Policy (WAJIB)

Backend harus kompatibel dengan source frontend saat ini.

Aturan:

-   Jangan mengubah source frontend.
-   Analisis kontrak API frontend sebelum implementasi.
-   Backend mengikuti payload dan response frontend selama tidak
    bertentangan dengan Source of Truth.
-   Jika frontend sudah sesuai Source of Truth → backend menyesuaikan.
-   Jika frontend menyimpang → laporkan pada report, jangan ubah
    frontend.

------------------------------------------------------------------------

# 5. General Architecture Rules

Untuk setiap phase wajib:

-   menggunakan repository pattern existing
-   menggunakan service layer existing
-   menggunakan validator existing
-   menggunakan storage abstraction existing
-   menggunakan authentication & authorization existing
-   tidak membuat implementasi paralel
-   tidak menduplikasi business logic

------------------------------------------------------------------------

# 6. Phase Specification

## Phase 3.5 --- Document Register

### Objective

Bangun API Document Register yang kompatibel dengan frontend.

### Business Rules

-   search
-   filter
-   sorting
-   pagination
-   current assignee
-   revision
-   status
-   SLA datasource

### API

Gunakan contract frontend.

### Validation

-   endpoint PASS
-   payload sesuai frontend
-   pagination PASS

### Definition of Done

Frontend dapat mengambil data register tanpa perubahan source.

------------------------------------------------------------------------

## Phase 3.6 --- Workflow Engine

### Objective

Implementasi workflow resmi sesuai BUSINESS-WORKFLOW.md.

### Business Rules

-   Process Review
-   Project Review
-   Process Comment
-   Project Comment
-   Process Reject
-   Project Reject
-   Current Assignee
-   Workflow Transition
-   Workflow History

### Validation

Seluruh transisi valid.

------------------------------------------------------------------------

## Phase 3.7 --- Approval Engine

### Objective

Implementasi Approval A/B/C.

### Business Rules

-   Approved
-   Approved with Comment
-   Not Approved

### Validation

Seluruh approval mengikuti PRD.

------------------------------------------------------------------------

## Phase 3.8 --- Workflow Comment

### Objective

Comment dan attachment workflow.

### Business Rules

-   Process Comment
-   Project Comment
-   Comment History
-   Attachment Integration

### Validation

Comment dan attachment bekerja.

------------------------------------------------------------------------

## Phase 3.9 --- Revision Lifecycle

### Objective

Upload Revision.

### Business Rules

-   revision chain
-   active revision
-   revision history

### Validation

Revision pointer benar.

------------------------------------------------------------------------

## Phase 3.10 --- SLA Engine

### Objective

Implementasi SLA.

### Business Rules

-   Count-up
-   On Track
-   At Risk
-   Overdue
-   Done

### Validation

Perhitungan sesuai PRD.

------------------------------------------------------------------------

## Phase 3.11 --- Escalation Alert

### Objective

Implementasi PART 13 PRD.

### Business Rules

-   Dynamic Level 1--4
-   One-time Notification

### Validation

Escalation PASS.

------------------------------------------------------------------------

## Phase 3.12 --- Notification Foundation

### Objective

Notification backend.

### Validation

Trigger sesuai workflow.

------------------------------------------------------------------------

## Phase 3.13 --- Audit Trail

### Objective

Audit seluruh aktivitas utama.

### Validation

Audit konsisten.

------------------------------------------------------------------------

## Phase 3.14 --- Dashboard API

### Objective

Datasource dashboard.

### Validation

Semua widget memperoleh data.

------------------------------------------------------------------------

# 7. Validation Per Phase

Setelah setiap phase:

-   syntax check
-   dependency check
-   endpoint validation
-   authentication
-   authorization
-   frontend compatibility
-   regression phase sebelumnya

Jika gagal: **STOP. Jangan lanjut ke phase berikutnya.** berikan laporan masalahnya apa dan terletak dimana.

------------------------------------------------------------------------

# 8. Phase Completion Gate

Phase selesai apabila:

-   Objective tercapai
-   Business Rules terpenuhi
-   Validation PASS
-   Frontend compatible
-   Source of Truth compatible
-   Regression PASS

------------------------------------------------------------------------

# 9. Security Requirements

-   Project Membership Validation
-   RBAC Validation
-   Horizontal Privilege Escalation Prevention
-   Secure Error Response
-   Storage Abstraction
-   No Sensitive Data Leakage

------------------------------------------------------------------------

# 10. Database Governance

Jika schema berubah:

-   update canonical schema
-   migration idempotent
-   evaluasi/update seed
-   MariaDB validation
-   MySQL validation
-   fresh install test
-   existing migration test
-   migration guide

------------------------------------------------------------------------

# 11. Final Validation

Setelah Phase 3.14:

-   Full Regression Test
-   Workflow End-to-End Test
-   Dashboard Validation
-   API Validation
-   Permission Validation
-   Backend Startup Validation

------------------------------------------------------------------------

# 12. Final Deliverables

-   Backend business EDMS lengkap
-   Compatible dengan frontend existing
-   Tidak mengubah source frontend
-   Foundation tetap utuh
-   Siap untuk Phase 3.15 Frontend Integration

------------------------------------------------------------------------

# 13. Final Implementation Report

## Per Phase

-   Repository Reconnaissance
-   Frontend Compatibility Analysis
-   Gap Analysis
-   Architecture Decision
-   Validation Result
-   Completion Gate

## Akhir Sprint

-   Endpoint List
-   Files Created
-   Files Modified
-   Database Changes
-   Migration Guide (jika ada)
-   Regression Result
-   Remaining Risks
-   Ready for Phase 3.15

------------------------------------------------------------------------

# 14. Definition of Done

Sprint dinyatakan selesai apabila:

-   Seluruh Phase 3.5--3.14 selesai.
-   Semua quality gate lulus.
-   Backend kompatibel dengan frontend existing.
-   Tidak ada perubahan frontend.
-   Source of Truth dipatuhi.
-   Database Governance dipatuhi.
-   Regression PASS.
-   Backend siap memasuki Phase 3.15.
