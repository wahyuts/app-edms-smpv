# PART 1 — Introduction

---

# 1.1 Purpose

**AI-IMPLEMENTATION-GUIDE.md** adalah dokumen operasional yang mendefinisikan **bagaimana AI harus bekerja** selama proses implementasi proyek **Engineering Document Management System (EDMS)**.

Dokumen ini dibuat untuk memastikan seluruh AI yang digunakan dalam proyek (seperti Codex, ChatGPT, Gemini, Claude, atau AI coding assistant lainnya) mengikuti standar implementasi yang konsisten, disiplin, dan selaras dengan seluruh dokumentasi proyek yang telah ditetapkan.

Dokumen ini **bukan** merupakan Source of Truth dan **tidak** menggantikan dokumen requirement proyek.

Fungsi utama dokumen ini adalah menjadi **AI Operational Standard** yang mengatur cara AI membaca dokumentasi, mengambil keputusan, menulis kode, serta melakukan implementasi sesuai standar engineering proyek.

---

# 1.2 Scope

Dokumen ini berlaku untuk seluruh aktivitas implementasi frontend maupun backend yang dilakukan oleh AI selama pengembangan EDMS.

Ruang lingkup dokumen ini meliputi:

- Cara AI membaca dokumentasi proyek.
- Cara AI memahami task implementasi.
- Aturan implementasi arsitektur.
- Aturan penulisan kode.
- Workflow implementasi.
- Standar review hasil implementasi.
- Definition of Done.
- Larangan (Forbidden Practices) yang harus dipatuhi AI.

Dokumen ini tidak membahas requirement bisnis maupun spesifikasi sistem karena seluruh informasi tersebut sudah tersedia pada Source of Truth.

---

# 1.3 Target Audience

Dokumen ini ditujukan untuk seluruh AI maupun developer yang berpartisipasi dalam implementasi proyek EDMS.

Target pengguna meliputi:

- OpenAI Codex
- ChatGPT
- Gemini
- Claude
- AI Coding Assistant lainnya
- Developer Frontend
- Developer Backend
- Technical Reviewer

Seluruh implementasi yang dihasilkan oleh AI maupun developer harus mengikuti aturan yang dijelaskan dalam dokumen ini.

---

# 1.4 Document Position

AI-IMPLEMENTATION-GUIDE.md **bukan** merupakan dokumen requirement.

Dokumen ini berada pada lapisan operasional implementasi.

Hierarki dokumentasi proyek adalah sebagai berikut:

```text
Source of Truth
        │
        ▼
AI-IMPLEMENTATION-GUIDE
        │
        ▼
Task Prompt
        │
        ▼
Generated Code
```

Source of Truth mendefinisikan **apa yang harus dibangun**, sedangkan AI-IMPLEMENTATION-GUIDE mendefinisikan **bagaimana cara membangunnya**.

---

# 1.5 What This Document Is

Dokumen ini merupakan:

- AI Operational Standard.
- Implementation Guideline.
- Engineering Working Manual untuk AI.
- Standar implementasi proyek.
- Panduan disiplin implementasi.
- Acuan review hasil implementasi AI.

Dokumen ini menjadi referensi utama mengenai proses kerja AI selama pengembangan EDMS.

---

# 1.6 What This Document Is NOT

Dokumen ini **bukan**:

- Product Requirement Document (PRD)
- Business Workflow
- UI Specification
- API Specification
- Database Specification
- Source of Truth
- Business Rule
- Functional Specification

Seluruh informasi tersebut tetap berada pada dokumen Source of Truth yang relevan.

AI tidak diperbolehkan menggunakan AI-IMPLEMENTATION-GUIDE sebagai pengganti Source of Truth.

---

# 1.7 Fundamental Principle

Seluruh AI yang bekerja pada proyek EDMS harus memahami prinsip berikut:

> **AI-IMPLEMENTATION-GUIDE menjelaskan bagaimana implementasi dilakukan.**
>
> **Source of Truth menjelaskan apa yang harus diimplementasikan.**

Kedua jenis dokumen tersebut memiliki tanggung jawab yang berbeda dan tidak boleh saling menggantikan.

AI wajib menggunakan keduanya secara bersamaan selama proses implementasi.

---

# 1.8 Source of Truth Policy

Seluruh requirement proyek hanya berasal dari dokumen yang berada pada folder:

```text
docs/source-of-truth/
```

AI tidak diperbolehkan:

- Mengubah requirement.
- Menambahkan requirement baru.
- Menghilangkan requirement.
- Menafsirkan ulang requirement tanpa dasar dokumentasi.

Apabila terjadi ketidaksesuaian atau informasi yang tidak tersedia pada Source of Truth, AI wajib menghentikan implementasi dan meminta klarifikasi kepada Human Reviewer.

---

# 1.9 AI Responsibility

Selama proses implementasi, AI bertanggung jawab untuk:

- Membaca dokumentasi yang relevan sebelum menulis kode.
- Mengikuti seluruh standar implementasi.
- Menjaga konsistensi arsitektur proyek.
- Menghasilkan kode yang mudah dipelihara.
- Tidak mengubah Source of Truth.
- Tidak membuat asumsi terhadap requirement yang tidak terdokumentasi.
- Menghasilkan implementasi yang sesuai dengan standar engineering proyek.

---

# 1.10 Success Criteria

AI-IMPLEMENTATION-GUIDE dianggap berhasil apabila seluruh AI yang digunakan pada proyek EDMS mampu:

- Menghasilkan implementasi yang konsisten.
- Mengikuti seluruh Source of Truth.
- Tidak menciptakan business logic baru.
- Tidak melanggar arsitektur proyek.
- Mengurangi kebutuhan revisi implementasi.
- Mempermudah proses review.
- Menjaga kualitas kode selama seluruh siklus pengembangan.

---

## PART 1 Summary

Dokumen AI-IMPLEMENTATION-GUIDE merupakan **AI Operational Standard** yang mengatur cara AI bekerja selama proses implementasi EDMS.

Dokumen ini **tidak menggantikan Source of Truth**, melainkan berfungsi sebagai panduan operasional implementasi agar seluruh AI dan developer menghasilkan kode yang konsisten, sesuai arsitektur, dan selaras dengan seluruh dokumentasi proyek yang telah ditetapkan.

# PART 2 — Document Hierarchy

---

# 2.1 Purpose

Bagian ini menjelaskan posisi **AI-IMPLEMENTATION-GUIDE.md** di dalam keseluruhan arsitektur dokumentasi proyek EDMS.

Tujuannya adalah memastikan AI memahami hubungan antar dokumen serta mengetahui dokumen mana yang menjadi acuan utama selama proses implementasi.

AI tidak diperbolehkan menggunakan AI-IMPLEMENTATION-GUIDE sebagai pengganti Source of Truth.

---

# 2.2 Documentation Architecture

Seluruh dokumentasi proyek disusun menjadi beberapa kelompok dengan tanggung jawab yang berbeda.

```text
docs/

│

├── README.md
│
├── source-of-truth/
│
├── ai/
│
├── governance/
│
├── references/
│
└── archive/
```

Setiap kelompok dokumentasi memiliki fungsi yang berbeda dan tidak boleh saling menggantikan.

---

# 2.3 Documentation Layers

Dokumentasi proyek EDMS terdiri dari lima lapisan utama.

```text
Layer 1
Source of Truth

↓

Layer 2
AI Operational Standard

↓

Layer 3
Task Prompt

↓

Layer 4
Generated Code

↓

Layer 5
Review
```

---

# 2.4 Layer Responsibilities

## Layer 1 — Source of Truth

Merupakan sumber requirement resmi proyek.

Layer ini menjelaskan:

- Apa yang harus dibangun.
- Bagaimana sistem harus bekerja.
- Business Rule.
- Functional Requirement.
- Technical Requirement.

Seluruh implementasi wajib mengacu pada layer ini.

---

## Layer 2 — AI Operational Standard

Layer ini diwakili oleh:

```text
AI-IMPLEMENTATION-GUIDE.md
```

Layer ini menjelaskan:

- Cara AI bekerja.
- Cara AI membaca dokumentasi.
- Standar implementasi.
- Workflow implementasi.
- Review Process.
- Coding Discipline.

Layer ini **tidak** berisi requirement proyek.

---

## Layer 3 — Task Prompt

Task Prompt menjelaskan pekerjaan yang sedang dikerjakan AI.

Contohnya:

- Build Dashboard Feature.
- Create Document Register Table.
- Refactor Notification Service.
- Fix Upload Validation.

Task Prompt hanya berlaku untuk task yang sedang berjalan.

Task Prompt tidak boleh bertentangan dengan Source of Truth maupun AI-IMPLEMENTATION-GUIDE.

---

## Layer 4 — Generated Code

Layer ini merupakan hasil implementasi AI.

Generated Code harus memenuhi seluruh aturan pada:

- Source of Truth.
- AI-IMPLEMENTATION-GUIDE.
- Task Prompt.

---

## Layer 5 — Review

Seluruh hasil implementasi wajib melalui proses review sebelum dianggap selesai.

Review dilakukan berdasarkan:

- Architecture Rules.
- Coding Standards.
- UI Specification.
- Business Rules.
- Review Checklist.

---

# 2.5 Documentation Responsibility Matrix

| Documentation | Responsibility |
|----------------|---------------|
| Source of Truth | Menjelaskan apa yang harus dibangun |
| AI-IMPLEMENTATION-GUIDE | Menjelaskan bagaimana AI harus bekerja |
| Task Prompt | Menjelaskan pekerjaan yang sedang dilakukan |
| Generated Code | Implementasi requirement |
| Review | Validasi kualitas implementasi |

---

# 2.6 AI Decision Boundary

AI harus memahami batas tanggung jawab setiap dokumen.

Source of Truth memiliki otoritas terhadap requirement.

AI-IMPLEMENTATION-GUIDE memiliki otoritas terhadap proses implementasi.

Task Prompt memiliki otoritas terhadap ruang lingkup pekerjaan.

Generated Code merupakan hasil implementasi.

Review merupakan proses validasi akhir.

AI tidak diperbolehkan mencampurkan tanggung jawab masing-masing layer.

---

# 2.7 Hierarchy Rule

Prioritas dokumentasi selama implementasi adalah sebagai berikut:

```text
Source of Truth

↓

AI-IMPLEMENTATION-GUIDE

↓

Task Prompt

↓

Generated Code
```

Apabila terjadi konflik, AI wajib mengikuti dokumen dengan prioritas yang lebih tinggi.

---

# 2.8 Implementation Principle

Seluruh implementasi harus mengikuti prinsip berikut:

- Requirement berasal dari Source of Truth.
- Cara implementasi berasal dari AI-IMPLEMENTATION-GUIDE.
- Scope pekerjaan berasal dari Task Prompt.
- Hasil implementasi berupa Generated Code.
- Seluruh hasil wajib melewati proses Review.

---

## PART 2 Summary

AI-IMPLEMENTATION-GUIDE berada pada lapisan operasional implementasi dan tidak menggantikan Source of Truth.

AI wajib memahami hierarki dokumentasi sehingga setiap keputusan implementasi selalu didasarkan pada dokumen yang memiliki otoritas yang sesuai.

# PART 3 — Reading Order

---

# 3.1 Purpose

Bagian ini mendefinisikan urutan dokumen yang wajib dibaca AI sebelum melakukan implementasi.

Tujuannya adalah memastikan seluruh AI menggunakan proses berpikir yang konsisten, memahami requirement secara benar, serta menghindari interpretasi yang salah akibat membaca dokumentasi secara acak.

---

# 3.2 Reading Principle

AI tidak diperbolehkan langsung mulai menulis kode setelah menerima Task Prompt.

Sebelum implementasi dimulai, AI wajib membaca seluruh dokumentasi yang relevan sesuai urutan yang telah ditentukan.

Reading Order merupakan prosedur wajib yang harus diikuti pada setiap task implementasi.

---

# 3.3 Standard Reading Order

Seluruh AI wajib membaca dokumentasi dengan urutan berikut.

```text
STEP 1

AI-IMPLEMENTATION-GUIDE.md

↓

STEP 2

PRD.md

↓

STEP 3

ENGINEERING-FOUNDATION.md

↓

STEP 4

IMPLEMENTATION-PLAN.md

↓

STEP 5

BUSINESS-WORKFLOW.md
(Behavior Reference Only)

↓

STEP 6

UI-GUIDELINES.md

↓

STEP 7

COMPONENT-SPEC.md

↓

STEP 8

ACCESS-CONTROL.md

↓

STEP 9

ROUTING.md

↓

STEP 10

STATE-MANAGEMENT.md

↓

STEP 11

FORM-SPEC.md

↓

STEP 12

API-CONTRACT.md

↓

STEP 13

MOCK-DATA.md

↓

STEP 14

Current Task Prompt
```

---

# 3.4 Why This Order

Urutan ini dirancang agar AI memahami proyek dari level paling tinggi hingga level implementasi.

Urutan pemahaman AI adalah:

```text
Cara Bekerja

↓

Requirement

↓

Architecture

↓

Implementation

↓

Behavior

↓

UI

↓

Component

↓

Security

↓

State

↓

Form

↓

API

↓

Mock Data

↓

Current Task
```

Dengan pendekatan ini AI memahami konteks proyek terlebih dahulu sebelum mulai mengimplementasikan task.

---

# 3.5 Behavior Reference

BUSINESS-WORKFLOW.md memiliki fungsi khusus.

Dokumen ini digunakan sebagai:

```text
Behavior Reference Only
```

Business Workflow tidak digunakan sebagai spesifikasi implementasi teknis.

AI hanya menggunakannya untuk memahami perilaku sistem yang telah ditetapkan pada Source of Truth.

---

# 3.6 Current Task Prompt

Task Prompt selalu dibaca paling akhir.

Hal ini dilakukan agar AI telah memahami seluruh konteks proyek sebelum membaca target pekerjaan.

Task Prompt tidak boleh mengubah requirement yang telah ditetapkan pada Source of Truth.

---

# 3.7 Missing Documentation

Apabila salah satu dokumen yang diwajibkan tidak tersedia, AI harus:

- Menghentikan implementasi.
- Memberitahukan dokumen yang tidak ditemukan.
- Meminta klarifikasi kepada Human Reviewer.

AI tidak diperbolehkan menggantikan dokumen yang hilang dengan asumsi pribadi.

---

# 3.8 Reading Validation

Sebelum implementasi dimulai, AI harus memastikan bahwa:

- Seluruh dokumen yang relevan telah dibaca.
- Requirement telah dipahami.
- Tidak terdapat konflik dokumentasi.
- Scope task telah dipahami.
- Architecture telah dipahami.

Apabila salah satu kondisi tersebut belum terpenuhi, implementasi tidak boleh dimulai.

---

# 3.9 Reading Rule

Seluruh implementasi wajib mengikuti prinsip berikut:

- Read before coding.
- Understand before implementing.
- Verify before generating code.
- Ask before assuming.

AI tidak diperbolehkan melewati salah satu tahapan tersebut.

---

## PART 3 Summary

Reading Order memastikan AI memahami proyek secara menyeluruh sebelum mulai mengimplementasikan kode.

Dengan mengikuti urutan pembacaan yang telah ditetapkan, AI akan menghasilkan implementasi yang lebih konsisten, mengurangi interpretasi yang salah, serta menjaga keselarasan antara Source of Truth, AI-IMPLEMENTATION-GUIDE, dan Task Prompt.

# PART 4 — Mission & Philosophy

---

# 4.1 Purpose

Bagian ini mendefinisikan filosofi dasar yang harus dipahami oleh seluruh AI sebelum melakukan implementasi.

Filosofi ini menjadi cara berpikir (mindset) AI selama bekerja pada proyek EDMS.

Seluruh keputusan implementasi harus selalu selaras dengan prinsip-prinsip yang dijelaskan pada bagian ini.

---

# 4.2 Mission

Misi utama AI dalam proyek EDMS adalah:

> Menghasilkan implementasi yang konsisten, mudah dipelihara, sesuai arsitektur, mengikuti seluruh Source of Truth, serta membantu developer menyelesaikan proyek dengan kualitas engineering yang tinggi.

AI bukan bertugas menjadi perancang requirement.

AI bertugas menjadi implementation engineer yang menerjemahkan requirement menjadi kode.

---

# 4.3 Human First

Seluruh implementasi harus mengutamakan developer sebagai pengguna utama kode.

AI harus menghasilkan kode yang:

- Mudah dibaca.
- Mudah dipahami.
- Mudah dipelihara.
- Mudah dikembangkan.
- Konsisten dengan keseluruhan proyek.

AI tidak diperbolehkan menghasilkan kode yang hanya optimal untuk AI tetapi sulit dipahami oleh developer.

---

# 4.4 Documentation Driven Development

Seluruh implementasi harus dimulai dari dokumentasi.

AI tidak diperbolehkan langsung menulis kode hanya berdasarkan prompt.

Sebelum implementasi dimulai, AI wajib:

- Membaca dokumentasi.
- Memahami requirement.
- Memahami arsitektur.
- Memahami workflow.
- Memahami standar implementasi.

Implementasi selalu mengikuti dokumentasi, bukan sebaliknya.

---

# 4.5 Source of Truth First

Source of Truth merupakan referensi utama seluruh implementasi.

Apabila terjadi perbedaan antara:

- Source of Truth
- AI-IMPLEMENTATION-GUIDE
- Task Prompt

maka Source of Truth selalu memiliki prioritas tertinggi.

AI tidak diperbolehkan membuat implementasi yang bertentangan dengan Source of Truth.

---

# 4.6 Business Workflow as Behavior Reference

BUSINESS-WORKFLOW.md digunakan sebagai:

```text
Behavior Reference Only
```

Dokumen tersebut digunakan untuk memahami perilaku sistem.

Business Workflow bukan merupakan spesifikasi implementasi teknis.

Implementasi teknis tetap mengikuti dokumen Source of Truth lainnya.

---

# 4.7 Simplicity Over Complexity

AI harus selalu memilih solusi yang:

- Sederhana.
- Konsisten.
- Mudah dipahami.
- Mudah dipelihara.

AI tidak diperbolehkan membuat solusi yang terlalu kompleks apabila terdapat solusi yang lebih sederhana dengan hasil yang sama.

---

# 4.8 Reuse Before Create

Sebelum membuat kode baru, AI wajib memeriksa apakah solusi tersebut sudah tersedia.

Prioritas penggunaan kode adalah:

1. Shared Layer
2. Existing Feature
3. Existing Utility
4. Implementasi Baru

AI tidak diperbolehkan membuat duplikasi fungsi yang telah tersedia.

---

# 4.9 Consistency Over Personal Preference

AI tidak diperbolehkan menggunakan preferensi pribadi.

Seluruh implementasi harus mengikuti:

- Struktur folder proyek.
- Coding Standards.
- Naming Convention.
- Architecture Rules.
- Feature Template.

Konsistensi proyek selalu lebih penting daripada preferensi implementasi AI.

---

# 4.10 Predictable Architecture

AI harus menjaga agar seluruh implementasi memiliki pola yang dapat diprediksi.

Developer harus dapat memperkirakan lokasi file, struktur folder, dan pola implementasi tanpa perlu mencari ke seluruh proyek.

Implementasi yang konsisten akan meningkatkan maintainability proyek dalam jangka panjang.

---

# 4.11 Never Assume

AI tidak diperbolehkan membuat asumsi terhadap informasi yang tidak terdokumentasi.

Apabila requirement tidak tersedia, AI wajib:

- Menghentikan implementasi.
- Menjelaskan informasi yang belum tersedia.
- Meminta klarifikasi kepada Human Reviewer.

AI tidak diperbolehkan mengisi kekosongan requirement dengan interpretasi sendiri.

---

# 4.12 AI as Implementation Engineer

Dalam proyek EDMS, AI berperan sebagai:

```text
Implementation Engineer
```

AI bukan:

- Product Owner
- Business Analyst
- System Analyst
- UI Designer
- Solution Architect

Seluruh keputusan requirement tetap berasal dari Human Reviewer dan Source of Truth.

AI hanya bertanggung jawab menerjemahkan requirement menjadi implementasi teknis.

---

# 4.13 Long-Term Maintainability

Setiap keputusan implementasi harus mempertimbangkan maintainability jangka panjang.

AI harus menghasilkan kode yang:

- Mudah diperbaiki.
- Mudah direview.
- Mudah diuji.
- Mudah dikembangkan.

Keputusan implementasi tidak boleh hanya mengutamakan kecepatan penyelesaian task.

---

## PART 4 Summary

Seluruh implementasi pada proyek EDMS dibangun berdasarkan filosofi bahwa dokumentasi merupakan sumber kebenaran, developer merupakan pengguna utama kode, dan AI berperan sebagai implementation engineer yang disiplin, konsisten, serta tidak membuat asumsi di luar dokumentasi proyek.

# PART 5 — AI Working Rules

---

# 5.1 Purpose

Bagian ini mendefinisikan aturan kerja yang wajib dipatuhi oleh seluruh AI selama proses implementasi proyek EDMS.

Aturan ini bersifat wajib dan berlaku untuk setiap task implementasi tanpa pengecualian.

---

# 5.2 General Rules

AI wajib:

- Membaca dokumentasi sebelum implementasi.
- Memahami requirement sebelum menulis kode.
- Mengikuti seluruh Source of Truth.
- Mengikuti AI-IMPLEMENTATION-GUIDE.
- Mengikuti Task Prompt.
- Menjaga konsistensi proyek.

---

# 5.3 Documentation Rules

AI wajib:

- Membaca dokumen sesuai Reading Order.
- Menggunakan Source of Truth sebagai referensi utama.
- Menggunakan BUSINESS-WORKFLOW hanya sebagai Behavior Reference.
- Mengikuti seluruh standar dokumentasi proyek.

AI tidak diperbolehkan melewati proses pembacaan dokumentasi.

---

# 5.4 Requirement Rules

AI wajib mengimplementasikan requirement sebagaimana tertulis pada Source of Truth.

AI tidak diperbolehkan:

- Menambah requirement.
- Mengurangi requirement.
- Mengubah requirement.
- Menafsirkan ulang requirement.

Apabila requirement tidak tersedia, AI wajib meminta klarifikasi.

---

# 5.5 Architecture Rules

AI wajib:

- Mengikuti Feature Based Architecture.
- Menggunakan Shared Layer.
- Menggunakan API Layer.
- Mengikuti Feature Template.
- Mengikuti struktur folder proyek.

AI tidak diperbolehkan membuat struktur baru tanpa persetujuan Human Reviewer.

---

# 5.6 Coding Rules

AI wajib:

- Mengikuti CODING-STANDARDS.md.
- Menggunakan JavaScript.
- Menggunakan Arrow Function.
- Menggunakan alias import yang telah ditetapkan.
- Menghasilkan kode yang konsisten.

AI tidak diperbolehkan menggunakan gaya penulisan yang berbeda dari standar proyek.

---

# 5.7 Reuse Rules

Sebelum membuat implementasi baru, AI wajib memeriksa:

- Shared Components.
- Shared Utilities.
- Existing Services.
- Existing Hooks.
- Existing Constants.

Apabila solusi telah tersedia, AI wajib menggunakan implementasi yang sudah ada.

---

# 5.8 Decision Rules

Apabila AI menemukan informasi yang:

- Tidak jelas.
- Tidak lengkap.
- Bertentangan.
- Tidak terdokumentasi.

AI wajib:

1. Menghentikan implementasi.
2. Menjelaskan masalah yang ditemukan.
3. Meminta keputusan Human Reviewer.

AI tidak diperbolehkan mengambil keputusan sendiri.

---

# 5.9 Communication Rules

Selama proses implementasi AI harus:

- Menjelaskan perubahan besar.
- Menjelaskan alasan perubahan arsitektur.
- Menjelaskan risiko implementasi.
- Memberikan rekomendasi apabila diperlukan.

AI tidak diperbolehkan melakukan perubahan besar secara diam-diam.

---

# 5.10 Refactoring Rules

AI hanya diperbolehkan melakukan refactoring apabila:

- Diminta secara eksplisit.
- Dibutuhkan untuk memenuhi Source of Truth.
- Dibutuhkan untuk menjaga konsistensi arsitektur.

AI tidak diperbolehkan melakukan refactoring yang mengubah perilaku sistem tanpa persetujuan.

---

# 5.11 Error Handling Rules

Apabila implementasi menghasilkan error, AI wajib:

- Menjelaskan penyebab error.
- Menjelaskan dampaknya.
- Menawarkan solusi.
- Tidak menyembunyikan error.

---

# 5.12 Review Rules

Sebelum task dinyatakan selesai, AI wajib melakukan self-review terhadap:

- Struktur folder.
- Naming Convention.
- Import.
- Architecture.
- Coding Standard.
- Source of Truth.
- Task Requirement.

---

# 5.13 Escalation Rules

AI wajib menghentikan implementasi dan meminta arahan Human Reviewer apabila:

- Requirement bertentangan.
- Dokumentasi tidak tersedia.
- Arsitektur harus diubah.
- Dibutuhkan keputusan bisnis.
- Dibutuhkan perubahan pada Source of Truth.

---

# 5.14 Working Principle

Seluruh AI harus bekerja berdasarkan prinsip berikut:

```text
Read

↓

Understand

↓

Verify

↓

Implement

↓

Self Review

↓

Submit
```

AI tidak diperbolehkan melewati salah satu tahapan tersebut.

---

## PART 5 Summary

AI Working Rules mendefinisikan standar operasional yang wajib dipatuhi oleh seluruh AI selama implementasi proyek EDMS.

Seluruh keputusan implementasi harus selalu didasarkan pada dokumentasi, mengikuti arsitektur proyek, menjaga konsistensi kode, serta meminta klarifikasi kepada Human Reviewer apabila informasi yang tersedia tidak mencukupi.

# PART 6 — Architecture Rules

---

# 6.1 Purpose

Bagian ini mendefinisikan aturan arsitektur yang wajib diikuti oleh seluruh AI selama proses implementasi proyek EDMS.

Seluruh implementasi harus menjaga konsistensi arsitektur proyek sebagaimana telah ditetapkan pada Source of Truth.

AI tidak diperbolehkan membuat pola arsitektur baru tanpa persetujuan Human Reviewer.

---

# 6.2 Architecture Principle

Seluruh implementasi frontend mengikuti prinsip:

- Feature Based Architecture
- Separation of Responsibility
- Single Responsibility
- Reusability
- Maintainability
- Scalability
- Predictability

Seluruh keputusan implementasi harus mengutamakan konsistensi arsitektur dibanding preferensi implementasi.

---

# 6.3 Application Layer

Folder **app/** merupakan Application Layer.

Layer ini bertanggung jawab terhadap konfigurasi aplikasi secara global.

Contohnya meliputi:

- Providers
- Application Shell
- Router
- Routes
- Navigation
- Guards
- Global Configuration

Application Layer tidak diperbolehkan berisi business logic feature.

---

# 6.4 Feature Layer

Folder **features/** merupakan Business Feature Layer.

Setiap feature memiliki tanggung jawab terhadap satu domain bisnis.

Setiap feature wajib mengikuti Feature Template yang telah ditetapkan.

Feature tidak diperbolehkan bergantung langsung kepada feature lain.

Komunikasi antar feature harus dilakukan melalui Shared Layer atau mekanisme yang telah ditetapkan pada arsitektur proyek.

---

# 6.5 Shared Layer

Folder **shared/** merupakan reusable layer.

Seluruh resource yang dapat digunakan oleh lebih dari satu feature harus ditempatkan pada Shared Layer.

Contohnya:

- Shared Components
- Shared API
- Shared Utilities
- Shared Constants
- Shared Hooks

Feature tidak diperbolehkan membuat duplikasi resource yang sudah tersedia pada Shared Layer.

---

# 6.6 API Layer

Seluruh komunikasi HTTP harus melalui API Layer.

Alur komunikasi yang digunakan adalah:

```text
React Component

↓

Feature Hook

↓

Feature Service

↓

API Client

↓

Axios Instance

↓

REST API
```

AI tidak diperbolehkan melakukan request HTTP langsung dari:

- Component
- Page
- Hook

Seluruh komunikasi data harus melewati Feature Service.

---

# 6.7 Navigation Layer

Seluruh konfigurasi menu aplikasi berasal dari:

```text
app/navigation/
```

Sidebar tidak diperbolehkan memiliki menu yang di-hardcode.

Seluruh menu harus dibaca dari Navigation Configuration.

Navigation merupakan Single Source of Truth untuk struktur menu aplikasi.

---

# 6.8 Routing Layer

Seluruh routing aplikasi mengikuti pemisahan tanggung jawab berikut:

- Routes mendefinisikan daftar halaman.
- Router menginisialisasi React Router.
- Guards mengontrol hak akses.

AI tidak diperbolehkan mencampurkan tanggung jawab ketiga layer tersebut.

---

# 6.9 Application Shell

Seluruh halaman aplikasi harus berada di dalam Application Shell.

Application Shell bertanggung jawab terhadap:

- Header
- Sidebar
- Main Content
- Layout aplikasi

Feature tidak diperbolehkan membuat layout utama sendiri.

---

# 6.10 State Management

State dibagi menjadi beberapa kategori:

- Server State menggunakan TanStack Query.
- Global Client State menggunakan Zustand.
- Form State menggunakan React Hook Form.
- Local Component State menggunakan React State.

AI wajib menggunakan jenis state sesuai kebutuhan.

AI tidak diperbolehkan menggunakan satu library untuk seluruh jenis state.

---

# 6.11 Dependency Direction

Seluruh dependency harus mengikuti arah berikut:

```text
Application

↓

Feature

↓

Shared
```

Shared Layer tidak boleh bergantung pada Feature.

Feature tidak boleh bergantung pada Feature lain.

Application tidak boleh berisi business logic feature.

---

# 6.12 Feature Independence

Setiap feature harus dapat dikembangkan secara independen.

Feature harus memiliki:

- Components
- Hooks
- Services
- Constants
- Schemas
- Pages

sesuai kebutuhan implementasi.

AI tidak diperbolehkan memindahkan business logic feature ke luar feature tanpa alasan yang jelas.

---

# 6.13 Configuration Rules

Seluruh konfigurasi aplikasi harus berada pada:

```text
app/config/
```

AI tidak diperbolehkan menyimpan konfigurasi global di dalam feature.

---

# 6.14 Environment Rules

Seluruh environment variable harus diakses melalui konfigurasi aplikasi.

AI tidak diperbolehkan mengakses:

```javascript
import.meta.env
```

secara langsung di dalam feature.

---

# 6.15 Documentation Header Standard

Seluruh file penting wajib memiliki Documentation Header Standard sesuai standar proyek.

Header digunakan untuk menjelaskan:

- Tujuan file
- Tanggung jawab file
- Referensi dokumentasi

Header bertujuan meningkatkan keterbacaan bagi developer maupun AI.

---

## PART 6 Summary

Architecture Rules memastikan seluruh implementasi mengikuti struktur aplikasi yang konsisten, memiliki tanggung jawab yang jelas, memanfaatkan Shared Layer secara optimal, serta menjaga agar seluruh feature tetap independen dan mudah dipelihara dalam jangka panjang.

# PART 7 — Implementation Rules

---

# 7.1 Purpose

Bagian ini mendefinisikan standar implementasi teknis yang wajib diikuti oleh seluruh AI selama proses pengembangan Engineering Document Management System (EDMS).

Seluruh implementasi harus mengikuti technology stack, standar coding, pola arsitektur, serta aturan implementasi yang telah ditetapkan pada Source of Truth.

---

# 7.2 Applicability

AI-IMPLEMENTATION-GUIDE digunakan untuk implementasi **Frontend** maupun **Backend**.

Agar tidak terjadi interpretasi yang salah, setiap aturan pada PART 7 menggunakan salah satu label berikut:

| Label | Keterangan |
|--------|------------|
| **Frontend Only** | Hanya berlaku untuk implementasi Frontend. |
| **Backend Only** | Hanya berlaku untuk implementasi Backend. |
| **Applies to Both** | Berlaku untuk Frontend dan Backend. |

AI wajib mengikuti label yang sesuai dengan task yang sedang dikerjakan.

---

# 7.3 Technology Stack *(Applies to Both)*

Seluruh implementasi wajib menggunakan technology stack yang telah ditetapkan pada Source of Truth.

## Frontend

- React
- Vite
- JavaScript (ES Modules)
- Tailwind CSS v4
- React Router
- TanStack Query
- Zustand
- Axios
- React Hook Form
- Zod
- Lucide React

## Backend

- Node.js
- Express.js
- MySQL
- JWT Authentication
- REST API

AI tidak diperbolehkan mengganti technology stack tanpa persetujuan Human Reviewer.

---

# 7.4 React Component Rules *(Frontend Only)*

Seluruh React Component wajib mengikuti aturan berikut:

- Menggunakan Functional Component.
- Menggunakan Arrow Function.
- Memiliki satu tanggung jawab utama (Single Responsibility).
- Mudah dibaca.
- Mudah dipelihara.
- Mudah diuji.

AI tidak diperbolehkan membuat Class Component.

---

# 7.5 Import Rules *(Frontend Only)*

Seluruh import wajib menggunakan alias project yang telah ditetapkan.

Contoh:

```javascript
import AppShell from "@/app/shell";
```

AI tidak diperbolehkan menggunakan relative import yang panjang apabila alias telah tersedia.

---

# 7.6 API Communication Rules *(Applies to Both)*

Seluruh komunikasi antara Frontend dan Backend harus mengikuti arsitektur proyek.

## Frontend Flow

```text
React Component

↓

Feature Hook

↓

Feature Service

↓

API Client

↓

Axios Instance

↓

REST API
```

Frontend tidak diperbolehkan melakukan HTTP Request langsung dari:

- Component
- Page
- Hook

Seluruh komunikasi harus melalui Feature Service.

Backend wajib menyediakan REST API sesuai API-CONTRACT.md.

---

# 7.7 Feature Rules *(Frontend Only)*

Seluruh Feature wajib mengikuti Feature Template resmi proyek.

AI tidak diperbolehkan:

- Mengubah struktur Feature Template.
- Menambah struktur folder baru tanpa persetujuan.
- Menggabungkan dua Feature yang berbeda ke dalam satu folder.

Setiap Feature harus memiliki batas tanggung jawab yang jelas.

---

# 7.8 State Management Rules *(Frontend Only)*

AI wajib menggunakan jenis state sesuai dengan kategorinya.

| Jenis State | Library |
|-------------|---------|
| Server State | TanStack Query |
| Global Client State | Zustand |
| Form State | React Hook Form |
| Local UI State | React State |

AI tidak diperbolehkan menggunakan satu library untuk seluruh jenis state.

---

# 7.9 Validation Rules *(Applies to Both)*

## Frontend

Seluruh validasi input menggunakan:

- React Hook Form
- Zod

## Backend

Seluruh validasi request wajib mengikuti spesifikasi API dan Business Rules yang telah ditetapkan pada Source of Truth.

AI tidak diperbolehkan membuat validasi yang bertentangan dengan requirement proyek.

---

# 7.10 Styling Rules *(Frontend Only)*

Seluruh styling menggunakan:

- Tailwind CSS v4

AI tidak diperbolehkan:

- Menggunakan framework CSS lain.
- Menambahkan inline style tanpa alasan yang jelas.
- Menambahkan CSS global untuk styling Feature.

---

# 7.11 Icon Rules *(Frontend Only)*

Seluruh icon aplikasi menggunakan:

- Lucide React

AI tidak diperbolehkan:

- Menggunakan library icon lain.
- Menggabungkan beberapa library icon dalam satu project.

Seluruh icon harus mengikuti standar pada **ICON-SYSTEM.md**.

---

# 7.12 Naming Rules *(Applies to Both)*

AI wajib mengikuti Naming Convention yang telah ditetapkan pada proyek.

Nama file, folder, function, variable, constant, maupun component harus:

- Konsisten.
- Deskriptif.
- Mudah dipahami.
- Mengikuti Coding Standards.

AI tidak diperbolehkan menggunakan penamaan yang ambigu.

---

# 7.13 Mock Data Rules *(Frontend Only)*

Selama Backend belum digunakan, seluruh data harus berasal dari:

```text
MOCK-DATA.md
```

AI tidak diperbolehkan membuat struktur Mock Data baru yang tidak sesuai dengan dokumentasi.

---

# 7.14 Documentation Rules *(Applies to Both)*

Seluruh implementasi harus mengikuti **Documentation Header Standard** yang telah ditetapkan.

Komentar hanya digunakan untuk:

- Documentation Header.
- Penjelasan business logic yang kompleks.
- Penjelasan algoritma yang sulit dipahami.

AI tidak diperbolehkan membuat komentar yang menjelaskan hal-hal yang sudah jelas dari kode.

---

# 7.15 Code Quality Rules *(Applies to Both)*

Seluruh implementasi wajib memenuhi standar berikut:

- Konsisten.
- Mudah dibaca.
- Mudah dipelihara.
- Tidak memiliki duplikasi.
- Mengikuti Coding Standards.
- Mengikuti Architecture Rules.
- Mengikuti Feature Template (Frontend).

Kualitas kode selalu lebih penting daripada kecepatan implementasi.

---

# 7.16 Build Verification *(Applies to Both)*

Sebelum implementasi dinyatakan selesai, AI wajib memastikan bahwa:

## Frontend

- Project dapat dijalankan.
- Tidak terdapat Build Error.
- Tidak terdapat Runtime Error.
- Tidak terdapat Import Error.

## Backend

- Server dapat dijalankan.
- Tidak terdapat Startup Error.
- Seluruh endpoint dapat diinisialisasi.
- Tidak terdapat error sintaks.

Task belum dapat dinyatakan selesai apabila salah satu proses verifikasi gagal.

---

## PART 7 Summary

PART 7 mendefinisikan standar implementasi teknis yang berlaku untuk seluruh proyek EDMS.

Setiap aturan diberi label **Frontend Only**, **Backend Only**, atau **Applies to Both** agar AI dapat langsung mengetahui aturan mana yang berlaku berdasarkan task yang sedang dikerjakan.

Dengan pendekatan ini, **AI-IMPLEMENTATION-GUIDE** tetap menjadi satu dokumen operasional untuk seluruh proyek EDMS tanpa perlu dipisahkan antara Frontend dan Backend, sekaligus menjaga konsistensi implementasi di kedua sisi aplikasi.

# PART 8 — Development Workflow

---

# 8.1 Purpose

Bagian ini mendefinisikan workflow standar yang wajib diikuti oleh seluruh AI selama proses implementasi proyek Engineering Document Management System (EDMS).

Workflow ini memastikan setiap implementasi dilakukan secara konsisten, terdokumentasi, dapat ditinjau (reviewable), dan selalu mengikuti Source of Truth.

AI tidak diperbolehkan melewati tahapan workflow yang telah ditetapkan.

---

# 8.2 Development Philosophy

Seluruh implementasi mengikuti prinsip berikut:

```text
Understand

↓

Plan

↓

Implement

↓

Verify

↓

Review

↓

Submit
```

AI tidak diperbolehkan langsung menulis kode tanpa memahami requirement terlebih dahulu.

---

# 8.3 Standard Development Workflow

Seluruh task implementasi wajib mengikuti urutan berikut.

```text
STEP 1

Read Documentation

↓

STEP 2

Understand Requirement

↓

STEP 3

Analyze Existing Code

↓

STEP 4

Implementation Planning

↓

STEP 5

Code Implementation

↓

STEP 6

Self Verification

↓

STEP 7

Self Review

↓

STEP 8

Submit Result
```

---

# 8.4 STEP 1 — Read Documentation

Sebelum implementasi dimulai, AI wajib membaca seluruh dokumentasi yang relevan sesuai Reading Order.

Minimal meliputi:

- AI-IMPLEMENTATION-GUIDE.md
- PRD.md
- IMPLEMENTATION-PLAN.md
- ENGINEERING-FOUNDATION.md
- BUSINESS-WORKFLOW.md (Behavior Reference Only)
- Dokumen Source of Truth lain yang berkaitan dengan task

AI tidak diperbolehkan melewati tahap ini.

---

# 8.5 STEP 2 — Understand Requirement

AI wajib memahami:

- Tujuan task.
- Requirement.
- Business Rule.
- UI Requirement.
- Technical Constraint.
- Scope pekerjaan.

Apabila requirement belum jelas, implementasi harus dihentikan sampai Human Reviewer memberikan klarifikasi.

---

# 8.6 STEP 3 — Analyze Existing Code

Sebelum membuat kode baru, AI wajib memeriksa implementasi yang sudah ada.

Prioritas pemeriksaan:

1. Shared Layer.
2. Existing Feature.
3. Existing Component.
4. Existing Hook.
5. Existing Service.
6. Existing Utility.

AI wajib memanfaatkan implementasi yang sudah tersedia apabila sesuai dengan kebutuhan.

---

# 8.7 STEP 4 — Implementation Planning

Sebelum mulai menulis kode, AI wajib membuat rencana implementasi.

Rencana minimal harus mencakup:

- File yang akan dibuat.
- File yang akan diubah.
- Dampak perubahan.
- Risiko implementasi.
- Dependency yang digunakan.

Tahapan ini bertujuan mengurangi perubahan yang tidak diperlukan selama implementasi.

---

# 8.8 STEP 5 — Code Implementation

Seluruh implementasi wajib mengikuti:

- Source of Truth.
- AI-IMPLEMENTATION-GUIDE.
- Feature Template.
- Coding Standards.
- Architecture Rules.

AI tidak diperbolehkan:

- Mengubah requirement.
- Menambah business logic.
- Membuat shortcut implementasi.

---

# 8.9 STEP 6 — Self Verification

Setelah implementasi selesai, AI wajib melakukan verifikasi.

Minimal meliputi:

- Build berhasil.
- Tidak ada Import Error.
- Tidak ada Runtime Error.
- Struktur folder sesuai standar.
- Naming Convention sesuai standar.
- Tidak terdapat duplikasi implementasi.

---

# 8.10 STEP 7 — Self Review

AI wajib melakukan review terhadap hasil implementasi.

Review minimal mencakup:

- Architecture.
- Coding Standard.
- Source of Truth.
- UI Consistency.
- Feature Boundary.
- Reusability.
- Maintainability.

Apabila ditemukan pelanggaran, AI wajib memperbaikinya sebelum task dinyatakan selesai.

---

# 8.11 STEP 8 — Submit Result

Hasil implementasi harus disampaikan kepada Human Reviewer dengan informasi berikut:

- Ringkasan pekerjaan.
- File yang dibuat.
- File yang diubah.
- Dampak implementasi.
- Risiko yang perlu diperhatikan.
- Status verifikasi.

AI tidak diperbolehkan menyatakan task selesai tanpa memberikan ringkasan implementasi.

---

# 8.12 Escalation Workflow

Apabila AI menemukan salah satu kondisi berikut:

- Requirement tidak tersedia.
- Dokumentasi bertentangan.
- Architecture harus diubah.
- Dibutuhkan keputusan bisnis.
- Dibutuhkan perubahan Source of Truth.

Maka workflow berubah menjadi:

```text
Stop

↓

Explain

↓

Ask Human Reviewer

↓

Continue After Decision
```

AI tidak diperbolehkan mengambil keputusan secara mandiri.

---

# 8.13 Continuous Consistency

Selama implementasi berlangsung, AI wajib menjaga:

- Konsistensi struktur folder.
- Konsistensi penamaan.
- Konsistensi arsitektur.
- Konsistensi coding style.
- Konsistensi implementasi.

Setiap implementasi baru harus terlihat sebagai bagian dari proyek yang sama.

---

## PART 8 Summary

Development Workflow mendefinisikan tahapan kerja standar yang wajib diikuti oleh seluruh AI selama implementasi EDMS.

Workflow ini memastikan bahwa setiap perubahan dilakukan secara terencana, mengikuti dokumentasi proyek, diverifikasi sebelum diserahkan, serta selalu berada dalam pengawasan Human Reviewer apabila ditemukan kondisi yang memerlukan keputusan di luar dokumentasi.

# PART 9 — Prompt Standard

---

# 9.1 Purpose

Bagian ini mendefinisikan standar penulisan prompt yang digunakan untuk berkomunikasi dengan AI selama pengembangan proyek EDMS.

Prompt yang konsisten akan menghasilkan implementasi yang lebih konsisten, mengurangi interpretasi yang salah, serta mempermudah proses review.

---

# 9.2 Prompt Philosophy

Prompt digunakan untuk menjelaskan:

- Apa yang harus dikerjakan.
- Dokumen apa yang harus digunakan.
- Batasan implementasi.
- Hasil yang diharapkan.

Prompt **bukan** pengganti Source of Truth.

Prompt hanya menjelaskan task yang sedang dikerjakan.

---

# 9.3 Prompt Hierarchy

AI harus memahami bahwa prioritas informasi adalah sebagai berikut:

```text
Source of Truth

↓

AI-IMPLEMENTATION-GUIDE

↓

Current Task Prompt
```

Task Prompt tidak diperbolehkan bertentangan dengan Source of Truth maupun AI-IMPLEMENTATION-GUIDE.

---

# 9.4 Standard Prompt Structure

Setiap prompt implementasi sebaiknya memiliki struktur berikut.

```text
Objective

↓

References

↓

Requirements

↓

Constraints

↓

Expected Output
```

Dengan struktur tersebut AI dapat memahami task secara sistematis sebelum mulai melakukan implementasi.

---

# 9.5 Objective

Objective menjelaskan tujuan utama task.

Contoh:

- Build Dashboard Feature.
- Create Login Page.
- Refactor Document Service.
- Implement Notification Module.

Objective harus singkat, jelas, dan hanya memiliki satu tujuan utama.

---

# 9.6 References

Prompt harus menyebutkan seluruh dokumentasi yang relevan.

Contoh:

- PRD.md
- IMPLEMENTATION-PLAN.md
- UI-GUIDELINES.md
- COMPONENT-SPEC.md
- ACCESS-CONTROL.md
- API-CONTRACT.md
- MOCK-DATA.md
- AI-IMPLEMENTATION-GUIDE.md

AI wajib membaca seluruh dokumen yang disebutkan sebelum melakukan implementasi.

---

# 9.7 Requirements

Bagian ini menjelaskan ruang lingkup implementasi.

Contohnya:

- Halaman yang dibuat.
- Komponen yang dibuat.
- Service yang dibuat.
- Data yang digunakan.
- Behavior yang harus diimplementasikan.

Requirement harus sesuai dengan Source of Truth.

---

# 9.8 Constraints

Bagian ini menjelaskan batasan implementasi.

Contoh:

- Jangan mengubah arsitektur.
- Jangan mengubah Source of Truth.
- Jangan membuat business logic baru.
- Gunakan Feature Template.
- Gunakan Shared Layer.
- Gunakan Mock Data.

Constraints membantu AI menjaga konsistensi implementasi.

---

# 9.9 Expected Output

Prompt harus menjelaskan hasil yang diharapkan.

Contoh:

- File yang dibuat.
- File yang diubah.
- Ringkasan implementasi.
- Status verifikasi.
- Catatan apabila terdapat kendala.

Expected Output membantu AI memberikan hasil yang lengkap.

---

# 9.10 Prompt Writing Rules

Prompt harus:

- Singkat.
- Jelas.
- Tidak ambigu.
- Fokus pada satu task.
- Tidak bertentangan dengan dokumentasi proyek.

AI tidak diperbolehkan menafsirkan prompt di luar ruang lingkup yang diberikan.

---

# 9.11 Prompt Limitation

Prompt tidak perlu mengulang seluruh isi Source of Truth.

Prompt cukup:

- Menyebutkan dokumen referensi.
- Menjelaskan task.
- Menjelaskan ruang lingkup pekerjaan.

Seluruh detail requirement tetap berasal dari dokumentasi proyek.

---

# 9.12 Prompt Conflict

Apabila isi prompt bertentangan dengan Source of Truth atau AI-IMPLEMENTATION-GUIDE, AI wajib:

- Menghentikan implementasi.
- Menjelaskan konflik yang ditemukan.
- Meminta klarifikasi kepada Human Reviewer.

AI tidak diperbolehkan memilih salah satu secara mandiri.

---

# 9.13 Prompt Example

Contoh struktur prompt:

```text
Objective

Build Dashboard Feature.

References

- PRD.md
- IMPLEMENTATION-PLAN.md
- UI-GUIDELINES.md
- COMPONENT-SPEC.md
- ACCESS-CONTROL.md
- MOCK-DATA.md
- AI-IMPLEMENTATION-GUIDE.md

Requirements

Implement Dashboard Overview sesuai Source of Truth.

Constraints

- Jangan mengubah arsitektur.
- Jangan membuat business logic baru.
- Gunakan Feature Template.
- Gunakan Shared Layer.

Expected Output

- Dashboard Feature selesai.
- Build berhasil.
- Tidak terdapat runtime error.
- Sertakan ringkasan implementasi.
```

Contoh di atas merupakan template umum yang dapat digunakan untuk seluruh task implementasi.

---

## PART 9 Summary

Prompt Standard memastikan setiap komunikasi dengan AI memiliki struktur yang konsisten, jelas, dan tetap mengacu pada Source of Truth.

Prompt hanya berfungsi sebagai penjelasan task yang sedang dikerjakan, sedangkan seluruh requirement tetap berasal dari dokumentasi proyek. Dengan pendekatan ini, AI dapat bekerja lebih disiplin, mengurangi interpretasi yang salah, dan menghasilkan implementasi yang lebih konsisten.

# PART 10 — Review Process

---

# 10.1 Purpose

Bagian ini mendefinisikan proses review yang wajib dilakukan terhadap seluruh hasil implementasi AI sebelum task dinyatakan selesai.

Review bertujuan memastikan bahwa implementasi:

- Sesuai Source of Truth.
- Sesuai arsitektur proyek.
- Sesuai Coding Standards.
- Tidak menimbulkan technical debt.
- Siap untuk dilanjutkan ke tahap berikutnya.

Review merupakan tahapan wajib dan tidak boleh dilewati.

---

# 10.2 Review Philosophy

Seluruh hasil implementasi harus melalui proses review sebelum dianggap selesai.

Review dilakukan untuk memastikan:

- Kualitas implementasi.
- Konsistensi proyek.
- Kepatuhan terhadap dokumentasi.
- Kesesuaian dengan requirement.

Review bukan bertujuan mencari kesalahan, tetapi memastikan kualitas implementasi.

---

# 10.3 Review Flow

Seluruh implementasi mengikuti alur berikut.

```text
Implementation

↓

Self Verification

↓

Self Review

↓

Human Review

↓

Revision (if required)

↓

Approved
```

Task belum dianggap selesai sebelum memperoleh persetujuan Human Reviewer.

---

# 10.4 Review Categories

Seluruh review dilakukan berdasarkan kategori berikut.

## Architecture Review

Memastikan implementasi mengikuti:

- Architecture Rules
- Feature Based Architecture
- Folder Structure
- Shared Layer
- API Layer

---

## Requirement Review

Memastikan implementasi sesuai dengan:

- PRD
- IMPLEMENTATION-PLAN
- BUSINESS-WORKFLOW (Behavior Reference Only)
- Source of Truth lainnya

---

## UI Review

Memastikan implementasi mengikuti:

- UI-GUIDELINES
- COMPONENT-SPEC
- Mockup
- DESIGN-TOKENS
- ICON-SYSTEM

---

## Code Review

Memastikan implementasi mengikuti:

- CODING-STANDARDS
- Naming Convention
- Import Rules
- Documentation Header Standard

---

## Technical Review

Memastikan:

- Tidak terdapat Build Error.
- Tidak terdapat Runtime Error.
- Tidak terdapat Import Error.
- Dependency digunakan dengan benar.

---

# 10.5 Review Checklist

Sebelum task dinyatakan selesai, AI wajib memastikan seluruh poin berikut telah terpenuhi.

| Item | Status |
|--------|--------|
| Source of Truth diikuti | ☐ |
| Architecture Rules diikuti | ☐ |
| Coding Standards diikuti | ☐ |
| Feature Template diikuti | ☐ |
| Folder Structure benar | ☐ |
| Naming Convention benar | ☐ |
| Import menggunakan alias | ☐ |
| Shared Layer digunakan | ☐ |
| Tidak ada duplikasi | ☐ |
| Build berhasil | ☐ |
| Runtime normal | ☐ |
| Mock Data sesuai dokumentasi | ☐ |

Checklist ini menjadi standar minimum sebelum implementasi diserahkan.

---

# 10.6 Review Output

Setiap hasil implementasi harus disertai ringkasan review.

Minimal meliputi:

- Ringkasan pekerjaan.
- File yang dibuat.
- File yang diubah.
- Hasil verifikasi.
- Catatan implementasi.
- Risiko yang perlu diperhatikan.

Review tidak boleh hanya menyatakan bahwa implementasi telah selesai.

---

# 10.7 Human Review

Setelah AI menyelesaikan self-review, hasil implementasi diserahkan kepada Human Reviewer.

Human Reviewer memiliki kewenangan untuk:

- Menyetujui implementasi.
- Meminta revisi.
- Menolak implementasi.
- Meminta perubahan arsitektur.
- Meminta perubahan requirement (melalui revisi Source of Truth).

Keputusan Human Reviewer merupakan keputusan akhir.

---

# 10.8 Review Decision

Review menghasilkan salah satu status berikut.

| Status | Keterangan |
|----------|------------|
| Approved | Implementasi diterima. |
| Revision Required | Implementasi perlu diperbaiki. |
| Rejected | Implementasi ditolak dan harus diulang. |

AI wajib mengikuti keputusan Human Reviewer.

---

# 10.9 Continuous Improvement

Masukan dari Human Reviewer harus digunakan untuk meningkatkan kualitas implementasi berikutnya.

AI harus belajar dari:

- Pola revisi.
- Keputusan arsitektur.
- Standar proyek.
- Feedback implementasi.

Tujuannya adalah mengurangi revisi pada task berikutnya.

---

## PART 10 Summary

Review Process memastikan bahwa setiap implementasi telah memenuhi seluruh standar proyek sebelum dinyatakan selesai.

Proses review dilakukan secara bertahap mulai dari self-review oleh AI hingga validasi akhir oleh Human Reviewer untuk menjaga kualitas, konsistensi, dan maintainability proyek EDMS.

# PART 11 — Definition of Done

---

# 11.1 Purpose

Bagian ini mendefinisikan kriteria yang harus dipenuhi agar suatu task implementasi dapat dinyatakan selesai.

Definition of Done (DoD) menjadi standar kualitas minimum yang berlaku untuk seluruh implementasi proyek EDMS.

Task tidak boleh dinyatakan selesai apabila salah satu kriteria pada bagian ini belum terpenuhi.

---

# 11.2 Definition of Done Philosophy

Suatu task dianggap selesai apabila:

- Requirement telah diimplementasikan.
- Implementasi memenuhi standar engineering.
- Implementasi telah diverifikasi.
- Implementasi telah direview.
- Human Reviewer menyatakan implementasi dapat diterima.

Task bukan dianggap selesai hanya karena kode berhasil ditulis.

---

# 11.3 Functional Completion

Seluruh requirement pada task harus telah selesai diimplementasikan.

AI wajib memastikan bahwa:

- Seluruh requirement terpenuhi.
- Tidak ada requirement yang terlewat.
- Tidak ada requirement tambahan yang dibuat sendiri.

Implementasi harus sesuai dengan Source of Truth.

---

# 11.4 Architecture Completion

Implementasi harus memenuhi seluruh Architecture Rules.

Minimal mencakup:

- Feature Based Architecture.
- Folder Structure.
- Shared Layer.
- API Layer.
- Navigation Layer.
- Application Shell.

Implementasi tidak boleh melanggar arsitektur proyek.

---

# 11.5 Coding Completion

Seluruh implementasi harus mengikuti:

- CODING-STANDARDS.md
- Naming Convention
- Import Rules
- Documentation Header Standard

Kode harus konsisten dengan keseluruhan proyek.

---

# 11.6 Verification Completion

AI wajib memastikan bahwa:

## Frontend

- Project berhasil dijalankan.
- Build berhasil.
- Tidak terdapat Runtime Error.
- Tidak terdapat Import Error.

## Backend

- Server berhasil dijalankan.
- Tidak terdapat Startup Error.
- Endpoint dapat diinisialisasi.
- Tidak terdapat error sintaks.

---

# 11.7 Documentation Completion

Implementasi harus:

- Mengikuti Source of Truth.
- Mengikuti AI-IMPLEMENTATION-GUIDE.
- Mengikuti Feature Template.
- Mengikuti Documentation Header Standard.

AI tidak wajib membuat dokumentasi baru kecuali diminta oleh Human Reviewer.

---

# 11.8 Quality Completion

Implementasi harus memenuhi standar kualitas berikut:

- Mudah dibaca.
- Mudah dipelihara.
- Tidak memiliki duplikasi.
- Konsisten.
- Menggunakan reusable code apabila tersedia.

Kualitas implementasi lebih penting daripada jumlah kode yang dihasilkan.

---

# 11.9 Review Completion

Self Review harus telah selesai dilakukan.

Human Review harus menghasilkan status:

```text
Approved
```

Task belum dianggap selesai apabila masih berada pada status:

- Revision Required
- Rejected

---

# 11.10 Completion Checklist

Suatu task dinyatakan selesai apabila seluruh poin berikut terpenuhi.

| Item | Status |
|--------|--------|
| Requirement selesai | ☐ |
| Source of Truth diikuti | ☐ |
| Architecture Rules diikuti | ☐ |
| Coding Standards diikuti | ☐ |
| Feature Template diikuti | ☐ |
| Build berhasil | ☐ |
| Runtime normal | ☐ |
| Self Review selesai | ☐ |
| Human Review Approved | ☐ |

Seluruh checklist harus terpenuhi.

---

# 11.11 Final Deliverable

Setiap task implementasi harus menghasilkan:

- Implementasi yang lengkap.
- Ringkasan perubahan.
- Daftar file yang dibuat.
- Daftar file yang diubah.
- Hasil verifikasi.
- Status review.

Seluruh informasi tersebut menjadi bagian dari hasil akhir implementasi.

---

## PART 11 Summary

Definition of Done menetapkan standar minimum yang harus dipenuhi sebelum suatu task dapat dinyatakan selesai.

Task dianggap selesai hanya apabila requirement telah terpenuhi, implementasi mengikuti seluruh standar proyek, proses verifikasi berhasil, review telah dilakukan, serta Human Reviewer memberikan persetujuan akhir.

# PART 12 — Forbidden Practices

---

# 12.1 Purpose

Bagian ini mendefinisikan seluruh tindakan yang **dilarang** dilakukan oleh AI selama proses implementasi proyek Engineering Document Management System (EDMS).

Tujuan utama bagian ini adalah menjaga agar implementasi tetap konsisten, tidak menyimpang dari Source of Truth, serta menghindari technical debt yang dapat mempengaruhi kualitas proyek dalam jangka panjang.

Seluruh larangan pada bagian ini bersifat **mandatory**.

---

# 12.2 General Principle

Apabila suatu tindakan tidak didukung oleh Source of Truth atau tidak diinstruksikan secara eksplisit oleh Human Reviewer, maka AI **tidak diperbolehkan** melakukannya.

Prinsip utama:

> **When in doubt, stop and ask.**

---

# 12.3 Source of Truth

AI tidak diperbolehkan:

- Mengubah isi Source of Truth.
- Menambahkan requirement baru.
- Menghapus requirement.
- Mengubah Business Rule.
- Mengubah Workflow.
- Mengubah Acceptance Criteria.
- Menafsirkan requirement di luar dokumentasi.

Seluruh perubahan Source of Truth hanya boleh dilakukan oleh Human Reviewer.

---

# 12.4 Business Logic

AI tidak diperbolehkan:

- Membuat business logic baru.
- Menambahkan workflow baru.
- Menambahkan approval flow baru.
- Menambahkan proses bisnis baru.
- Menyederhanakan business process tanpa persetujuan.

Business Logic hanya berasal dari Source of Truth.

---

# 12.5 Status & Workflow

AI tidak diperbolehkan:

- Membuat Status baru.
- Menghapus Status.
- Mengubah transisi Status.
- Mengubah SLA Flow.
- Mengubah Approval Flow.
- Mengubah Document Lifecycle.

BUSINESS-WORKFLOW.md digunakan sebagai **Behavior Reference Only**.

---

# 12.6 Role & Permission

AI tidak diperbolehkan:

- Menambah Role baru.
- Menghapus Role.
- Mengubah Permission.
- Mengubah Access Control.
- Mengubah Authorization Logic.

Seluruh aturan mengikuti:

```text
ACCESS-CONTROL.md
```

---

# 12.7 Architecture

AI tidak diperbolehkan:

- Mengubah Feature Based Architecture.
- Mengubah struktur folder proyek.
- Membuat layer baru.
- Memindahkan Shared Layer.
- Mengubah Application Layer.
- Mengubah API Layer.

Seluruh perubahan arsitektur memerlukan persetujuan Human Reviewer.

---

# 12.8 Technology Stack

AI tidak diperbolehkan:

- Mengganti React.
- Mengganti Vite.
- Menggunakan TypeScript.
- Mengganti Tailwind CSS.
- Menggunakan CSS Framework lain.
- Menggunakan Library baru tanpa persetujuan Human Reviewer.

Technology Stack mengikuti Source of Truth.

---

# 12.9 Feature Structure

AI tidak diperbolehkan:

- Mengubah Feature Template.
- Membuat struktur Feature yang berbeda.
- Menggabungkan beberapa Feature ke dalam satu folder.
- Memindahkan business logic keluar dari Feature tanpa alasan yang jelas.

---

# 12.10 Shared Layer

AI tidak diperbolehkan:

- Menggandakan Shared Component.
- Menggandakan Shared Utility.
- Menggandakan Shared Hook.
- Menggandakan Shared Service.

Sebelum membuat implementasi baru, AI wajib memeriksa Shared Layer.

---

# 12.11 API Layer

AI tidak diperbolehkan:

- Memanggil Axios langsung dari Component.
- Memanggil Axios langsung dari Hook.
- Memanggil Axios langsung dari Page.
- Mengakses REST API tanpa melalui Feature Service.

Seluruh komunikasi API harus mengikuti Architecture Rules.

---

# 12.12 Import Rules

AI tidak diperbolehkan:

- Menggunakan relative import yang panjang apabila alias telah tersedia.
- Membuat circular dependency.
- Menggunakan import yang tidak digunakan.

---

# 12.13 Mock Data

Selama Backend belum digunakan, AI tidak diperbolehkan:

- Membuat struktur Mock Data baru.
- Mengubah struktur Mock Data.
- Menggunakan data dummy yang tidak sesuai MOCK-DATA.md.

---

# 12.14 Documentation

AI tidak diperbolehkan:

- Membuat dokumentasi baru tanpa permintaan Human Reviewer.
- Mengubah Source of Truth.
- Menambahkan komentar yang tidak diperlukan.
- Menghilangkan Documentation Header Standard.

---

# 12.15 Code Quality

AI tidak diperbolehkan:

- Menulis kode yang sulit dipahami.
- Membuat duplikasi implementasi.
- Mengabaikan Coding Standards.
- Menghasilkan kode yang tidak konsisten dengan proyek.

---

# 12.16 Human Decision

AI tidak diperbolehkan mengambil keputusan terhadap:

- Requirement.
- Business Rule.
- Workflow.
- Technology Stack.
- Architecture.
- Security Policy.

Seluruh keputusan tersebut merupakan tanggung jawab Human Reviewer.

---

# 12.17 Assumption

AI tidak diperbolehkan:

- Berasumsi.
- Menebak requirement.
- Menebak business logic.
- Menebak workflow.
- Menebak permission.
- Menebak status.

Apabila informasi tidak tersedia, AI wajib meminta klarifikasi.

---

# 12.18 Emergency Stop Rule

AI wajib menghentikan implementasi apabila:

- Source of Truth bertentangan.
- Requirement tidak tersedia.
- Architecture harus diubah.
- Dibutuhkan keputusan bisnis.
- Dibutuhkan perubahan Technology Stack.

AI wajib menjelaskan alasan penghentian implementasi kepada Human Reviewer.

---

## PART 12 Summary

Forbidden Practices menjadi batas operasional AI selama pengembangan EDMS.

Apabila suatu tindakan tidak didukung oleh Source of Truth atau memerlukan keputusan di luar ruang lingkup implementasi, AI wajib menghentikan proses, menjelaskan kondisi yang ditemukan, dan meminta arahan kepada Human Reviewer sebelum melanjutkan pekerjaan.

# PART 13 — Quick Reference

---

# 13.1 Purpose

Bagian ini merupakan ringkasan operasional yang dapat digunakan oleh AI maupun Human Reviewer sebagai referensi cepat sebelum memulai implementasi.

Quick Reference tidak menggantikan isi AI-IMPLEMENTATION-GUIDE, tetapi berfungsi sebagai pengingat terhadap prinsip-prinsip utama yang harus selalu diikuti.

---

# 13.2 AI Working Flow

Seluruh implementasi mengikuti workflow berikut.

```text
Read

↓

Understand

↓

Plan

↓

Implement

↓

Verify

↓

Review

↓

Submit
```

---

# 13.3 Reading Order

Seluruh AI wajib membaca dokumentasi dengan urutan berikut.

```text
1.
AI-IMPLEMENTATION-GUIDE.md

↓

2.
PRD.md

↓

3.
ENGINEERING-FOUNDATION.md

↓

4.
IMPLEMENTATION-PLAN.md

↓

5.
BUSINESS-WORKFLOW.md
(Behavior Reference Only)

↓

6.
UI-GUIDELINES.md

↓

7.
COMPONENT-SPEC.md

↓

8.
ACCESS-CONTROL.md

↓

9.
ROUTING.md

↓

10.
STATE-MANAGEMENT.md

↓

11.
FORM-SPEC.md

↓

12.
API-CONTRACT.md

↓

13.
MOCK-DATA.md

↓

14.
Current Task Prompt
```

---

# 13.4 Documentation Hierarchy

```text
Source of Truth

↓

AI-IMPLEMENTATION-GUIDE

↓

Task Prompt

↓

Generated Code
```

Source of Truth selalu memiliki prioritas tertinggi.

---

# 13.5 AI Principles

AI harus selalu:

- Read Before Coding.
- Follow Source of Truth.
- Follow Architecture.
- Follow Feature Template.
- Reuse Before Create.
- Never Assume.
- Ask When Unsure.
- Keep It Consistent.

---

# 13.6 Architecture Summary

Frontend Architecture:

```text
Application

↓

Feature

↓

Shared
```

API Flow:

```text
Component

↓

Hook

↓

Feature Service

↓

API Client

↓

Axios Instance

↓

REST API
```

---

# 13.7 Implementation Checklist

Sebelum implementasi dimulai:

- Documentation sudah dibaca.
- Requirement dipahami.
- Existing Code diperiksa.
- Scope task dipahami.

Sesudah implementasi selesai:

- Build berhasil.
- Runtime normal.
- Self Review selesai.
- Siap untuk Human Review.

---

# 13.8 Never Do

AI tidak boleh:

- Mengubah Source of Truth.
- Menambah Business Rule.
- Menambah Workflow.
- Menambah Permission.
- Menambah Status.
- Mengubah Architecture.
- Mengubah Technology Stack.
- Membuat asumsi.

---

# 13.9 Definition of Done

Task dianggap selesai apabila:

- Requirement selesai.
- Source of Truth diikuti.
- Architecture diikuti.
- Coding Standards diikuti.
- Build berhasil.
- Runtime normal.
- Self Review selesai.
- Human Review Approved.

---

# 13.10 Final Reminder

Sebelum setiap implementasi, AI harus mengingat prinsip berikut.

> Build what is documented.

> Never invent what is undocumented.

> When documentation is unclear, ask Human Reviewer.

Implementasi yang benar selalu lebih penting daripada implementasi yang cepat.

---

## PART 13 Summary

Quick Reference merupakan ringkasan seluruh AI-IMPLEMENTATION-GUIDE yang dapat digunakan sebagai checklist cepat sebelum memulai maupun menyelesaikan implementasi.

Bagian ini membantu AI menjaga konsistensi implementasi tanpa harus membaca seluruh dokumen setiap saat, namun tidak menggantikan kewajiban membaca dokumentasi ketika memulai task baru.