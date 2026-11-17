# Phase E.2A - Local Migration and Controlled Runtime Validation

Date: 2026-11-17 (Asia/Bangkok, UTC+7).

## Environment

- Target: 127.0.0.1:3306 / edms_smpv_dev.
- Server: 10.4.32-MariaDB; DESKTOP-3DFA1TA; datadir D:\xampp\mysql\data\.
- Verified XAMPP executable: D:\xampp\mysql\bin\mysqld.exe.
- Backend: localhost:4000; local storage at apps/backend/storage.
- Owner stopped the previous backend before backup/ALTER.
- Owner set both scheduler flags false and restarted before inspection. No scheduler file/config change by Codex.
- Controlled UAT backend started directly with node src/server.js (no npm prestart/seed hook).
- Both scheduler-disabled startup messages observed. Process-only EMAIL_PROVIDER=dummy prevented real email delivery; apps/backend/.env was not edited.

## Backup

- File: D:\Project\Back Up Database app-edms-smpv Xampp\edms_smpv_dev_pre_E2A_20261117_095755.sql
- Size: 1,973,634 bytes.
- SHA-256: 946f866b2a169a04ea0fd9000c3cb45ed602c9e0d0606d093355f882eeab7fdf
- Completed: 2026-11-17T02:57:56.521Z (09:57:56 UTC+7).
- XAMPP mysqldump exit code 0; single-transaction, routines, triggers, events, hex-blob, schema and data included.
- All 33 base-table definitions and INSERT coverage for each nonempty table verified without printing dump contents.
- No routines/triggers/events existed in the target schema at backup time.
- Before/after backup table hashes identical. Restore test NOT PERFORMED; no restore or disposable database created.

## Migration

- Executed only database/migration/20261117_0001_approval_a_history_snapshots.sql, once.
- New columns: created_by_username_snapshot VARCHAR(255) NULL; approval_target_stage_snapshot VARCHAR(64) NULL.
- CHECK: target is NULL, or action Approval A and target IFA-Submitted/AS-Built.
- Existing columns, keys, FKs and CHECKs preserved; other 32 table structures unchanged.
- All preexisting data hashes across 33 tables identical immediately after migration.
- Before/after migration counts: 47 workflow comments; 55 revisions; 72 stored files.
- All 47 old workflow comments retained NULL new snapshots; no backfill.
- Read-only verification completed 2026-11-17T03:05:26.025Z.
- Initial verification stopped on a trailing-comma representation difference in SHOW CREATE TABLE after removing the new CHECK from the comparison. Corrected only the local verification helper's punctuation normalization; subsequent read-only verification proved original DDL/data unchanged. ALTER was not retried.
- CHECK definition verified from server metadata; deliberate invalid SQL writes were not performed.

## Authentication and Runtime

- Credential file confirmed gitignored/untracked before reading; no passwords/cookies/tokens stored in this report.
- Actual memberships verified in active project SS-ALPHA-01 / PRJ-008dce88-7d3e-4160-9238-95c20df2fb10:
  Admin deny; Document Owner desy; Team Process herlina; Team Project samoris; Viewer rudeus.
- Normal HTTP login and active-project selection succeeded for all five roles. No accounts/passwords/memberships changed.
- 96 runtime assertions PASS; 0 FAIL; 1 case NOT TESTED.
- Team Process Approval A: IFR -> IFA / Project Review; Team Project Approval A: IFA -> AS-Built / Approved.
- Exact revision/file IDs and upload snapshots preserved; physical moves verified by old-path absence, destination stage and SHA-256.
- Actor username/role/target/revision/timestamp persisted on system comments; no new revision/stored file from Approval A.
- Events API produced distinct entries and one Current File; default remained upload-only. Stage filters did not promote older events.
- Historical View/Download verified against actual fixture bytes, not just HTTP 200.
- Both roles' Approval B/C status/comment behavior passed; B without comment rejected, C without comment accepted; neither added Approval A events.
- Admin/Owner/Viewer Approval denied; wrong-stage reviewer denied; duplicate Approval A rejected; unauthenticated history 401; invalid mode/stage 422; all five roles read events.
- Cross-project denial NOT TESTED live: no existing document inaccessible to Viewer was available. No memberships/projects were changed to manufacture this case. Offline authorization coverage passed.
- No deliberate storage failure, destructive race, real deadlock or lost-COMMIT injection on the live local dataset.
- UAT sessions logged out through the normal endpoint; cookies held only in process memory.

## Retained Fixture Inventory

All five documents were created by this run and intentionally retained. No Permanent Delete or automatic cleanup.

| Document Number | Document ID | Revision ID | Stored File ID | Final State |
|---|---|---|---|---|
| E2A-20261117-6c58d6-A | DOC-PFD-616457c4-ea9a-4f96-bf68-3ab6b0d8505d | REV-7fbe5961-c148-4bd8-9fbe-fea497047e46 | FILE-cc7d73b6-eca9-4523-9987-bbb0078d88f6 | Approved / AS-Built |
| E2A-20261117-6c58d6-PB | DOC-PFD-d43de849-57a7-446f-9322-67611b78dabd | REV-669b4855-2cbf-432c-bc6e-7a75c400146c | FILE-04879215-e5ca-4f64-a9ee-ce60ac7cbbbd | Process Comment / IFR-Submitted |
| E2A-20261117-6c58d6-PC | DOC-PFD-5d1c4f15-8f7e-41f1-8384-15abbe50a529 | REV-85ebbd60-0a92-41dc-8c52-abdba339a60e | FILE-e357e635-50bd-4efb-81f2-28bedb4f6116 | Process Reject / IFR-Submitted |
| E2A-20261117-6c58d6-JB | DOC-PFD-f399f75e-fc39-4110-b413-ff6939cc7187 | REV-ccba6f8b-0ea6-499c-b4da-c700e867f9d0 | FILE-d6bf01ec-c85c-4cd7-98da-f9c8e1dfb918 | Project Comment / IFA-Submitted |
| E2A-20261117-6c58d6-JC | DOC-PFD-e1978d16-baee-41a3-9d72-8dcc2e39daa8 | REV-89cb2f02-49e5-4e52-82d9-5c2e0e858d48 | FILE-1f44cf84-6ce0-4f3a-b316-90426e7689a9 | Project Reject / IFA-Submitted |

## Integrity and Regression

- Final counts: 55 comments, 60 revisions, 77 stored files. UAT additions: 4 Approval A, 2 Approval B, 2 Approval C comments; 5 revisions/files from 5 actual uploads.
- Existing document/revision/file/comment/history/SLA business rows and all project memberships unchanged by hash comparison.
- All preexisting physical-file paths/checksums unchanged; exactly 5 new fixture files at their final keys; no duplicates/orphan file references found for fixtures.
- Expected changes limited to fixture document-owned records, admission/IO/provenance, notification/SLA/audit and authentication sessions. No unexpected table changes detected.
- Repeated history reads left full database row hashes unchanged.
- Offline serial regression: 1,129 PASS, 0 FAIL, 1 SKIP, 13 TODO. Database-dependent TODOs are not PASS; C2B remains paused/excluded and pinned hashes untouched.
- HTTP unit-server cases excluded from offline run; actual local HTTP runtime checks above were performed separately.
- Application/frontend/schema source files and migration SQL not edited during E.2A. Only gitignored local validation helpers/artifacts and this report added.
- Railway/R2 not accessed. No seed/reset/repair/restore, deployment, commit or push.

## Final Status

PARTIAL: local migration and main controlled runtime validation PASS; live cross-project negative case remains NOT TESTED. E.3 and D.3 not started.
The controlled backend remains on port 4000 with schedulers disabled and process-only dummy email provider; do not start another backend on that port without checking the existing process.
