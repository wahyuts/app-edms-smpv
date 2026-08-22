# ==============================================================================
# PART 1 — Introduction
# ==============================================================================

| Metadata | Description |
|----------|-------------|
| **Document Level** | Technical Design Document |
| **Document Status** | Draft |
| **Owner** | Product Owner |
| **Purpose** | Menjelaskan standar struktur direktori proyek EDMS Rebuild sebagai acuan implementasi Frontend sehingga organisasi source code konsisten, mudah dipelihara, dan mudah dikembangkan. |
| **Depends On** | PRD.md, ENGINEERING-FOUNDATION.md, IMPLEMENTATION-PLAN.md, COMPONENT-SPEC.md, UI-GUIDELINES.md |
| **Design Reference** | Approved UI Design Mockup |
| **Behaviour Reference** | BUSINESS-WORKFLOW.md |
| **Primary Audience** | Frontend Developer, Backend Developer, Technical Lead, QA Engineer, AI Coding Assistant |
| **Change Impact** | High |
| **Last Review** | Architecture Review |

---

# 1.1 Purpose

FILE-STRUCTURE.md merupakan dokumen yang mendefinisikan standar organisasi direktori dan file pada proyek **Engineering Document Management System (EDMS) Rebuild**.

Dokumen ini menjadi acuan resmi dalam penyusunan struktur source code Frontend sehingga seluruh implementasi memiliki pola organisasi yang konsisten, mudah dipahami, serta mendukung proses pengembangan dan pemeliharaan aplikasi dalam jangka panjang.

FILE-STRUCTURE.md tidak mendefinisikan Business Workflow maupun Business Logic. Seluruh keputusan mengenai perilaku sistem tetap mengacu pada dokumen Source of Truth yang telah ditetapkan. Dokumen ini hanya menjelaskan bagaimana struktur proyek harus diorganisasikan agar implementasi dapat mengikuti spesifikasi yang telah disepakati.

---

# 1.2 Objectives

Penyusunan FILE-STRUCTURE.md bertujuan untuk:

- Menentukan struktur direktori resmi proyek Frontend EDMS Rebuild.
- Menetapkan standar organisasi source code berdasarkan Feature dan Component.
- Menjadi acuan implementasi arsitektur proyek React.
- Menjaga konsistensi penempatan file selama proses pengembangan.
- Mempermudah proses maintenance, debugging, dan scalability.
- Mengurangi duplikasi struktur maupun penempatan file.
- Menjadi referensi implementasi bagi Developer dan AI Coding Assistant.

---

# 1.3 Scope

Dokumen ini mencakup organisasi struktur proyek Frontend EDMS Rebuild, meliputi:

- Root Project Structure
- Application Structure
- Feature Module Structure
- Component Organization
- Layout Organization
- Asset Organization
- Service Layer Structure
- State Management Structure
- Routing Structure
- Shared Resources
- Naming Convention
- Dependency Rules

Dokumen ini tidak membahas implementasi Business Logic, Database Schema, REST API, maupun Workflow bisnis.

---

# 1.4 Document Position

FILE-STRUCTURE.md merupakan bagian dari **Technical Design Documents** yang menerjemahkan keputusan arsitektur menjadi organisasi source code yang siap diimplementasikan.

Hubungan antar dokumen adalah sebagai berikut.

```text
BUSINESS-WORKFLOW.md
        │
        │ (Behaviour Reference Only)
        ▼
SYSTEM-REQUIREMENTS.md (Historical Reference / Unavailable)
FEATURE-MAPPING.md (Historical Reference / Unavailable)
        │
        ▼
PRD.md
        │
        ├── UI-GUIDELINES.md
        ├── ENGINEERING-FOUNDATION.md
        ├── COMPONENT-SPEC.md
        └── IMPLEMENTATION-PLAN.md
                 │
                 ▼
         FILE-STRUCTURE.md
                 │
                 ▼
        Frontend Source Code
```

FILE-STRUCTURE.md tidak menentukan kebutuhan bisnis maupun desain antarmuka. Dokumen ini hanya mendefinisikan bagaimana source code diorganisasikan agar implementasi tetap konsisten terhadap seluruh dokumen Source of Truth.

---

# 1.5 Source of Truth

FILE-STRUCTURE.md disusun berdasarkan dokumen berikut.

| Priority | Reference | Purpose |
|----------|-----------|---------|
| **1** | PRD.md | Menentukan Product Module, Feature, Screen, dan kebutuhan produk yang harus diimplementasikan. |
| **2** | ENGINEERING-FOUNDATION.md | Menentukan teknologi, arsitektur aplikasi, dan pola implementasi proyek. |
| **3** | IMPLEMENTATION-PLAN.md | Menentukan strategi implementasi dan organisasi pengembangan. |
| **4** | COMPONENT-SPEC.md | Menentukan struktur dan organisasi React Component. |
| **5** | UI-GUIDELINES.md | Menentukan organisasi Layout, Design System, Asset, Icon, dan UI Standard. |
| **6** | Approved UI Design Mockup | Menjadi Visual Source of Truth terhadap struktur halaman dan layout aplikasi. |
| **7** | BUSINESS-WORKFLOW.md | Digunakan sebagai **Behaviour Reference Only** untuk memastikan struktur proyek mendukung Business Workflow yang telah ditetapkan. |

FILE-STRUCTURE.md tidak diperbolehkan mendefinisikan struktur yang bertentangan dengan dokumen Source of Truth tersebut.

---

# 1.6 Design Principles

Penyusunan struktur proyek mengikuti prinsip-prinsip berikut.

- Feature-Oriented Architecture.
- Component Reusability.
- Separation of Concerns.
- Single Responsibility Principle.
- Scalable Folder Organization.
- Consistent Naming Convention.
- Predictable Project Structure.
- Easy Navigation.
- Maintainable Architecture.
- AI-Friendly Project Organization.

---

# 1.7 Out of Scope

FILE-STRUCTURE.md tidak membahas hal-hal berikut.

- Business Workflow
- Functional Requirements
- Business Rules
- Validation Rules
- Permission Matrix
- REST API Specification
- Backend Architecture
- Database Schema
- UI Detail Specification

Seluruh aspek tersebut dijelaskan pada dokumen Source of Truth yang sesuai.

---

# 1.8 Expected Outcome

Setelah FILE-STRUCTURE.md diterapkan, proyek Frontend EDMS Rebuild diharapkan memiliki struktur yang:

- Konsisten pada seluruh Product Module.
- Mudah dipahami oleh seluruh anggota tim pengembang.
- Mendukung implementasi React secara modular.
- Mempermudah proses pengembangan, pengujian, dan pemeliharaan aplikasi.
- Mendukung skalabilitas tanpa mengubah arsitektur utama.
- Selaras dengan PRD.md, ENGINEERING-FOUNDATION.md, IMPLEMENTATION-PLAN.md, COMPONENT-SPEC.md, UI-GUIDELINES.md, serta Approved UI Design Mockup.
- Siap digunakan sebagai acuan implementasi oleh Developer maupun AI Coding Assistant.

# ==============================================================================
# PART 2 — Project Architecture
# ==============================================================================

## 2.1 Purpose

Project Architecture mendefinisikan filosofi organisasi source code pada Engineering Document Management System (EDMS) Rebuild.

Bagian ini menjelaskan bagaimana seluruh direktori, module, component, service, state management, dan resource diorganisasikan agar proyek tetap konsisten, mudah dikembangkan, mudah dipelihara, serta mendukung pertumbuhan aplikasi dalam jangka panjang.

Project Architecture tidak mendefinisikan struktur folder secara rinci. Detail struktur direktori akan dijelaskan pada PART berikutnya.

---

## 2.2 Architecture Philosophy

Engineering Document Management System (EDMS) Rebuild menggunakan pendekatan **Feature-Oriented Architecture** yang dikombinasikan dengan **Shared Component Architecture**.

Seluruh implementasi aplikasi dibangun berdasarkan pembagian tanggung jawab yang jelas sehingga setiap bagian proyek memiliki fungsi yang spesifik.

Pendekatan ini memberikan keuntungan sebagai berikut.

- Struktur proyek mudah dipahami.
- Modul dapat dikembangkan secara independen.
- Reusable Component dapat digunakan lintas Feature.
- Source code lebih mudah dipelihara.
- Mendukung skalabilitas proyek dalam jangka panjang.
- Mendukung implementasi AI Coding Assistant secara konsisten.

---

## 2.3 Architecture Layers

Struktur proyek dibagi menjadi beberapa lapisan utama.

```text
Presentation Layer

│

├── Pages

├── Layouts

├── Components

│

▼

Application Layer

│

├── Hooks

├── Services

├── Queries

├── Stores

│

▼

Infrastructure Layer

│

├── API

├── Config

├── Constants

├── Utils

└── Assets
```

Masing-masing layer memiliki tanggung jawab yang berbeda dan tidak boleh saling mengambil alih fungsi.

---

## 2.4 Architectural Principles

Seluruh struktur proyek wajib mengikuti prinsip berikut.

### PSA-001 Separation of Concerns

Setiap folder memiliki tanggung jawab yang jelas.

Contoh.

- Components hanya berisi UI Component.
- Services hanya berisi komunikasi data.
- Pages hanya menyusun halaman.
- Stores hanya mengelola Global State.

---

### PSA-002 Feature First

Pengembangan aplikasi dilakukan berdasarkan Product Feature.

Contoh Feature.

- Dashboard
- Document Register
- Transmittal
- SLA Monitoring
- Escalation
- Audit Trail
- Storage NAS
- Notifications
- Administration

Setiap Feature memiliki struktur implementasi yang konsisten.

---

### PSA-003 Reusable First

Komponen yang dapat digunakan lebih dari satu Feature harus ditempatkan pada area Shared.

Komponen yang hanya digunakan oleh satu Feature tetap berada pada Feature tersebut.

---

### PSA-004 Low Coupling

Setiap module harus memiliki ketergantungan seminimal mungkin terhadap module lain.

Perubahan pada satu module tidak boleh menyebabkan perubahan pada seluruh aplikasi.

---

### PSA-005 High Cohesion

Seluruh file dalam satu folder harus memiliki tanggung jawab yang saling berhubungan.

Folder tidak boleh berisi file yang memiliki fungsi berbeda.

---

## 2.5 Project Organization

Organisasi proyek mengikuti hirarki berikut.

```text
Application

│

├── Core Structure

│      ├── App
│      ├── Routing
│      ├── Layout
│      └── Configuration

│

├── Feature Modules

│      ├── Dashboard
│      ├── Document Register
│      ├── Transmittal
│      ├── SLA Monitoring
│      ├── Escalation
│      ├── Audit Trail
│      ├── Storage NAS
│      ├── Notifications
│      └── Administration

│

├── Shared Resources

│      ├── Components
│      ├── Hooks
│      ├── Services
│      ├── Utils
│      ├── Constants
│      ├── Assets
│      └── Types

│

└── Infrastructure

       ├── API
       ├── Config
       ├── Queries
       └── Stores
```

Struktur detail setiap bagian akan dijelaskan pada PART selanjutnya.

---

## 2.6 Dependency Direction

Hubungan antar layer mengikuti aturan berikut.

```text
Pages

↓

Feature Components

↓

Shared Components

↓

Hooks

↓

Services

↓

API

↓

Backend
```

Aturan ini wajib dipatuhi oleh seluruh implementasi.

Contoh yang diperbolehkan.

```text
Dashboard Page

↓

Summary Card

↓

Dashboard Service

↓

REST API
```

Contoh yang **tidak diperbolehkan**.

```text
Dashboard Page

↓

REST API
```

Halaman tidak diperbolehkan melakukan komunikasi langsung dengan API.

---

## 2.7 Module Independence

Setiap Product Module harus dapat berkembang secara independen.

Contoh.

```text
Dashboard
```

tidak boleh bergantung pada

```text
Administration
```

secara langsung.

Interaksi antar module hanya diperbolehkan melalui:

- Shared Component
- Shared Service
- Shared Store
- Shared Utility

---

## 2.8 Scalability Principles

Struktur proyek harus mendukung penambahan Feature baru tanpa mengubah struktur utama.

Sebagai contoh.

```text
Dashboard

↓

Dashboard V2
```

atau

```text
Vendor Portal

```

dapat ditambahkan tanpa melakukan perubahan terhadap struktur folder yang sudah ada.

Seluruh Feature baru harus mengikuti arsitektur yang telah ditetapkan.

---

## 2.9 General Rules

Seluruh organisasi proyek wajib memenuhi ketentuan berikut.

- Mengikuti ENGINEERING-FOUNDATION.md.
- Mengikuti IMPLEMENTATION-PLAN.md.
- Mengikuti COMPONENT-SPEC.md.
- Mengikuti UI-GUIDELINES.md.
- Mengikuti struktur Product Module pada PRD.md.
- Mendukung implementasi berdasarkan Approved UI Design Mockup.
- Tidak mengandung duplikasi struktur.
- Tidak membuat ketergantungan yang tidak diperlukan.

---

## 2.10 Acceptance Criteria

Project Architecture dinyatakan memenuhi standar apabila.

- Seluruh layer memiliki tanggung jawab yang jelas.
- Struktur mengikuti pendekatan Feature-Oriented Architecture.
- Dependency mengikuti arah yang telah ditetapkan.
- Feature dapat dikembangkan secara independen.
- Shared Resources digunakan secara konsisten.
- Struktur proyek mudah dipahami oleh Developer dan AI Coding Assistant.
- Seluruh organisasi proyek selaras dengan ENGINEERING-FOUNDATION.md, COMPONENT-SPEC.md, IMPLEMENTATION-PLAN.md, UI-GUIDELINES.md, dan PRD.md.

---

# End of PART 2

PART 2 mendefinisikan arsitektur dasar organisasi proyek Engineering Document Management System (EDMS) Rebuild.

Seluruh struktur direktori yang akan dijelaskan pada PART berikutnya wajib mengikuti prinsip arsitektur, dependency, dan organisasi proyek yang telah ditetapkan pada bagian ini agar menghasilkan source code yang modular, scalable, mudah dipelihara, dan konsisten di seluruh aplikasi.

# ==============================================================================
# PART 3 — Root Directory Structure
# ==============================================================================

## 3.1 Purpose

Root Directory Structure mendefinisikan struktur direktori utama (Root Project Structure) pada Engineering Document Management System (EDMS) Rebuild.

Bagian ini menjadi standar resmi organisasi proyek sehingga seluruh aplikasi, dokumentasi, database, konfigurasi, dan resource pendukung memiliki lokasi yang konsisten, mudah dipahami, serta mudah dipelihara.

EDMS Rebuild menggunakan pendekatan **Monorepo Architecture**, di mana Frontend dan Backend berada dalam satu repository namun tetap dipisahkan secara jelas berdasarkan tanggung jawab masing-masing.

---

## 3.2 Root Directory Philosophy

Engineering Document Management System (EDMS) Rebuild menggunakan pendekatan **Monorepo Project Structure**.

Seluruh aplikasi ditempatkan pada direktori **apps/**, sedangkan seluruh resource bersama ditempatkan pada direktori khusus sesuai tanggung jawabnya.

Pendekatan ini memberikan keuntungan sebagai berikut.

- Frontend dan Backend berada dalam satu repository.
- Dokumentasi proyek terpusat.
- Database menjadi resource bersama.
- Struktur proyek lebih mudah dipelihara.
- Mendukung skalabilitas apabila di masa depan terdapat aplikasi tambahan.
- Mempermudah Development, Integration, Testing, dan Deployment.

---

## 3.3 Root Directory Structure

Struktur direktori utama proyek mengikuti standar berikut.

```text
edms-rebuild/
│
├── apps/                                  # Application Workspace
│   │
│   ├── frontend/                          # React + Vite Application
│   │
│   └── backend/                           # Node.js + Express Application
│
├── database/                              # Shared Database Resources
│   │
│   ├── schema/                            # Database Schema
│   ├── migrations/                        # Database Migration
│   ├── seeds/                             # Initial / Dummy Data
│   └── backups/                           # Database Backup
│
├── docs/                                  # Project Documentation
│
├── scripts/                               # Build, Utility & Automation Scripts
│
├── .github/                               # GitHub Workflow & CI/CD
│
├── .vscode/                               # VS Code Workspace Configuration
│
├── .gitignore                             # Git Ignore Rules
├── package.json                           # Root Workspace Configuration
├── README.md                              # Project Documentation
└── LICENSE                                # Project License
```

Root Directory hanya digunakan untuk mengorganisasikan aplikasi dan resource bersama.

Seluruh implementasi Frontend dan Backend berada di dalam direktori **apps/**.

---

## 3.4 Root Directory Responsibilities

| Directory | Responsibility |
|------------|----------------|
| **apps/** | Workspace utama yang berisi seluruh aplikasi pada proyek EDMS. |
| **apps/frontend/** | Source Code aplikasi Frontend React + Vite. |
| **apps/backend/** | Source Code aplikasi Backend Node.js + Express. |
| **database/** | Resource database bersama meliputi Schema, Migration, Seed, dan Backup. |
| **docs/** | Seluruh dokumentasi proyek dan Technical Design Documents. |
| **scripts/** | Build Script, Utility Script, Automation Script, dan Deployment Helper. |
| **.github/** | GitHub Actions, Workflow, Issue Template, Pull Request Template, dan konfigurasi CI/CD. |
| **.vscode/** | Workspace Configuration untuk Visual Studio Code. |

---

## 3.5 Root Configuration Files

Konfigurasi tingkat proyek ditempatkan pada Root Directory.

| File | Purpose |
|------|----------|
| **package.json** | Root Workspace Configuration dan Shared Script. |
| **README.md** | Dokumentasi umum proyek. |
| **LICENSE** | Informasi lisensi proyek. |
| **.gitignore** | Daftar file yang tidak diikutsertakan ke Git Repository. |

Konfigurasi yang hanya berlaku untuk Frontend atau Backend ditempatkan pada direktori aplikasi masing-masing.

---

## 3.6 Root Directory Rules

Seluruh Root Directory wajib mengikuti aturan berikut.

### RDS-001

Seluruh aplikasi wajib ditempatkan pada direktori:

```text
apps/
```

---

### RDS-002

Frontend dan Backend wajib dipisahkan menjadi dua aplikasi independen.

```text
apps/

├── frontend/

└── backend/
```

---

### RDS-003

Seluruh resource database ditempatkan pada:

```text
database/
```

---

### RDS-004

Seluruh dokumentasi proyek ditempatkan pada:

```text
docs/
```

---

### RDS-005

Seluruh Build Script, Utility Script, dan Automation Script ditempatkan pada:

```text
scripts/
```

---

### RDS-006

Seluruh konfigurasi GitHub dan CI/CD ditempatkan pada:

```text
.github/
```

---

### RDS-007

Seluruh konfigurasi editor ditempatkan pada:

```text
.vscode/
```

---

### RDS-008

Tidak diperbolehkan menambahkan direktori baru pada Root Project tanpa melalui Architecture Review.

---

### RDS-009

Nama direktori menggunakan huruf kecil (**lowercase**) dan format **kebab-case** apabila terdiri dari lebih dari satu kata.

---

## 3.7 Directory Organization Principles

Organisasi Root Directory mengikuti prinsip berikut.

- Monorepo Architecture.
- Separation of Concerns.
- Clear Responsibility.
- Feature Scalability.
- Predictable Project Structure.
- Consistent Naming Convention.
- Maintainable Project Organization.
- AI-Friendly Project Layout.

---

## 3.8 Dependency Rules

Hubungan antar direktori Root mengikuti aturan berikut.

```text
Root Project
│
├── apps/
│   ├── frontend/
│   └── backend/
│
├── database/
│
├── docs/
│
├── scripts/
│
└── .github/
```

Ketentuan yang berlaku.

- Frontend tidak diperbolehkan mengakses database secara langsung.
- Backend menjadi satu-satunya aplikasi yang berkomunikasi dengan database.
- Database hanya digunakan oleh Backend.
- Dokumentasi tidak menjadi bagian dari Source Code aplikasi.
- Script dapat digunakan oleh Frontend maupun Backend sesuai kebutuhan.
- Seluruh komunikasi antara Frontend dan Backend dilakukan melalui REST API.

---

## 3.9 Best Practices

Untuk menjaga konsistensi struktur proyek, seluruh developer wajib mengikuti praktik berikut.

- Tidak menyimpan Source Code di luar direktori **apps/**.
- Tidak menyimpan file Database di dalam aplikasi Frontend maupun Backend.
- Tidak menyimpan dokumentasi di dalam Source Code aplikasi.
- Menempatkan seluruh konfigurasi bersama pada Root Project.
- Menjaga struktur Root tetap sederhana dan mudah dipahami.
- Menghindari penambahan direktori baru tanpa kebutuhan arsitektur yang jelas.

---

## 3.10 Acceptance Criteria

Root Directory Structure dinyatakan memenuhi standar apabila.

- Menggunakan pendekatan **Monorepo Architecture**.
- Frontend dan Backend berada pada direktori **apps/**.
- Resource Database berada pada direktori **database/**.
- Dokumentasi berada pada direktori **docs/**.
- Build Script dan Utility Script berada pada direktori **scripts/**.
- Workflow CI/CD berada pada direktori **.github/**.
- Tidak terdapat direktori yang memiliki tanggung jawab ganda.
- Struktur proyek konsisten dengan ENGINEERING-FOUNDATION.md, IMPLEMENTATION-PLAN.md, COMPONENT-SPEC.md, dan Project Architecture.

---

# End of PART 3

PART 3 menetapkan struktur direktori utama Engineering Document Management System (EDMS) Rebuild menggunakan pendekatan **Monorepo Architecture**.

Struktur ini menjadi fondasi organisasi proyek sebelum memasuki pembahasan struktur internal aplikasi Frontend dan Backend pada PART berikutnya, sehingga seluruh implementasi memiliki organisasi yang konsisten, scalable, mudah dipelihara, dan siap mendukung pengembangan jangka panjang.

# ==============================================================================
# PART 4 — Application Structure
# ==============================================================================

## 4.1 Purpose

Application Structure mendefinisikan struktur internal setiap aplikasi pada Engineering Document Management System (EDMS) Rebuild.

Karena EDMS menggunakan pendekatan **Monorepo Architecture**, maka setiap aplikasi memiliki struktur internal yang independen namun tetap mengikuti standar arsitektur yang sama.

Bagian ini menjelaskan organisasi tingkat tinggi untuk aplikasi Frontend dan Backend sebelum membahas struktur folder yang lebih spesifik pada PART berikutnya.

---

## 4.2 Application Architecture

EDMS Rebuild terdiri dari dua aplikasi utama.

```text
EDMS Rebuild

│

├── Frontend Application

└── Backend Application
```

Kedua aplikasi dikembangkan secara independen namun saling terhubung melalui REST API.

---

## 4.3 Monorepo Application Structure

Struktur workspace aplikasi mengikuti standar berikut.

```text
apps/
│
├── frontend/
│   │
│   ├── public/
│   ├── src/
│   ├── .env
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
└── backend/
    │
    ├── src/
    ├── uploads/
    ├── logs/
    ├── .env
    ├── package.json
    └── server.js
```

Frontend dan Backend memiliki konfigurasi, dependency, dan proses build masing-masing.

---

## 4.4 Frontend Application

### Purpose

Frontend Application bertanggung jawab terhadap seluruh User Interface Engineering Document Management System (EDMS).

Frontend dibangun menggunakan teknologi yang telah ditetapkan pada ENGINEERING-FOUNDATION.md.

Runtime folder boundary resmi frontend berada di `apps/frontend/src` dan menggunakan tiga boundary utama:

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

Struktur generik lama seperti root `components/`, `pages/`, dan istilah konseptual `modules/` hanya boleh dibaca sebagai Historical Reference apabila masih muncul pada dokumen lain. Runtime frontend saat ini menggunakan feature-based folders di `apps/frontend/src/features`.

### Responsibilities

- Menampilkan User Interface.
- Mengelola navigasi aplikasi.
- Mengelola interaksi pengguna.
- Berkomunikasi dengan Backend melalui REST API melalui Service Layer.
- Pada fase lama sebelum Backend tersedia, seluruh local persistence, IndexedDB, localStorage, Fake API, dan Mock JSON diakses melalui Service Layer sebagai historical frontend baseline.
- Pada current backend-integrated runtime, Service Layer frontend memanggil Backend REST API dan tidak menjadi canonical business persistence.
- Mengelola Global State dan Server State.
- Menampilkan data sesuai Business Workflow.

### Technology

- React
- Vite
- Tailwind CSS
- React Router
- Zustand
- TanStack Query
- Axios
- React Hook Form
- Zod
- Lucide React

---

## 4.5 Backend Application

### Purpose

Backend Application bertanggung jawab terhadap seluruh Business Logic dan komunikasi dengan Database.

Backend menjadi satu-satunya aplikasi yang memiliki akses langsung ke Database.

### Responsibilities

- REST API.
- Authentication.
- Authorization.
- Business Logic.
- Database Access.
- File Upload.
- Notification Service.
- Audit Trail.
- Logging.

### Technology

- Node.js
- Express.js
- MySQL

---

## 4.6 Communication Architecture

Hubungan antar aplikasi mengikuti arsitektur berikut.

```text
Frontend

↓

REST API

↓

Backend

↓

MySQL Database
```

Seluruh komunikasi antara Frontend dan Backend dilakukan menggunakan REST API.

Frontend tidak diperbolehkan mengakses Database secara langsung.

---

## 4.7 Responsibility Boundary

Pembagian tanggung jawab antar aplikasi.

| Frontend | Backend |
|-----------|----------|
| UI Rendering | Business Logic |
| User Interaction | Authentication |
| Navigation | Authorization |
| Form Handling | REST API |
| Client Validation | Database |
| State Management | File Storage |
| API Consumption | Notification Service |

Setiap aplikasi hanya diperbolehkan menangani tanggung jawab yang telah ditentukan.

---

## 4.8 Development Principles

Seluruh aplikasi mengikuti prinsip berikut.

### APS-001 Independent Development

Frontend dan Backend dapat dikembangkan secara independen.

---

### APS-002 Independent Deployment

Frontend dan Backend dapat dipublikasikan secara terpisah apabila diperlukan.

---

### APS-003 API First

Seluruh komunikasi antar aplikasi menggunakan REST API.

---

### APS-004 Shared Documentation

Seluruh aplikasi menggunakan dokumentasi proyek yang sama sebagai Source of Truth.

---

### APS-005 Technology Isolation

Setiap aplikasi memiliki dependency dan konfigurasi masing-masing.

Frontend tidak bergantung pada package Backend, demikian pula sebaliknya.

---

## 4.9 General Rules

Seluruh Application Structure wajib memenuhi ketentuan berikut.

- Menggunakan Monorepo Architecture.
- Frontend dan Backend berada pada direktori **apps/**.
- Frontend tidak mengandung Business Logic.
- Backend tidak mengandung User Interface.
- Seluruh komunikasi menggunakan REST API.
- Mengikuti ENGINEERING-FOUNDATION.md.
- Mengikuti IMPLEMENTATION-PLAN.md.
- Mengikuti COMPONENT-SPEC.md.
- Mengikuti UI-GUIDELINES.md.
- Mengikuti struktur Product Module pada PRD.md.

---

## 4.10 Acceptance Criteria

Application Structure dinyatakan memenuhi standar apabila.

- Frontend dan Backend memiliki struktur yang independen.
- Setiap aplikasi memiliki tanggung jawab yang jelas.
- Frontend hanya berkomunikasi melalui REST API.
- Backend menjadi satu-satunya aplikasi yang mengakses Database.
- Dependency antar aplikasi tetap rendah (Low Coupling).
- Struktur mendukung pengembangan paralel antara Frontend dan Backend.
- Seluruh implementasi konsisten dengan ENGINEERING-FOUNDATION.md dan Monorepo Architecture.

---

# End of PART 4

PART 4 mendefinisikan struktur dasar aplikasi pada Engineering Document Management System (EDMS) Rebuild menggunakan pendekatan **Monorepo Architecture**.

Bagian ini menjadi dasar organisasi Frontend dan Backend sebelum pembahasan struktur internal yang lebih rinci pada PART berikutnya, sehingga setiap aplikasi memiliki batas tanggung jawab yang jelas, mudah dikembangkan, dan siap diintegrasikan melalui REST API.

# ==============================================================================
# PART 5 — Frontend Structure
# ==============================================================================

## 5.1 Purpose

Frontend Structure mendefinisikan organisasi direktori internal aplikasi Frontend Engineering Document Management System (EDMS) Rebuild.

Bagian ini menjadi standar resmi penyusunan source code React sehingga seluruh Feature, Component, Service, Hook, Store, dan Resource memiliki lokasi yang konsisten, mudah dipelihara, dan mudah dikembangkan.

Frontend menggunakan pendekatan **Feature-Oriented Architecture** yang dipadukan dengan **Shared Component Architecture**.

---

## 5.2 Frontend Architecture

Frontend dibangun menggunakan teknologi yang telah ditetapkan pada ENGINEERING-FOUNDATION.md.

Struktur internal aplikasi mengikuti pembagian tanggung jawab berikut.

```text
Frontend

│

├── Core

├── Features

├── Shared

├── Infrastructure

└── Resources
```

Setiap bagian memiliki fungsi yang berbeda dan tidak diperbolehkan saling mengambil alih tanggung jawab.

---

## 5.3 Frontend Directory Structure

Superseded / Historical Reference.

Struktur direktori pada section ini adalah struktur generik lama. Runtime frontend aktif mengikuti boundary resmi `app/`, `modules/`, dan `shared/` pada PART 4.4 dan PHASE 2 Current Implementation.

```text
apps/
└── frontend/
    │
    ├── public/
    │
    ├── src/
    │   │
    │   ├── app/
    │   │
    │   ├── pages/
    │   │
    │   ├── components/
    │   │
    │   ├── layouts/
    │   │
    │   ├── services/
    │   │
    │   ├── stores/
    │   │
    │   ├── hooks/
    │   │
    │   ├── routes/
    │   │
    │   ├── assets/
    │   │
    │   ├── utils/
    │   │
    │   ├── constants/
    │   │
    │   ├── types/
    │   │
    │   └── main.jsx
    │
    ├── .env
    ├── index.html
    ├── package.json
    └── vite.config.js
```

Struktur detail setiap direktori akan dijelaskan pada PART berikutnya.

---

## 5.4 Directory Responsibilities

Superseded / Historical Reference. Mapping direktori di bawah menjelaskan struktur generik lama dan bukan runtime folder architecture aktif.

| Directory | Responsibility |
|------------|----------------|
| **app/** | Root Application, Provider, dan konfigurasi global. |
| **pages/** | Seluruh halaman aplikasi sesuai Product Module. |
| **components/** | Reusable UI Components sesuai COMPONENT-SPEC.md. |
| **layouts/** | Application Layout dan Page Layout. |
| **services/** | Service Layer dan komunikasi REST API. |
| **stores/** | Global State menggunakan Zustand. |
| **hooks/** | Custom React Hooks. |
| **routes/** | Routing Configuration menggunakan React Router. |
| **assets/** | Icon, Image, Font, dan resource visual. |
| **utils/** | Utility Function yang dapat digunakan kembali. |
| **constants/** | Konstanta aplikasi. |
| **types/** | Shared Type Definition dan Model. |

---

## 5.5 Feature Organization

Superseded / Historical Reference. Feature organization runtime aktif berada pada `modules/`, bukan root `pages/`.

Seluruh Product Module berasal dari PRD.md.

Setiap halaman utama berada pada direktori:

```text
pages/
```

Contoh.

```text
pages/

├── dashboard/

├── document-register/

├── transmittal/

├── sla-monitoring/

├── escalation/

├── audit-trail/

├── storage/

├── notifications/

└── administration/
```

Seluruh Product Module memiliki struktur yang konsisten.

---

## 5.6 Shared Organization

Komponen yang digunakan oleh lebih dari satu Product Module ditempatkan pada direktori bersama.

Contoh.

```text
components/

├── layout/

├── navigation/

├── display/

├── forms/

├── feedback/

├── workflow/

└── shared/
```

Organisasi ini mengikuti COMPONENT-SPEC.md.

---

## 5.7 Layer Dependency

Hubungan antar direktori mengikuti aturan berikut.

```text
Pages

↓

Layouts

↓

Components

↓

Hooks

↓

Services

↓

REST API
```

Aturan yang berlaku.

- Pages tidak mengakses REST API secara langsung.
- Components tidak mengandung Business Logic.
- Hooks tidak mengakses Database.
- Services menjadi satu-satunya penghubung ke Backend.

---

## 5.8 Naming Convention

Seluruh direktori menggunakan format:

```text
kebab-case
```

Contoh.

```text
document-register

sla-monitoring

audit-trail
```

React Component menggunakan:

```text
PascalCase
```

Contoh.

```text
SummaryCard.jsx

DocumentTable.jsx

StatusBadge.jsx

UploadDialog.jsx
```

Custom Hook menggunakan:

```text
camelCase
```

dengan awalan:

```text
use
```

Contoh.

```text
useAuth.js

useDashboard.js

useDocumentRegister.js
```

---

## 5.9 General Rules

Seluruh struktur Frontend wajib memenuhi ketentuan berikut.

- Mengikuti Feature-Oriented Architecture.
- Mengikuti Component-Driven Development.
- Mengikuti ENGINEERING-FOUNDATION.md.
- Mengikuti IMPLEMENTATION-PLAN.md.
- Mengikuti UI-GUIDELINES.md.
- Mengikuti COMPONENT-SPEC.md.
- Tidak mengandung Business Logic pada Pages maupun Components.
- Seluruh komunikasi Backend dilakukan melalui Service Layer.

---

## 5.10 Acceptance Criteria

Frontend Structure dinyatakan memenuhi standar apabila.

- Seluruh Product Module berada pada direktori yang benar.
- Seluruh Reusable Component berada pada direktori **components/**.
- Routing dipisahkan dari Page.
- Global State dipisahkan dari Component.
- Service Layer menjadi satu-satunya akses menuju REST API.
- Struktur Frontend mudah dipahami oleh Developer maupun AI Coding Assistant.
- Seluruh implementasi konsisten dengan ENGINEERING-FOUNDATION.md, UI-GUIDELINES.md, COMPONENT-SPEC.md, dan Project Architecture.

---

# End of PART 5

PART 5 mendefinisikan organisasi internal aplikasi Frontend Engineering Document Management System (EDMS) Rebuild.

Struktur ini memastikan seluruh implementasi React mengikuti pendekatan **Feature-Oriented Architecture** dan **Component-Driven Development**, sehingga source code tetap modular, scalable, mudah dipelihara, serta konsisten dengan seluruh dokumen Source of Truth yang telah ditetapkan.

# ==============================================================================
# PART 6 — Backend Structure
# ==============================================================================

## 6.1 Purpose

Backend Structure mendefinisikan organisasi direktori internal aplikasi Backend pada Engineering Document Management System (EDMS) Rebuild.

Bagian ini menjadi standar implementasi Backend sehingga seluruh Business Logic, REST API, Database Access, Authentication, dan Service memiliki organisasi source code yang konsisten, modular, dan mudah dipelihara.

Backend dibangun menggunakan **Node.js**, **Express.js**, dan **MySQL** sesuai ENGINEERING-FOUNDATION.md.

---

## 6.2 Backend Architecture

Backend menggunakan pendekatan **Layered Architecture**.

Setiap layer memiliki tanggung jawab yang jelas sehingga Business Logic tidak bercampur dengan REST API maupun Database.

```text
Backend

│

├── Presentation Layer

├── Application Layer

├── Domain Layer

└── Infrastructure Layer
```

Pendekatan ini mempermudah proses maintenance, testing, dan scalability.

---

## 6.3 Backend Directory Structure

Struktur direktori backend mengikuti standar berikut.

```text
apps/
└── backend/
    │
    ├── src/
    │   │
    │   ├── app/
    │   │
    │   ├── config/
    │   │
    │   ├── routes/
    │   │
    │   ├── controllers/
    │   │
    │   ├── services/
    │   │
    │   ├── repositories/
    │   │
    │   ├── middleware/
    │   │
    │   ├── validators/
    │   │
    │   ├── models/
    │   │
    │   ├── utils/
    │   │
    │   ├── constants/
    │   │
    │   ├── types/
    │   │
    │   └── server.js
    │
    ├── uploads/
    │
    ├── logs/
    │
    ├── .env
    ├── package.json
    └── server.js
```

Seluruh Business Logic wajib berada di dalam direktori **src/**.

---

## 6.4 Directory Responsibilities

| Directory | Responsibility |
|------------|----------------|
| **app/** | Inisialisasi Express Application dan konfigurasi global. |
| **config/** | Konfigurasi aplikasi, database, JWT, environment, dan library. |
| **routes/** | REST API Route Definition. |
| **controllers/** | HTTP Request Handler. |
| **services/** | Business Logic aplikasi. |
| **repositories/** | Database Access Layer (MySQL). |
| **middleware/** | Authentication, Authorization, Validation, Logging, Error Handler. |
| **validators/** | Request Validation menggunakan Zod atau Validator yang digunakan proyek. |
| **models/** | Data Model dan Mapping Database. |
| **utils/** | Utility Function. |
| **constants/** | Konstanta aplikasi. |
| **types/** | Shared Type Definition. |
| **uploads/** | File hasil upload pengguna. |
| **logs/** | Application Log dan Error Log. |

---

## 6.5 Request Flow

Seluruh Request Backend mengikuti alur berikut.

```text
HTTP Request

↓

Route

↓

Middleware

↓

Controller

↓

Service

↓

Repository

↓

MySQL Database

↓

Repository

↓

Service

↓

Controller

↓

HTTP Response
```

Tidak diperbolehkan melewati salah satu layer.

---

## 6.6 Layer Responsibilities

### Routes

- Mendefinisikan Endpoint REST API.
- Tidak mengandung Business Logic.

---

### Controllers

- Menerima HTTP Request.
- Memanggil Service.
- Mengembalikan HTTP Response.

---

### Services

- Menjalankan seluruh Business Logic.
- Mengelola Workflow aplikasi.
- Mengatur transaksi bisnis.

---

### Repositories

- Berkomunikasi dengan MySQL.
- Menjalankan Query Database.
- Tidak mengandung Business Logic.

---

### Middleware

- Authentication.
- Authorization.
- Validation.
- Logging.
- Error Handling.

---

## 6.7 Module Organization

Seluruh Product Module mengikuti struktur yang konsisten.

Contoh.

```text
Document Register

│

├── Route

├── Controller

├── Service

└── Repository
```

Contoh lain.

```text
Dashboard

│

├── Route

├── Controller

├── Service

└── Repository
```

Pendekatan ini diterapkan pada seluruh Product Module.

---

## 6.8 Dependency Rules

Hubungan antar layer mengikuti aturan berikut.

```text
Route

↓

Middleware

↓

Controller

↓

Service

↓

Repository

↓

Database
```

Ketentuan yang berlaku.

- Route tidak mengakses Database.
- Controller tidak menjalankan Query.
- Service tidak menerima HTTP Request secara langsung.
- Repository tidak mengandung Business Logic.
- Database hanya diakses melalui Repository.

---

## 6.9 General Rules

Seluruh Backend Structure wajib memenuhi ketentuan berikut.

- Menggunakan Layered Architecture.
- Mengikuti Separation of Concerns.
- Mengikuti Single Responsibility Principle.
- Seluruh Business Logic berada pada Service Layer.
- Seluruh Query Database berada pada Repository Layer.
- Seluruh REST API didefinisikan pada Route Layer.
- Seluruh Request melewati Middleware apabila diperlukan.
- Mengikuti ENGINEERING-FOUNDATION.md.
- Mengikuti IMPLEMENTATION-PLAN.md.
- Mendukung REST API yang digunakan Frontend.

---

## 6.10 Acceptance Criteria

Backend Structure dinyatakan memenuhi standar apabila.

- Seluruh layer memiliki tanggung jawab yang jelas.
- Business Logic berada pada Service Layer.
- Database hanya diakses melalui Repository.
- REST API didefinisikan pada Route Layer.
- Controller hanya menangani HTTP Request dan Response.
- Middleware digunakan untuk kebutuhan lintas modul.
- Struktur Backend mudah dipahami dan mudah dikembangkan.
- Seluruh implementasi konsisten dengan ENGINEERING-FOUNDATION.md, IMPLEMENTATION-PLAN.md, dan Monorepo Architecture.

---

# End of PART 6

PART 6 mendefinisikan organisasi internal aplikasi Backend Engineering Document Management System (EDMS) Rebuild.

Struktur ini memastikan implementasi Backend mengikuti pendekatan **Layered Architecture** sehingga Business Logic, REST API, dan Database Access memiliki batas tanggung jawab yang jelas, mudah dipelihara, serta siap mendukung integrasi dengan aplikasi Frontend melalui REST API.

# ==============================================================================
# PART 7 — Shared Resources Structure
# ==============================================================================

## 7.1 Purpose

Shared Resources Structure mendefinisikan organisasi resource bersama yang digunakan oleh Frontend maupun Backend pada Engineering Document Management System (EDMS) Rebuild.

Bagian ini bertujuan memastikan bahwa resource yang bersifat umum tidak diduplikasi pada setiap Product Module, sehingga implementasi menjadi lebih konsisten, mudah dipelihara, dan mudah digunakan kembali.

Shared Resources hanya berisi resource yang dapat digunakan oleh lebih dari satu Feature atau Module.

---

## 7.2 Shared Resource Philosophy

Seluruh Shared Resource mengikuti prinsip berikut.

- Reusable.
- Single Source of Truth.
- Consistent.
- Independent.
- Easy to Maintain.
- Easy to Discover.

Resource yang hanya digunakan oleh satu Feature tidak diperbolehkan ditempatkan pada Shared Resources.

---

## 7.3 Shared Resource Categories

Shared Resources dikelompokkan menjadi beberapa kategori.

```text
Shared Resources

│

├── UI Resources

├── Application Resources

├── Utility Resources

├── Static Resources

└── Configuration Resources
```

Masing-masing kategori memiliki tanggung jawab yang berbeda.

---

## 7.4 Frontend Shared Resources

Superseded / Historical Reference. Shared resource runtime aktif berada pada `shared/`.

Shared Resource pada Frontend terdiri dari beberapa kelompok.

```text
src/

├── assets/

├── components/

├── hooks/

├── services/

├── stores/

├── utils/

├── constants/

└── types/
```

### Responsibilities

| Directory | Responsibility |
|------------|----------------|
| **assets/** | Logo, Icon, Image, Font, Illustration, dan resource visual lainnya. |
| **components/** | Reusable UI Components yang digunakan lintas Feature. |
| **hooks/** | Custom React Hooks yang digunakan kembali. |
| **services/** | Shared Service untuk komunikasi REST API. |
| **stores/** | Global State menggunakan Zustand. |
| **utils/** | Utility Function yang dapat digunakan kembali. |
| **constants/** | Konstanta global aplikasi. |
| **types/** | Shared Type Definition dan Data Model. |

---

## 7.5 Backend Shared Resources

Shared Resource pada Backend terdiri dari beberapa kelompok.

```text
src/

├── config/

├── middleware/

├── validators/

├── utils/

├── constants/

└── types/
```

### Responsibilities

| Directory | Responsibility |
|------------|----------------|
| **config/** | Konfigurasi aplikasi, database, JWT, dan environment. |
| **middleware/** | Authentication, Authorization, Logging, Validation, Error Handler. |
| **validators/** | Request Validation. |
| **utils/** | Utility Function Backend. |
| **constants/** | Konstanta Backend. |
| **types/** | Shared Type Definition Backend. |

---

## 7.6 Asset Organization

Seluruh Asset Frontend mengikuti struktur berikut.

```text
assets/

├── icons/

├── images/

├── logos/

├── illustrations/

├── fonts/

└── styles/
```

### Rules

- Logo hanya berada pada **logos/**.
- Icon hanya berada pada **icons/**.
- Font hanya berada pada **fonts/**.
- Tidak diperbolehkan mencampurkan jenis asset dalam satu direktori.
- Penamaan file mengikuti Naming Convention proyek.

---

## 7.7 Utility Organization

Utility Function merupakan fungsi umum yang dapat digunakan oleh berbagai Feature.

Contoh.

```text
utils/

├── date/

├── formatter/

├── validator/

├── storage/

├── helper/

└── converter/
```

### Rules

- Tidak mengandung Business Logic.
- Tidak melakukan Request API.
- Tidak bergantung pada Product Module tertentu.
- Mudah digunakan kembali.

---

## 7.8 Shared Resource Rules

Seluruh Shared Resources wajib memenuhi aturan berikut.

### SRS-001

Hanya resource yang digunakan oleh lebih dari satu Feature yang boleh ditempatkan pada Shared Resources.

---

### SRS-002

Resource yang hanya digunakan oleh satu Feature harus tetap berada pada Feature tersebut.

---

### SRS-003

Shared Component wajib mengikuti COMPONENT-SPEC.md.

---

### SRS-004

Shared Asset wajib mengikuti UI-GUIDELINES.md.

---

### SRS-005

Shared Resource tidak diperbolehkan mengandung Business Logic yang spesifik terhadap Product Module tertentu.

---

### SRS-006

Tidak diperbolehkan terjadi duplikasi Utility maupun Shared Component.

---

## 7.9 General Rules

Seluruh Shared Resources wajib memenuhi ketentuan berikut.

- Mengikuti prinsip Reusable First.
- Mengikuti Separation of Concerns.
- Mengikuti Single Responsibility Principle.
- Mengikuti ENGINEERING-FOUNDATION.md.
- Mengikuti COMPONENT-SPEC.md.
- Mengikuti UI-GUIDELINES.md.
- Mudah ditemukan.
- Mudah dipelihara.
- Tidak bergantung pada Feature tertentu.

---

## 7.10 Acceptance Criteria

Shared Resources Structure dinyatakan memenuhi standar apabila.

- Seluruh Shared Component berada pada direktori yang benar.
- Asset dikelompokkan berdasarkan jenisnya.
- Utility tidak mengandung Business Logic.
- Global Store dapat digunakan oleh berbagai Feature.
- Shared Service digunakan kembali oleh berbagai Module.
- Tidak terdapat duplikasi Shared Resource.
- Struktur mudah dipahami oleh Developer maupun AI Coding Assistant.
- Seluruh implementasi konsisten dengan ENGINEERING-FOUNDATION.md, COMPONENT-SPEC.md, UI-GUIDELINES.md, dan Project Architecture.

---

# End of PART 7

PART 7 mendefinisikan organisasi seluruh Shared Resources pada Engineering Document Management System (EDMS) Rebuild.

Struktur ini memastikan seluruh komponen, asset, utility, konfigurasi, dan resource bersama dikelola secara terpusat, konsisten, serta dapat digunakan kembali oleh berbagai Product Module tanpa menimbulkan duplikasi implementasi maupun ketergantungan yang tidak diperlukan.

# ==============================================================================
# PART 8 — Naming Convention
# ==============================================================================

## 8.1 Purpose

Naming Convention mendefinisikan standar penamaan seluruh direktori, file, component, function, variable, constant, hook, service, API, dan resource pada Engineering Document Management System (EDMS) Rebuild.

Tujuan utama bagian ini adalah menjaga konsistensi source code sehingga mudah dipahami oleh seluruh Developer maupun AI Coding Assistant.

Seluruh implementasi wajib mengikuti aturan penamaan yang telah ditetapkan pada dokumen ini.

---

## 8.2 General Naming Principles

Seluruh penamaan pada proyek mengikuti prinsip berikut.

- Konsisten.
- Deskriptif.
- Mudah dipahami.
- Tidak menggunakan singkatan yang tidak umum.
- Menggunakan Bahasa Inggris.
- Menghindari nama yang ambigu.
- Menggunakan format penamaan sesuai jenis resource.

---

## 8.3 Directory Naming

Seluruh direktori menggunakan format:

```text
kebab-case
```

### Example

```text
dashboard

document-register

sla-monitoring

audit-trail

storage-nas

user-management
```

### Rules

- Menggunakan huruf kecil.
- Tidak menggunakan spasi.
- Menggunakan tanda minus (-) sebagai pemisah kata.
- Nama direktori harus mewakili isi direktori.

---

## 8.4 File Naming

Penamaan file mengikuti jenis file yang digunakan.

### React Component

Menggunakan:

```text
PascalCase
```

Example

```text
DashboardLayout.jsx

SummaryCard.jsx

DocumentTable.jsx

StatusBadge.jsx

ApprovalDialog.jsx
```

---

### Custom Hook

Menggunakan:

```text
camelCase
```

dengan awalan:

```text
use
```

Example

```text
useAuth.js

useDashboard.js

useNotification.js

useDocumentRegister.js
```

---

### Service

Menggunakan:

```text
camelCase
```

dengan akhiran:

```text
Service
```

Example

```text
authService.js

dashboardService.js

documentService.js

notificationService.js
```

---

### Store

Menggunakan:

```text
camelCase
```

dengan akhiran:

```text
Store
```

Example

```text
authStore.js

dashboardStore.js

notificationStore.js
```

---

### Utility

Menggunakan:

```text
camelCase
```

Example

```text
dateFormatter.js

numberFormatter.js

storageHelper.js

fileConverter.js
```

---

## 8.5 Component Naming

Seluruh React Component menggunakan:

```text
PascalCase
```

Contoh.

```text
DashboardHeader

SummaryCard

StatusBadge

SearchInput

FilterToolbar

NotificationDropdown

HistoryButton

UploadDialog
```

Nama Component harus menggambarkan fungsi utamanya.

---

## 8.6 JavaScript Naming

### Variable

Menggunakan:

```text
camelCase
```

Contoh.

```text
documentList

selectedProject

currentRevision

isLoading
```

---

### Function

Menggunakan:

```text
camelCase
```

Contoh.

```text
fetchDashboard()

uploadDocument()

approveDocument()

downloadFile()
```

---

### Boolean

Menggunakan awalan.

```text
is

has

can

should
```

Contoh.

```text
isLoading

hasPermission

canUpload

shouldRefresh
```

---

### Constant

Menggunakan:

```text
UPPER_SNAKE_CASE
```

Contoh.

```text
API_BASE_URL

DEFAULT_PAGE_SIZE

MAX_UPLOAD_SIZE

SESSION_TIMEOUT
```

---

## 8.7 API Naming

REST API Endpoint menggunakan format:

```text
kebab-case
```

Contoh.

```text
/api/documents

/api/document-register

/api/user-management

/api/sla-monitoring

/api/notifications
```

HTTP Method mengikuti REST Standard.

```text
GET

POST

PUT

PATCH

DELETE
```

---

## 8.8 Database Naming

Penamaan database mengikuti standar berikut.

### Table

```text
snake_case
```

Contoh.

```text
documents

document_revisions

user_roles

project_members
```

---

### Column

```text
snake_case
```

Contoh.

```text
document_id

created_at

updated_at

current_status
```

---

### Primary Key

```text
id
```

atau

```text
table_name_id
```

Contoh.

```text
id

document_id

project_id
```

---

## 8.9 Naming Rules

Seluruh penamaan wajib memenuhi aturan berikut.

- Menggunakan Bahasa Inggris.
- Tidak menggunakan nama yang ambigu.
- Tidak menggunakan singkatan yang tidak umum.
- Nama harus mewakili isi atau fungsi.
- Konsisten dengan ENGINEERING-FOUNDATION.md.
- Konsisten pada seluruh Product Module.
- Mengikuti standar React dan JavaScript.
- Mengikuti struktur FILE-STRUCTURE.md.

---

## 8.10 Acceptance Criteria

Naming Convention dinyatakan memenuhi standar apabila.

- Seluruh direktori menggunakan **kebab-case**.
- Seluruh React Component menggunakan **PascalCase**.
- Seluruh Function menggunakan **camelCase**.
- Seluruh Variable menggunakan **camelCase**.
- Seluruh Constant menggunakan **UPPER_SNAKE_CASE**.
- Seluruh REST API mengikuti REST Naming Convention.
- Seluruh Database mengikuti **snake_case**.
- Tidak terdapat penamaan yang ambigu.
- Seluruh implementasi konsisten pada seluruh aplikasi.

---

# End of PART 8

PART 8 mendefinisikan standar penamaan yang digunakan pada Engineering Document Management System (EDMS) Rebuild.

Seluruh Developer dan AI Coding Assistant wajib mengikuti Naming Convention ini agar struktur source code tetap konsisten, mudah dipahami, mudah dipelihara, dan selaras dengan ENGINEERING-FOUNDATION.md serta FILE-STRUCTURE.md.

# ==============================================================================
# PART 9 — Dependency Rules
# ==============================================================================

## 9.1 Purpose

Dependency Rules mendefinisikan aturan ketergantungan (Dependency) antar direktori, layer, module, dan component pada Engineering Document Management System (EDMS) Rebuild.

Bagian ini bertujuan menjaga arsitektur aplikasi tetap konsisten, modular, dan mudah dipelihara dengan membatasi arah komunikasi antar layer.

Seluruh implementasi wajib mengikuti aturan dependency yang telah ditetapkan pada bagian ini.

---

## 9.2 Dependency Philosophy

Engineering Document Management System (EDMS) Rebuild menggunakan prinsip:

- One Direction Dependency
- Separation of Concerns
- Low Coupling
- High Cohesion
- Single Responsibility
- Feature Isolation

Setiap layer hanya diperbolehkan bergantung pada layer yang berada di bawahnya.

Layer yang lebih rendah tidak diperbolehkan bergantung pada layer yang lebih tinggi.

---

## 9.3 Overall Dependency Flow

Hubungan antar layer mengikuti arsitektur berikut.

```text
Frontend

Page

↓

Layout

↓

Feature Component

↓

Shared Component

↓

Custom Hook

↓

Service

↓

REST API

↓

Backend

↓

Route

↓

Middleware

↓

Controller

↓

Service

↓

Repository

↓

MySQL Database
```

Dependency wajib mengikuti arah tersebut.

Tidak diperbolehkan melakukan lompatan layer.

---

## 9.4 Frontend Dependency Rules

Hubungan antar direktori Frontend mengikuti aturan berikut.

```text
Page

↓

Layout

↓

Component

↓

Hook

↓

Service

↓

REST API
```

### Allowed Dependency

| Layer | Can Access |
|---------|------------|
| Pages | Layouts, Components, Hooks |
| Layouts | Components |
| Components | Hooks, Shared Components |
| Hooks | Services |
| Services | REST API |
| Stores | Services |
| Routes | Pages |
| Assets | All UI Layer |
| Utils | All Layer |

---

### Forbidden Dependency

Hal berikut tidak diperbolehkan.

```text
Page

↓

REST API
```

---

```text
Component

↓

Repository
```

---

```text
Hook

↓

Database
```

---

```text
Service

↓

UI Component
```

---

## 9.5 Backend Dependency Rules

Hubungan antar layer Backend mengikuti aturan berikut.

```text
Route

↓

Middleware

↓

Controller

↓

Service

↓

Repository

↓

Database
```

### Allowed Dependency

| Layer | Can Access |
|---------|------------|
| Route | Middleware, Controller |
| Middleware | Next Middleware, Controller |
| Controller | Service |
| Service | Repository |
| Repository | Database |
| Validator | Controller |
| Config | All Backend Layer |
| Utils | All Backend Layer |

---

### Forbidden Dependency

Tidak diperbolehkan.

```text
Route

↓

Repository
```

---

```text
Controller

↓

Database
```

---

```text
Service

↓

HTTP Request
```

---

```text
Repository

↓

REST API
```

---

## 9.6 Module Dependency Rules

Setiap Product Module harus bersifat independen.

Contoh.

```text
Dashboard
```

tidak boleh bergantung langsung pada.

```text
Administration
```

Komunikasi antar Product Module hanya diperbolehkan melalui.

- Shared Component
- Shared Hook
- Shared Service
- Shared Store
- Shared Utility

---

## 9.7 Shared Resource Dependency

Shared Resource boleh digunakan oleh seluruh Product Module.

```text
Dashboard

↓

Shared Component

↓

Shared Hook

↓

Shared Service
```

Namun.

Shared Resource tidak boleh bergantung pada Product Module tertentu.

Contoh yang tidak diperbolehkan.

```text
Shared Component

↓

Dashboard Component
```

---

## 9.8 Circular Dependency Rules

Circular Dependency tidak diperbolehkan pada seluruh proyek.

Contoh yang salah.

```text
A

↓

B

↓

C

↓

A
```

Setiap dependency harus memiliki arah yang jelas.

Apabila terdapat kebutuhan komunikasi dua arah, gunakan Service atau State Management sebagai mediator.

---

## 9.9 General Rules

Seluruh Dependency wajib memenuhi ketentuan berikut.

- Mengikuti One Direction Dependency.
- Tidak mengandung Circular Dependency.
- Mengikuti Separation of Concerns.
- Mengikuti Single Responsibility Principle.
- Mengikuti Feature-Oriented Architecture.
- Mengikuti Component-Driven Development.
- Frontend tidak mengakses Database.
- Backend tidak mengakses UI Component.
- Seluruh komunikasi Frontend dan Backend dilakukan melalui REST API.
- Mengikuti ENGINEERING-FOUNDATION.md.
- Mengikuti IMPLEMENTATION-PLAN.md.
- Mengikuti COMPONENT-SPEC.md.
- Mengikuti FILE-STRUCTURE.md.

---

## 9.10 Acceptance Criteria

Dependency Rules dinyatakan memenuhi standar apabila.

- Seluruh dependency mengikuti arah yang telah ditentukan.
- Tidak terdapat Circular Dependency.
- Product Module tetap independen.
- Shared Resource tidak bergantung pada Product Module.
- Frontend hanya berkomunikasi dengan Backend melalui REST API.
- Backend hanya mengakses Database melalui Repository Layer.
- Business Logic tidak berada pada UI Layer.
- Struktur dependency mudah dipahami oleh Developer maupun AI Coding Assistant.
- Seluruh implementasi konsisten dengan ENGINEERING-FOUNDATION.md, FILE-STRUCTURE.md, dan Project Architecture.

---

# End of PART 9

PART 9 mendefinisikan aturan dependency yang berlaku pada Engineering Document Management System (EDMS) Rebuild.

Seluruh implementasi Frontend dan Backend wajib mengikuti arah dependency yang telah ditetapkan agar arsitektur aplikasi tetap modular, memiliki **low coupling**, **high cohesion**, mudah dipelihara, serta siap dikembangkan tanpa menimbulkan ketergantungan yang tidak diperlukan.

# ==============================================================================
# PART 10 — File Structure Acceptance Criteria
# ==============================================================================

## 10.1 Purpose

File Structure Acceptance Criteria mendefinisikan standar akhir yang harus dipenuhi sebelum struktur proyek Engineering Document Management System (EDMS) Rebuild dinyatakan siap digunakan sebagai fondasi implementasi Frontend dan Backend.

Bagian ini menjadi acuan resmi bagi Product Owner, Technical Lead, Frontend Developer, Backend Developer, QA Engineer, dan AI Coding Assistant dalam melakukan verifikasi terhadap struktur proyek sebelum proses pengembangan dimulai.

---

## 10.2 Acceptance Scope

Acceptance Criteria pada dokumen ini mencakup seluruh struktur proyek, meliputi:

- Root Directory
- Frontend Structure
- Backend Structure
- Shared Resources
- Database Resources
- Naming Convention
- Dependency Rules
- Monorepo Architecture

Seluruh struktur proyek wajib memenuhi standar berikut sebelum dinyatakan siap digunakan.

---

## 10.3 Architecture Acceptance Criteria

Struktur proyek dinyatakan memenuhi standar arsitektur apabila.

| ID | Criteria | Status |
|----|----------|--------|
| ARC-001 | Menggunakan Monorepo Architecture. | ☐ |
| ARC-002 | Frontend dan Backend dipisahkan menjadi aplikasi yang independen. | ☐ |
| ARC-003 | Struktur proyek mengikuti Feature-Oriented Architecture. | ☐ |
| ARC-004 | Struktur proyek mengikuti Component-Driven Development. | ☐ |
| ARC-005 | Struktur proyek mengikuti ENGINEERING-FOUNDATION.md. | ☐ |

---

## 10.4 Root Structure Acceptance Criteria

Root Directory dinyatakan memenuhi standar apabila.

| ID | Criteria | Status |
|----|----------|--------|
| ROOT-001 | Seluruh aplikasi berada pada direktori **apps/**. | ☐ |
| ROOT-002 | Database berada pada direktori **database/**. | ☐ |
| ROOT-003 | Dokumentasi berada pada direktori **docs/**. | ☐ |
| ROOT-004 | Utility Script berada pada direktori **scripts/**. | ☐ |
| ROOT-005 | GitHub Workflow berada pada direktori **.github/**. | ☐ |
| ROOT-006 | Root Project tidak memiliki direktori yang tidak memiliki tanggung jawab yang jelas. | ☐ |

---

## 10.5 Frontend Acceptance Criteria

Frontend Structure dinyatakan memenuhi standar apabila.

Runtime acceptance aktif:

- Struktur mengikuti boundary `app/`, `modules/`, dan `shared/`.
- Module UI berada pada direktori `modules/`.
- Route, navigation, dan layout aplikasi berada pada direktori `app/`.
- Global State berada pada direktori `shared/stores/`.
- Service Layer berada pada direktori `shared/services/`.
- Shared hooks, constants, utils, dan mocks berada pada direktori `shared/`.

Tabel lama di bawah dipertahankan sebagai Historical Reference untuk struktur generik lama.

| ID | Criteria | Status |
|----|----------|--------|
| FE-001 | Struktur mengikuti Feature-Oriented Architecture. | ☐ |
| FE-002 | Reusable Component berada pada direktori **components/**. | ☐ |
| FE-003 | Seluruh halaman berada pada direktori **pages/**. | ☐ |
| FE-004 | Global State berada pada direktori **stores/**. | ☐ |
| FE-005 | Service Layer berada pada direktori **services/**. | ☐ |
| FE-006 | Routing berada pada direktori **routes/**. | ☐ |
| FE-007 | Asset mengikuti UI-GUIDELINES.md. | ☐ |

---

## 10.6 Backend Acceptance Criteria

Backend Structure dinyatakan memenuhi standar apabila.

| ID | Criteria | Status |
|----|----------|--------|
| BE-001 | Backend menggunakan Layered Architecture. | ☐ |
| BE-002 | Route hanya mendefinisikan Endpoint REST API. | ☐ |
| BE-003 | Controller hanya menangani HTTP Request dan Response. | ☐ |
| BE-004 | Business Logic berada pada Service Layer. | ☐ |
| BE-005 | Repository menjadi satu-satunya akses ke Database. | ☐ |
| BE-006 | Middleware digunakan untuk kebutuhan lintas modul. | ☐ |
| BE-007 | Seluruh Query Database berada pada Repository Layer. | ☐ |

---

## 10.7 Naming & Dependency Acceptance Criteria

Struktur proyek dinyatakan memenuhi standar apabila.

| ID | Criteria | Status |
|----|----------|--------|
| ND-001 | Seluruh direktori menggunakan **kebab-case**. | ☐ |
| ND-002 | React Component menggunakan **PascalCase**. | ☐ |
| ND-003 | Function menggunakan **camelCase**. | ☐ |
| ND-004 | Constant menggunakan **UPPER_SNAKE_CASE**. | ☐ |
| ND-005 | Database menggunakan **snake_case**. | ☐ |
| ND-006 | Tidak terdapat Circular Dependency. | ☐ |
| ND-007 | Dependency mengikuti aturan FILE-STRUCTURE.md. | ☐ |

---

## 10.8 Development Readiness Checklist

Sebelum implementasi dimulai, struktur proyek wajib memenuhi checklist berikut.

| Checklist | Status |
|-----------|--------|
| Monorepo Architecture diterapkan | ☐ |
| Frontend Structure telah dibuat | ☐ |
| Backend Structure telah dibuat | ☐ |
| Shared Resources telah disiapkan | ☐ |
| Database Structure telah disiapkan | ☐ |
| Naming Convention diterapkan | ☐ |
| Dependency Rules diterapkan | ☐ |
| Dokumentasi mengikuti FILE-STRUCTURE.md | ☐ |
| Seluruh struktur sesuai ENGINEERING-FOUNDATION.md | ☐ |
| Seluruh struktur sesuai IMPLEMENTATION-PLAN.md | ☐ |

---

## 10.9 Production Readiness

Struktur proyek dinyatakan siap digunakan apabila memenuhi seluruh kondisi berikut.

- Struktur Monorepo telah diterapkan.
- Frontend dan Backend memiliki struktur yang independen.
- Tidak terdapat direktori yang memiliki tanggung jawab ganda.
- Seluruh Shared Resources dapat digunakan lintas Product Module.
- Struktur mengikuti Feature-Oriented Architecture.
- Struktur mengikuti Component-Driven Development.
- Dependency mengikuti aturan yang telah ditetapkan.
- Seluruh penamaan mengikuti Naming Convention proyek.
- Struktur siap digunakan sebagai fondasi implementasi Frontend dan Backend.

---

## 10.10 Final Acceptance

FILE-STRUCTURE.md dinyatakan **Approved** apabila.

- Seluruh Acceptance Criteria telah terpenuhi.
- Struktur proyek konsisten dengan PRD.md.
- Struktur proyek mengikuti ENGINEERING-FOUNDATION.md.
- Struktur proyek mendukung IMPLEMENTATION-PLAN.md.
- Struktur proyek mendukung UI-GUIDELINES.md.
- Struktur proyek mendukung COMPONENT-SPEC.md.
- Struktur proyek siap digunakan sebagai standar resmi organisasi source code Engineering Document Management System (EDMS) Rebuild.
- Product Owner menyetujui struktur proyek sebagai **Project Structure Baseline**.

---

# End of PART 10

PART 10 menetapkan standar akhir yang harus dipenuhi sebelum struktur proyek Engineering Document Management System (EDMS) Rebuild dinyatakan **Approved** dan digunakan sebagai fondasi implementasi.

Setelah seluruh Acceptance Criteria pada bagian ini terpenuhi, FILE-STRUCTURE.md menjadi **Project Structure Baseline**, yaitu acuan resmi organisasi source code yang wajib diikuti oleh seluruh Developer dan AI Coding Assistant selama proses pengembangan hingga fase maintenance.

---

# PHASE 2 SOURCE OF TRUTH SYNCHRONIZATION

## Current Implementation

Struktur runtime frontend aktual berada pada `apps/frontend/src`.

Boundary resmi:

- `app/routes` untuk React Router.
- `app/navigation` untuk Sidebar Navigation.
- `app/layouts` untuk AppShell dan layout auth.
- `features/*` untuk feature module UI dan integration layer.
- `shared/api` untuk API client, interceptor, dan Query Client.
- `shared/services` untuk shared service yang masih berlaku.
- `shared/constants` untuk status, permission, action, lifecycle, SLA, role, dan storage constants.
- `shared/stores` untuk Zustand store.
- `shared/realtime` untuk SSE client, event dispatcher, event validator, dan recovery hook.
- `shared/mocks` atau mock JSON untuk historical/dev seed data apabila masih diperlukan.

Backend runtime aktual berada pada `apps/backend/src` dan menggunakan boundary:

- `routes` untuk Express route registration.
- `controllers` untuk request/response orchestration.
- `services` untuk business workflow, transaction orchestration, storage, notification, audit, realtime publisher, scheduler, dan domain logic.
- `repositories` untuk MySQL persistence/query.
- `middlewares` untuk authentication, authorization, upload, dan error handling.
- `storage` untuk Local Storage driver dan Cloudflare R2 driver.
- `validators` dan `utils` untuk validasi serta helper teknis.

Backend, database, dan storage yang sebelumnya diklasifikasikan sebagai target architecture placeholder sekarang menjadi current backend-integrated runtime untuk scope yang sudah dimigrasikan.
