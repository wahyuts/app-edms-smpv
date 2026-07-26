# UI-LANGUAGE-GUIDELINES.md

> **Version:** 1.0\
> **Status:** Draft\
> **Project:** ReBuild Engineering Document Management System (EDMS)

## 1. Purpose

Dokumen ini menjadi standar resmi seluruh **User-Facing Messages** pada
aplikasi EDMS dan wajib diikuti oleh seluruh implementasi Frontend
maupun Backend.

# 2. Scope

Dokumen ini mengatur standar bahasa untuk seluruh **User-Facing Messages** pada aplikasi EDMS.

Standar ini berlaku untuk implementasi Frontend maupun Backend yang menghasilkan tampilan atau pesan kepada pengguna.

Dokumen ini mencakup:

- Language Principles
- Toast Notification
- Form Validation Messages
- Empty State Messages
- Confirmation Messages
- Terminology Dictionary
- Status Badge Naming
- Button Label Standard
- Terminology Khusus EDMS
- EDMS Message Catalog

Dokumen ini **tidak mengatur**:

- Business Workflow
- Business Rules
- UI Layout
- UI Component
- Warna dan Design System
- Icon
- Typography
- API Contract
- Database Schema

Untuk aturan mengenai hal-hal tersebut, gunakan dokumen Source of Truth yang sesuai.

## 3. Language Principles

### 3.1 Bahasa Utama

Gunakan **Bahasa Indonesia** sebagai bahasa utama.

### 3.2 Pertahankan Istilah Teknis

Jangan menerjemahkan istilah yang sudah umum digunakan.

Gunakan secara konsisten:

-   Login
-   Logout
-   Upload
-   Download
-   Preview
-   Dashboard
-   Search
-   Filter
-   History
-   Comment
-   Approval
-   Revision
-   Reset Password
-   Transmittal
-   Save
-   Cancel
-   Close
-   Reject

### 3.3 Kalimat Sederhana

Gunakan kalimat yang: - sederhana; - jelas; - profesional; - tidak
bertele-tele.

Target panjang sekitar **5--8 kata** sesuai konteks.

### 3.4 Sebutkan Objek

Contoh yang baik: - Dokumen Berhasil Diupload - Revision Berhasil
Dibuat - Password Berhasil Diubah

Hindari: - Upload Berhasil - Berhasil

### 3.5 Hindari Bahasa Terlalu Formal

Hindari kalimat seperti: - Silakan melakukan login kembali. - Mohon
menghubungi Administrator.

Gunakan: - Login Kembali - Hubungi Admin - Session Telah Berakhir

## 4. Toast Guidelines

### Success

Pola yang disarankan:

**`<Objek>`{=html} Berhasil `<Aksi>`{=html}**

Contoh: - Dokumen Berhasil Dibuat - Dokumen Berhasil Diupload - Dokumen
Berhasil Didownload - Password Berhasil Diubah - Comment Berhasil
Ditambahkan

### Error

Gunakan salah satu pola: - Gagal `<Aksi>`{=html} `<Objek>`{=html} -
`<Objek>`{=html} Tidak Valid

Contoh: - Gagal Mengupload Dokumen - Gagal Mengambil Data - File Tidak
Valid - Link Reset Tidak Valid

### Warning

Contoh: - Data Belum Lengkap - Session Telah Berakhir - Dokumen Belum
Dipilih

## 5. Form Validation Messages

Contoh: - Username Wajib Diisi - Password Wajib Diisi - Email Tidak
Valid - Password Minimal 8 Karakter - Konfirmasi Password Tidak Sesuai

## 6. Empty State Messages

Contoh: - Dokumen Tidak Ditemukan - History Tidak Tersedia - Tidak Ada
Data - Belum Ada Hasil Pencarian

## 7. Confirmation Messages

Contoh: - Hapus Dokumen Ini? - Simpan Perubahan? - Logout Sekarang? -
Batalkan Perubahan?

## 8. Terminology Dictionary

  Gunakan     Hindari
  ----------- -------------
  User        Pengguna
  Dokumen     Document
  Upload      Unggah
  Download    Unduh
  Dashboard   Dasbor
  Search      Cari
  Filter      Penyaring
  History     Riwayat
  Comment     Komentar
  Approval    Persetujuan
  Revision    Revisi
  Viewer      Penampil
  Transmittal Pengiriman
  Notification    Notifikasi


## 9. Konsistensi Terminologi

Istilah yang dipilih harus digunakan secara konsisten di seluruh
aplikasi.

## 10. Status Badge Naming

Workflow Status harus selalu mengikuti BUSINESS-WORKFLOW.md dan tidak boleh dimodifikasi tanpa revisi pada Business Workflow.

Gunakan nama status yang konsisten di seluruh aplikasi. Status Badge
merupakan representasi kondisi bisnis, sehingga tidak boleh berubah-ubah
antar modul.

### SLA Status

  Gunakan          Hindari
  ---------------- ------------------
  On Track         Sesuai Jadwal
  At Risk          Hampir Terlambat
  Overdue          Terlambat
  Final As-Built   Final

### Workflow Status

Gunakan status yang telah ditetapkan pada Business Workflow:

-   Process Review
-   Project Review
-   Process Comment
-   Project Comment
-   Process Reject
-   Project Reject
-   Approved

> Jangan membuat variasi penulisan baru seperti "In Review", "Waiting
> Review", atau "Approval Process" apabila tidak didefinisikan pada
> Business Workflow.

------------------------------------------------------------------------

## 11. Button Label Standard

Label tombol harus singkat, jelas, dan menggunakan istilah yang
konsisten.

### Primary Actions

-   Save
-   Upload
-   Download
-   Login
-   Logout
-   Reset Password
-   Approve

### Secondary Actions

-   Cancel
-   Close
-   Back
-   Preview
-   History
-   Comment

### Destructive Actions

-   Delete
-   Cancel Approval

> Hindari label tombol yang terlalu panjang seperti "Klik Di Sini Untuk
> Menyimpan Data". Gunakan maksimal 1--3 kata sesuai fungsi tombol.

------------------------------------------------------------------------

## 12. Terminology Khusus EDMS

Istilah berikut merupakan terminologi resmi proyek EDMS dan tidak boleh
diterjemahkan.

  Istilah            Keterangan
  ------------------ ------------------------------------
  Document Number    Nomor identitas dokumen
  Revision           Revisi dokumen
  Current Assignee   Penanggung jawab proses saat ini
  Approval           Persetujuan dokumen
  Comment            Catatan review
  History            Riwayat perubahan
  Transmittal        Pengiriman dokumen resmi
  Process Review     Tahap review oleh Team Process
  Project Review     Tahap review oleh Team Project
  Approved           Dokumen telah disetujui
  IFR                Issued For Review
  IFA                Issued For Approval
  IFC                Issued For Construction
  As-Built           Revisi akhir sesuai kondisi aktual
  Process Reject     Dokumen ditolak pada tahap Process Review dan menunggu revisi dari Document Owner
  Project Reject     Dokumen ditolak pada tahap Project Review dan menunggu revisi dari Document Owner

> Seluruh modul wajib menggunakan istilah di atas secara konsisten pada
> UI, API, dokumentasi, dan pesan kepada pengguna.

------------------------------------------------------------------------

## 13. Rules for AI Assistant

-   Wajib mengikuti dokumen ini.
-   Jangan menerjemahkan istilah teknis yang telah ditetapkan.
-   Jangan menggunakan gaya bahasa berbeda antar modul.
-   Tambahkan istilah baru ke Terminology Dictionary sebelum digunakan.
-   Jika menemukan User-Facing Message yang belum diatur dalam dokumen ini, jangan mengubahnya secara otomatis. Gunakan implementasi yang sudah ada, lalu usulkan penambahan ke UI-LANGUAGE-GUIDELINES.md apabila istilah tersebut akan digunakan secara luas.

------------------------------------------------------------------------

## 14. EDMS Message Catalog

Bagian ini berisi kumpulan pesan standar yang direkomendasikan untuk
digunakan di seluruh aplikasi EDMS. Gunakan pesan berikut sebelum
membuat pesan baru.

### 14.1 Authentication

**Success**

-   Login Berhasil
-   Logout Berhasil
-   Password Berhasil Diubah
-   Password Berhasil Direset

**Warning**

-   Session Telah Berakhir
-   Link Reset Tidak Valid
-   Password Lama Tidak Sesuai

**Error**

-   Username atau Password Tidak Valid
-   Gagal Login
-   Gagal Mereset Password

------------------------------------------------------------------------

### 14.2 Document

**Success**

-   Dokumen Berhasil Dibuat
-   Dokumen Berhasil Diperbarui
-   Dokumen Berhasil Diupload
-   Dokumen Berhasil Didownload
-   Dokumen Berhasil Dihapus

**Warning**

-   Dokumen Belum Dipilih
-   Dokumen Tidak Ditemukan

**Error**

-   Gagal Mengupload Dokumen
-   Gagal Mendownload Dokumen
-   Gagal Menghapus Dokumen

------------------------------------------------------------------------

### 14.3 Revision

**Success**

-   Revision Berhasil Dibuat
-   Revision Berhasil Diupload

**Warning**

-   Revision Tidak Ditemukan

**Error**

-   Gagal Mengupload Revision

------------------------------------------------------------------------

### 14.4 Approval

**Success**

-   Approval Berhasil Dikirim
-   Comment Berhasil Ditambahkan

**Warning**

-   Approval Belum Dipilih

**Error**

-   Gagal Mengirim Approval

------------------------------------------------------------------------

### 14.5 Validation

-   Data Belum Lengkap
-   File Tidak Valid
-   Ukuran File Terlalu Besar
-   Email Tidak Valid
-   Password Minimal 8 Karakter
-   Konfirmasi Password Tidak Sesuai

------------------------------------------------------------------------

### 14.6 Empty State

-   Tidak Ada Data
-   Dokumen Tidak Ditemukan
-   History Tidak Tersedia
-   Belum Ada Hasil Pencarian

------------------------------------------------------------------------

### 14.7 Confirmation Dialog

-   Simpan Perubahan?
-   Hapus Dokumen Ini?
-   Logout Sekarang?
-   Batalkan Perubahan?

------------------------------------------------------------------------

### 14.8 Rules

-   Gunakan pesan pada katalog ini sebelum membuat pesan baru.
-   Apabila diperlukan pesan baru, gunakan gaya bahasa yang mengikuti UI
    Language Standard.
-   Hindari membuat beberapa variasi pesan untuk kondisi yang sama.
-   Perbarui katalog ini setiap kali ditambahkan pesan baru yang akan
    digunakan secara luas.

## 15. Maintenance

Dokumen ini merupakan **living document** dan diperbarui apabila
terdapat keputusan resmi proyek.
Perubahan dokumen ini harus dicatat pada CHANGELOG atau DECISION LOG proyek.
