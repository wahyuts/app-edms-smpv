Tolong ubah dan revisi hak akses untuk notification dari yang tadinya

| Event Name | Trigger | Admin | Document Owner | Team Process | Team Project | Catatan Recipient |
|---|---|---:|---:|---:|---:|---|
| `Document Uploaded` | Create Document berhasil | Tidak | Tidak | Ya | Tidak | Dikirim ke `currentAssigneeUserId` awal, yaitu Team Process aktif pada project |
| `Revision Uploaded` | Upload Revision dari `Process Comment` / `Process Reject` ke `Process Review` | Tidak | Tidak | Ya | Tidak | Dikirim ke current assignee baru sesuai status `Process Review` |
| `Revision Uploaded` | Upload Revision dari `Project Comment` / `Project Reject` ke `Project Review` | Tidak | Tidak | Tidak | Ya | Dikirim ke current assignee baru sesuai status `Project Review` |
| `Approval A Completed` | `Process Review` → `Project Review` | Tidak | Tidak | Tidak | Ya | Dikirim ke current assignee Team Project |
| `Document Approved` | `Project Review` → `Approved` | Tidak | Ya | Tidak | Tidak | Dikirim ke Document Owner aktif pada project |
| `Approval B Completed` | `Process Review` → `Process Comment` | Tidak | Ya | Tidak | Tidak | Dikirim ke Document Owner sebagai current assignee |
| `Approval B Completed` | `Project Review` → `Project Comment` | Tidak | Ya | Tidak | Tidak | Dikirim ke Document Owner sebagai current assignee |
| `Approval C Completed` | `Process Review` → `Process Reject` | Tidak | Ya | Tidak | Tidak | Dikirim ke Document Owner sebagai current assignee |
| `Approval C Completed` | `Project Review` → `Project Reject` | Tidak | Ya | Tidak | Tidak | Dikirim ke Document Owner sebagai current assignee |
| `SLA At Risk` | Dokumen masuk SLA `At Risk` | Ya | Ya | Ya | Ya | Dikirim ke seluruh active user + active project membership pada project terkait untuk 4 role resmi |
| `SLA Overdue` | Dokumen masuk SLA `Overdue` / Escalation candidate | Ya | Ya | Ya | Ya | Dikirim ke seluruh active user + active project membership pada project terkait untuk 4 role resmi |

menjadi

| Event Name | Trigger | Admin | Document Owner | Team Process | Team Project | Catatan Recipient |
|---|---|---:|---:|---:|---:|---|
| `Document Uploaded` | Create Document berhasil | Tidak | Tidak | Ya | Tidak | Dikirim ke `currentAssigneeUserId` awal, yaitu Team Process aktif pada project |
| `Revision Uploaded` | Upload Revision dari `Process Comment` / `Process Reject` ke `Process Review` | Tidak | Tidak | Ya | Tidak | Dikirim ke current assignee baru sesuai status `Process Review` |
| `Revision Uploaded` | Upload Revision dari `Project Comment` / `Project Reject` ke `Project Review` | Tidak | Tidak | Tidak | Ya | Dikirim ke current assignee baru sesuai status `Project Review` |
| `Approval A Completed` | `Process Review` → `Project Review` | Tidak | Tidak | Tidak | Ya | Dikirim ke current assignee Team Project |
| `Document Approved` | `Project Review` → `Approved` | Ya | Ya | Tidak | Tidak | Dikirim ke Document Owner dan Admin aktif pada project |
| `Approval B Completed` | `Process Review` → `Process Comment` | Ya | Ya | Tidak | Tidak | Dikirim ke Document Owner sebagai current assignee |
| `Approval B Completed` | `Project Review` → `Project Comment` | Ya | Ya | Tidak | Tidak | Dikirim ke Document Owner sebagai current assignee |
| `Approval C Completed` | `Process Review` → `Process Reject` | Ya | Ya | Tidak | Tidak | Dikirim ke Document Owner dan Admin |
| `Approval C Completed` | `Project Review` → `Project Reject` | Ya | Ya | Tidak | Tidak | Dikirim ke Document Owner dan Admin |
| `SLA At Risk` | Dokumen masuk SLA `At Risk` | Ya | Ya | Ya | Ya | Dikirim ke seluruh active user + active project membership pada project terkait untuk 4 role resmi |
| `SLA Overdue` | Dokumen masuk SLA `Overdue` / Escalation candidate | Ya | Ya | Ya | Ya | Dikirim ke seluruh active user + active project membership pada project terkait untuk 4 role resmi |

untuk message, title dan lainnya gunakan table Message Dictionary dibawah ini

| Business Event | Title | Message | Priority |
|---------------|-------|---------|:--------:|
| Document Uploaded | **New Review Task** | A new document is waiting for your review. | Medium |
| Approval A Completed | **New Project Review Task** | A document is waiting for your project review. | Medium |
| Approval B Completed | **Revision Required** | Document requires revision. Review comment and attachment are available. | High |
| Approval C Completed | **Document Not Approved By Team Process** | Document was not approved. | High |
| Approval C Completed | **Document Not Approved By Team Project** | Document was not approved. | High |
| Revision Uploaded | **Revision Ready for Review** | A revised document is ready for review. | Medium |
| Document Approved | **Document Approved** | The document has been approved. | Low |
| SLA At Risk | **SLA Warning** | Document is approaching its SLA limit. | Medium |
| SLA Overdue | **SLA Overdue** | Document has exceeded the SLA limit. | High |

catatan untuk Approval C Completed ini dibagi menjadi 2 karena tergantung dari siapa yang mentriggernya baik itu Team Process atau Team Project akan menghasilkan pesan notifikasi yang berbeda seperti pada table matrix diatas.



