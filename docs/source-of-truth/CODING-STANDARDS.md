# ==============================================================================
# CODING-STANDARDS.md
# PART 1 — DOCUMENT OVERVIEW
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Document Level** | Engineering Implementation Standard |
| **Document Status** | Draft |
| **Owner** | Frontend Architecture |
| **Purpose** | Mendefinisikan standar penulisan source code Engineering Document Management System (EDMS) agar implementasi memiliki kualitas, konsistensi, keterbacaan, dan maintainability yang tinggi. |
| **Depends On** | PRD.md, ENGINEERING-FOUNDATION.md, IMPLEMENTATION-PLAN.md, UI-GUIDELINES.md, COMPONENT-SPEC.md, FILE-STRUCTURE.md, ROUTING.md, STATE-MANAGEMENT.md, API-CONTRACT.md, ACCESS-CONTROL.md, FORM-SPEC.md, MOCK-DATA.md |
| **Design Reference** | Approved UI Design Mockup |
| **Behaviour Reference** | BUSINESS-WORKFLOW.md |
| **Primary Audience** | Frontend Developer, Backend Developer, Technical Lead, QA Engineer, AI Coding Agent |
| **Change Impact** | Very High |
| **Last Review** | Architecture Review |

---

# 1.1 Purpose

CODING-STANDARDS.md merupakan dokumen resmi yang mendefinisikan standar penulisan source code pada Engineering Document Management System (EDMS) Rebuild.

Dokumen ini menjadi pedoman implementasi agar seluruh source code memiliki struktur, gaya penulisan, pola implementasi, serta kualitas yang konsisten pada seluruh Product Module.

CODING-STANDARDS.md tidak mendefinisikan kebutuhan bisnis, Business Workflow, maupun spesifikasi produk baru.

Seluruh kebutuhan bisnis tetap mengacu pada PRD.md, sedangkan perilaku sistem mengacu pada BUSINESS-WORKFLOW.md sebagai **Behaviour Reference Only**.

---

# 1.2 Objectives

Dokumen ini bertujuan untuk:

- Menetapkan standar penulisan source code pada seluruh proyek EDMS.
- Menjaga konsistensi implementasi antar Product Module.
- Mengurangi variasi gaya penulisan kode.
- Mempermudah proses code review.
- Mempermudah proses debugging dan maintenance.
- Mendukung implementasi Feature First Architecture.
- Menjadi acuan implementasi bagi Frontend Developer, Backend Developer, dan AI Coding Agent.
- Menghasilkan source code yang mudah dibaca, mudah diuji, dan mudah dikembangkan.

---

# 1.3 Scope

CODING-STANDARDS.md mencakup standar implementasi untuk:

- Project Structure
- JavaScript Standards
- React Standards
- Component Standards
- State Management Standards
- Service Layer Standards
- API Integration Standards
- Form Standards
- Naming Convention
- Code Documentation
- Error Handling
- Development Workflow
- Code Quality Rules
- Engineering Best Practices
- Coding Acceptance Criteria

Dokumen ini tidak mencakup:

- Business Workflow
- Business Rules
- Functional Requirements
- Database Schema
- REST API Specification
- UI Design Detail
- Permission Definition

Seluruh topik tersebut dijelaskan pada dokumen Source of Truth yang sesuai.

---

# 1.4 Document Position

CODING-STANDARDS.md merupakan bagian dari **Engineering Implementation Documents**.

Dokumen ini menerjemahkan keputusan arsitektur, desain, dan spesifikasi teknis menjadi standar implementasi source code yang wajib diterapkan selama proses pengembangan.

Hubungan antar dokumen adalah sebagai berikut.

```text
BUSINESS-WORKFLOW.md
        │
        │ (Behaviour Reference Only)
        ▼
PRD.md
        │
        ▼
ENGINEERING-FOUNDATION.md
        │
        ▼
IMPLEMENTATION-PLAN.md
        │
        ├── UI-GUIDELINES.md
        ├── COMPONENT-SPEC.md
        ├── FILE-STRUCTURE.md
        ├── ROUTING.md
        ├── STATE-MANAGEMENT.md
        ├── API-CONTRACT.md
        ├── ACCESS-CONTROL.md
        ├── FORM-SPEC.md
        ├── MOCK-DATA.md
        │
        ▼
CODING-STANDARDS.md
        │
        ▼
Frontend & Backend Source Code
```

CODING-STANDARDS.md tidak menggantikan dokumen Source of Truth lainnya.

Dokumen ini hanya mendefinisikan bagaimana implementasi source code harus ditulis agar tetap konsisten dengan seluruh spesifikasi proyek.

---

# 1.5 Source Documents

Seluruh isi CODING-STANDARDS.md wajib mengacu pada dokumen berikut.

## Primary Source

- PRD.md
- ENGINEERING-FOUNDATION.md
- IMPLEMENTATION-PLAN.md
- UI-GUIDELINES.md
- COMPONENT-SPEC.md
- FILE-STRUCTURE.md
- ROUTING.md
- STATE-MANAGEMENT.md
- API-CONTRACT.md
- ACCESS-CONTROL.md
- FORM-SPEC.md
- MOCK-DATA.md
- Approved UI Design Mockup

## Behaviour Reference

- BUSINESS-WORKFLOW.md

Apabila terjadi perbedaan informasi, prioritas mengikuti Project Documentation Hierarchy yang telah ditetapkan.

BUSINESS-WORKFLOW.md hanya digunakan sebagai referensi perilaku proses bisnis dan tidak menjadi sumber aturan penulisan kode.

---

# 1.6 Coding Principles

Seluruh implementasi source code wajib mengikuti prinsip berikut.

- Single Source of Truth.
- Readability First.
- Consistency Over Personal Preference.
- Feature First Architecture.
- Separation of Concerns.
- Reusable Before Duplicate.
- Service Layer Only.
- Predictable Code Structure.
- Mock First Development.
- API Ready Architecture.
- Clean Code.
- Self-Documenting Code.
- Maintainability First.
- Simplicity Over Complexity.

---

# 1.7 Technology Reference

Seluruh implementasi source code wajib mengikuti ENGINEERING-FOUNDATION.md.

| Category | Standard |
|----------|----------|
| Frontend Framework | React + Vite |
| Language | JavaScript (JSX) |
| Styling | Tailwind CSS |
| Routing | React Router |
| HTTP Client | Axios |
| Server State | TanStack Query |
| Client State | Zustand |
| Form | React Hook Form |
| Validation | Zod |
| Icons | Lucide React |
| Backend | Node.js + Express.js |
| Database | MySQL |

Penggunaan framework, library, maupun pola implementasi di luar standar tersebut hanya diperbolehkan melalui Architecture Review dan Change Request.

---

# 1.8 Coding Philosophy

Source code dipandang sebagai representasi implementasi dari seluruh Engineering Documentation.

Seluruh keputusan implementasi harus diturunkan dari dokumen Source of Truth, bukan dari asumsi developer.

Setiap file source code harus:

- Memiliki tanggung jawab yang jelas.
- Mudah dipahami tanpa dokumentasi tambahan.
- Mengikuti struktur proyek yang telah ditetapkan.
- Menghindari duplikasi logika.
- Mudah diuji.
- Mudah dipelihara.
- Mudah dikembangkan.

Implementasi harus mengutamakan keterbacaan dibandingkan kompleksitas yang tidak diperlukan.

---

# 1.9 Expected Outcome

Setelah CODING-STANDARDS.md diterapkan, seluruh implementasi EDMS diharapkan:

- Menggunakan standar penulisan kode yang seragam.
- Memiliki struktur proyek yang konsisten.
- Menghasilkan React Component yang modular dan reusable.
- Menggunakan Service Layer sebagai satu-satunya jalur komunikasi data.
- Menggunakan State Management sesuai arsitektur proyek.
- Mengikuti UI Guidelines dan Approved UI Design Mockup.
- Mudah dipelihara, diuji, dan dikembangkan.
- Dapat dihasilkan secara konsisten oleh Developer maupun AI Coding Agent.

# ==============================================================================
# END OF PART 1
# ==============================================================================

# ==============================================================================
# CODING-STANDARDS.md
# PART 2 — CODING PHILOSOPHY
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan filosofi dasar yang menjadi landasan seluruh implementasi source code Engineering Document Management System (EDMS). |
| **Depends On** | ENGINEERING-FOUNDATION.md, IMPLEMENTATION-PLAN.md, FILE-STRUCTURE.md, STATE-MANAGEMENT.md |
| **Primary Audience** | Frontend Developer, Backend Developer, Technical Lead, QA Engineer, AI Coding Agent |

---

# 2.1 Overview

Coding Philosophy merupakan fondasi utama yang mengarahkan bagaimana source code Engineering Document Management System (EDMS) harus ditulis, diorganisasikan, dan dipelihara.

Bagian ini tidak menjelaskan implementasi teknis secara rinci, melainkan menetapkan prinsip-prinsip yang wajib diikuti pada seluruh Product Module agar implementasi tetap konsisten terhadap arsitektur proyek dan mudah dikembangkan dalam jangka panjang.

Seluruh implementasi harus mengikuti keputusan yang telah ditetapkan pada ENGINEERING-FOUNDATION.md, IMPLEMENTATION-PLAN.md, FILE-STRUCTURE.md, STATE-MANAGEMENT.md, serta dokumen Source of Truth lainnya.

---

# 2.2 Coding Philosophy

EDMS Rebuild menggunakan pendekatan **Feature First Engineering** dengan prinsip **Clean Architecture Implementation**.

Setiap source code harus memiliki tanggung jawab yang jelas, mudah dipahami, mudah diuji, serta mudah dipelihara.

Seluruh implementasi harus mengikuti alur berikut.

```text
Business Requirement

↓

PRD

↓

Engineering Documents

↓

Source Code

↓

Running Application
```

Source code merupakan hasil implementasi dari dokumen engineering.

Source code bukan tempat untuk menentukan kebutuhan bisnis maupun membuat keputusan arsitektur baru.

---

# 2.3 Engineering Principles

Seluruh implementasi wajib mengikuti prinsip berikut.

### CSP-001 — Source of Truth First

Seluruh implementasi harus mengacu pada dokumen Source of Truth.

Developer maupun AI Coding Agent tidak diperbolehkan menambahkan perilaku sistem berdasarkan asumsi pribadi.

---

### CSP-002 — Readability First

Kode harus mudah dibaca oleh manusia.

Implementasi yang sederhana lebih diprioritaskan dibanding implementasi yang rumit tetapi sulit dipahami.

---

### CSP-003 — Consistency Over Preference

Seluruh Product Module harus menggunakan gaya penulisan yang sama.

Preferensi pribadi developer tidak boleh mengubah standar proyek.

---

### CSP-004 — Separation of Concerns

Setiap file hanya memiliki satu tanggung jawab.

Sebagai contoh:

- Component hanya bertanggung jawab terhadap UI.
- Service hanya bertanggung jawab terhadap komunikasi data.
- Store hanya bertanggung jawab terhadap State.
- Hook hanya bertanggung jawab terhadap reusable logic.

---

### CSP-005 — Feature First

Organisasi source code mengikuti Product Module.

Seluruh implementasi baru harus ditempatkan pada Feature yang sesuai.

---

### CSP-006 — Reusable Before Duplicate

Apabila suatu implementasi dapat digunakan oleh lebih dari satu Product Module, implementasi tersebut harus dibuat reusable.

Duplikasi source code harus dihindari.

---

### CSP-007 — Service Layer Only

Seluruh komunikasi menuju Mock Data maupun REST API wajib melalui Service Layer.

Component tidak diperbolehkan melakukan komunikasi data secara langsung.

---

### CSP-008 — Predictable Structure

Seluruh Feature harus memiliki struktur yang seragam sehingga developer dapat memahami lokasi implementasi tanpa melakukan pencarian yang panjang.

---

### CSP-009 — Minimal Complexity

Implementasi harus menghindari kompleksitas yang tidak memberikan manfaat nyata.

Pendekatan yang lebih sederhana diprioritaskan selama tetap memenuhi kebutuhan sistem.

---

### CSP-010 — API Ready

Seluruh implementasi Frontend harus siap dihubungkan dengan REST API tanpa perubahan struktur arsitektur.

Pergantian Mock JSON menjadi REST API hanya terjadi pada Service Layer.

---

# 2.4 Source Code Philosophy

Seluruh source code dipandang sebagai kumpulan implementasi modular yang saling bekerja sama membentuk aplikasi.

Setiap file memiliki fungsi yang spesifik.

```text
Pages

↓

Components

↓

Hooks

↓

Services

↓

REST API
```

Implementasi harus menjaga batas tanggung jawab antar layer.

Perubahan pada satu layer tidak boleh memaksa perubahan pada seluruh aplikasi.

---

# 2.5 Development Philosophy

Pengembangan EDMS mengikuti pendekatan bertahap sesuai IMPLEMENTATION-PLAN.md.

Seluruh proses implementasi mengikuti urutan berikut.

```text
Requirement

↓

Architecture

↓

Implementation

↓

Self Testing

↓

Review

↓

Bug Fix

↓

Approved
```

Setiap Feature harus dinyatakan stabil sebelum melanjutkan ke Feature berikutnya.

---

# 2.6 Data Flow Philosophy

Seluruh data mengikuti alur yang konsisten.

Runtime data flow resmi frontend:

```text
Mock JSON
↓
Service Layer
↓
TanStack Query
↓
Store (jika diperlukan)
↓
Page
↓
Component
```

UI Component tidak boleh mengakses Mock JSON atau REST API secara langsung. Service Layer menjadi satu-satunya data access layer frontend.

Historical Reference: diagram lama yang menempatkan React Component langsung sebelum Service Layer hanya berlaku sebagai catatan histori dan bukan data flow runtime aktif.

```text
User

↓

React Component

↓

Service Layer

↓

Mock JSON / REST API

↓

Service Response

↓

State Update

↓

UI Refresh
```

Data tidak boleh berpindah melalui jalur lain di luar arsitektur yang telah ditentukan.

---

# 2.7 Dependency Philosophy

Hubungan antar layer mengikuti arah berikut.

```text
Page

↓

Feature Component

↓

Shared Component

↓

Hook

↓

Service

↓

API
```

Aturan dependency wajib dipatuhi.

Contoh yang diperbolehkan.

```text
Dashboard Page

↓

Dashboard Service

↓

REST API
```

Contoh yang tidak diperbolehkan.

```text
Dashboard Page

↓

Axios

↓

REST API
```

Component tidak diperbolehkan mengakses Axios secara langsung.

---

# 2.8 General Rules

Seluruh implementasi source code wajib memenuhi ketentuan berikut.

- Mengikuti ENGINEERING-FOUNDATION.md.
- Mengikuti IMPLEMENTATION-PLAN.md.
- Mengikuti FILE-STRUCTURE.md.
- Mengikuti ROUTING.md.
- Mengikuti STATE-MANAGEMENT.md.
- Mengikuti API-CONTRACT.md.
- Mengikuti ACCESS-CONTROL.md.
- Mengikuti FORM-SPEC.md.
- Mengikuti MOCK-DATA.md.
- Mengikuti Approved UI Design Mockup.
- Tidak menambahkan Business Rule baru.
- Tidak mengubah Business Workflow.
- Tidak membuat arsitektur baru di luar standar proyek.

---

# 2.9 Anti Patterns

Implementasi berikut tidak diperbolehkan.

- Direct API Call dari React Component.
- Business Logic di dalam UI Component.
- Duplikasi Service.
- Duplikasi Validation.
- Duplikasi Utility.
- Hardcoded Permission.
- Hardcoded Role.
- Hardcoded API Endpoint di Component.
- Cross Feature Dependency tanpa Shared Layer.
- Circular Dependency.
- God Component.
- God Service.
- God Store.
- Magic Number tanpa konstanta.
- Inline Business Rule.
- Inline Complex Function pada JSX.
- Anonymous Function yang berlebihan pada proses rendering.
- Source code yang bertentangan dengan dokumen Source of Truth.

---

# 2.10 Best Practices

Seluruh implementasi disarankan mengikuti praktik berikut.

- Gunakan nama file yang deskriptif.
- Gunakan nama function yang menjelaskan tujuan.
- Gunakan component kecil dan reusable.
- Pisahkan UI dan logic.
- Hindari nested code yang berlebihan.
- Gunakan early return apabila meningkatkan keterbacaan.
- Gunakan konstanta untuk nilai yang digunakan berulang.
- Gunakan helper atau utility untuk logika umum.
- Tulis kode yang mudah dipahami tanpa memerlukan komentar panjang.
- Jaga konsistensi struktur antar Feature.

---

# 2.11 Acceptance Criteria

Coding Philosophy dinyatakan memenuhi standar apabila:

- Seluruh implementasi mengikuti Source of Truth proyek.
- Struktur implementasi konsisten pada seluruh Product Module.
- Dependency mengikuti arsitektur yang telah ditetapkan.
- Tidak terdapat Business Logic pada UI Component.
- Seluruh komunikasi data menggunakan Service Layer.
- Tidak terdapat duplikasi implementasi yang tidak diperlukan.
- Struktur proyek mudah dipahami oleh Developer maupun AI Coding Agent.
- Implementasi siap dikembangkan tanpa mengubah arsitektur utama.

# ==============================================================================
# END OF PART 2
# ==============================================================================

# ==============================================================================
# CODING-STANDARDS.md
# PART 3 — PROJECT STRUCTURE STANDARDS
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan standar organisasi struktur project, folder, file, dependency, dan module agar seluruh implementasi Engineering Document Management System (EDMS) memiliki struktur source code yang konsisten, scalable, dan mudah dipelihara. |
| **Depends On** | ENGINEERING-FOUNDATION.md, FILE-STRUCTURE.md, IMPLEMENTATION-PLAN.md, ROUTING.md |
| **Primary Audience** | Frontend Developer, Backend Developer, Technical Lead, QA Engineer, AI Coding Agent |

---

# 3.1 Overview

Project Structure Standards mendefinisikan bagaimana seluruh source code harus diorganisasikan di dalam repository EDMS.

Standar ini memastikan seluruh Product Module memiliki struktur yang seragam sehingga memudahkan proses development, maintenance, debugging, onboarding developer baru, maupun implementasi oleh AI Coding Agent.

Seluruh struktur project wajib mengikuti FILE-STRUCTURE.md.

---

# 3.2 Structure Philosophy

EDMS menggunakan pendekatan **Monorepo** dengan **Feature First Architecture**.

Seluruh implementasi Frontend dan Backend berada di dalam satu repository, tetapi dipisahkan secara jelas agar masing-masing dapat berkembang secara independen.

Struktur project harus memenuhi prinsip berikut.

- Modular
- Feature First
- Scalable
- Predictable
- Easy Navigation
- Easy Maintenance
- API Ready
- Backend Ready

---

# 3.3 Project Structure

Struktur project mengikuti standar berikut.

```text
edms-rebuild/

│

├── apps/
│
│   ├── frontend/
│   │
│   └── backend/
│
├── database/
│
├── docs/
│
├── scripts/
│
├── .github/
│
├── .vscode/
│
├── package.json
│
├── README.md
│
└── LICENSE
```

Developer tidak diperbolehkan menambahkan root folder baru tanpa melalui Architecture Review.

---

# 3.4 Frontend Structure

Frontend mengikuti runtime folder boundary pada FILE-STRUCTURE.md.

Runtime folder boundary resmi:

```text
src/
├── app/
│   ├── routes/
│   ├── navigation/
│   └── layouts/
├── modules/
│   ├── dashboard/
│   ├── document-register/
│   ├── upload-revision/
│   ├── approval/
│   ├── archive/
│   └── administration/
└── shared/
    ├── services/
    ├── hooks/
    ├── stores/
    ├── constants/
    ├── utils/
    └── mocks/
```

Historical Reference: struktur root `components/`, `pages/`, dan `features/` pada diagram lama di bawah adalah struktur generik lama dan bukan runtime folder architecture aktif.

```text
src/

├── app/

├── assets/

├── components/
│
│   ├── common/
│   ├── layout/
│   ├── dashboard/
│   ├── document-register/
│   ├── notification/
│   └── shared/

├── features/
│
│   ├── dashboard/
│   ├── document-register/
│   ├── sla/
│   ├── escalation/
│   ├── audit-trail/
│   └── administration/

├── hooks/

├── layouts/

├── mocks/

├── pages/

├── routes/

├── services/

├── stores/

├── styles/

├── utils/

└── constants/
```

Seluruh implementasi baru harus ditempatkan pada boundary `app/`, `modules/`, atau `shared/` yang sesuai.

---

# 3.5 Backend Structure

Backend mengikuti pendekatan modular berdasarkan domain.

```text
backend/

├── src/

│   ├── config/

│   ├── middleware/

│   ├── modules/

│   │   ├── auth/
│   │   ├── documents/
│   │   ├── dashboard/
│   │   ├── notifications/
│   │   ├── sla/
│   │   ├── escalation/
│   │   ├── audit/
│   │   └── administration/

│   ├── routes/

│   ├── services/

│   ├── repositories/

│   ├── utils/

│   └── app.js
```

Setiap module Backend bertanggung jawab terhadap satu domain bisnis.

---

# 3.6 Folder Responsibility

Setiap folder memiliki tanggung jawab yang jelas.

| Folder | Responsibility |
|----------|----------------|
| components | Reusable UI Component |
| features | Product Module |
| hooks | Reusable Custom Hooks |
| layouts | Global Layout |
| mocks | Mock JSON & Fake API |
| pages | Route Level Component |
| routes | React Router |
| services | API Communication |
| stores | Zustand Store |
| utils | Utility Function |
| constants | Constant Value |

Folder tidak boleh digunakan untuk tujuan di luar tanggung jawabnya.

---

# 3.7 Dependency Rules

Hubungan antar folder mengikuti aturan berikut.

```text
Page

↓

Feature

↓

Component

↓

Hook

↓

Store

↓

Service

↓

API
```

Dependency hanya boleh bergerak ke bawah.

Dependency yang berlawanan arah tidak diperbolehkan.

---

# 3.8 Import Rules

Aturan import wajib mengikuti struktur project.

### STRUCT-001

Gunakan import relatif hanya pada folder yang berdekatan.

---

### STRUCT-002

Gunakan alias path untuk import lintas Feature.

---

### STRUCT-003

Tidak diperbolehkan melakukan import yang memutar (Circular Import).

---

### STRUCT-004

Feature tidak boleh mengakses implementasi internal Feature lain.

Interaksi antar Feature dilakukan melalui Shared Layer atau Service.

---

### STRUCT-005

Page tidak diperbolehkan mengakses Mock Data maupun REST API secara langsung.

---

### STRUCT-006

Seluruh komunikasi data harus melalui Service Layer.

---

# 3.9 Module Isolation

Setiap Feature harus bersifat independen.

Sebagai contoh.

```text
Dashboard

↓

Dashboard Component

↓

Dashboard Service

↓

Dashboard Store
```

Feature Dashboard tidak boleh mengetahui implementasi internal Feature SLA maupun Escalation.

Apabila terdapat kebutuhan bersama, implementasi harus dipindahkan ke Shared Layer.

---

# 3.10 Shared Layer Rules

Shared Layer digunakan untuk implementasi yang digunakan oleh lebih dari satu Feature.

Contoh.

- Button
- Card
- Modal
- Badge
- Table
- Loading
- Empty State
- Utility
- Formatter
- Validation Helper

Shared Layer tidak boleh berisi Business Logic milik Feature tertentu.

---

# 3.11 Project Structure Best Practices

Seluruh implementasi disarankan mengikuti praktik berikut.

- Satu folder memiliki satu tanggung jawab.
- Hindari folder dengan isi yang terlalu banyak.
- Gunakan struktur yang konsisten pada seluruh Feature.
- Hindari nested folder yang tidak diperlukan.
- Pisahkan Shared Resource dari Feature Resource.
- Gunakan Feature Folder sebagai batas implementasi.

---

# 3.12 Acceptance Criteria

Project Structure Standards dinyatakan memenuhi standar apabila.

- Seluruh struktur project mengikuti FILE-STRUCTURE.md.
- Seluruh Product Module menggunakan Feature First Architecture.
- Tidak terdapat Circular Dependency.
- Seluruh komunikasi data melalui Service Layer.
- Shared Component digunakan untuk implementasi lintas Feature.
- Folder memiliki tanggung jawab yang jelas.
- Struktur project mudah dipahami oleh Developer maupun AI Coding Agent.
- Struktur siap mendukung pengembangan Frontend dan Backend secara paralel.

# ==============================================================================
# END OF PART 3
# ==============================================================================

# ==============================================================================
# CODING-STANDARDS.md
# PART 4 — JAVASCRIPT & REACT STANDARDS
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan standar implementasi JavaScript dan React yang digunakan pada Engineering Document Management System (EDMS). |
| **Depends On** | ENGINEERING-FOUNDATION.md, COMPONENT-SPEC.md, STATE-MANAGEMENT.md |
| **Primary Audience** | Frontend Developer, Technical Lead, AI Coding Agent |

---

# 4.1 Overview

Seluruh implementasi Frontend EDMS menggunakan **React + JavaScript (JSX)**.

Bagian ini mendefinisikan standar penulisan JavaScript dan React agar seluruh Product Module memiliki gaya implementasi yang konsisten, mudah dibaca, mudah diuji, dan mudah dipelihara.

---

# 4.2 JavaScript Standard

Seluruh source code Frontend menggunakan:

- ECMAScript Modern (ES Modules)
- JavaScript (JSX)
- Functional Programming
- Arrow Function
- Named Export (kecuali Entry Point)
- Async/Await
- Destructuring
- Optional Chaining
- Nullish Coalescing

Implementasi harus menghindari sintaks JavaScript lama apabila tersedia alternatif yang lebih modern.

---

# 4.3 React Standard

Seluruh implementasi React wajib mengikuti standar berikut.

- Functional Component
- React Hooks
- Composition Pattern
- Custom Hook
- Controlled Component
- Declarative Rendering

Tidak diperbolehkan menggunakan Class Component.

---

# 4.4 Component Declaration

Seluruh Component menggunakan Arrow Function.

### Good

```jsx
const DashboardCard = () => {
    return (
        <Card />
    );
};

export default DashboardCard;
```

### Bad

```jsx
function DashboardCard() {
    return (
        <Card />
    );
}
```

---

# 4.5 Props Standard

Gunakan Destructuring pada parameter.

### Good

```jsx
const StatusBadge = ({ status }) => {
    return (
        <Badge />
    );
};
```

### Bad

```jsx
const StatusBadge = (props) => {
    return (
        <Badge status={props.status} />
    );
};
```

---

# 4.6 State Standard

Gunakan React State hanya untuk Local State.

Contoh.

- Modal
- Dropdown
- Search Input
- Selected Tab
- Toggle

Data Server tidak boleh disimpan menggunakan useState.

---

# 4.7 Hooks Standard

React Hooks hanya dipanggil.

- Pada level atas Component.
- Pada Custom Hook.

Tidak diperbolehkan memanggil Hook di dalam.

- Loop
- Condition
- Nested Function

---

# 4.8 JSX Standard

JSX harus sederhana.

Hindari logika kompleks.

### Good

```jsx
const isApproved = status === "Approved";

return (
    <StatusBadge status={status} />
);
```

### Bad

```jsx
return (
    status === "Approved"
        ? ...
        : ...
);
```

untuk logika yang panjang.

---

# 4.9 Event Handler Standard

Gunakan Function yang memiliki nama.

### Good

```jsx
const handleSubmit = () => {};
```

```jsx
<Button onClick={handleSubmit} />
```

### Bad

```jsx
<Button
    onClick={() => {
        ...
    }}
/>
```

untuk implementasi yang kompleks.

---

# 4.10 JavaScript Rules

### JS-001

Gunakan const secara default.

---

### JS-002

Gunakan let hanya apabila nilai berubah.

---

### JS-003

Jangan gunakan var.

---

### JS-004

Gunakan Template Literal.

---

### JS-005

Gunakan Strict Equality (`===`).

---

### JS-006

Gunakan Optional Chaining apabila diperlukan.

---

### JS-007

Gunakan Early Return.

---

### JS-008

Gunakan Destructuring.

---

### JS-009

Gunakan Async/Await.

---

### JS-010

Hindari Nested Condition yang panjang.

---

# 4.11 React Rules

### REACT-001

Gunakan Functional Component.

---

### REACT-002

Gunakan Arrow Function.

---

### REACT-003

Satu Component untuk satu tanggung jawab.

---

### REACT-004

Pisahkan Business Logic dari UI.

---

### REACT-005

Gunakan Custom Hook untuk logic yang digunakan berulang.

---

### REACT-006

Jangan melakukan API Call langsung di Component.

---

### REACT-007

Gunakan Service Layer.

---

### REACT-008

Gunakan TanStack Query untuk Server State.

---

### REACT-009

Gunakan Zustand hanya untuk Global State.

---

### REACT-010

Gunakan React Hook Form untuk seluruh Form.

---

# 4.12 Best Practices

- Component maksimal fokus pada satu tujuan.
- Hindari file yang terlalu panjang.
- Hindari nested JSX berlebihan.
- Gunakan helper apabila diperlukan.
- Gunakan constant daripada magic value.
- Pisahkan reusable logic menjadi Custom Hook.

---

# 4.13 Acceptance Criteria

JavaScript & React Standards dinyatakan memenuhi standar apabila.

- Seluruh Component menggunakan Functional Component.
- Seluruh Function menggunakan Arrow Function.
- Tidak terdapat Class Component.
- Tidak terdapat API Call langsung pada Component.
- JSX tetap sederhana.
- React Hook digunakan sesuai aturan.
- Seluruh implementasi mengikuti ENGINEERING-FOUNDATION.md.

# ==============================================================================
# END OF PART 4
# ==============================================================================

# ==============================================================================
# CODING-STANDARDS.md
# PART 5 — COMPONENT STANDARDS
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan standar implementasi React Component pada Engineering Document Management System (EDMS). |
| **Depends On** | COMPONENT-SPEC.md, UI-GUIDELINES.md, FILE-STRUCTURE.md |
| **Primary Audience** | Frontend Developer, Technical Lead, QA Engineer, AI Coding Agent |

---

# 5.1 Overview

Component merupakan unit utama penyusun antarmuka pengguna.

Seluruh Component harus mengikuti COMPONENT-SPEC.md dan UI-GUIDELINES.md sehingga memiliki perilaku, struktur, dan tampilan yang konsisten.

---

# 5.2 Component Philosophy

Setiap Component harus.

- Reusable
- Independent
- Predictable
- Easy Testing
- Easy Maintenance

Component hanya bertanggung jawab terhadap presentasi dan interaksi pengguna.

Business Logic ditempatkan pada Hook atau Service.

---

# 5.3 Component Classification

Component dibagi menjadi beberapa kategori.

| Category | Purpose |
|----------|---------|
| Layout Component | Layout aplikasi |
| Feature Component | Component milik Feature |
| Shared Component | Component lintas Feature |
| Form Component | Input & Form |
| Display Component | Table, Card, Badge |
| Feedback Component | Alert, Modal, Toast |

---

# 5.4 Component Structure

Struktur dasar Component.

```text
Component

↓

Import

↓

Constant

↓

Hooks

↓

Event Handler

↓

Return JSX

↓

Export
```

Urutan tersebut harus dipertahankan pada seluruh Component.

---

# 5.5 Component Responsibility

Component hanya boleh.

- Menampilkan UI.
- Mengelola Local State sederhana.
- Memanggil Hook.
- Memanggil Event Handler.
- Menerima Props.

Component tidak boleh.

- Mengakses REST API.
- Mengakses Mock JSON.
- Mengandung Business Rule.
- Mengandung Query Logic.

---

# 5.6 Props Standard

Props harus.

- Jelas.
- Minimal.
- Deskriptif.
- Tidak redundan.

Gunakan Destructuring.

```jsx
const Card = ({ title, value }) => {}
```

---

# 5.7 Component Naming

Nama Component menggunakan PascalCase.

Contoh.

```text
DashboardCard

DocumentTable

StatusBadge

NotificationPanel

ApprovalDialog
```

Nama harus merepresentasikan fungsi Component.

---

# 5.8 File Naming

Nama file mengikuti nama Component.

```text
DashboardCard.jsx

DocumentTable.jsx

StatusBadge.jsx
```

Satu file hanya berisi satu Component utama.

---

# 5.9 Component Rules

### COMP-001

Satu Component memiliki satu tanggung jawab.

---

### COMP-002

Component harus reusable apabila memungkinkan.

---

### COMP-003

Business Logic tidak berada di Component.

---

### COMP-004

Gunakan Props untuk komunikasi Parent → Child.

---

### COMP-005

Gunakan Callback untuk komunikasi Child → Parent.

---

### COMP-006

Jangan melakukan API Call di Component.

---

### COMP-007

Jangan mengakses Store yang tidak diperlukan.

---

### COMP-008

Gunakan Shared Component apabila digunakan oleh lebih dari satu Feature.

---

### COMP-009

Ikuti UI-GUIDELINES.md.

---

### COMP-010

Ikuti COMPONENT-SPEC.md.

---

# 5.10 Component Best Practices

- Component kecil lebih baik daripada Component besar.
- Gunakan Composition daripada duplikasi.
- Hindari Props yang terlalu banyak.
- Pisahkan logic menjadi Custom Hook.
- Gunakan memoisasi apabila benar-benar diperlukan.
- Hindari optimasi prematur.

---

# 5.11 Anti Patterns

Implementasi berikut tidak diperbolehkan.

- God Component.
- Component lebih dari satu tanggung jawab.
- Inline Business Logic.
- API Call di JSX.
- Nested Component yang terlalu dalam.
- Hardcoded Data.
- Hardcoded Permission.
- Hardcoded Role.

---

# 5.12 Acceptance Criteria

Component Standards dinyatakan memenuhi standar apabila.

- Seluruh Component mengikuti COMPONENT-SPEC.md.
- Seluruh tampilan mengikuti UI-GUIDELINES.md.
- Satu Component memiliki satu tanggung jawab.
- Tidak terdapat Business Logic di Component.
- Tidak terdapat API Call langsung.
- Seluruh Component mudah digunakan ulang.
- Struktur Component konsisten pada seluruh Product Module.

# ==============================================================================
# END OF PART 5
# ==============================================================================

# ==============================================================================
# CODING-STANDARDS.md
# PART 6 — STATE & SERVICE STANDARDS
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan standar implementasi State Management dan Service Layer pada Engineering Document Management System (EDMS). |
| **Depends On** | STATE-MANAGEMENT.md, API-CONTRACT.md, MOCK-DATA.md, ENGINEERING-FOUNDATION.md |
| **Primary Audience** | Frontend Developer, Technical Lead, QA Engineer, AI Coding Agent |

---

# 6.1 Overview

State Management dan Service Layer merupakan fondasi utama komunikasi data pada Frontend EDMS.

Seluruh implementasi wajib mengikuti arsitektur yang telah ditetapkan sehingga data mengalir secara konsisten dari Service Layer menuju UI melalui State Management.

Component tidak diperbolehkan mengakses Mock Data maupun REST API secara langsung.

---

# 6.2 State Philosophy

State dibagi menjadi tiga kategori.

| State | Technology |
|---------|------------|
| Local State | React useState |
| Global State | Zustand |
| Server State | TanStack Query |

Setiap kategori memiliki tanggung jawab yang berbeda.

---

# 6.3 State Responsibility

### Local State

Digunakan untuk UI sementara.

Contoh.

- Modal
- Dropdown
- Selected Tab
- Search Keyword
- Form Step

---

### Global State

Digunakan untuk data lintas halaman.

Contoh.

- Logged User
- Sidebar
- Theme
- Authentication
- Notification Counter

---

### Server State

Digunakan untuk seluruh data yang berasal dari Backend.

Contoh.

- Dashboard
- Documents
- Notifications
- SLA
- Escalation
- Audit Trail

---

# 6.4 Service Layer Philosophy

Service Layer merupakan satu-satunya pintu komunikasi data.

```text
Component

↓

TanStack Query

↓

Service Layer

↓

Mock API / REST API
```

Component tidak boleh mengetahui implementasi API.

---

# 6.5 Service Responsibility

Service bertanggung jawab untuk.

- Request Data
- Response Mapping
- Error Mapping
- Query Parameter
- Pagination
- Filtering
- Sorting

Service tidak boleh.

- Mengandung UI Logic.
- Mengandung JSX.
- Mengandung Business Rule.

---

# 6.6 Store Organization

Store dipisahkan berdasarkan domain.

Contoh.

```text
stores/

auth.store.js

layout.store.js

notification.store.js

dashboard.store.js
```

Satu Store hanya menangani satu domain.

---

# 6.7 Service Organization

Service dipisahkan berdasarkan Feature.

```text
services/

dashboard.service.js

document.service.js

notification.service.js

sla.service.js

audit.service.js
```

Setiap Service hanya menangani satu Feature.

---

# 6.8 State Rules

### STATE-001

Local UI menggunakan useState.

---

### STATE-002

Global State menggunakan Zustand.

---

### STATE-003

Server State menggunakan TanStack Query.

---

### STATE-004

Server State tidak disimpan di Zustand.

---

### STATE-005

Query menggunakan Service Layer.

---

### STATE-006

Store tidak melakukan API Call.

---

### STATE-007

Service tidak menyimpan State.

---

### STATE-008

Component tidak mengakses Mock JSON.

---

### STATE-009

Seluruh Response mengikuti API-CONTRACT.md.

---

### STATE-010

Gunakan Mock API selama Frontend Development.

---

# 6.9 Best Practices

- Pisahkan State berdasarkan tanggung jawab.
- Gunakan Query Key yang konsisten.
- Gunakan Custom Hook untuk Query.
- Gunakan Service Layer sebagai abstraksi.
- Hindari Global State yang tidak diperlukan.
- Hindari penyimpanan data duplikat.

---

# 6.10 Anti Patterns

Tidak diperbolehkan.

- API Call pada Component.
- Fetch menggunakan useEffect.
- Menyimpan Server State di Zustand.
- Mengakses JSON langsung.
- Store saling bergantung.
- Service memanggil Service lain tanpa alasan yang jelas.
- Business Logic di Store.

---

# 6.11 Acceptance Criteria

State & Service Standards dinyatakan memenuhi standar apabila.

- Seluruh komunikasi data melalui Service Layer.
- Seluruh Server State menggunakan TanStack Query.
- Seluruh Global State menggunakan Zustand.
- Seluruh Local State menggunakan React State.
- Component tidak mengakses API secara langsung.
- Store memiliki tanggung jawab yang jelas.
- Struktur Service mengikuti Feature Architecture.

# ==============================================================================
# END OF PART 6
# ==============================================================================

# ==============================================================================
# CODING-STANDARDS.md
# PART 7 — API & FORM STANDARDS
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan standar implementasi komunikasi API dan pengelolaan Form pada Engineering Document Management System (EDMS). |
| **Depends On** | API-CONTRACT.md, FORM-SPEC.md, ACCESS-CONTROL.md, MOCK-DATA.md |
| **Primary Audience** | Frontend Developer, Backend Developer, QA Engineer, AI Coding Agent |

---

# 7.1 Overview

Seluruh komunikasi API dan implementasi Form wajib mengikuti kontrak yang telah ditetapkan pada API-CONTRACT.md dan FORM-SPEC.md.

Implementasi harus bersifat konsisten sehingga migrasi dari Mock API menuju REST API dapat dilakukan tanpa perubahan pada Component.

---

# 7.2 API Philosophy

Komunikasi data mengikuti pola berikut.

```text
Component

↓

Custom Hook

↓

TanStack Query

↓

Service Layer

↓

REST API / Mock API
```

Component tidak mengetahui detail implementasi endpoint.

---

# 7.3 API Standards

Seluruh Request harus.

- Menggunakan Axios.
- Melalui Service Layer.
- Mengikuti API Contract.
- Menggunakan Async/Await.
- Menggunakan Error Handling yang konsisten.

---

# 7.4 Response Standards

Seluruh Response mengikuti struktur berikut.

```json
{
  "success": true,
  "message": "",
  "data": {}
}
```

Response tidak boleh dimodifikasi di Component.

Mapping dilakukan di Service Layer apabila diperlukan.

---

# 7.5 Form Philosophy

Seluruh Form menggunakan.

- React Hook Form
- Zod Validation

Form harus.

- Predictable
- Reusable
- Easy Validation
- Easy Testing

---

# 7.6 Form Standards

Seluruh Form mengikuti aturan berikut.

- Controlled Form.
- Validasi menggunakan Zod.
- Default Value ditentukan pada Form.
- Submit melalui Handler.
- Reset menggunakan API React Hook Form.

---

# 7.7 Validation Rules

Validasi dibagi menjadi dua.

| Validation | Responsibility |
|------------|----------------|
| Client Validation | React Hook Form + Zod |
| Server Validation | REST API |

Kedua validasi harus saling melengkapi.

---

# 7.8 API & Form Rules

### APIFORM-001

Gunakan Axios melalui Service Layer.

---

### APIFORM-002

Jangan memanggil Endpoint dari Component.

---

### APIFORM-003

Gunakan React Hook Form.

---

### APIFORM-004

Gunakan Zod.

---

### APIFORM-005

Ikuti FORM-SPEC.md.

---

### APIFORM-006

Ikuti API-CONTRACT.md.

---

### APIFORM-007

Seluruh Error ditampilkan melalui UI Feedback yang konsisten.

---

### APIFORM-008

Gunakan Mock API selama Frontend Development.

---

### APIFORM-009

Gunakan Endpoint sesuai REST Convention.

---

### APIFORM-010

Response tidak dimodifikasi di UI.

---

# 7.9 Best Practices

- Pisahkan Schema Validation.
- Gunakan reusable validation.
- Gunakan reusable Form Component.
- Gunakan reusable Input Component.
- Gunakan Loading State.
- Gunakan Disabled State saat Submit.
- Tangani Error dan Success secara konsisten.
- Hindari duplikasi validasi.

---

# 7.10 Anti Patterns

Tidak diperbolehkan.

- Validasi manual yang berulang.
- Hardcoded Endpoint.
- Hardcoded URL.
- Fetch di dalam Form.
- API Call di Button.
- Business Logic di Input Component.
- Response Mapping di JSX.
- Mengabaikan Error Response.

---

# 7.11 Acceptance Criteria

API & Form Standards dinyatakan memenuhi standar apabila.

- Seluruh komunikasi API mengikuti API-CONTRACT.md.
- Seluruh Form mengikuti FORM-SPEC.md.
- Validasi menggunakan React Hook Form dan Zod.
- API hanya diakses melalui Service Layer.
- Endpoint mengikuti REST Convention.
- Error ditampilkan secara konsisten.
- Mock API dapat diganti menjadi REST API tanpa perubahan pada Component.

# ==============================================================================
# END OF PART 7
# ==============================================================================

# ==============================================================================
# CODING-STANDARDS.md
# PART 8 — NAMING & DOCUMENTATION STANDARDS
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan standar penamaan (Naming Convention) dan dokumentasi source code pada Engineering Document Management System (EDMS). |
| **Depends On** | FILE-STRUCTURE.md, COMPONENT-SPEC.md, API-CONTRACT.md, FORM-SPEC.md |
| **Primary Audience** | Frontend Developer, Backend Developer, Technical Lead, QA Engineer, AI Coding Agent |

---

# 8.1 Overview

Naming Convention dan Documentation Standards bertujuan menjaga konsistensi seluruh source code sehingga mudah dipahami, mudah dicari, dan mudah dipelihara.

Seluruh nama file, folder, variable, function, component, service, store, hook, dan constant wajib mengikuti standar yang sama.

---

# 8.2 General Naming Principles

Seluruh penamaan wajib memenuhi prinsip berikut.

- Descriptive
- Consistent
- Predictable
- Readable
- Business Friendly

Nama harus menjelaskan tujuan implementasi.

Singkatan yang tidak umum harus dihindari.

---

# 8.3 Naming Convention

| Object | Convention | Example |
|----------|------------|---------|
| Folder | kebab-case | `document-register` |
| React Component | PascalCase | `DocumentTable.jsx` |
| Custom Hook | camelCase + use | `useDocuments.js` |
| Service | camelCase | `document.service.js` |
| Store | camelCase | `auth.store.js` |
| Utility | camelCase | `formatDate.js` |
| Constant | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |
| Variable | camelCase | `documentStatus` |
| Function | camelCase | `handleSubmit` |
| Type Property | camelCase | `documentNumber` |

---

# 8.4 File Naming Standards

Setiap file harus menggunakan nama yang konsisten.

Contoh.

```text
DashboardPage.jsx

DocumentTable.jsx

StatusBadge.jsx

ApprovalDialog.jsx

document.service.js

auth.store.js

useDocuments.js

formatDate.js
```

Nama file harus merepresentasikan isi file.

---

# 8.5 Function Naming Standards

Gunakan awalan yang menjelaskan tujuan function.

| Prefix | Purpose |
|----------|---------|
| get | Mengambil data |
| create | Membuat data |
| update | Memperbarui data |
| delete | Menghapus data |
| handle | Event Handler |
| validate | Validasi |
| format | Formatting |
| calculate | Perhitungan |
| map | Transformasi data |

Contoh.

```text
getDocuments()

handleSubmit()

validateForm()

formatDate()

calculateProgress()
```

---

# 8.6 Documentation Standards

Source code harus bersifat **Self-Documenting**.

Komentar hanya digunakan apabila diperlukan untuk menjelaskan alasan implementasi yang kompleks.

Komentar tidak digunakan untuk menjelaskan kode yang sudah jelas.

### Good

```javascript
// Reset SLA timer ketika status berubah sesuai business behaviour.
```

### Bad

```javascript
// Menambahkan angka 1.
count++;
```

---

# 8.7 Documentation Rules

Dokumentasi diperlukan untuk.

- Utility kompleks.
- Algoritma khusus.
- Integrasi eksternal.
- Workaround teknis.
- Temporary Fix (disertai referensi Issue).

Komentar tidak diperlukan pada implementasi sederhana.

---

# 8.8 Naming Rules

### NAME-001

Gunakan Bahasa Inggris.

---

### NAME-002

Gunakan istilah bisnis sesuai PRD.md.

---

### NAME-003

Gunakan camelCase untuk Variable dan Function.

---

### NAME-004

Gunakan PascalCase untuk Component.

---

### NAME-005

Gunakan kebab-case untuk Folder.

---

### NAME-006

Gunakan UPPER_SNAKE_CASE untuk Constant.

---

### NAME-007

Nama harus deskriptif.

---

### NAME-008

Hindari singkatan yang ambigu.

---

### NAME-009

Gunakan istilah yang konsisten dengan API-CONTRACT.md.

---

### NAME-010

Gunakan nama yang sama antara Frontend dan Backend apabila merepresentasikan Entity yang sama.

---

# 8.9 Best Practices

- Gunakan nama yang mudah dipahami.
- Gunakan istilah yang konsisten dengan Product Module.
- Gunakan nama Property sesuai API.
- Gunakan komentar seperlunya.
- Gunakan TODO hanya untuk pekerjaan yang benar-benar akan diselesaikan.
- Hapus komentar yang sudah tidak relevan.

---

# 8.10 Acceptance Criteria

Naming & Documentation Standards dinyatakan memenuhi standar apabila.

- Seluruh nama file konsisten.
- Seluruh nama Component mengikuti PascalCase.
- Seluruh Function menggunakan camelCase.
- Seluruh Constant menggunakan UPPER_SNAKE_CASE.
- Istilah bisnis konsisten dengan PRD.md.
- Dokumentasi hanya digunakan untuk implementasi yang memerlukan penjelasan tambahan.
- Source code mudah dipahami tanpa komentar yang berlebihan.

# ==============================================================================
# END OF PART 8
# ==============================================================================

# ==============================================================================
# CODING-STANDARDS.md
# PART 9 — GIT & DEVELOPMENT WORKFLOW STANDARDS
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan standar penggunaan Git dan Development Workflow pada Engineering Document Management System (EDMS). |
| **Depends On** | IMPLEMENTATION-PLAN.md, ENGINEERING-FOUNDATION.md, FILE-STRUCTURE.md |
| **Primary Audience** | Frontend Developer, Backend Developer, Technical Lead, QA Engineer, AI Coding Agent |

---

# 9.1 Overview

Development Workflow mendefinisikan proses standar mulai dari implementasi hingga source code siap digabungkan (merge) ke branch utama.

Seluruh anggota tim wajib mengikuti workflow yang sama untuk menjaga kualitas source code.

---

# 9.2 Development Flow

Proses pengembangan mengikuti alur berikut.

```text
Requirement

↓

Task

↓

Feature Branch

↓

Implementation

↓

Self Review

↓

Testing

↓

Pull Request

↓

Code Review

↓

Approval

↓

Merge
```

Setiap tahap harus diselesaikan sebelum melanjutkan ke tahap berikutnya.

---

# 9.3 Branch Strategy

Struktur branch.

```text
main

develop

feature/*

bugfix/*

hotfix/*

release/*
```

Contoh.

```text
feature/document-register

feature/dashboard

bugfix/login-error

hotfix/api-timeout
```

---

# 9.4 Commit Message Convention

Format.

```text
type(scope): message
```

Contoh.

```text
feat(document): add document register table

fix(auth): resolve login validation

refactor(service): simplify document service

docs(form): update validation rules

style(ui): improve spacing

test(api): add service unit test
```

---

# 9.5 Commit Rules

### COMMIT-001

Satu commit hanya memiliki satu tujuan.

---

### COMMIT-002

Gunakan commit yang kecil dan mudah dipahami.

---

### COMMIT-003

Hindari commit yang mencampur Feature dan Bug Fix.

---

### COMMIT-004

Commit harus dapat dijelaskan melalui pesan commit.

---

### COMMIT-005

Jangan melakukan commit file yang tidak terkait.

---

# 9.6 Pull Request Standards

Setiap Pull Request minimal berisi.

- Ringkasan perubahan.
- Feature yang terpengaruh.
- Screenshot (apabila UI berubah).
- Hasil pengujian.
- Referensi Issue atau Task.

Pull Request harus dapat ditinjau tanpa memerlukan penjelasan tambahan.

---

# 9.7 Code Review Checklist

Reviewer memastikan.

- Mengikuti CODING-STANDARDS.md.
- Tidak menambahkan Business Rule baru.
- Tidak melanggar Architecture.
- Tidak terdapat duplikasi.
- Tidak terdapat Hardcoded Data.
- Tidak terdapat API Call langsung di Component.
- Mengikuti UI Guidelines.
- Mengikuti API Contract.

---

# 9.8 Development Rules

### DEV-001

Seluruh pekerjaan menggunakan Feature Branch.

---

### DEV-002

Merge ke `main` hanya melalui Pull Request.

---

### DEV-003

Seluruh perubahan harus melewati Code Review.

---

### DEV-004

Perubahan harus lulus Testing.

---

### DEV-005

Ikuti IMPLEMENTATION-PLAN.md.

---

### DEV-006

Perubahan tidak boleh bertentangan dengan Source of Truth.

---

### DEV-007

Business Workflow tidak boleh diubah tanpa Change Request.

---

### DEV-008

Source code harus mengikuti seluruh standar pada CODING-STANDARDS.md.

---

# 9.9 Best Practices

- Commit sesering mungkin dengan perubahan yang terfokus.
- Gunakan Branch yang deskriptif.
- Lakukan Self Review sebelum membuat Pull Request.
- Hindari Pull Request yang terlalu besar.
- Selesaikan Conflict sebelum Review.
- Pastikan aplikasi dapat dijalankan sebelum Merge.

---

# 9.10 Acceptance Criteria

Git & Development Workflow Standards dinyatakan memenuhi standar apabila.

- Seluruh perubahan menggunakan Feature Branch.
- Seluruh Merge melalui Pull Request.
- Seluruh Pull Request telah melalui Code Review.
- Commit mengikuti format yang ditentukan.
- Perubahan mengikuti IMPLEMENTATION-PLAN.md.
- Tidak ada perubahan yang bertentangan dengan Source of Truth.
- Seluruh source code memenuhi standar kualitas proyek EDMS.

# ==============================================================================
# END OF PART 9
# ==============================================================================

# ==============================================================================
# CODING-STANDARDS.md
# PART 10 — CODING ACCEPTANCE CRITERIA
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Purpose** | Mendefinisikan standar akhir (Acceptance Criteria) yang harus dipenuhi sebelum source code Engineering Document Management System (EDMS) dinyatakan siap untuk Code Review, Integration, dan Production. |
| **Depends On** | PRD.md, ENGINEERING-FOUNDATION.md, IMPLEMENTATION-PLAN.md, UI-GUIDELINES.md, COMPONENT-SPEC.md, FILE-STRUCTURE.md, ROUTING.md, STATE-MANAGEMENT.md, API-CONTRACT.md, ACCESS-CONTROL.md, FORM-SPEC.md, MOCK-DATA.md |
| **Behaviour Reference** | BUSINESS-WORKFLOW.md |
| **Primary Audience** | Technical Lead, Frontend Developer, Backend Developer, QA Engineer, AI Coding Agent |

---

# 10.1 Purpose

Coding Acceptance Criteria merupakan standar akhir yang digunakan untuk memverifikasi bahwa seluruh implementasi source code telah memenuhi seluruh Engineering Standard yang telah ditetapkan.

Bagian ini menjadi **Quality Gate** sebelum source code dinyatakan layak untuk:

- Code Review
- Pull Request
- Integration Testing
- User Acceptance Test (UAT)
- Production Release

Acceptance Criteria memastikan seluruh implementasi tetap konsisten terhadap Source of Truth proyek.

---

# 10.2 Acceptance Scope

Acceptance Criteria mencakup seluruh standar yang telah didefinisikan pada dokumen ini.

- Coding Philosophy
- Project Structure Standards
- JavaScript & React Standards
- Component Standards
- State & Service Standards
- API & Form Standards
- Naming & Documentation Standards
- Git & Development Workflow Standards

Seluruh bagian wajib memenuhi standar sebelum source code dapat di-*merge*.

---

# 10.3 Project Structure Acceptance

| ID | Criteria | Status |
|----|----------|--------|
| STRUCT-001 | Struktur project mengikuti FILE-STRUCTURE.md. | ☐ |
| STRUCT-002 | Feature menggunakan Feature First Architecture. | ☐ |
| STRUCT-003 | Tidak terdapat Circular Dependency. | ☐ |
| STRUCT-004 | Folder memiliki tanggung jawab yang jelas. | ☐ |
| STRUCT-005 | Shared Resource digunakan sesuai standar. | ☐ |
| STRUCT-006 | Source code mudah dinavigasi. | ☐ |

---

# 10.4 JavaScript & React Acceptance

| ID | Criteria | Status |
|----|----------|--------|
| JS-001 | Seluruh Component menggunakan Functional Component. | ☐ |
| JS-002 | Seluruh Function menggunakan Arrow Function. | ☐ |
| JS-003 | Tidak terdapat Class Component. | ☐ |
| JS-004 | Menggunakan Modern JavaScript (ES Modules). | ☐ |
| JS-005 | React Hook digunakan sesuai aturan. | ☐ |
| JS-006 | JSX mudah dibaca dan tidak mengandung logika kompleks. | ☐ |

---

# 10.5 Component Acceptance

| ID | Criteria | Status |
|----|----------|--------|
| COMP-001 | Satu Component memiliki satu tanggung jawab. | ☐ |
| COMP-002 | Component mengikuti COMPONENT-SPEC.md. | ☐ |
| COMP-003 | Tidak terdapat Business Logic di Component. | ☐ |
| COMP-004 | Component reusable apabila memungkinkan. | ☐ |
| COMP-005 | Props digunakan secara konsisten. | ☐ |
| COMP-006 | Struktur Component seragam. | ☐ |

---

# 10.6 State & Service Acceptance

| ID | Criteria | Status |
|----|----------|--------|
| STATE-001 | Server State menggunakan TanStack Query. | ☐ |
| STATE-002 | Global State menggunakan Zustand. | ☐ |
| STATE-003 | Local State menggunakan React State. | ☐ |
| STATE-004 | Seluruh komunikasi data melalui Service Layer. | ☐ |
| STATE-005 | Component tidak mengakses API secara langsung. | ☐ |
| STATE-006 | Service mengikuti API-CONTRACT.md. | ☐ |

---

# 10.7 API & Form Acceptance

| ID | Criteria | Status |
|----|----------|--------|
| APIFORM-001 | Seluruh API mengikuti API-CONTRACT.md. | ☐ |
| APIFORM-002 | Seluruh Form mengikuti FORM-SPEC.md. | ☐ |
| APIFORM-003 | Validasi menggunakan React Hook Form dan Zod. | ☐ |
| APIFORM-004 | Error ditangani secara konsisten. | ☐ |
| APIFORM-005 | Mock API dapat diganti menjadi REST API tanpa perubahan Component. | ☐ |
| APIFORM-006 | Tidak terdapat Hardcoded Endpoint. | ☐ |

---

# 10.8 Code Quality Checklist

Seluruh implementasi wajib memenuhi checklist berikut.

| Checklist | Status |
|-----------|--------|
| Tidak terdapat Hardcoded Data | ☐ |
| Tidak terdapat Hardcoded Permission | ☐ |
| Tidak terdapat Hardcoded Role | ☐ |
| Tidak terdapat Circular Dependency | ☐ |
| Tidak terdapat Duplicate Logic | ☐ |
| Tidak terdapat Duplicate Component | ☐ |
| Tidak terdapat Duplicate Service | ☐ |
| Tidak terdapat Dead Code | ☐ |
| Tidak terdapat Unused Import | ☐ |
| Tidak terdapat Unused Variable | ☐ |
| Tidak terdapat Magic Number tanpa Constant | ☐ |
| Tidak terdapat Console Log untuk Production | ☐ |
| Tidak terdapat TODO yang belum diselesaikan | ☐ |

---

# 10.9 Documentation & Development Acceptance

| Document | Validation |
|----------|------------|
| PRD.md | Terminologi bisnis sesuai |
| ENGINEERING-FOUNDATION.md | Technology Stack sesuai |
| IMPLEMENTATION-PLAN.md | Implementasi mengikuti Roadmap |
| UI-GUIDELINES.md | UI mengikuti standar desain |
| COMPONENT-SPEC.md | Component sesuai spesifikasi |
| FILE-STRUCTURE.md | Struktur folder sesuai |
| ROUTING.md | Routing mengikuti spesifikasi |
| STATE-MANAGEMENT.md | State mengikuti arsitektur |
| API-CONTRACT.md | Request & Response sesuai |
| ACCESS-CONTROL.md | Permission diterapkan dengan benar |
| FORM-SPEC.md | Form mengikuti spesifikasi |
| MOCK-DATA.md | Mock Service mengikuti standar |
| BUSINESS-WORKFLOW.md | Behaviour sesuai sebagai Behaviour Reference Only |

---

# 10.10 Final Acceptance

Source code Engineering Document Management System (EDMS) dinyatakan **Approved** apabila:

- Seluruh Acceptance Criteria telah terpenuhi.
- Seluruh implementasi mengikuti Source of Truth proyek.
- Tidak terdapat pelanggaran terhadap ENGINEERING-FOUNDATION.md.
- Struktur project mengikuti FILE-STRUCTURE.md.
- Routing mengikuti ROUTING.md.
- State Management mengikuti STATE-MANAGEMENT.md.
- API mengikuti API-CONTRACT.md.
- Access Control mengikuti ACCESS-CONTROL.md.
- Form mengikuti FORM-SPEC.md.
- Mock Data mengikuti MOCK-DATA.md.
- Component mengikuti COMPONENT-SPEC.md.
- UI mengikuti UI-GUIDELINES.md.
- Tidak terdapat perubahan Business Rule di dalam source code.
- Tidak terdapat perubahan Business Workflow tanpa Change Request resmi.
- Seluruh perubahan telah melalui Self Review, Code Review, dan Testing.
- Source code dinyatakan siap untuk Integration Testing dan Production Release.

---

# End of PART 10

CODING-STANDARDS.md menjadi **Official Engineering Coding Standard** untuk proyek **Engineering Document Management System (EDMS) Rebuild**.

Dokumen ini menjadi acuan utama dalam proses implementasi source code Frontend maupun Backend sehingga seluruh Developer dan AI Coding Agent menghasilkan implementasi yang konsisten, mudah dipelihara, mudah dikembangkan, serta selaras dengan seluruh Engineering Documentation dan Source of Truth proyek.

Seluruh perubahan terhadap standar yang didefinisikan pada dokumen ini hanya dapat dilakukan melalui proses **Architecture Review** dan **Change Request** yang telah disetujui.

# ==============================================================================
# END OF CODING-STANDARDS.md
# ==============================================================================

---

# PHASE 2 SOURCE OF TRUTH SYNCHRONIZATION

## Current Implementation Standard

Untuk EDMS current implementation, source code wajib mempertahankan boundary berikut:

- Component hanya mengelola rendering dan interaction orchestration.
- Business behaviour berada pada Service Layer, constants, dan validation schema.
- Permission string harus memakai katalog resmi di ACCESS-CONTROL.md.
- Route path harus memakai katalog resmi di ROUTING.md.
- Status, lifecycle, revision stage, SLA status, escalation level, dan workflow action harus memakai constants resmi.
- Local persistence hanya boleh diakses melalui Service Layer.
- Perubahan backend production tidak boleh mengubah behaviour frontend yang sudah dinyatakan current system model tanpa Change Request baru.

Kode tidak boleh menghidupkan kembali permission deprecated, route deprecated, Delete Document operasional, atau Single Project assumption.
