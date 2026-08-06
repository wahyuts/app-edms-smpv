# SECTION E.1 --- Integrasi SLA & Escalation (Prompt Enterprise)

## 1. Latar Belakang

Anda sedang melanjutkan proyek **ReBuild Engineering Document Management
System (EDMS)**.

Status implementasi saat ini:

-   SECTION A --- Repository Recon ✅
-   SECTION B --- Regression ✅
-   SECTION C --- Document Domain ✅
-   SECTION D --- Engineering Workflow & Collaboration ✅
-   PATCH D.1 --- Unified Temporary Upload Pipeline ✅
-   PATCH D.2 --- Document Owner RBAC Alignment ✅

Seluruh modul di atas dianggap **stabil** dan **tidak boleh diubah**
kecuali benar-benar diperlukan untuk integrasi.

Fokus SECTION E.1 adalah mengintegrasikan **SLA Engine** dan
**Escalation Engine** ke dalam runtime sistem.

------------------------------------------------------------------------

# 2. Tujuan

Implementasikan integrasi penuh untuk:

-   SLA Runtime
-   Perhitungan Overdue
-   Escalation Engine
-   Sinkronisasi Runtime
-   Trigger Notification
-   Penyedia Data Dashboard

Implementasi harus mengikuti seluruh dokumen Source of Truth.

------------------------------------------------------------------------

# 3. Source of Truth

Seluruh implementasi WAJIB mengacu pada:

1.  BUSINESS-WORKFLOW.md
2.  SYSTEM-REQUIREMENTS.md
3.  FEATURE-MAPPING.md
4.  PRD.md
5.  DATABASE-SCHEMA.md
6.  DATABASE-DESIGN-DECISIONS.md
7.  BACKEND-FOUNDATION.md
8.  API-CONTRACT.md
9.  DECISION-LOG.md

Apabila terdapat konflik, Source of Truth selalu menjadi acuan utama.

------------------------------------------------------------------------

# 4. Ruang Lingkup yang Dilindungi

JANGAN mengubah:

-   Authentication
-   Authorization
-   RBAC
-   Project Membership
-   Document CRUD
-   Workflow
-   Revision
-   Temporary Upload Pipeline
-   History
-   Storage
-   Database Schema
-   API yang sudah stabil

------------------------------------------------------------------------

# 5. Arsitektur SLA

SLA adalah layanan pendukung.

Workflow tetap menjadi sumber kebenaran utama.

Alur integrasi:

Workflow → SLA Runtime → Escalation Runtime → Notification → Dashboard →
Audit Trail

SLA tidak boleh mengubah status workflow.

------------------------------------------------------------------------

# 6. Integrasi SLA

Implementasikan:

-   SLA Start
-   SLA Reset
-   SLA Done
-   Current Assignee
-   Perhitungan Overdue
-   Sinkronisasi Runtime

Siklus resmi:

Create Document

↓

Process Review

↓

SLA Mulai

↓

Approval B / C

↓

Comment

↓

Upload Revision

↓

SLA Reset

↓

Approval A

↓

Project Review

↓

SLA Reset

↓

Approved

↓

SLA Done

------------------------------------------------------------------------

# 7. Aturan SLA

-   SLA dimulai setelah submit pertama.
-   Menggunakan Days Until Validation.
-   Timer berjalan menghitung ke atas.
-   Reset hanya pada transisi workflow yang telah disetujui.
-   Approved menghentikan SLA secara permanen.
-   Current Assignee harus selalu sesuai workflow aktif.

------------------------------------------------------------------------

# 8. Perhitungan Overdue

Implementasikan perhitungan dinamis.

Ketika waktu melebihi Days Until Validation:

-   SLA menjadi Overdue.
-   Escalation Engine aktif.

Jangan:

-   mengubah workflow,
-   mengubah status approval,
-   melakukan archive otomatis,
-   melakukan reject otomatis.

Overdue hanyalah kondisi SLA.

------------------------------------------------------------------------

# 9. Escalation Engine

Implementasikan sesuai PRD Part 13.

Level:

-   Level 1
-   Level 2
-   Level 3
-   Level 4

Aturan:

-   Level 1 = hari pertama overdue.
-   Naik setiap +3 hari.
-   Maksimum Level 4.
-   Level dihitung secara dinamis.

------------------------------------------------------------------------

# 10. Integrasi Notification

Gunakan arsitektur Notification yang sudah ada.

Persyaratan:

-   Kirim notifikasi ke Current Assignee.
-   Hindari notifikasi duplikat.
-   Dokumen Approved tidak boleh muncul lagi sebagai overdue.

------------------------------------------------------------------------

# 11. Ketergantungan Dashboard

Pastikan runtime menyediakan data untuk:

-   SLA Overview
-   On Track
-   At Risk
-   Overdue
-   Done
-   Escalation Summary
-   Current Assignee Summary

Dashboard akan diimplementasikan pada SECTION E.2.

------------------------------------------------------------------------

# 12. Matriks Validasi

Validasi minimal:

  Skenario          Hasil
  ----------------- ------------------------
  Create Document   SLA Mulai
  Approval A        SLA Reset
  Approval B        Reset setelah Revision
  Approval C        Reset setelah Revision
  Upload Revision   Timer Reset
  Approved          SLA Done
  Overdue           Level 1
  +3 Hari           Level 2
  +6 Hari           Level 3
  +9 Hari           Level 4

------------------------------------------------------------------------

# 13. Checklist Regression

Pastikan patch ini tidak merusak:

-   Authentication
-   RBAC
-   CRUD
-   Workflow
-   Upload Revision
-   Temporary Upload
-   History
-   Attachment
-   API yang sudah ada

Seluruh regression harus PASS.

------------------------------------------------------------------------

# 14. Kendali Risiko

Dilarang:

-   Mengubah workflow bisnis.
-   Mengubah approval flow.
-   Mengubah revision flow.
-   Mengubah document numbering.
-   Mengubah arsitektur yang sudah stabil.

------------------------------------------------------------------------

# 15. Update Dokumentasi

Perbarui hanya jika implementasi memang berubah:

-   PRD.md
-   API-CONTRACT.md
-   BACKEND-FOUNDATION.md
-   DATABASE-DESIGN-DECISIONS.md
-   DECISION-LOG.md

------------------------------------------------------------------------

# 16. Deliverables

Codex wajib memberikan:

1.  Ringkasan Implementasi
2.  Ringkasan Arsitektur
3.  Daftar File yang Berubah
4.  Perubahan Database (jika ada)
5.  Perubahan API (jika ada)
6.  Hasil Validasi
7.  Hasil Regression
8.  Risiko yang Masih Ada
9.  Rekomendasi untuk SECTION E.2

------------------------------------------------------------------------

# 17. Definition of Done

SECTION E.1 dianggap selesai apabila:

-   SLA Runtime berfungsi.
-   Overdue berjalan benar.
-   Escalation Level 1--4 benar.
-   Notification Trigger terhubung.
-   Dashboard dapat mengonsumsi data SLA.
-   Workflow tidak berubah.
-   Validation PASS.
-   Regression PASS.

------------------------------------------------------------------------

# 18. Batas Eksekusi

Berhenti setelah SECTION E.1 selesai.

Jangan mengerjakan:

-   Dashboard UI
-   Notification Center
-   Audit Trail
-   SECTION E.2
