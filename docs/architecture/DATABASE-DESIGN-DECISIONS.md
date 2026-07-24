# DATABASE-DESIGN-DECISIONS.md

> Version: 1.0
> Status: APPROVED
> Phase: Database Engineering
> Owner: Product Owner
> Scope: Seluruh Database Engineering EDMS

---

# 1. Purpose

Dokumen ini berisi seluruh keputusan arsitektur database yang telah disetujui Product Owner sebelum proses implementasi SQL dimulai.

Dokumen ini merupakan **kontrak resmi** antara:

- Business Workflow
- Validated Frontend
- Source of Truth
- Database Engineering
- Backend Engineering

Seluruh implementasi database wajib mengikuti keputusan pada dokumen ini.

---

# 2. Engineering Governance

## DDD-001 — Database Authority

Database bukan sumber kebenaran bisnis.

Hierarchy resmi proyek adalah:

Business Workflow

↓

Validated Frontend

↓

Source of Truth

↓

Database

↓

Backend

Database hanya mengimplementasikan desain yang telah disetujui.

---

## DDD-002 — No Silent Modification

Database Engineering DILARANG:

- mengubah Business Workflow
- mengubah Frontend
- mengubah Source of Truth
- mengubah API Contract

tanpa persetujuan Product Owner.

Jika ditemukan konflik:

STOP.

Buat Database Conflict Report.

Menunggu keputusan Product Owner.

---

## DDD-003 — Synchronization Rule

Jika Product Owner menyetujui suatu perubahan maka seluruh layer yang terdampak WAJIB diselaraskan kembali.

Perubahan dianggap selesai apabila:

- Frontend
- Source of Truth
- DATABASE-SCHEMA.md
- API Contract (jika terdampak)
- Database
- Backend (nantinya)

kembali berada pada kondisi synchronized.

---

# 3. Entity Decisions

## DDD-004 — Document Types

Document Type menggunakan lookup table.

Entity:

document_types

Status:

APPROVED

Alasan:

Jenis dokumen diperkirakan akan berkembang di masa depan.

---

## DDD-005 — Workflow Entity

Tidak membuat tabel:

workflow

workflow_transition

workflow_master

Workflow bersifat FIXED.

Workflow direpresentasikan oleh:

- workflow_status
- responsible_role
- current_assignee
- document_history
- workflow_comments
- workflow_attachments

Status:

APPROVED

---

## DDD-006 — Workflow History

History resmi menggunakan:

document_history

Tidak membuat entity:

workflow_history

Status:

APPROVED

---

## DDD-007 — Storage Repository

Entity resmi:

stored_files

Tidak membuat entity:

storage_repository

Status:

APPROVED

---

# 4. Attribute Decisions

## DDD-008 — Revision Sequence

Tambahkan attribute:

revision_sequence

pada:

document_revisions

Status:

APPROVED

---

## DDD-009 — Current Assignee

Current Assignee disimpan sebagai:

current_assignee_user_id

Display Name dibentuk oleh API Response.

Frontend tidak membaca nama langsung dari database.

Status:

APPROVED

---

# 5. Lookup vs Enum Strategy

## DDD-010 — Lookup Tables

Lookup digunakan untuk data yang dapat berkembang.

Minimal:

- roles
- permissions
- departments
- document_types

Status:

APPROVED

---

## DDD-011 — Fixed Business Catalog

Menggunakan ENUM atau CHECK Constraint.

Minimal:

- workflow_status
- lifecycle_status
- revision_stage
- notification_event
- audit_action

Tidak membuat lookup table.

Status:

APPROVED

---

# 6. Relationship Decisions

## DDD-012 — Active Revision

engineering_documents.active_revision_id

boleh membentuk circular reference konseptual.

Implementasi dilakukan menggunakan:

INSERT

↓

Revision

↓

UPDATE active_revision

Bukan redesign entity.

Status:

APPROVED

---

## DDD-013 — Active File

engineering_documents.active_file_id

menggunakan strategi implementasi yang sama.

Status:

APPROVED

---

# 7. Index Strategy

## DDD-014 — Current Assignee Index

Tambahkan index:

current_assignee_user_id

Status:

APPROVED

---

## DDD-015 — Timeline Index

Tambahkan index:

(project_id, document_id, created_at)

pada:

document_history

Status:

APPROVED

---

## DDD-016 — Search Strategy

Document Register harus memiliki index yang mendukung pencarian:

- document_number
- title
- drawing_number
- area
- workflow_status
- lifecycle_status
- current_assignee
- revision

Status:

APPROVED

---

# 8. Security Decisions

## DDD-017 — Refresh Session

Password Change

Password Reset

Logout All Device

WAJIB mencabut Refresh Session aktif.

Status:

APPROVED

---

## DDD-018 — Password Reset

password_reset_tokens

bersifat temporary.

Expired token dapat dipurge.

Status:

APPROVED

---

# 9. Seed Strategy

## DDD-019 — schema.sql

schema.sql

hanya berisi:

- CREATE DATABASE
- CREATE TABLE
- PK
- FK
- INDEX
- UNIQUE
- CHECK
- VIEW (jika ada)

Tidak boleh memiliki data.

Status:

APPROVED

---

## DDD-020 — seed-base.sql

Berisi:

- Roles
- Permissions
- Role Permissions
- System Metadata
- Admin
- Admin Credential
- No Department

Tidak berisi data demo.

Status:

APPROVED

---

## DDD-021 — seed-demo.sql

Seluruh data demo berasal dari:

Validated Frontend

↓

IndexedDB

↓

Seeder

Tidak boleh membuat dummy baru secara manual.

Status:

APPROVED

---

## DDD-022 — seed-staging.sql

Dataset ringan.

Digunakan untuk:

User Acceptance Test

Client Demo

Staging Environment

Status:

APPROVED

---

# 10. Environment Strategy

Development

schema.sql

+

seed-base.sql

+

seed-demo.sql

---

Staging

schema.sql

+

seed-base.sql

+

seed-staging.sql

---

Production

schema.sql

+

seed-base.sql

---

# 11. Database Engineering Exit Criteria

Database Engineering dapat dilanjutkan ke Phase berikutnya apabila:

✓ Seluruh keputusan pada dokumen ini telah disetujui.

✓ Tidak terdapat Database Conflict Report yang masih terbuka.

✓ Source of Truth tetap synchronized.

✓ Frontend tetap synchronized.

✓ Business Workflow tetap synchronized.

---

# 12. Final Verdict

DATABASE DESIGN DECISIONS

STATUS:

APPROVED

DATABASE ENGINEERING

AUTHORIZED TO GENERATE SCHEMA.SQL