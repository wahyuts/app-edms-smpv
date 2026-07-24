Dokumen ini bersifat operasional dan dirancang untuk dibaca oleh AI. Apabila terdapat konflik antara dokumen ini dengan Source of Truth Project, maka Source of Truth selalu memiliki prioritas yang lebih tinggi.

# PROMPT-STANDARD.md

# PART 1 — Purpose

## 1.1 Objective

Dokumen ini merupakan **aturan operasional standar** yang wajib digunakan oleh AI (Codex) sebelum mengerjakan setiap Sprint, Task, maupun Feature pada project **Engineering Document Management System (EDMS)**.

Dokumen ini **bukan** merupakan dokumen kebutuhan bisnis (Business Requirement), melainkan panduan perilaku AI selama proses implementasi.

Seluruh aturan di dalam dokumen ini bersifat **tetap (persistent)** dan berlaku untuk seluruh proses pengembangan hingga project selesai, kecuali apabila terdapat revisi yang disetujui oleh Project Architect.

---

## 1.2 Purpose

Tujuan utama dokumen ini adalah:

- Mengurangi pengulangan instruksi pada setiap prompt Sprint.
- Menjaga konsistensi implementasi antar Sprint.
- Mencegah AI melakukan perubahan di luar ruang lingkup pekerjaan.
- Menjamin seluruh implementasi mengikuti Source of Truth project.
- Mengurangi penggunaan Context Window dan Token pada setiap Task.

Dengan adanya dokumen ini, prompt Sprint hanya perlu menjelaskan **tujuan pekerjaan**, sedangkan seluruh aturan umum akan diambil dari dokumen ini.

---

## 1.3 Scope

Dokumen ini berlaku untuk seluruh aktivitas implementasi frontend maupun backend pada project EDMS, termasuk namun tidak terbatas pada:

- UI Development
- Component Development
- Routing
- State Management
- API Integration
- Mock Data Integration
- Business Logic Implementation
- Refactoring
- Bug Fixing
- Performance Improvement

---

## 1.4 Relationship with Other Documents

Dokumen ini **tidak menggantikan** Source of Truth Project.

AI tetap wajib membaca dokumen utama sesuai urutan yang telah ditentukan pada AI-IMPLEMENTATION-GUIDE.md.

PROMPT-STANDARD.md hanya berfungsi sebagai aturan operasional AI selama mengerjakan Task.

Hierarki dokumentasi adalah sebagai berikut:

```
Source of Truth
        │
        ▼
AI-IMPLEMENTATION-GUIDE.md
        │
        ▼
PROMPT-STANDARD.md
        │
        ▼
Sprint Prompt
```

---

## 1.5 Philosophy

Prompt Sprint harus dibuat sesingkat mungkin.

Seluruh aturan yang bersifat permanen **tidak boleh diulang** pada setiap Sprint.

Prompt Sprint hanya berisi:

- Tujuan Sprint
- Scope pekerjaan
- Acceptance Criteria
- Constraint khusus (jika ada)

Sedangkan seluruh aturan umum akan mengikuti dokumen ini.

---

## 1.6 Expected Result

Dengan menggunakan PROMPT-STANDARD.md diharapkan:

- Prompt menjadi lebih pendek.
- Context Window lebih hemat.
- Konsistensi implementasi meningkat.
- AI bekerja lebih terarah.
- Risiko perubahan arsitektur tanpa izin dapat diminimalkan.
- Seluruh Sprint memiliki pola implementasi yang konsisten.

---

## End of Part 1

# PART 2 — Mandatory Reading

## 2.1 Objective

Sebelum memulai implementasi, AI wajib memahami referensi yang relevan dengan pekerjaan yang sedang dilakukan.

AI tidak diperbolehkan langsung melakukan implementasi tanpa terlebih dahulu memahami Source of Truth dan dokumen pendukung yang berkaitan dengan Sprint atau Task.

AI tidak diwajibkan membaca seluruh dokumentasi project apabila dokumen tersebut tidak berhubungan dengan pekerjaan yang sedang dilakukan.

---

# 2.2 Reading Strategy

AI harus menggunakan prinsip berikut ketika membaca dokumentasi:

- Baca hanya dokumen yang relevan dengan Task.
- Hindari membaca dokumen yang tidak berhubungan untuk menghemat Context Window.
- Ikuti urutan prioritas dokumen.
- Jangan melakukan implementasi berdasarkan asumsi.

---

# 2.3 Reading Priority

Apabila terdapat konflik informasi antar dokumen, AI wajib mengikuti urutan prioritas berikut.

```
Business Workflow
        ↓
PRD
        ↓
Implementation Plan
        ↓
UI Guidelines
        ↓
Technical Specification
        ↓
Visual Reference (Mockup)
```

AI tidak diperbolehkan memilih referensi secara acak.
Business Entity yang telah didefinisikan pada dokumen dengan prioritas tertinggi wajib dipertahankan secara konsisten pada seluruh proses implementasi.

AI tidak diperbolehkan mengganti, menambah, mengurangi, maupun membuat Business Entity baru yang bertentangan dengan Source of Truth Project.
Apabila ditemukan konflik Business Entity antar dokumen, AI wajib mengikuti dokumen dengan prioritas yang lebih tinggi sesuai Reading Priority.
---

# 2.4 Mandatory Reading Level

## Level 1 — AI Operational Guide

```
docs/ai/AI-IMPLEMENTATION-GUIDE.md
```

Tujuan:

- Memahami workflow implementasi.
- Memahami aturan kerja AI.
- Memahami struktur project.
- Memahami standar implementasi.

Dokumen ini wajib dibaca terlebih dahulu.

---

## Level 2 — Business Source of Truth

AI membaca dokumen Source of Truth yang berkaitan langsung dengan Sprint atau Task.

Contoh:

- BUSINESS-WORKFLOW.md
- PRD.md
- IMPLEMENTATION-PLAN.md
- UI-GUIDELINES.md

---

## Level 3 — Technical Reference

AI membaca dokumen teknis yang diperlukan.

Contoh:

- API-CONTRACT.md
- FILE-STRUCTURE.md
- ROUTING.md
- STATE-MANAGEMENT.md
- ACCESS-CONTROL.md
- COMPONENT-SPEC.md
- TABLE-SPEC.md
- FORM-SPEC.md

AI tidak diwajibkan membaca seluruh dokumen teknis apabila tidak diperlukan oleh Sprint.

---

# 2.5 Visual Reference Rules

Visual Reference memiliki dua fungsi yang berbeda:

- Layout Reference
- Design Language Reference

AI wajib memahami perbedaan keduanya sebelum melakukan implementasi.

---

## Layout Reference

Layout bersifat **Feature-Specific**.

Apabila tersedia mockup untuk Feature yang sedang dikerjakan, AI wajib menggunakan mockup tersebut sebagai referensi Layout utama.

Contoh:

Dashboard → Dashboard Mockup

Login → Login Mockup

Document Register → Document Register Mockup

AI tidak diperbolehkan menggunakan Layout dari mockup Feature lain sebagai referensi utama.

---

## Design Language Reference

Design Language bersifat **Project-Wide**.

Seluruh mockup yang tersedia pada project merupakan representasi Design Language EDMS.

Walaupun suatu Feature tidak memiliki mockup sendiri, AI tetap wajib mempertahankan Design Language yang telah diterapkan pada project.

Design Language meliputi:

- Color Palette
- Background
- Surface Color
- Border Color
- Typography
- Icon Style
- Button Style
- Card Style
- Modal Style
- Input Style
- Table Style
- Badge Style
- Spacing
- Border Radius
- Shadow
- Hover Effect
- Interaction Pattern

Tujuan utama Design Language adalah menjaga identitas visual yang konsisten pada seluruh aplikasi.

---

## Apabila Mockup Tidak Tersedia

Apabila Feature yang sedang dikerjakan belum memiliki mockup, AI wajib mengikuti urutan referensi berikut:

1. UI-GUIDELINES.md
2. COMPONENT-SPEC.md
3. Design Pattern yang telah diterapkan pada project.
4. Design Language yang telah digunakan pada Foundation.

Design Pattern yang dimaksud meliputi:

- AppShell
- Sidebar
- Header
- Footer
- Card
- Button
- Input
- Table
- Modal
- Typography
- Icon
- Layout
- Spacing

AI tidak diperbolehkan mengambil Layout dari mockup Feature lain.

Namun AI tetap wajib menjaga konsistensi Design Language Project.

---

## 2.5.1 Mockup Priority Rules

Apabila pada folder:

docs/references/mockups/

tersedia mockup yang secara langsung berkaitan dengan Feature yang sedang diimplementasikan, maka AI wajib menggunakan mockup tersebut sebagai referensi visual utama.

AI wajib mempertahankan:

- Layout
- Component Position
- Component Grouping
- Visual Hierarchy
- Interaction Pattern
- Button Arrangement
- Table Structure
- Navigation Structure

sesuai dengan mockup tersebut.

AI tidak diperbolehkan melakukan improvisasi terhadap susunan komponen apabila mockup telah tersedia.

Apabila terdapat lebih dari satu mockup untuk Feature yang sama, AI wajib menggunakan mockup dengan tingkat detail paling tinggi sebagai referensi utama.

Contoh:

Document Register

↓

docs/references/mockups/document-register.png

↓

docs/references/mockups/document-register-action-layout.png

Pada contoh di atas:

- document-register.png menjadi acuan Layout halaman.
- document-register-action-layout.png menjadi acuan khusus untuk susunan Action Button.

Apabila ditemukan konflik antara Source of Truth dan Mockup, AI wajib mengikuti Source of Truth Project.

Apabila ditemukan konflik antar Mockup, AI wajib menghentikan implementasi dan meminta klarifikasi kepada Human Reviewer.

---

# 2.6 Selective Reading

AI hanya membaca dokumen yang berhubungan dengan pekerjaan saat ini.

Contoh:

Sprint Dashboard UI

AI cukup membaca:

- AI-IMPLEMENTATION-GUIDE.md
- BUSINESS-WORKFLOW.md
- PRD.md
- IMPLEMENTATION-PLAN.md
- UI-GUIDELINES.md
- DASHBOARD-INTERACTIONS.md
- Dashboard Mockup

AI tidak perlu membaca:

- API-CONTRACT.md
- FORM-SPEC.md
- TABLE-SPEC.md

apabila tidak berhubungan dengan Sprint yang sedang dikerjakan.

---

# 2.7 Mandatory Compliance

Sebelum melakukan implementasi, AI harus memastikan bahwa:

- Seluruh referensi yang relevan telah dipahami.
- Scope Sprint telah dipahami.
- Tidak terdapat konflik antar referensi.
- Implementasi mengikuti Source of Truth.
- Implementasi mengikuti Design Language Project.
- Implementasi mengikuti Design Pattern Project.

Apabila terdapat informasi yang tidak tersedia atau bertentangan, AI wajib menghentikan implementasi dan meminta klarifikasi kepada Human Reviewer.

AI tidak diperbolehkan membuat asumsi sendiri.

---

# 2.8 Business Entity Rules

Business Entity merupakan istilah, struktur, maupun konsep bisnis yang telah didefinisikan pada Source of Truth Project.

Contoh Business Entity meliputi namun tidak terbatas pada:

- Role
- User
- Document Status
- Document Revision
- Approval Type
- Workflow
- SLA Status
- Escalation Level
- Document Type
- Notification Type
- Business Process

---

## Source of Truth First

Apabila Business Entity telah didefinisikan pada Source of Truth Project, AI wajib menggunakan Business Entity tersebut.

AI tidak diperbolehkan membuat Business Entity baru berdasarkan:

- Asumsi.
- Best Practice umum.
- Template Project lain.
- Framework.
- Preferensi pribadi AI.

Seluruh Business Entity harus mengikuti definisi yang terdapat pada Source of Truth Project.

---

## No Generic Business Entity

AI tidak diperbolehkan mengganti Business Entity Project dengan istilah generik.

Contoh yang tidak diperbolehkan:

Business Workflow

```
Role

- Admin
- Document Owner
- Team Process
- Team Project
```

↓

Implementasi AI

```
- Administrator
- Engineer
- Reviewer
- Client
```

Implementasi di atas dianggap tidak valid karena tidak mengikuti Source of Truth Project.

---

## Business Workflow Priority

Apabila Business Workflow telah mendefinisikan:

- Role
- Status
- Approval
- Workflow
- Revision
- SLA

maka AI wajib menggunakan definisi tersebut sebagai dasar implementasi.

AI tidak diperbolehkan membuat alternatif baru.

---

## Business Entity Consistency

Business Entity yang telah digunakan pada project harus dipertahankan secara konsisten pada seluruh implementasi.

Contoh:

Business Workflow

↓

PRD

↓

Mock JSON

↓

Service Layer

↓

Component

↓

UI

↓

Backend Ready Schema

Seluruh layer harus menggunakan Business Entity yang sama.

AI tidak diperbolehkan menggunakan istilah yang berbeda untuk Business Entity yang sama.

---

## End of Part 2

# PART 3 — Working Rules

## 3.1 Objective

Bagian ini menjelaskan aturan operasional yang wajib dipatuhi oleh AI selama melakukan implementasi.

Seluruh aturan pada bagian ini berlaku untuk setiap Sprint, Task, Bug Fix, Refactoring, maupun Enhancement.

AI tidak diperbolehkan mengabaikan aturan ini kecuali terdapat instruksi eksplisit dari Human Reviewer.

---

# 3.2 Scope First Principle

AI hanya boleh mengerjakan pekerjaan yang berada di dalam Scope Sprint.

AI tidak diperbolehkan:

- Menambahkan Feature baru.
- Mengembangkan Feature yang belum diminta.
- Melakukan Refactoring besar di luar Scope.
- Mengubah Architecture tanpa izin.
- Mengubah struktur project tanpa instruksi.

AI harus menyelesaikan pekerjaan sesuai Scope yang diberikan.

---

# 3.3 Preserve Existing Implementation

AI boleh menggunakan implementasi yang sudah ada sebagai referensi.

Namun AI tidak diperbolehkan mengubah implementasi yang sudah berjalan dengan baik apabila perubahan tersebut tidak termasuk dalam Scope Sprint.

Contoh:

Sprint:

```
Memperbaiki Sidebar
```

AI tidak boleh mengubah:

- Header
- Footer
- Dashboard
- Routing
- API Layer

apabila tidak diminta.

Tujuan aturan ini adalah mencegah perubahan yang tidak disengaja (Regression).

---

# 3.4 Foundation Protection

Foundation yang telah dinyatakan **Frozen** dianggap sebagai bagian stabil dari project.

AI tidak diperbolehkan mengubah Foundation tanpa instruksi eksplisit.

Foundation meliputi:

- AppShell
- Sidebar
- Header
- Footer
- Navigation
- Router
- Provider
- Global Layout
- Theme
- Design Pattern

Perubahan Foundation hanya boleh dilakukan apabila terdapat Task khusus yang memang ditujukan untuk Foundation.

---

# 3.5 Architecture Protection

AI tidak diperbolehkan:

- Mengganti Technology Stack.
- Mengubah Folder Structure.
- Mengubah Service Pattern.
- Mengubah State Management Pattern.
- Mengubah Routing Pattern.
- Mengubah API Pattern.

selama tidak terdapat instruksi eksplisit.

AI wajib mengikuti Architecture yang telah disepakati pada project.

---

# 3.6 Consistency Principle

AI wajib menjaga konsistensi implementasi.

Apabila suatu Pattern telah digunakan pada project, AI wajib menggunakan Pattern yang sama.

Contoh:

- Naming Convention
- Component Structure
- Import Style
- Folder Structure
- Layout Pattern
- UI Pattern

AI tidak diperbolehkan membuat Pattern baru apabila Pattern yang sesuai telah tersedia.

---

# 3.7 Incremental Development

AI harus mengembangkan project secara bertahap.

Urutan implementasi:

```
Foundation

↓

Feature Skeleton

↓

Static UI

↓

Interaction

↓

Business Logic

↓

API Integration

↓

Optimization
```

AI tidak diperbolehkan melompati tahapan implementasi.

---

# 3.8 No Hidden Refactoring

AI tidak diperbolehkan melakukan Refactoring tersembunyi.

Contoh yang tidak diperbolehkan:

- Rename Folder
- Rename Component
- Memindahkan File
- Mengubah Naming Convention
- Mengubah Import Path

apabila perubahan tersebut tidak diminta.

---

# 3.9 Stop Rule

AI harus berhenti apabila:

- Acceptance Criteria telah terpenuhi.
- Scope Sprint telah selesai.
- Tidak terdapat pekerjaan lain pada Sprint.

AI tidak diperbolehkan menambahkan pekerjaan baru dengan alasan "sekalian".

Implementasi tambahan hanya boleh dilakukan apabila diminta oleh Human Reviewer.

---

# 3.10 Human Reviewer Authority

Human Reviewer merupakan otoritas tertinggi pada project.

Apabila terdapat konflik antara:

- Dokumentasi
- Implementasi
- Interpretasi AI

AI wajib mengikuti keputusan Human Reviewer.

AI tidak diperbolehkan berdebat atau mempertahankan implementasi apabila Human Reviewer telah memberikan keputusan akhir.

---

## End of Part 3

# PART 4 — Output Rules

## 4.1 Objective

Setelah menyelesaikan implementasi, AI wajib memberikan ringkasan hasil pekerjaan secara singkat, jelas, dan mudah dipahami.

Output bertujuan membantu Human Reviewer melakukan proses review dengan cepat, bukan membuat dokumentasi baru.

AI harus memprioritaskan kualitas implementasi dibandingkan panjang laporan.

---

# 4.2 Required Output

Setiap implementasi minimal harus memuat informasi berikut:

## Summary

Menjelaskan secara singkat apa yang telah diimplementasikan.

Contoh:

- Dashboard berhasil menggunakan AppShell.
- Sidebar telah membaca Navigation Configuration.
- React Router berhasil dirender.

---

## Modified Files

AI wajib menyebutkan file yang diubah beserta tujuan perubahannya.

Contoh:

```
Modified Files

- AppShell.jsx
  Integrasi Sidebar dan Header.

- navigation.js
  Menambahkan konfigurasi menu Dashboard.
```

---

## New Files

Apabila terdapat file baru, AI wajib menjelaskan:

- Nama file
- Lokasi
- Tujuan file

Apabila tidak ada:

```
New Files

None
```

---

## Dependency Changes

Apabila terdapat perubahan dependency:

- Package yang ditambahkan
- Alasan penggunaan

Contoh:

```
Added

lucide-react

Reason

Project Icon Library
```

Apabila tidak ada perubahan:

```
Dependency Changes

None
```

---

## Breaking Changes

AI wajib memberi tahu apabila implementasi berpotensi memengaruhi bagian lain dari project.

Apabila tidak ada:

```
Breaking Changes

None
```

---

## Manual Action Required

AI wajib memberi tahu apabila Human Reviewer perlu melakukan langkah tambahan.

Contoh:

- npm install
- npm run dev
- Update .env

Apabila tidak ada:

```
Manual Action Required

None
```

---

## Acceptance Result

AI wajib mengevaluasi hasil implementasi berdasarkan Acceptance Criteria Sprint.

Pilihan status yang diperbolehkan:

```
Completed

Completed with Notes

Need Human Review

Need Clarification
```

AI tidak diperbolehkan menyatakan implementasi **Completed** apabila Acceptance Criteria belum terpenuhi.

---

# 4.3 Output Principles

AI harus mengikuti prinsip berikut:

- Ringkas.
- Jelas.
- Fokus pada implementasi.
- Tidak membuat dokumentasi tambahan.
- Tidak menjelaskan source code secara berlebihan.
- Tidak mengulang isi Source of Truth.
- Tidak membuat asumsi mengenai keberhasilan implementasi.

AI hanya boleh menyatakan implementasi selesai apabila seluruh Acceptance Criteria telah terpenuhi.

---

## End of Part 4

# PART 5 — AI Safety Rules

## 5.1 Objective

Bagian ini menjelaskan batasan (Guardrails) yang wajib dipatuhi AI selama melakukan implementasi.

Tujuan utama bagian ini adalah menjaga agar AI tetap bekerja sesuai Scope Sprint, menjaga stabilitas project, dan menghindari perubahan yang tidak diinginkan.

---

# 5.2 No Assumption Rule

AI tidak diperbolehkan membuat asumsi terhadap requirement yang tidak tertulis.

Apabila informasi tidak tersedia atau tidak jelas, AI wajib menghentikan implementasi pada bagian tersebut dan meminta klarifikasi kepada Human Reviewer.

AI tidak boleh mengisi kekosongan informasi berdasarkan tebakan.

---

# 5.3 No Scope Expansion

AI hanya boleh mengerjakan pekerjaan yang terdapat pada Sprint atau Task.

AI tidak diperbolehkan:

- Menambahkan Feature baru.
- Menambahkan halaman baru.
- Menambahkan menu baru.
- Menambahkan Business Logic baru.
- Menambahkan API baru.

Apabila tidak diminta secara eksplisit.

---

# 5.4 No Architecture Modification

AI tidak diperbolehkan mengubah Architecture Project tanpa instruksi.

Termasuk tetapi tidak terbatas pada:

- Folder Structure
- Routing Pattern
- State Management
- Service Layer
- API Pattern
- Provider Pattern
- Feature Based Architecture

Architecture dianggap sebagai bagian stabil dari project.

---

# 5.5 No Hidden Refactoring

AI tidak diperbolehkan melakukan Refactoring tersembunyi.

Contoh:

- Rename File
- Rename Folder
- Rename Component
- Memindahkan File
- Mengubah Import Path
- Mengubah Naming Convention

Apabila perubahan tersebut tidak termasuk Scope Sprint.

---

# 5.6 Preserve Existing Behaviour

Apabila suatu fitur telah berjalan dengan baik, AI wajib mempertahankan perilaku tersebut.

AI tidak diperbolehkan mengubah implementasi yang telah stabil hanya untuk mengikuti preferensi pribadi atau pendekatan lain.

Perubahan hanya boleh dilakukan apabila diminta secara eksplisit.

---

# 5.7 Preserve Existing Design Language

AI wajib menjaga konsistensi Design Language Project.

AI tidak diperbolehkan:

- Mengubah Theme.
- Mengubah Color Palette.
- Mengubah Typography.
- Mengubah Component Style.
- Mengubah Layout Pattern.

Apabila perubahan tersebut tidak termasuk Scope Sprint.

---

# 5.8 React Component Protection

Apabila suatu konfigurasi menggunakan React Component Reference, AI wajib mempertahankan implementasi tersebut.

AI tidak diperbolehkan mengubah React Component menjadi:

- String
- Placeholder
- Emoji
- Huruf pertama
- Implementasi alternatif

Contoh yang benar:

```jsx
icon: LayoutDashboard
```

Contoh yang tidak diperbolehkan:

```jsx
icon: "LayoutDashboard"
```

atau

```jsx
Dashboard

↓

"D"
```

AI wajib mempertahankan pola React Component yang telah digunakan pada project.

---

# 5.9 No Placeholder Replacement

AI tidak diperbolehkan mengganti implementasi yang valid menjadi Placeholder.

Contoh yang tidak diperbolehkan:

- Mengganti Icon menjadi huruf pertama.
- Mengganti Component menjadi Text.
- Mengganti Data menjadi Dummy tanpa instruksi.

Placeholder hanya boleh dibuat apabila memang diminta pada Sprint.

---

# 5.10 Stop and Ask

AI wajib menghentikan implementasi apabila:

- Requirement tidak jelas.
- Dokumentasi bertentangan.
- Informasi tidak tersedia.
- Perubahan berpotensi memengaruhi Foundation.
- Perubahan berpotensi mengubah Architecture.

Pada kondisi tersebut AI wajib meminta klarifikasi kepada Human Reviewer.

AI tidak diperbolehkan mengambil keputusan sendiri.

---

# 5.11 Human Reviewer Authority

Keputusan Human Reviewer merupakan keputusan akhir.

Apabila Human Reviewer memberikan instruksi yang berbeda dengan interpretasi AI, maka AI wajib mengikuti keputusan Human Reviewer.

---

# 5.12 Safety Principles

Selama proses implementasi AI harus mengikuti prinsip berikut:

- Jangan berasumsi.
- Jangan mengubah Scope.
- Jangan mengubah Architecture.
- Jangan mengubah Foundation.
- Jangan mengubah Design Language.
- Jangan melakukan Refactoring tersembunyi.
- Jangan mengganti React Component menjadi String.
- Berhenti apabila tidak yakin.
- Selalu ikuti Human Reviewer.

---

## End of Part 5

# PART 6 — Coding Rules

## 6.1 Objective

Bagian ini menjelaskan standar implementasi yang wajib diikuti AI selama proses pengembangan.

Tujuan utama Coding Rules adalah menjaga konsistensi source code, mempermudah maintenance, serta memastikan seluruh implementasi mengikuti Architecture Project.

Bagian ini merupakan ringkasan operasional dari AI-IMPLEMENTATION-GUIDE.md dan tidak menggantikannya.

---

# 6.2 General Principles

Seluruh implementasi harus mengikuti prinsip berikut:

- Konsisten.
- Sederhana.
- Mudah dipelihara.
- Mudah dibaca.
- Reusable.
- Tidak membuat kompleksitas yang tidak diperlukan.

AI harus mengutamakan keterbacaan (Readability) dibandingkan implementasi yang terlalu pintar (Over Engineering).

---

# 6.3 Technology Stack

AI wajib menggunakan Technology Stack yang telah ditetapkan pada project.

## Frontend

- React
- Vite
- JavaScript (ES Modules)
- React Router
- Axios
- TanStack Query
- Zustand
- React Hook Form
- Zod
- Tailwind CSS
- Lucide React

## Backend

- Node.js
- Express.js
- MySQL

AI tidak diperbolehkan mengganti Technology Stack tanpa instruksi eksplisit.

---

# 6.4 Project Architecture

AI wajib mengikuti Architecture Project yang telah ditetapkan.

Project menggunakan:

- Feature Based Architecture
- Shared Component Pattern
- Service Layer Pattern
- Mock Service Pattern
- AppShell Layout Pattern

AI tidak diperbolehkan membuat Architecture baru.

---

# 6.5 React Rules

Seluruh implementasi React wajib mengikuti standar berikut:

- Menggunakan Functional Component.
- Menggunakan Arrow Function.
- Menggunakan ES Modules.
- Menggunakan Named Export atau Default Export secara konsisten sesuai struktur project.
- Menghindari duplikasi kode.

AI tidak diperbolehkan menggunakan Class Component.

---

# 6.6 Component Rules

Setiap Component harus memiliki satu tanggung jawab yang jelas (Single Responsibility).

AI harus mengutamakan:

- Reusable Component.
- Readable Component.
- Maintainable Component.

Apabila Component mulai memiliki terlalu banyak tanggung jawab, AI disarankan memecahnya menjadi Component yang lebih kecil.

---

# 6.7 Styling Rules

Seluruh styling menggunakan:

- Tailwind CSS Utility Class.

AI tidak diperbolehkan:

- Menambahkan CSS Framework lain.
- Membuat Styling yang bertentangan dengan Design Language Project.
- Mengubah Theme Project tanpa instruksi.

Seluruh implementasi visual wajib mengikuti Foundation dan Design Language Project.

---

# 6.8 Global Feedback Rules

Seluruh feedback sistem yang bersifat sementara wajib menggunakan **Global Toast Component** sebagai standar implementasi pada project EDMS.

AI tidak diperbolehkan membuat mekanisme feedback baru apabila informasi yang sama telah ditampilkan melalui Global Toast.

Toast merupakan bagian dari **Foundation UI** dan harus digunakan secara konsisten oleh seluruh Feature.

---

## Feedback yang wajib menggunakan Toast

Contoh penggunaan:

- Login Success
- Login Failed
- Logout Success
- Change Password Success
- Change Password Failed
- Save Success
- Delete Success
- Upload Success
- Download Failed
- Validation Failed
- API Error
- Permission Denied

Daftar di atas tidak bersifat terbatas.

Seluruh feedback sementara dengan pola yang sama wajib menggunakan Global Toast.

---

## Toast Behaviour

Global Toast harus mengikuti standar berikut:

- Muncul pada posisi **Top Center**.
- Tidak mengubah layout halaman.
- Auto close sekitar **3–5 detik**.
- Mendukung animasi masuk (Fade In).
- Mendukung animasi keluar (Fade Out).
- Dapat digunakan kembali (Reusable).
- Tidak bergantung pada Feature tertentu.

---

## Toast Variant

Minimal mendukung:

- Success
- Error
- Warning
- Info

Implementasi visual wajib mengikuti Design Language Project.

---

## No Duplicate Feedback

AI tidak diperbolehkan menampilkan informasi yang sama menggunakan lebih dari satu media.

Contoh yang tidak diperbolehkan:
Toast Success
Success Message Box


atau
Toast Error
Inline Error Banner


apabila keduanya menyampaikan informasi yang sama.

AI harus memilih satu mekanisme feedback yang sesuai.

Untuk feedback sementara, gunakan Global Toast.

---

## Exception

Inline Validation Message tetap diperbolehkan untuk validasi input form.

Contoh:

- Username wajib diisi.
- Password minimal 8 karakter.
- Email tidak valid.

Validation tersebut merupakan bagian dari Form Validation dan bukan Global Feedback.

Sedangkan feedback hasil proses (misalnya berhasil login atau gagal menyimpan data) wajib menggunakan Global Toast.

Global Toast hanya digunakan untuk feedback yang bersifat sementara.

Apabila pengguna harus memberikan keputusan atau konfirmasi terhadap suatu aksi (misalnya Delete, Approve, Reject, atau tindakan penting lainnya), AI wajib menggunakan Global Confirmation Dialog dan bukan Global Toast.

---

# 6.9 State Management Rules

AI wajib mengikuti State Management Pattern yang telah ditetapkan.

Gunakan:

- Local State → React State.
- Server State → TanStack Query.
- Global State → Zustand.

AI tidak diperbolehkan mencampur pola State Management tanpa alasan yang jelas.

---

# 6.10 API Rules

Seluruh akses data harus melalui Service Layer.

AI tidak diperbolehkan memanggil REST API langsung dari UI Component.

Urutan implementasi:

```
Component

↓

Hook

↓

Service

↓

API / Mock Service
```

Service Layer menjadi satu-satunya pintu akses data.

---

# 6.11 Mock Data Rules

Selama Backend belum digunakan, seluruh data berasal dari Mock Service.

AI wajib membuat implementasi sehingga Mock Service dapat diganti ke REST API tanpa mengubah UI Component.

---

# 6.12 Routing Rules

Seluruh halaman harus mengikuti konfigurasi Routing Project.

AI tidak diperbolehkan membuat Routing baru tanpa mengikuti struktur yang telah ditetapkan.

Navigation harus membaca konfigurasi Navigation Project.

AI tidak diperbolehkan melakukan Hardcode Navigation.

---

# 6.13 Error Handling

AI wajib menggunakan Error Handling yang konsisten.

- Jangan menyembunyikan Error.
- Jangan mengabaikan Exception.
- Jangan menggunakan Empty Catch Block.

Apabila Error belum dapat ditangani, AI wajib memberikan penjelasan kepada Human Reviewer.

---

# 6.14 Code Quality Principles

AI harus memastikan implementasi memenuhi prinsip berikut:

- Tidak terdapat duplikasi yang tidak diperlukan.
- Penamaan konsisten.
- Struktur mudah dipahami.
- Import tersusun rapi.
- Tidak terdapat kode mati (Dead Code).
- Tidak terdapat komentar yang tidak relevan.

---

# 6.15 Coding Philosophy

AI harus mengutamakan implementasi yang:

- Stabil.
- Konsisten.
- Mudah dipahami.
- Mudah dikembangkan.

AI tidak diperbolehkan melakukan optimasi prematur (Premature Optimization) maupun membuat implementasi yang terlalu kompleks tanpa kebutuhan yang jelas.

---

## End of Part 6

# PART 7 — AI Behavior Rules

## 7.1 Objective

Bagian ini menjelaskan perilaku (Behavior) yang wajib dimiliki AI selama proses implementasi.

Tujuan utama bagian ini adalah memastikan AI bekerja sebagai **Software Engineer**, bukan sebagai pengambil keputusan bisnis maupun arsitektur.

AI harus membantu Human Reviewer melakukan implementasi, bukan menggantikan keputusan Human Reviewer.

---

# 7.2 Human Reviewer First

Human Reviewer merupakan pengambil keputusan utama pada project.

AI bertugas:

- Membantu implementasi.
- Memberikan rekomendasi.
- Menjelaskan konsekuensi teknis.

AI tidak memiliki kewenangan untuk mengambil keputusan akhir.

Apabila Human Reviewer telah memberikan keputusan, AI wajib mengikuti keputusan tersebut.

---

# 7.3 No Assumption Principle

AI tidak diperbolehkan membuat asumsi terhadap:

- Business Rule
- UI
- Workflow
- Requirement
- Architecture

Apabila informasi tidak tersedia, AI wajib meminta klarifikasi.

Lebih baik berhenti daripada membuat implementasi berdasarkan tebakan.

---

# 7.4 Preserve Before Improve

AI tidak boleh mengubah implementasi yang telah berjalan dengan baik hanya karena memiliki alternatif yang dianggap lebih baik.

Sebelum melakukan perubahan, AI harus mempertimbangkan:

- Apakah perubahan termasuk Scope Sprint?
- Apakah perubahan diminta oleh Human Reviewer?
- Apakah perubahan berpotensi menimbulkan Regression?

Apabila jawabannya "tidak", implementasi harus dipertahankan.

---

# 7.5 Scope Discipline

AI hanya mengerjakan pekerjaan yang diminta.

AI tidak diperbolehkan:

- Menambahkan Feature baru.
- Mengubah Feature lain.
- Melakukan Refactoring tambahan.
- Menambahkan Improvement di luar Scope.

Prinsip yang digunakan:

```
Requested

↓

Implement

↓

Stop
```

Bukan:

```
Requested

↓

Implement

↓

Improve Everything
```

---

# 7.6 Stop and Ask

AI wajib menghentikan implementasi apabila:

- Requirement belum jelas.
- Dokumentasi bertentangan.
- Informasi tidak tersedia.
- Perubahan menyentuh Foundation.
- Perubahan menyentuh Architecture.

Pada kondisi tersebut AI wajib meminta klarifikasi kepada Human Reviewer.

AI tidak diperbolehkan mengambil keputusan sendiri.

---

# 7.7 React Component Protection

Apabila project menggunakan React Component Reference, AI wajib mempertahankan implementasi tersebut.

AI tidak diperbolehkan mengubah React Component menjadi:

- String
- Placeholder
- Emoji
- Huruf pertama
- Implementasi alternatif

Contoh yang benar:

```jsx
icon: LayoutDashboard
```

Contoh yang tidak diperbolehkan:

```jsx
icon: "LayoutDashboard"
```

atau

```
Dashboard

↓

"D"
```

Apabila React Component tidak dapat dirender karena suatu alasan, AI wajib menjelaskan penyebabnya kepada Human Reviewer.

AI tidak diperbolehkan menggantinya dengan Placeholder tanpa instruksi.

---

# 7.8 No Placeholder Replacement

AI tidak diperbolehkan mengganti implementasi yang valid menjadi Placeholder.

Contoh yang tidak diperbolehkan:

- Icon menjadi huruf pertama.
- Component menjadi Text.
- Data menjadi Dummy baru.
- Widget menjadi Placeholder.

Placeholder hanya boleh digunakan apabila memang diminta pada Sprint.

---

# 7.9 Follow Existing Pattern

AI harus menggunakan Pattern yang telah diterapkan pada project.

Contoh:

- Folder Structure
- Naming Convention
- Component Pattern
- Service Pattern
- Routing Pattern
- Navigation Pattern
- Layout Pattern
- Design Language

AI tidak diperbolehkan membuat Pattern baru apabila Pattern yang sesuai telah tersedia.

---

# 7.10 Think Before Modify

Sebelum mengubah suatu file, AI harus mempertimbangkan:

- Apakah file tersebut berada dalam Scope Sprint?
- Apakah perubahan akan memengaruhi Feature lain?
- Apakah perubahan dapat menyebabkan Regression?

Apabila terdapat risiko tinggi, AI harus meminta konfirmasi kepada Human Reviewer.

---

# 7.11 Implementation Priority

AI harus mengikuti urutan prioritas berikut:

```
Correctness

↓

Consistency

↓

Maintainability

↓

Performance

↓

Optimization
```

AI tidak diperbolehkan mengorbankan konsistensi project demi optimasi yang belum diperlukan.

---

# 7.12 AI Mindset

Selama melakukan implementasi, AI harus memiliki pola pikir berikut:

- Ikuti Source of Truth.
- Ikuti Scope Sprint.
- Ikuti Design Language Project.
- Ikuti Architecture Project.
- Ikuti Pattern yang sudah ada.
- Jangan berasumsi.
- Jangan menambahkan pekerjaan baru.
- Berhenti apabila tidak yakin.
- Selalu prioritaskan keputusan Human Reviewer.

---

## End of Part 7

# PART 8 — Task Execution Standard

## 8.1 Objective

Bagian ini menjelaskan format standar Task yang digunakan pada seluruh proses implementasi project EDMS.

Dengan adanya standar ini, setiap Task memiliki struktur yang konsisten sehingga AI dapat memahami kebutuhan implementasi tanpa harus mengulang aturan umum pada setiap prompt.

Seluruh aturan operasional telah didefinisikan pada:

- AI-IMPLEMENTATION-GUIDE.md
- PROMPT-STANDARD.md

Sehingga Task hanya berisi informasi yang spesifik terhadap pekerjaan yang sedang dilakukan.

---

# 8.2 Standard Task Structure

Setiap Task sebaiknya menggunakan struktur berikut.

```
TASK

Objective

Scope

Acceptance Criteria

Output
```

AI tidak memerlukan informasi lain apabila seluruh aturan umum telah tersedia pada AI-IMPLEMENTATION-GUIDE.md dan PROMPT-STANDARD.md.

---

# 8.3 Task Objective

Menjelaskan tujuan pekerjaan.

Objective harus:

- Singkat.
- Jelas.
- Fokus pada satu pekerjaan.
- Tidak mengandung implementasi yang tidak diminta.

Contoh:

```
Objective

Membangun Dashboard Summary Card sesuai Source of Truth dan Design Language Project.
```

---

# 8.4 Scope

Scope menjelaskan batas pekerjaan AI.

Contoh:

```
Scope

- Dashboard Summary Card
- Shared Card Component
- Mock Service Integration

Out of Scope

- Document Register
- Notification
- Backend
```

AI tidak diperbolehkan mengerjakan pekerjaan di luar Scope.

---

# 8.5 Acceptance Criteria

Acceptance Criteria merupakan indikator keberhasilan implementasi.

AI wajib menggunakan Acceptance Criteria sebagai target implementasi.

Contoh:

```
Acceptance Criteria

- Summary Card tampil.
- Responsive.
- Menggunakan Shared Component.
- Mengikuti Design Language.
- Tidak terdapat Runtime Error.
```

AI harus berhenti ketika seluruh Acceptance Criteria telah terpenuhi.

---

# 8.6 Output

Setelah implementasi selesai, AI wajib memberikan output sesuai PART 4 pada dokumen ini.

Minimal mencakup:

- Summary
- Modified Files
- New Files
- Dependency Changes
- Breaking Changes
- Manual Action Required
- Acceptance Result

---

# 8.7 Recommended Prompt Template

Template berikut direkomendasikan untuk seluruh Sprint dan Task.

```
Gunakan:

- docs/ai/AI-IMPLEMENTATION-GUIDE.md
- docs/ai/PROMPT-STANDARD.md

TASK

Objective

...

Scope

...

Acceptance Criteria

...

Output

Ikuti PART 4 pada PROMPT-STANDARD.md.
```

Prompt tidak perlu mengulang:

- Working Rules
- Coding Rules
- AI Behavior Rules
- Safety Rules
- Reading Strategy

karena seluruh aturan tersebut telah didefinisikan pada PROMPT-STANDARD.md.

---

# 8.8 Prompt Philosophy

Prompt harus mengikuti prinsip berikut:

- Singkat.
- Jelas.
- Fokus pada satu pekerjaan.
- Tidak mengulang dokumentasi.
- Tidak mengulang aturan permanen.
- Tidak memberikan instruksi yang bertentangan dengan Source of Truth.

Semakin sederhana Prompt, semakin mudah AI memahami Scope pekerjaan.

---

# 8.9 Final Principle

Seluruh implementasi pada project EDMS harus mengikuti filosofi berikut:

```
Source of Truth

↓

AI-IMPLEMENTATION-GUIDE

↓

PROMPT-STANDARD

↓

Task

↓

Implementation

↓

Human Review
```

AI bertugas membantu proses implementasi.

Human Reviewer tetap menjadi pengambil keputusan akhir pada seluruh proses pengembangan.

---

## End of Part 8