# STORAGE-STRATEGY.md

> **Document Status:** Draft  
> **Phase:** Storage Strategy Design  
> **Part:** 1 — Storage Philosophy  
> **Version:** v0.1  
> **Last Updated:** 2026-07-21  
> **Status:** Draft for Review

---

# 1. Purpose

Dokumen ini mendefinisikan filosofi dasar penyimpanan (Storage Philosophy) untuk seluruh sistem Engineering Document Management System (EDMS).

Storage Strategy menjadi acuan utama dalam merancang:

- Database Schema
- File Upload Service
- File Download Service
- Document Viewer
- Revision Management
- Workflow Attachment
- Archive
- Project Close
- Backup & Recovery
- Future Storage Migration

Dokumen ini **tidak membahas implementasi teknis**, library backend, maupun source code.

---

# 2. Scope

Storage Strategy hanya mengatur seluruh objek yang berhubungan dengan file digital.

Termasuk:

- Document File
- Revision File
- Workflow Attachment
- Preview Source
- Download Source
- Storage Metadata

Storage Strategy **tidak mengatur**:

- Database Schema
- REST API
- Authentication
- Authorization
- UI
- Frontend Logic
- Business Workflow

---

# 3. Design Principles

Seluruh keputusan Storage Strategy harus mengikuti prinsip berikut.

## ST-001 — Database is Metadata, Not File Storage

Database hanya menyimpan metadata file.

File fisik **tidak disimpan** di dalam database.

Database hanya mengetahui:

- identitas file
- lokasi file
- atribut file
- hubungan file dengan entity lain

---

## ST-002 — Single Source of File Truth

Setiap file fisik hanya memiliki **satu metadata resmi**.

Seluruh modul harus mengakses file melalui metadata tersebut.

Tidak diperbolehkan setiap modul menyimpan path file masing-masing.

---

## ST-003 — Separation of Business Data and File Data

Data bisnis dan data file merupakan dua domain yang berbeda.

Contoh:

Business Data

- Project
- Document
- Revision
- Workflow
- Comment

File Data

- PDF
- Image
- Excel
- Word
- Attachment

Keduanya saling berelasi tetapi tidak saling bergantung secara fisik.

---

## ST-004 — Storage Independent Architecture

Storage Strategy tidak boleh bergantung pada media penyimpanan tertentu.

Implementasi harus tetap berlaku apabila suatu saat sistem menggunakan:

- Local Storage
- NAS
- SAN
- Object Storage
- Cloud Storage

Perubahan media penyimpanan tidak boleh mengubah Business Logic maupun Database Schema secara signifikan.

---

## ST-005 — Relative Reference Only

Sistem tidak boleh bergantung pada absolute path.

Seluruh referensi penyimpanan harus menggunakan identifier atau relative reference yang dapat dipindahkan ke storage lain tanpa mengubah data bisnis.

---

## ST-006 — File Identity Never Changes

Setiap file memiliki identitas unik.

Identitas file tidak berubah walaupun:

- dipindahkan ke storage lain
- dipindahkan ke NAS
- dipindahkan ke Cloud
- folder berubah
- nama file fisik berubah

Identity merupakan acuan utama sistem.

---

## ST-007 — Metadata Drives Access

Viewer, Download, Preview, Revision maupun Attachment tidak boleh membaca file secara langsung.

Seluruh akses file harus melalui metadata resmi.

Dengan demikian seluruh validasi dapat dilakukan sebelum file dibuka.

---

## ST-008 — Storage Must Support Multi Project

Storage harus mampu melayani banyak Project secara bersamaan.

Data antar Project harus benar-benar terisolasi.

File dari Project A tidak boleh dapat diakses melalui referensi Project B.

---

## ST-009 — Storage Must Preserve History

Storage tidak boleh menghilangkan histori file.

Revision lama tetap merupakan bagian dari histori sistem.

Workflow Attachment juga merupakan histori dan tidak boleh diperlakukan sebagai Revision.

---

## ST-010 — Storage Must Be Deterministic

Satu file harus selalu menghasilkan satu lokasi penyimpanan yang dapat ditentukan secara konsisten.

Storage tidak boleh bergantung pada kondisi runtime maupun browser.

---

# 4. Storage Philosophy

## PH-001 — Business Owns Files

Setiap file selalu dimiliki oleh sebuah proses bisnis.

Tidak ada file yang berdiri sendiri.

Minimal setiap file harus memiliki hubungan dengan salah satu entity berikut:

- Document
- Revision
- Workflow Comment

---

## PH-002 — Project Owns Every File

Seluruh file harus berada di bawah kepemilikan sebuah Project.

Tidak diperbolehkan terdapat file yang tidak memiliki Project.

Project menjadi boundary utama seluruh proses penyimpanan.

---

## PH-003 — Document Owns Revision

Revision merupakan turunan dari Document.

Revision tidak boleh berpindah ke Document lain.

Seluruh histori Revision tetap menjadi milik Document tersebut.

---

## PH-004 — Workflow Attachment Is Independent From Revision

Attachment pada Approval B/C bukan merupakan Revision.

Attachment hanya menjadi bukti komunikasi dalam Workflow.

Attachment tidak pernah menjadi Active Document.

---

## PH-005 — Active File Is a Business Concept

Document hanya memiliki satu Active File pada satu waktu.

Perubahan Active File terjadi melalui proses bisnis seperti Upload Revision.

Storage tidak menentukan Active File.

Business Workflow yang menentukan.

---

## PH-006 — Archive Does Not Move Files

Proses Archive hanya mengubah status bisnis.

Lokasi fisik file tidak berubah.

Seluruh histori tetap tersedia.

---

## PH-007 — Restore Does Not Restore Storage

Restore hanya mengubah status Document.

Tidak ada proses pemindahan file secara fisik.

---

## PH-008 — Project Close Does Not Move Files

Ketika Project ditutup:

- Project menjadi Closed
- Document menjadi Archived sesuai aturan bisnis
- File tetap berada pada lokasi penyimpanan yang sama

Storage tidak melakukan reorganisasi file.

---

## PH-009 — Storage Is Immutable

Setelah file berhasil disimpan secara permanen:

- isi file tidak boleh diubah
- lokasi file tidak boleh berubah oleh proses bisnis biasa

Perubahan dokumen dilakukan melalui Revision baru, bukan mengubah file lama.

---

## PH-010 — File Deletion Is Exceptional

Penghapusan file fisik bukan bagian dari proses bisnis normal.

Business Workflow menggunakan:

- Archive
- Restore
- Project Close

bukan penghapusan file.

Kebijakan penghapusan fisik hanya dapat dilakukan melalui kebijakan retensi atau administrasi sistem di masa depan.

---

# 5. Storage Ownership Model

Model kepemilikan file mengikuti hierarki berikut.

```text
Project
    │
    └── Document
            │
            ├── Revision
            │      │
            │      └── File
            │
            └── Workflow Comment
                    │
                    └── Attachment
```

Prinsip utama:

- Project memiliki Document.
- Document memiliki Revision.
- Revision memiliki File.
- Workflow Comment memiliki Attachment.
- Attachment bukan Revision.
- Attachment bukan Active Document.

---

# 6. File Categories

Storage mengenali beberapa kategori file.

Kategori digunakan sebagai klasifikasi penyimpanan, bukan sebagai Business Workflow.

Kategori awal:

- Active Document File
- Revision File
- Workflow Attachment

Kategori lain dapat ditambahkan di masa depan tanpa mengubah filosofi Storage.

---

# 7. General Rules

## STR-001

Satu metadata hanya merepresentasikan satu file fisik.

---

## STR-002

Satu file fisik hanya memiliki satu identitas resmi.

---

## STR-003

Viewer selalu membuka Active File sesuai Business Workflow.

---

## STR-004

History selalu mengacu pada Revision yang dipilih.

---

## STR-005

Workflow Attachment hanya dapat diakses melalui Workflow Comment.

---

## STR-006

Archive tidak mengubah lokasi file.

---

## STR-007

Restore tidak mengubah lokasi file.

---

## STR-008

Project Close tidak memindahkan file.

---

## STR-009

Storage tidak menentukan Business Workflow.

Business Workflow menentukan file mana yang aktif.

---

## STR-010

Storage tidak boleh mengandung aturan bisnis yang hanya berlaku pada Frontend.

---

# 8. Out of Scope

Part ini belum membahas:

- Struktur folder
- Naming Convention
- Relative Path
- Storage Key
- Upload Flow
- Temporary Upload
- Checksum
- MIME Validation
- File Size Validation
- Backup
- Recovery
- NAS
- Object Storage
- Cloud Storage
- Security
- Access Control

Seluruh topik tersebut akan dibahas pada Part berikutnya.

---

# 9. Phase Boundary

Part ini hanya mendefinisikan filosofi penyimpanan.

Part ini tidak mengubah:

- Business Workflow
- Source of Truth
- Database Schema
- Backend API
- Frontend
- File Structure
- Storage Provider

---

# 10. Deliverable

Setelah Part 1 selesai, telah ditetapkan:

- Filosofi dasar Storage EDMS.
- Prinsip kepemilikan file.
- Hubungan antara Business Data dan File Data.
- Aturan dasar penyimpanan file.
- Boundary antara Business Logic dan Storage.

Seluruh keputusan pada Part berikutnya wajib mengikuti filosofi yang telah ditetapkan pada Part ini.

# STORAGE-STRATEGY.md

> **Document Status:** Draft  
> **Phase:** Storage Strategy Design  
> **Part:** 2 — Storage Architecture  
> **Version:** v0.1  
> **Last Updated:** 2026-07-21  
> **Status:** Draft for Review

---

# 1. Purpose

Part ini mendefinisikan arsitektur penyimpanan (Storage Architecture) yang akan digunakan oleh seluruh sistem EDMS.

Storage Architecture menjelaskan bagaimana file disusun, direferensikan, dan dikelola secara logis tanpa bergantung pada media penyimpanan tertentu.

Part ini tidak membahas implementasi backend maupun struktur database.

---

# 2. Objectives

Storage Architecture dirancang untuk memenuhi tujuan berikut:

- Mendukung banyak Project secara bersamaan.
- Mendukung banyak Document pada setiap Project.
- Mendukung Revision tanpa mengubah histori.
- Mendukung Workflow Attachment.
- Mendukung Archive.
- Mendukung Restore.
- Mendukung Project Close.
- Mendukung migrasi storage di masa depan.
- Menjaga konsistensi referensi file.
- Memisahkan Business Logic dari Storage.

---

# 3. Storage Layers

Storage dibangun menggunakan tiga lapisan logis.

```text
Business Layer
        │
        ▼
Metadata Layer
        │
        ▼
Physical Storage Layer
```

---

## Layer 1 — Business Layer

Business Layer berisi seluruh entity bisnis.

Contoh:

- Project
- Document
- Revision
- Workflow Comment

Business Layer tidak mengetahui lokasi fisik file.

Business Layer hanya mengetahui bahwa suatu entity memiliki file.

---

## Layer 2 — Metadata Layer

Metadata Layer menjadi penghubung antara Business Layer dan Physical Storage.

Metadata menyimpan informasi seperti:

- identitas file
- nama file
- ukuran file
- tipe file
- lokasi logis
- status file

Seluruh akses file wajib melalui Metadata Layer.

---

## Layer 3 — Physical Storage Layer

Physical Storage menyimpan file fisik.

Storage dapat berupa:

- Local Storage
- NAS
- SAN
- Object Storage
- Cloud Storage

Business Layer tidak mengetahui jenis media penyimpanan yang digunakan.

---

# 4. Storage Boundary

Storage hanya bertanggung jawab terhadap:

- penyimpanan file
- pengambilan file
- metadata file

Storage tidak bertanggung jawab terhadap:

- Workflow
- Approval
- SLA
- Escalation
- Notification
- Permission
- Business Rule

---

# 5. Storage Object Model

Storage mengenali empat objek utama.

```text
Project
    │
    └── Document
            │
            ├── Revision File
            │
            └── Workflow Attachment
```

Keterangan:

- Project merupakan boundary tertinggi.
- Document menjadi induk seluruh file bisnis.
- Revision File merupakan versi dokumen.
- Workflow Attachment merupakan bukti komunikasi.

---

# 6. Storage Categories

Storage dibagi menjadi beberapa kategori logis.

## SC-001 — Active Document

Menyimpan file aktif yang digunakan oleh Document saat ini.

Hanya terdapat satu Active File pada satu waktu.

---

## SC-002 — Revision File

Menyimpan seluruh histori revisi.

Revision tidak pernah menggantikan histori sebelumnya.

---

## SC-003 — Workflow Attachment

Digunakan oleh:

- Approval B
- Approval C

Attachment bukan Revision.

Attachment tidak pernah menjadi Active Document.

---

## SC-004 — Future Categories

Storage harus memungkinkan penambahan kategori baru.

Contoh:

- Transmittal Attachment
- Vendor Drawing
- External Reference
- Import Package

Penambahan kategori tidak boleh mengubah arsitektur dasar.

---

# 7. Storage Hierarchy

Storage mengikuti hierarki kepemilikan.

```text
Project
    │
    ├── Documents
    │       │
    │       ├── Active File
    │       │
    │       └── Revision Files
    │
    └── Workflow Attachments
```

Prinsip:

- Project memiliki banyak Document.
- Document memiliki satu Active File.
- Document memiliki banyak Revision.
- Workflow Attachment berdiri sendiri.

---

# 8. Logical Storage Reference

Storage tidak menggunakan lokasi fisik sebagai referensi utama.

Seluruh hubungan antar entity menggunakan referensi logis.

Contoh hubungan:

```text
Project
        │
        ▼
Document
        │
        ▼
Revision
        │
        ▼
Stored File
```

Business Entity tidak mengetahui lokasi file.

Business Entity hanya mengetahui Stored File.

---

# 9. Storage Identity

Setiap file wajib memiliki identitas permanen.

Identitas tersebut digunakan oleh seluruh sistem.

Identitas tidak berubah walaupun:

- nama file berubah
- folder berubah
- storage dipindahkan
- storage provider berubah

Identity menjadi referensi utama seluruh layanan backend.

---

# 10. File Naming Principle

Storage membedakan empat atribut yang berkaitan dengan identitas dan nama file, yaitu:

- Document Number
- File Identity
- Original File Name
- Physical File Name

Keempat atribut tersebut memiliki fungsi yang berbeda dan tidak boleh diperlakukan sebagai informasi yang sama.

---

## Document Number

Document Number merupakan identitas bisnis sebuah Document.

Contoh:

```text
PFD-EDMS-0002
```

Document Number digunakan untuk mengidentifikasi Document dalam Business Workflow.

Document Number bukan merupakan nama file fisik dan bukan identitas Storage.

---

## File Identity

File Identity merupakan identitas internal yang unik dan permanen untuk setiap file yang disimpan oleh sistem.

Contoh:

```text
FILE-d77eaf41-974b-4d43-b0d9-4827af9745c4
```

File Identity digunakan sebagai referensi utama pada Metadata Layer.

File Identity:

- tidak ditampilkan kepada pengguna,
- tidak digunakan sebagai nama download,
- tidak digunakan sebagai nama file fisik,
- dan tidak berubah selama umur file.

Format teknis File Identity akan ditentukan pada tahap Database Schema dan implementasi Backend.

---

## Original File Name

Original File Name adalah nama file yang diunggah oleh pengguna.

Contoh:

```text
Drawing Final Approved.pdf
```

atau

```text
PFD-EDMS-0002.pdf
```

Original File Name disimpan secara utuh di Metadata Layer.

Original File Name digunakan untuk:

- tampilan pada User Interface,
- nama file ketika diunduh,
- nama file pada Document Viewer,
- serta informasi yang ditampilkan kepada pengguna.

Document Number dan Original File Name merupakan dua atribut yang berbeda.

Pada beberapa kasus keduanya dapat memiliki nilai yang sama, namun sistem tidak boleh mengasumsikan bahwa keduanya selalu sama.

---

## Physical File Name

Physical File Name adalah nama file yang digunakan pada Physical Storage Layer.

Physical File Name mengikuti konsep:

```text
Hybrid Human Readable + Unique Identifier
```

Format konseptual:

```text
{DOCUMENT_NUMBER}_{REVISION}_{SHORT_FILE_ID}_{SANITIZED_ORIGINAL_FILE_NAME}
```

Contoh:

```text
PFD-EDMS-0002_REV03_FILE-d77eaf41_Drawing_Final_Approved.pdf
```

Pendekatan ini dipilih untuk memenuhi beberapa tujuan sekaligus:

- menghindari konflik nama file,
- menjaga hubungan yang jelas antara file dan Document,
- mempermudah pencarian file secara manual pada folder Storage,
- mempertahankan keterbacaan oleh administrator sistem,
- serta tetap menyediakan identitas unik bagi setiap file.

Physical File Name hanya digunakan secara internal oleh Storage Layer.

Physical File Name tidak boleh ditampilkan kepada pengguna sebagai nama download.

---

## Filename Normalization

Original File Name dapat dinormalisasi ketika digunakan sebagai bagian dari Physical File Name.

Karakter yang tidak didukung oleh file system dapat diubah atau dihapus.

Contoh:

```text
Original File Name

Drawing / Final : Approved?.pdf
```

menjadi:

```text
Physical File Name

PFD-EDMS-0002_REV03_FILE-d77eaf41_Drawing_Final_Approved.pdf
```

Normalisasi hanya berlaku pada Physical File Name.

Original File Name yang asli tetap disimpan utuh pada Metadata Layer.

---

## Physical Filename Lifecycle

Setelah file berhasil disimpan pada Permanent Storage, Physical File Name tidak boleh berubah selama lifecycle normal.

Perubahan berikut tidak mengubah Physical File Name:

- perubahan metadata Document,
- perubahan status Workflow,
- Archive,
- Restore,
- Project Close.

Apabila dilakukan Upload Revision, sistem akan membuat File Identity dan Physical File Name baru untuk Revision tersebut.

---

## Download Principle

Storage selalu membaca file berdasarkan File Identity dan Physical File Name.

Namun file yang diterima oleh pengguna harus selalu menggunakan Original File Name.

Aturan ini berlaku untuk:

- Download melalui tombol aplikasi,
- Download Revision,
- Download melalui History,
- Download melalui toolbar bawaan PDF Viewer,
- Save As dari Document Viewer.

Dengan demikian pengguna selalu memperoleh nama file yang sama dengan nama file yang diunggah, sedangkan Storage tetap menggunakan Physical File Name yang aman dan unik.

---

# 11. Storage Location Principle

Business Logic tidak mengetahui lokasi penyimpanan.

Business Logic hanya mengetahui identitas file.

Storage bertanggung jawab menerjemahkan identitas tersebut menjadi lokasi fisik.

Dengan demikian perpindahan storage tidak memengaruhi Business Layer.

---

# 12. Active File Architecture

Document hanya memiliki satu Active File.

Perubahan Active File hanya dapat terjadi melalui proses bisnis resmi.

Contoh:

```text
Revision 1
        │
Revision 2
        │
Revision 3
        │
Active
```

Storage tidak menentukan file aktif.

Workflow yang menentukan.

---

# 13. Revision Architecture

Revision bersifat immutable.

Setiap Revision merupakan snapshot lengkap.

Revision lama:

- tidak ditimpa
- tidak diganti
- tidak diperbarui

Revision baru selalu menghasilkan file baru.

---

# 14. Workflow Attachment Architecture

Workflow Attachment memiliki siklus hidup sendiri.

Workflow Attachment:

- tidak masuk Revision
- tidak menjadi Active File
- tidak menggantikan Document

Workflow Attachment hanya digunakan sebagai bukti komunikasi.

---

# 15. Archive Architecture

Archive tidak mengubah struktur storage.

Archive hanya mengubah status bisnis.

File tetap berada pada lokasi yang sama.

Seluruh histori tetap tersedia.

---

# 16. Restore Architecture

Restore tidak membuat file baru.

Restore tidak memindahkan file.

Restore hanya mengaktifkan kembali Document sesuai Business Workflow.

---

# 17. Project Close Architecture

Project Close tidak memindahkan file.

Seluruh file tetap berada pada storage.

Perubahan hanya terjadi pada status Project dan Document sesuai aturan bisnis.

---

# 18. Storage Independence

Storage harus independen terhadap:

- Operating System
- File System
- Storage Vendor
- Cloud Provider

Perubahan teknologi storage tidak boleh mengubah:

- Business Workflow
- Database Relationship
- API Contract

---

# 19. Scalability Principles

Storage harus mampu berkembang tanpa perubahan arsitektur.

Target pengembangan:

- lebih banyak Project
- lebih banyak Document
- lebih banyak Revision
- ukuran file lebih besar
- jumlah pengguna lebih besar

Pertumbuhan kapasitas tidak boleh mengubah model penyimpanan.

---

# 20. Future Compatibility

Storage Architecture harus kompatibel terhadap kemungkinan implementasi berikut:

- Local Storage
- NAS
- SAN
- Distributed Storage
- Object Storage
- Cloud Storage
- Hybrid Storage

Migrasi antar media penyimpanan tidak boleh memengaruhi Business Layer.

---

# 21. Design Constraints

Storage Architecture wajib memenuhi batasan berikut:

- Tidak menyimpan file di database.
- Tidak bergantung pada absolute path.
- Tidak bergantung pada nama file.
- Tidak bergantung pada folder tertentu.
- Tidak bergantung pada satu storage provider.
- Tidak menyimpan Business Rule di Storage Layer.
- Tidak mengubah histori revisi.
- Tidak menghapus histori attachment.

---

# 22. Out of Scope

Part ini belum membahas:

- Folder Structure
- Directory Convention
- Relative Path Format
- Storage Key
- Upload Pipeline
- Temporary Upload
- File Validation
- MIME Validation
- Checksum
- File Size
- Backup Strategy
- Recovery Strategy
- Security
- Access Control

Seluruh topik tersebut akan dibahas pada Part berikutnya.

---

# 23. Deliverable

Setelah Part 2 selesai, telah ditetapkan:

- Arsitektur logis penyimpanan EDMS.
- Lapisan Storage.
- Hierarki kepemilikan file.
- Kategori file.
- Prinsip identitas file.
- Arsitektur Active File.
- Arsitektur Revision.
- Arsitektur Workflow Attachment.
- Arsitektur Archive.
- Arsitektur Project Close.
- Prinsip independensi Storage.

Seluruh keputusan pada Part berikutnya wajib mengikuti arsitektur yang telah ditetapkan pada Part ini.

# STORAGE-STRATEGY.md

> **Document Status:** Draft  
> **Phase:** Storage Strategy Design  
> **Part:** 3 — File Lifecycle  
> **Version:** v0.1  
> **Last Updated:** 2026-07-21  
> **Status:** Draft for Review

---

# 1. Purpose

Part ini mendefinisikan siklus hidup (File Lifecycle) seluruh file dalam sistem EDMS.

Dokumen ini menjelaskan bagaimana file bergerak sejak pertama kali diunggah hingga tidak lagi digunakan oleh proses bisnis.

File Lifecycle menjadi acuan utama bagi:

- Upload Service
- Revision Management
- Workflow Attachment
- Archive
- Restore
- Project Close
- Future Retention Policy

Part ini tidak membahas implementasi teknis backend maupun struktur database.

---

# 2. Lifecycle Principles

Seluruh file dalam EDMS wajib mengikuti prinsip berikut.

## FL-001 — Every File Has a Lifecycle

Tidak ada file yang berada di storage tanpa status yang jelas.

Setiap file harus memiliki siklus hidup yang dapat ditelusuri.

---

## FL-002 — Lifecycle Is Business Driven

Perubahan status file hanya dapat terjadi karena proses bisnis.

Storage tidak boleh mengubah lifecycle secara mandiri.

---

## FL-003 — Lifecycle Must Be Traceable

Seluruh perubahan lifecycle harus dapat ditelusuri melalui histori sistem.

---

## FL-004 — File History Must Be Preserved

Perubahan terhadap dokumen tidak boleh menghilangkan histori file sebelumnya.

---

## FL-005 — File Is Immutable

Setelah file berhasil disimpan secara permanen, isi file tidak boleh diubah.

Perubahan dokumen dilakukan melalui file baru.

---

# 3. File Creation

File dapat dibuat melalui proses bisnis berikut:

- Create Document
- Upload Revision
- Approval B Attachment
- Approval C Attachment

Tidak ada proses lain yang menghasilkan file baru.

---

# 4. Document File Lifecycle

Siklus hidup Document File mengikuti alur berikut.

```text
Create Document
        │
        ▼
Stored
        │
        ▼
Active
        │
        ▼
Replaced by New Revision
        │
        ▼
Revision History
        │
        ▼
Archived
        │
        ▼
Project Closed
```

---

## Stage 1 — Stored

File berhasil disimpan.

File telah memiliki metadata resmi.

File siap digunakan oleh sistem.

---

## Stage 2 — Active

File menjadi representasi utama Document.

Viewer membuka file ini.

Download Default mengambil file ini.

---

## Stage 3 — Replaced

Ketika Upload Revision dilakukan:

- file lama tidak dihapus
- file baru menjadi Active File
- file lama berubah menjadi Revision History

---

## Stage 4 — Revision History

Revision lama tetap tersedia.

Revision:

- dapat dilihat
- dapat diunduh
- menjadi histori permanen

Revision tidak pernah menjadi Active File kembali kecuali terdapat proses bisnis resmi di masa depan.

---

## Stage 5 — Archived

Document diarsipkan.

Perubahan hanya terjadi pada status bisnis.

File:

- tetap tersedia
- tetap dapat ditelusuri
- tidak dipindahkan

---

## Stage 6 — Project Closed

Ketika Project ditutup:

- seluruh file tetap berada pada storage
- tidak ada migrasi file
- histori tetap dipertahankan

---

# 5. Revision Lifecycle

Revision memiliki lifecycle tersendiri.

```text
Upload Revision
        │
        ▼
Stored
        │
        ▼
Validated
        │
        ▼
Becomes Active
        │
        ▼
Previous Active → Revision History
```

---

## RL-001

Setiap Upload Revision menghasilkan file baru.

---

## RL-002

Revision lama tidak boleh diubah.

---

## RL-003

Revision lama tidak boleh dihapus oleh proses bisnis normal.

---

## RL-004

Seluruh Revision menjadi histori permanen.

---

# 6. Workflow Attachment Lifecycle

Workflow Attachment mengikuti lifecycle berikut.

```text
Upload Attachment
        │
        ▼
Stored
        │
        ▼
Attached to Workflow Comment
        │
        ▼
Read
        │
        ▼
Archived Together With Document
```

---

## WA-001

Attachment hanya dapat dibuat melalui Approval B atau Approval C.

---

## WA-002

Attachment tidak pernah menjadi Active File.

---

## WA-003

Attachment tidak dapat diubah setelah berhasil disimpan.

---

## WA-004

Attachment mengikuti umur Workflow Comment.

---

# 7. Active File Transition

Perubahan Active File hanya dapat terjadi melalui proses berikut.

```text
Initial Upload
        │
        ▼
Active File
        │
Upload Revision
        │
        ▼
New Active File
        │
Old Active File
        │
        ▼
Revision History
```

Storage tidak menentukan file aktif.

Business Workflow yang menentukan.

---

# 8. Archive Lifecycle

Archive mengikuti alur berikut.

```text
Active Document
        │
        ▼
Archived
```

Archive tidak:

- memindahkan file
- mengganti nama file
- membuat file baru
- menghapus histori

Archive hanya mengubah status bisnis.

---

# 9. Restore Lifecycle

Restore mengikuti alur berikut.

```text
Archived
        │
        ▼
Active Business State
```

Restore:

- tidak membuat file baru
- tidak mengubah metadata file
- tidak memindahkan file

---

# 10. Project Close Lifecycle

Project Close mengikuti alur berikut.

```text
Open Project
        │
        ▼
Closed Project
```

Storage tetap identik.

Perubahan hanya terjadi pada status Project dan Document sesuai aturan bisnis.

---

# 11. Viewer Lifecycle

Viewer selalu mengikuti Active File.

```text
Document
        │
        ▼
Current Active File
        │
        ▼
Viewer
```

Viewer tidak membaca Revision kecuali pengguna memilih histori tertentu.

---

# 12. Download and Viewer Filename Policy

Download mengikuti dua mode.

## Default Download

Default Download mengambil Active File milik Document.

Nama file yang diterima pengguna wajib menggunakan Original File Name.

---

## History Download

History Download mengambil Revision yang dipilih.

Nama file yang diterima pengguna wajib menggunakan Original File Name milik file Revision tersebut.

---

## Viewer Download

Apabila pengguna mengunduh file melalui toolbar bawaan Document Viewer atau PDF Viewer, nama file yang ditawarkan kepada pengguna juga wajib menggunakan Original File Name.

Viewer tidak boleh menggunakan:

- File Identity,
- Physical File Name,
- Storage Key,
- nama random,
- maupun identifier internal lain

sebagai nama download yang ditampilkan kepada pengguna.

---

## Download Response Principle

Storage membaca file berdasarkan metadata dan Physical File Name.

Namun File Response kepada pengguna menggunakan Original File Name.

Alur konseptual:

```text
File Identity
        │
        ▼
Metadata
        │
        ▼
Physical File Name
        │
        ▼
Physical File
        │
        ▼
File Response
        │
        ▼
Original File Name
```

Dengan demikian:

file dapat disimpan menggunakan Physical File Name yang unik,
sedangkan pengguna tetap menerima file menggunakan Original File Name.

---

# 13. File Replacement Policy

Penggantian file hanya diperbolehkan melalui Upload Revision.

Tidak diperbolehkan:

- overwrite file
- edit file
- replace manual

Seluruh penggantian menghasilkan file baru.

---

# 14. File Movement Policy

Selama lifecycle normal:

File tidak dipindahkan.

Storage tetap stabil.

Perubahan status bisnis tidak memengaruhi lokasi file.

---

# 15. File Deletion Policy

Penghapusan file fisik bukan bagian dari lifecycle normal.

Selama operasi normal:

- Create
- Review
- Approval
- Revision
- Archive
- Restore
- Project Close

tidak ada file yang dihapus.

Penghapusan fisik hanya dapat dilakukan melalui kebijakan retensi yang akan didefinisikan pada masa depan.

---

# 16. File Recovery Philosophy

Karena file tidak dihapus selama lifecycle normal:

Restore tidak memerlukan proses recovery file.

Storage selalu mempertahankan seluruh file.

---

# 17. Lifecycle Integrity Rules

Seluruh lifecycle wajib memenuhi aturan berikut.

## LI-001

File hanya memiliki satu titik pembuatan.

---

## LI-002

File tidak dapat diubah setelah tersimpan.

---

## LI-003

File tidak boleh kehilangan histori.

---

## LI-004

Revision tidak boleh menggantikan histori.

---

## LI-005

Attachment tidak boleh menjadi Revision.

---

## LI-006

Archive tidak memindahkan file.

---

## LI-007

Restore tidak memindahkan file.

---

## LI-008

Project Close tidak mengubah struktur storage.

---

## LI-009

Business Workflow menentukan lifecycle.

Storage hanya menjalankan keputusan tersebut.

---

## LI-010

Lifecycle harus tetap konsisten walaupun media penyimpanan berubah.

---

# 18. Lifecycle Summary

| Business Event | Active File | Revision History | Workflow Attachment |
|----------------|------------|------------------|---------------------|
| Create Document | Dibuat | - | - |
| Upload Revision | Diganti | Bertambah | - |
| Approval B | Tidak berubah | Tidak berubah | Dibuat |
| Approval C | Tidak berubah | Tidak berubah | Dibuat |
| Archive | Tidak berubah | Tidak berubah | Tidak berubah |
| Restore | Tidak berubah | Tidak berubah | Tidak berubah |
| Project Close | Tidak berubah | Tidak berubah | Tidak berubah |

---

# 19. Out of Scope

Part ini belum membahas:

- Folder Structure
- Storage Key
- Relative Path
- Security
- Permission
- MIME Validation
- Virus Scanning
- File Encryption
- Backup
- Disaster Recovery
- Retention Policy
- Physical File Deletion

Topik tersebut akan dibahas pada Part berikutnya.

---

# 20. Deliverable

Setelah Part 3 selesai, telah ditetapkan:

- Siklus hidup Document File.
- Siklus hidup Revision.
- Siklus hidup Workflow Attachment.
- Mekanisme perpindahan Active File.
- Aturan Archive dan Restore.
- Aturan Project Close.
- Kebijakan penggantian file.
- Kebijakan penghapusan file.
- Prinsip integritas File Lifecycle.

Seluruh keputusan pada Part berikutnya wajib mengikuti File Lifecycle yang telah ditetapkan pada dokumen ini.

# STORAGE-STRATEGY.md

> **Document Status:** Draft  
> **Phase:** Storage Strategy Design  
> **Part:** 4 — Security & Access  
> **Version:** v0.1  
> **Last Updated:** 2026-07-21  
> **Status:** Draft for Review

---

# 1. Purpose

Part ini mendefinisikan prinsip keamanan (Security) dan pengendalian akses (Access Control) terhadap seluruh file yang disimpan dalam EDMS.

Tujuan utama Part ini adalah memastikan bahwa seluruh file:

- hanya dapat diakses oleh pengguna yang berwenang,
- tetap terjaga integritasnya,
- terlindungi dari perubahan yang tidak sah,
- dapat diaudit,
- dan tetap independen terhadap teknologi penyimpanan yang digunakan.

Part ini hanya membahas prinsip keamanan Storage Layer.

Part ini tidak membahas:

- Authentication
- Authorization Catalog / RBAC
- Permission Matrix
- Business Workflow
- Implementasi Backend
- Implementasi Frontend

---

# 2. Security Objectives

Storage Security dirancang untuk memenuhi tujuan berikut.

- Menjamin kerahasiaan file.
- Menjamin integritas file.
- Menjamin ketersediaan file.
- Menjamin seluruh akses dapat diaudit.
- Mencegah manipulasi file secara langsung.
- Memisahkan Business Security dari Storage Security.

---

# 3. Security Principles

## SEC-001 — Storage Never Trusts Client

Storage tidak pernah mempercayai informasi yang dikirim oleh Frontend.

Seluruh validasi dilakukan pada Backend.

---

## SEC-002 — Backend Is The Only Storage Gateway

Seluruh akses file wajib melalui Backend.

Frontend tidak pernah mengakses lokasi penyimpanan secara langsung.

---

## SEC-003 — Storage Is Private

Media penyimpanan dianggap sebagai area privat.

Lokasi penyimpanan tidak boleh diekspos kepada pengguna.

---

## SEC-004 — Metadata First

Seluruh proses keamanan dilakukan berdasarkan metadata.

Storage tidak boleh memberikan akses langsung berdasarkan nama file maupun lokasi file.

---

## SEC-005 — Least Privilege

Pengguna hanya memperoleh akses minimum yang diperlukan.

Hak akses tidak boleh melebihi kebutuhan proses bisnis.

---

## SEC-006 — Deny By Default

Apabila suatu permintaan tidak dapat divalidasi, maka akses wajib ditolak.

---

## SEC-007 — Auditability

Seluruh aktivitas terhadap file harus dapat ditelusuri.

---

## SEC-008 — Immutable Storage

File yang telah tersimpan permanen tidak boleh diubah secara langsung.

---

## SEC-009 — Separation Of Responsibility

Business Layer menentukan apakah pengguna boleh mengakses file.

Storage Layer hanya mengeksekusi keputusan tersebut.

---

## SEC-010 — Storage Independence

Seluruh mekanisme keamanan harus tetap berlaku walaupun media penyimpanan berubah.

---

# 4. Access Flow

Seluruh akses file mengikuti alur berikut.

```text
User
    │
    ▼
Authentication
    │
    ▼
Authorization
    │
    ▼
Business Validation
    │
    ▼
Metadata Validation
    │
    ▼
Storage Access
    │
    ▼
File Response
```

Storage tidak pernah dilewati secara langsung.

---

# 5. File Access Principles

## ACP-001

Seluruh file hanya dapat diakses menggunakan identitas metadata.

---

## ACP-002

Nama file bukan identitas akses.

---

## ACP-003

Lokasi penyimpanan bukan identitas akses.

---

## ACP-004

Folder bukan identitas akses.

---

## ACP-005

Storage Provider bukan identitas akses.

---

# 6. Upload Security

Setiap proses upload wajib melewati proses validasi.

Minimal mencakup:

- validasi autentikasi
- validasi otorisasi
- validasi proses bisnis
- validasi metadata

File yang gagal divalidasi tidak boleh masuk ke Permanent Storage.

---

# 7. Download Security

Download hanya dapat dilakukan apabila:

- pengguna telah terautentikasi,
- pengguna memiliki hak akses,
- file masih valid,
- Business Workflow mengizinkan.

Download tidak boleh menggunakan path fisik sebagai parameter publik.

---

# 8. Viewer Security

Viewer mengikuti aturan keamanan yang sama dengan Download.

Viewer tidak boleh membaca file langsung dari lokasi penyimpanan.

Viewer selalu menggunakan Backend sebagai perantara.

---

# 9. Revision Security

Revision mengikuti aturan keamanan yang sama dengan Document.

Revision lama:

- tidak dapat diubah,
- tidak dapat ditimpa,
- tetap dapat diaudit.

---

# 10. Workflow Attachment Security

Workflow Attachment hanya dapat diakses melalui Workflow yang terkait.

Attachment:

- tidak boleh digunakan sebagai Document,
- tidak boleh menjadi Active File,
- tidak boleh dipindahkan ke Revision.

---

# 11. Archive Security

Archive bukan mekanisme keamanan.

Archive hanya mengubah status bisnis.

Hak akses tetap mengikuti Business Workflow.

---

# 12. Restore Security

Restore tidak mengubah metadata keamanan.

Perubahan hanya terjadi pada status bisnis.

---

# 13. Project Close Security

Project Close tidak mengubah lokasi file.

Hak akses setelah Project Close mengikuti aturan Business Workflow dan kebijakan sistem.

Storage tidak menentukan kebijakan tersebut.

---

# 14. Metadata Integrity

Metadata harus selalu konsisten dengan file fisik.

Metadata tidak boleh menunjuk ke file yang berbeda.

Satu metadata hanya boleh merepresentasikan satu file.

---

# 15. File Integrity

Storage wajib menjaga integritas file.

Selama lifecycle normal:

- file tidak diubah,
- file tidak ditimpa,
- file tidak dimodifikasi.

Perubahan hanya dilakukan melalui pembuatan file baru.

---

# 16. Filename Security

Business Filename tidak boleh digunakan sebagai identitas keamanan.

Perubahan nama file tidak boleh memengaruhi hak akses.

---

# 17. Storage Location Security

Lokasi penyimpanan dianggap sebagai informasi internal.

Pengguna tidak perlu mengetahui:

- struktur folder,
- media penyimpanan,
- lokasi fisik,
- penyedia storage.

---

# 18. Error Handling Principles

Kesalahan akses tidak boleh mengungkapkan informasi internal storage.

Contoh informasi yang tidak boleh diekspos:

- absolute path,
- struktur folder,
- nama server,
- storage provider,
- konfigurasi backend.

Pengguna hanya menerima informasi yang diperlukan sesuai kebutuhan bisnis.

---

# 19. Future Security Compatibility

Storage harus memungkinkan penambahan mekanisme keamanan di masa depan tanpa mengubah arsitektur dasar.

Contoh:

- Virus Scanning
- File Encryption
- Digital Signature
- Watermark
- DLP (Data Loss Prevention)
- Secure File Sharing
- Malware Detection

---

# 20. Security Constraints

Storage wajib memenuhi batasan berikut.

- Tidak mempercayai Frontend.
- Tidak mengekspos lokasi file.
- Tidak mengekspos struktur storage.
- Tidak mengekspos nama storage provider.
- Tidak menggunakan Business Filename sebagai identitas.
- Tidak mengubah file setelah tersimpan.
- Tidak mengizinkan overwrite file.
- Tidak mengizinkan akses tanpa validasi.

---

# 21. Out of Scope

Part ini belum membahas:

- MIME Validation
- File Extension Validation
- File Size Validation
- Checksum
- Hash Algorithm
- Virus Scanning
- Encryption
- Backup
- Disaster Recovery
- Retention Policy
- Physical File Deletion

Topik tersebut akan dibahas pada Part berikutnya atau pada dokumen arsitektur lain yang lebih spesifik.

---

# 22. Deliverable

Setelah Part 4 selesai, telah ditetapkan:

- Prinsip keamanan Storage.
- Mekanisme umum akses file.
- Prinsip Upload, Viewer, dan Download.
- Prinsip keamanan Revision.
- Prinsip keamanan Workflow Attachment.
- Prinsip integritas metadata.
- Prinsip kerahasiaan lokasi penyimpanan.
- Aturan dasar pengendalian akses terhadap file.

Seluruh keputusan pada Part berikutnya wajib mengikuti prinsip Security & Access yang telah ditetapkan pada dokumen ini.

# STORAGE-STRATEGY.md

> **Document Status:** Draft  
> **Phase:** Storage Strategy Design  
> **Part:** 5 — Storage Rules & Design Decisions  
> **Version:** v0.1  
> **Last Updated:** 2026-07-21  
> **Status:** Draft for Review

---

# 1. Purpose

Part ini mendefinisikan seluruh aturan operasional (Storage Rules) yang menjadi keputusan arsitektur resmi untuk sistem penyimpanan file EDMS.

Seluruh implementasi Backend, Database, maupun API wajib mengikuti aturan pada dokumen ini.

Apabila terjadi konflik antara implementasi dengan dokumen ini, maka dokumen ini menjadi acuan utama.

---

# 2. Scope

Storage Rules mengatur:

- Hubungan Business Data dengan File
- Penyimpanan File
- Revision
- Workflow Attachment
- Viewer
- Download
- Archive
- Restore
- Project Close
- Metadata
- Integritas File

Storage Rules tidak mengatur:

- Business Workflow
- Hak Akses Pengguna
- UI
- Frontend
- Database Schema
- REST API

---

# 3. Core Design Decisions

Seluruh keputusan berikut merupakan keputusan arsitektur resmi.

---

## SR-001 — Database Stores Metadata Only

Database hanya menyimpan metadata file.

File fisik tidak pernah disimpan di dalam database.

---

## SR-002 — Every File Has One Metadata Record

Satu file fisik hanya memiliki satu metadata resmi.

Tidak diperbolehkan membuat metadata ganda untuk file yang sama.

---

## SR-003 — Every File Belongs To One Project

Seluruh file wajib berada di bawah satu Project.

Tidak diperbolehkan terdapat file tanpa Project.

---

## SR-004 — Every Document Has One Active File

Setiap Document hanya memiliki satu Active File.

Active File merupakan representasi resmi Document.

---

## SR-005 — Upload Revision Creates New File

Upload Revision selalu menghasilkan file baru.

Revision lama tetap dipertahankan.

---

## SR-006 — Revision Never Replaces History

Revision tidak pernah menghapus histori.

Seluruh histori Revision tetap tersedia.

---

## SR-007 — Workflow Attachment Is Not Revision

Attachment Approval B maupun Approval C bukan Revision.

Attachment tidak pernah menjadi Active File.

---

## SR-008 — Business Workflow Determines Active File

Storage tidak menentukan Active File.

Business Workflow yang menentukan.

---

## SR-009 — Archive Does Not Affect Storage

Archive tidak:

- memindahkan file,
- mengganti nama file,
- menghapus file,
- membuat file baru.

Archive hanya mengubah status bisnis.

---

## SR-010 — Restore Does Not Affect Storage

Restore tidak:

- membuat file baru,
- memindahkan file,
- mengubah metadata.

Restore hanya mengubah status bisnis.

---

## SR-011 — Project Close Does Not Affect Storage

Project Close tidak memindahkan file.

Seluruh file tetap berada pada storage.

---

## SR-012 — File Is Immutable

Setelah file berhasil disimpan permanen:

- isi file tidak boleh berubah,
- file tidak boleh ditimpa,
- file tidak boleh diedit.

---

## SR-013 — File Replacement Uses New Identity

Penggantian dokumen selalu menggunakan file baru.

File lama tetap dipertahankan.

---

## SR-014 — Storage Never Depends On Filename

Nama file bukan identitas penyimpanan.

Perubahan nama file tidak memengaruhi Storage.

---

## SR-015 — Storage Never Depends On Folder

Folder bukan identitas file.

Folder dapat berubah tanpa memengaruhi Business Layer.

---

## SR-016 — Storage Never Depends On Provider

Storage tidak boleh bergantung pada:

- Local Storage
- NAS
- SAN
- Cloud
- Object Storage

Seluruh media diperlakukan sama oleh Business Layer.

---

## SR-017 — Metadata Is The Only Storage Reference

Seluruh akses file wajib menggunakan metadata resmi.

Tidak diperbolehkan mengakses file berdasarkan lokasi fisik.

---

## SR-018 — Backend Is The Only Storage Gateway

Seluruh Upload, Download, dan Viewer wajib melalui Backend.

Frontend tidak boleh mengakses storage secara langsung.

---

## SR-019 — Business Layer Never Knows Physical Location

Business Layer tidak mengetahui:

- folder,
- absolute path,
- storage provider,
- media penyimpanan.

Business Layer hanya mengetahui metadata.

---

## SR-020 — Physical File Deletion Is Not Normal Business Process

Create

Review

Approval

Revision

Archive

Restore

Project Close

tidak pernah menghapus file fisik.

---

## SR-021 — File Naming Attributes Are Separate

Storage membedakan empat atribut utama yang berkaitan dengan identitas dan penamaan file, yaitu:

- Document Number
- File Identity
- Original File Name
- Physical File Name

Keempat atribut tersebut memiliki fungsi yang berbeda dan tidak boleh diperlakukan sebagai informasi yang sama.

Document Number merupakan identitas bisnis Document.

File Identity merupakan identitas internal permanen yang digunakan oleh Metadata Layer.

Original File Name merupakan nama file yang diunggah oleh pengguna dan digunakan sebagai nama yang ditampilkan pada User Interface maupun saat file diunduh.

Physical File Name merupakan nama file yang digunakan secara internal oleh Physical Storage Layer.

Document Number dan Original File Name tidak boleh diasumsikan selalu memiliki nilai yang sama. Pada beberapa kasus keduanya dapat sama, namun sistem harus memperlakukannya sebagai dua atribut yang independen.

---

## SR-022 — Physical Filename Uses Hybrid Naming

Physical File Name menggunakan konsep **Hybrid Human Readable + Unique Identifier**.

Format konseptual:

```text
{DOCUMENT_NUMBER}_{REVISION}_{SHORT_FILE_ID}_{SANITIZED_ORIGINAL_FILE_NAME}
```

Contoh:

```text
PFD-EDMS-0002_REV03_FILE-d77eaf41_Drawing_Final_Approved.pdf
```

Pendekatan ini dipilih untuk:

- menghindari konflik nama file,
- mempertahankan keterbacaan oleh administrator sistem,
- mempermudah pencarian file secara manual pada Storage,
- menjaga hubungan yang jelas antara file dengan Document,
- serta tetap menyediakan identitas unik bagi setiap file.

Physical File Name hanya digunakan secara internal oleh Storage Layer dan tidak boleh digunakan sebagai nama file yang ditampilkan kepada pengguna.

---

## SR-023 — User Download Uses Original File Name

Seluruh proses download wajib menggunakan **Original File Name** sebagai nama file yang diterima oleh pengguna.

Ketentuan ini berlaku untuk:

- Download melalui tombol aplikasi,
- Download Revision,
- Download melalui History,
- Download melalui Document Viewer,
- Download melalui toolbar bawaan PDF Viewer,
- maupun proses **Save As** dari Document Viewer.

Storage tetap membaca file berdasarkan File Identity dan Physical File Name, namun file yang dikirim kepada pengguna harus menggunakan Original File Name.

Physical File Name, File Identity, Storage Key, maupun identifier internal lainnya tidak boleh digunakan sebagai nama download yang ditampilkan kepada pengguna.

---

## SR-024 — Physical Filename Is Immutable

Setelah file berhasil disimpan pada Permanent Storage, Physical File Name tidak boleh diubah selama lifecycle normal.

Perubahan berikut tidak mengubah Physical File Name:

- perubahan metadata Document,
- perubahan status Workflow,
- Archive,
- Restore,
- Project Close,
- maupun perubahan metadata bisnis lainnya.

Apabila dilakukan Upload Revision, sistem akan membuat File Identity dan Physical File Name baru untuk Revision tersebut, sedangkan Physical File Name milik Revision sebelumnya tetap dipertahankan sebagai bagian dari histori penyimpanan.

---

# 4. Storage Consistency Rules

Storage wajib memenuhi konsistensi berikut.

---

## CONS-001

Metadata selalu mengarah pada satu file fisik.

---

## CONS-002

Satu file fisik tidak boleh dimiliki oleh lebih dari satu metadata.

---

## CONS-003

Revision selalu dimiliki oleh satu Document.

---

## CONS-004

Workflow Attachment selalu dimiliki oleh satu Workflow Comment.

---

## CONS-005

Active File selalu merupakan salah satu Revision resmi Document.

---

## CONS-006

File tidak boleh berpindah kepemilikan antar Project.

---

## CONS-007

Storage tidak boleh kehilangan histori.

---

## CONS-008

Storage tidak boleh menghasilkan histori palsu.

---

## CONS-009

Seluruh perubahan mengikuti Business Workflow.

---

## CONS-010

Storage selalu bersifat deterministic.

---

# 5. Storage Decision Summary

| Area | Official Decision |
|-------|-------------------|
| File Storage | File fisik berada di Storage |
| Database | Metadata saja |
| Active File | Ditentukan Business Workflow |
| Revision | File baru |
| Workflow Attachment | Terpisah dari Revision |
| Archive | Tidak memindahkan file |
| Restore | Tidak memindahkan file |
| Project Close | Tidak memindahkan file |
| Viewer | Membaca Active File |
| Download | Membaca Active File atau Revision |
| File Deletion | Tidak dilakukan pada proses bisnis normal |
| Metadata | Satu file satu metadata |
| File Identity | Identitas internal unik dan permanen |
| Original File Name | Nama yang ditampilkan dan digunakan saat download |
| Physical File Name | Hybrid Human Readable + Unique Identifier |
| Filename Relationship | Document Number dan Original File Name tidak diasumsikan sama |
| Storage Provider | Independen |

---

# 6. Architecture Constraints

Implementasi Backend wajib memenuhi batasan berikut.

- Tidak menyimpan file di database.
- Tidak menggunakan absolute path sebagai referensi bisnis.
- Tidak menggunakan nama file sebagai identitas.
- Tidak mengubah file yang telah tersimpan.
- Tidak menghapus histori revisi.
- Tidak menjadikan Attachment sebagai Revision.
- Tidak memindahkan file ketika Archive.
- Tidak memindahkan file ketika Restore.
- Tidak memindahkan file ketika Project Close.
- Tidak mengakses Storage langsung dari Frontend.
- Tidak mengasumsikan Document Number selalu sama dengan Original File Name.
- Tidak menggunakan Physical File Name sebagai nama download pengguna.
- Tidak mengekspos File Identity atau Storage Key sebagai nama download.
- Tidak mengganti Physical File Name setelah file masuk ke Permanent Storage.

---

# 7. Future Extensions

Storage Architecture dirancang agar dapat dikembangkan tanpa mengubah prinsip dasar.

Kemungkinan pengembangan di masa depan meliputi:

- Multiple Storage Provider
- Cloud Object Storage
- NAS Integration
- File Encryption
- Digital Signature
- Watermark
- Virus Scanning
- Automatic Backup
- Disaster Recovery
- Retention Policy
- Automatic File Purging
- File Version Comparison

Seluruh pengembangan tersebut harus tetap mematuhi filosofi Storage yang telah ditetapkan pada Part 1.

---

# 8. Final Architecture Summary

Storage Architecture EDMS mengikuti prinsip berikut.

```text
Business Layer
        │
        ▼
Metadata Layer
        │
        ▼
Storage Layer
        │
        ▼
Physical File
```

Prinsip utama:

- Business hanya mengenal metadata.
- Metadata menjadi satu-satunya referensi file.
- Storage bertanggung jawab terhadap penyimpanan fisik.
- File bersifat immutable.
- Revision selalu menghasilkan file baru.
- Attachment tidak pernah menjadi Revision.
- Archive, Restore, dan Project Close tidak memindahkan file.

---

# 9. Completion Criteria

Storage Strategy dinyatakan selesai apabila seluruh keputusan berikut telah ditetapkan.

- Filosofi Storage.
- Arsitektur Storage.
- File Lifecycle.
- Security & Access.
- Storage Rules.

Seluruh keputusan tersebut menjadi landasan resmi untuk:

- Database Schema Design
- Storage Metadata Design
- Upload Service
- Download Service
- Viewer Service
- Revision Service
- Backend API
- Future Storage Migration

---

# 10. Phase Completion

Dengan selesainya Part 5, maka **Phase Storage Strategy Design** dinyatakan selesai.

Dokumen ini menjadi acuan arsitektur resmi sebelum memasuki fase berikutnya, yaitu **Phase 2 — Clean Database Schema Design**.

Seluruh desain database dan implementasi backend wajib mengacu pada keputusan yang telah ditetapkan dalam **STORAGE-STRATEGY.md**.

---

# DOMAIN 5 BACKEND STORAGE BLUEPRINT

## Storage Transaction Flow

Backend storage implementation wajib menggunakan alur berikut:

```text
Upload Temporary
  -> Virus Scan
  -> Checksum
  -> Metadata Validation
  -> Database Transaction
  -> Permanent Storage
  -> Audit Trail
  -> Notification
```

Jika salah satu tahap gagal, proses wajib rollback.

## Temporary Upload

Temporary upload adalah area transit sebelum file menjadi permanent stored file.

Rules:

- Temporary file belum menjadi Active Document File.
- Temporary file belum menjadi Revision File.
- Temporary file belum menjadi Workflow Attachment resmi.
- Temporary file wajib memiliki temporary upload id.
- Temporary file yang gagal finalize wajib dibersihkan oleh rollback atau storage cleanup job.
- Temporary upload tidak boleh ditampilkan pada Document Viewer, Revision History, atau Workflow Comment sebelum finalize berhasil.

## Virus Scan

Virus scan adalah tahap wajib sebelum file dipindahkan ke permanent storage.

Rules:

- File yang gagal scan ditolak.
- Metadata database permanent tidak boleh dibuat untuk file yang gagal scan.
- Hasil scan dapat dicatat sebagai technical metadata atau audit/security event.
- Detail internal scanner tidak boleh diekspos kepada pengguna.

## Checksum

Checksum digunakan untuk integritas file.

Rules:

- Checksum dihitung sebelum permanent storage finalize.
- Checksum disimpan pada metadata file.
- Algorithm ditetapkan pada backend implementation phase sebagai keputusan teknis.
- Checksum tidak digunakan sebagai pengganti File Identity.

## Metadata Validation

Metadata validation wajib memeriksa:

- Project ownership.
- Document ownership.
- File category.
- Original File Name.
- MIME type.
- File extension.
- File size.
- Storage key uniqueness.
- Upload actor.
- Business process owner: Document, Revision, atau Workflow Comment.

## Permanent Storage

Permanent storage hanya terjadi setelah temporary upload, virus scan, checksum, dan metadata validation berhasil.

Rules:

- Permanent file immutable.
- Physical File Name immutable.
- File Identity permanent.
- Storage Key unique.
- Original File Name tetap digunakan untuk download/display.
- Physical File Name tidak ditampilkan kepada pengguna.
- Physical project directory menggunakan `projects.project_code`, bukan internal `projects.id`.
- Document directory menggunakan `DOCUMENT_NUMBER`.
- Revision directory menggunakan canonical revision label: `IFR-Submitted`, `IFA-Submitted`, `AS-Built`.
- `storage_key` berupa normalized relative key, bukan absolute machine path.

Canonical revision file path:

```text
projects/{PROJECT_CODE}/documents/{DOCUMENT_NUMBER}/revisions/{REVISION}/{PHYSICAL_FILE_NAME}
```

Physical filename:

```text
{DOCUMENT_NUMBER}_{REVISION}_{SUBMIT_DATE_YYYYMMDD}_{SHORT_FILE_ID}_{SANITIZED_ORIGINAL_FILE_NAME}
```

`SUBMIT_DATE_YYYYMMDD` berasal dari backend submit timestamp. `SHORT_FILE_ID` berasal dari `stored_files.file_id`.

## Rollback Rule

Rollback wajib menjaga konsistensi database dan file storage.

| Failure Point | Rollback Action |
|---|---|
| Temporary upload fails | Return validation/storage error; no database write |
| Virus scan fails | Delete/quarantine temporary file; no permanent metadata |
| Checksum fails | Delete temporary file; no permanent metadata |
| Metadata validation fails | Delete temporary file; no permanent metadata |
| Database transaction fails before permanent storage | Rollback DB; delete temporary file |
| Permanent storage fails | Rollback DB transaction; delete temporary/permanent partial file |
| Audit trail fails | Rollback business DB writes and storage finalize if still in transaction boundary |
| Notification fails | Rollback when notification is part of required transaction; otherwise persist notification retry marker according to Notification Blueprint |

## Storage Category Mapping

| Business Process | Storage Category | Active Document Impact |
|---|---|---|
| Upload Document | Active Document File / Revision File | Creates initial active file |
| Upload Revision | Revision File | Creates new active revision file and supersedes previous active revision |
| Approval B Attachment | Workflow Attachment | Does not become active file |
| Approval C Attachment | Workflow Attachment | Does not become active file |
| Archive | No new storage category | Does not move file |
| Restore | No new storage category | Does not move file |
| Project Close | No new storage category | Does not move file |

## Storage Job

Storage cleanup job:

- Runs by Scheduler/Cron.
- Removes orphan temporary uploads.
- Never deletes permanent storage.
- Uses temporary upload age and finalize status.
- Is idempotent and retry-safe.

## Backend Boundary

Storage Service coordinates storage operations, but Business Service owns business decisions.

Repository only persists metadata.

Frontend never accesses physical storage path directly.

## Workflow Attachment Storage

Workflow attachment bukan document revision dan tidak disimpan di `revisions/`.

Canonical paths:

```text
projects/{PROJECT_CODE}/documents/{DOCUMENT_NUMBER}/attachments/process-comments/{ATTACHMENT_FILE_NAME}
projects/{PROJECT_CODE}/documents/{DOCUMENT_NUMBER}/attachments/project-comments/{ATTACHMENT_FILE_NAME}
```

Attachment download tetap memakai original filename dari metadata.
