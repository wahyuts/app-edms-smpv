# EDMS v3.0 --- ENGINEERING FOUNDATION

## Technology Stack & Development Architecture

**Status:** Frozen

**Purpose:** Menjadi referensi resmi Technology Stack, Development
Strategy, dan Engineering Architecture.

# 1. Official Tech Stack --- EDMS

## Frontend

  Category          Technology
  ----------------- ------------------
  Framework         React 19 + Vite
  Language          JavaScript (JSX)
  Styling           Tailwind CSS
  Routing           React Router
  HTTP Client       Axios
  Server State      TanStack Query
  Client State      Zustand
  Form Management   React Hook Form
  Validation        Zod
  Icons             Lucide React
  Build Tool        Vite

## Backend

  Category           Technology
  ------------------ -----------------
  Runtime            Node.js
  Framework          Express.js
  Authentication     JWT
  Password Hashing   bcrypt
  Token Storage      HttpOnly Cookie
  Database           MySQL

## Database

  Category                  Technology
  ------------------------- ------------
  DBMS                      MySQL
  Development Environment   XAMPP

# 2. Authentication Strategy

-   JWT dibuat oleh Backend setelah Login berhasil.
-   JWT disimpan menggunakan HttpOnly Cookie.
-   JWT tidak disimpan di LocalStorage maupun SessionStorage.
-   Browser mengirim Cookie secara otomatis.
-   Frontend menyimpan Authentication State menggunakan Zustand.
-   Axios menggunakan withCredentials: true.

# 3. Frontend Development Strategy

Development: React UI -\> Service Layer -\> Mock JSON

Production: React UI -\> Service Layer -\> REST API -\> Node.js +
Express.js

Frontend tidak boleh mengakses Mock JSON atau REST API secara langsung.

# 4. Data Source Strategy

Development: Mock JSON -\> Service Layer -\> React Components

Production: REST API -\> Service Layer -\> React Components

# 5. Local Storage Policy

Digunakan hanya untuk: - Theme Preference - Sidebar Collapse State - UI
Preference

Tidak digunakan untuk: - JWT - Access Token - Refresh Token - Password -
Session Data - Data Bisnis EDMS

# 6. React Coding Style

-   JavaScript (.jsx)
-   Functional Components
-   Arrow Functions
-   ES Modules

# 7. State Management Strategy

-   TanStack Query untuk Server State
-   Zustand untuk Client/UI State
-   Zustand untuk Authentication State

# 8. Folder Philosophy

Feature First Architecture.

# 9. API Philosophy

React -\> Axios -\> Service Layer -\> Express REST API

Component tidak boleh memanggil Axios secara langsung.

# 10. Form Strategy

-   React Hook Form
-   Zod

# 11. Architecture Philosophy

Business -\> PRD -\> Engineering Documents -\> Codex -\> Source Code

# Project Freeze

-   Business Workflow
-   System Requirements
-   Feature Mapping
-   PRD v3.0
-   Technology Stack
-   Development Strategy
-   Architecture

---

# PHASE 2 SOURCE OF TRUTH SYNCHRONIZATION

## Current Implementation

Foundation runtime saat ini:

- React + Vite sebagai frontend.
- React Router sebagai routing.
- TanStack Query sebagai server-state simulation.
- Zustand sebagai global UI/project context state.
- React Hook Form dan Zod untuk form dan validation pada form yang telah dimigrasikan.
- Service Layer sebagai boundary data access.
- Fake API, mock JSON, IndexedDB, dan localStorage sebagai runtime persistence development.

## Target Architecture

Target produksi tetap:

- Frontend tidak memanggil database atau storage production langsung.
- Backend REST API menjadi owner business enforcement production.
- Authentication production menggunakan secure backend session dan HttpOnly Cookie.
- Database production mengikuti DATABASE-SCHEMA.md setelah backend tersedia.
- File storage production mengikuti STORAGE-STRATEGY.md setelah backend tersedia.

Selama backend belum tersedia, Service Layer frontend menjadi executable reference untuk behaviour yang harus dipertahankan oleh backend.

---

# STORAGE ARCHITECTURE ALIGNMENT

Backend runtime menjadi authority untuk storage path. Frontend hanya mengirim business payload dan `temporaryFileId`.

Canonical identity:

- Database Project Identity: `projects.id`.
- Physical Storage Project Directory: `projects.project_code`.
- Document storage folder: `documents/{DOCUMENT_NUMBER}`.
- Revision storage folder: `revisions/{REVISION}`.

Canonical permanent revision storage key:

```text
projects/{PROJECT_CODE}/documents/{DOCUMENT_NUMBER}/revisions/{REVISION}/{PHYSICAL_FILE_NAME}
```

Canonical revision vocabulary:

```text
IFR-Submitted
IFA-Submitted
AS-Built
```

Revision tidak sama dengan Workflow Status. Storage memakai revision label, bukan status workflow.

Physical filename:

```text
{DOCUMENT_NUMBER}_{REVISION}_{SUBMIT_DATE_YYYYMMDD}_{SHORT_FILE_ID}_{SANITIZED_ORIGINAL_FILE_NAME}
```

Download tetap memakai `original_file_name` sebagai user-facing filename. `storage_key` harus relative dan portable untuk Local Storage, NAS, dan Object Storage/R2.

Workflow attachment disimpan di:

```text
attachments/process-comments/
attachments/project-comments/
```

Temporary upload lifecycle tetap: temporary upload -> backend validation -> permanent promotion -> permanent relation -> temporary cleanup.
