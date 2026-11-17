# Phase B2 - Legacy Document Stage Recovery Review

Date: 2026-11-16 (Asia/Bangkok client date). Mode: local read-only audit, no recovery authorization.

## Target and Scope

- Target: 127.0.0.1:3306 / edms_smpv_dev; MariaDB 10.4.32-MariaDB; hostname DESKTOP-3DFA1TA.
- XAMPP process verified: PID 11916, D:/xampp/mysql/bin/mysqld.exe; datadir D:/xampp/mysql/data/.
- Examined 49 revisions / 49 distinct referenced files, 117 document history records and 122 relevant audit records.
- No database write, schema migration, storage access, backfill, application change, deployment, commit or push.
- Existing Phase B implementation and migration artifacts were left unchanged. Snapshot columns remain absent.

## Results

| Classification | Count | Recovery proposal |
| --- | ---: | --- |
| VERIFIED_DIRECT | 15 | Include |
| VERIFIED_CORRELATED | 23 | Include |
| AMBIGUOUS | 11 | Exclude, retain Unknown |
| UNVERIFIABLE | 0 | Exclude |
| Total | 49 | 38 proposed rows |

| Proposed stage | Count |
| --- | ---: |
| IFR-Submitted | 28 |
| IFA-Submitted | 10 |
| As-Built | 0 |
| Unknown | 11 |

Phase B1 was revalidated rather than assumed: its 15 direct and 16 initial correlated revisions remain verified. Seven additional revisions have unique one-to-one upload-history correlations (four IFR, three IFA). No evidence was upgraded solely to reduce Unknown.

## Evidence Rules

1. VERIFIED_DIRECT: a single Upload Revision audit explicitly references the exact revision ID. Project, uploader and metadata revisionSequence match the linked revision/file; metadata.revision records its upload stage. No contradictory exact reference or compatible-history conflict was found.
2. Initial VERIFIED_CORRELATED: exactly one sequence-1 revision and one initial Upload Document history event per document. Project/document/uploader and file ownership match; source_status is NULL, result_status and history workflow_status are Process Review, and IFR-Submitted is explicitly recorded in history. All 16 also have exactly one Upload Document audit; that audit alone does not provide stage.
3. Additional VERIFIED_CORRELATED: exactly one noninitial revision and exactly one Upload Revision history event share project/document/uploader/recorded result status. Stage is explicitly read from that unique history row. No temporal proximity, current revision_label, filename or storage folder is used to prove stage.
4. AMBIGUOUS: multiple revisions/history events share correlation keys. Some candidate stage values agree, but exact one-to-one event ownership cannot be established. These 11 rows remain Unknown and are not mapping targets.
5. Snapshot values are stage-only. Username and role snapshots are not recovered or modified. AS-Built historical spelling is normalized to the new snapshot CHECK value As-Built only in the proposal.

## Initial Revision Revalidation

All 16 initial revisions retain VERIFIED_CORRELATED; none were downgraded. Each has exactly one initial upload history event and one initial upload audit, consistent project/document/uploader/file ownership and explicitly recorded IFR stage. Later workflow events were not misclassified as upload events.

| Revision ID | Initial upload history ID | History count | Audit count |
| --- | --- | ---: | ---: |
| REV-7bd2a3a6-a16c-47d1-af13-2ac88fb396c4 | DTH-8a3daf43-d451-4573-a585-ba5aa56ec5cb | 1 | 1 |
| REV-f74ede0a-03e2-43db-9ca7-6ab46b97e9df | DTH-6e8aaed3-1872-4cf3-80db-dcfa47a82c68 | 1 | 1 |
| REV-8ac01d10-0983-4a6d-ad64-62b2a96e33de | DTH-ba1db710-6e24-41a5-949e-baa08fbee9ba | 1 | 1 |
| REV-9c9765b1-8c43-4c64-982b-9469d6c2dc2e | DTH-4919189f-9258-4361-9400-4246b1016fbe | 1 | 1 |
| REV-58d5cbe6-cf15-45cd-a0b4-f66bc8285fa2 | DTH-20ca71f3-c5f7-45cc-b247-faf165bcadf7 | 1 | 1 |
| REV-b3aed133-2e5c-47ae-8fcf-3f142a18eeec | DTH-dda815a4-c5ac-4625-9b12-e5fb377cf3c5 | 1 | 1 |
| REV-a5e4672e-2610-481e-a289-e897b836527f | DTH-c64b4038-cb3b-4bd3-816c-1e0591a0d23b | 1 | 1 |
| REV-a34549a1-296a-45b1-b07c-4a20576bf93a | DTH-8f99b959-0733-4306-8bcf-57b824104ab4 | 1 | 1 |
| REV-d455eb07-830c-4d7f-b0e8-0bddb3087df8 | DTH-49e3f1c9-8fa9-4492-812c-6cf9be99cdc4 | 1 | 1 |
| REV-e085e418-e0eb-405e-9bc7-282d3ac8265e | DTH-77adfbb9-5179-4e70-aeb7-9898559b2083 | 1 | 1 |
| REV-ba15e93d-4b64-494b-9f9d-e1362a997a3d | DTH-2b8040c5-fd9e-474d-8fd8-88a35de89e08 | 1 | 1 |
| REV-499b84fc-d913-483d-a2c5-f4085a14a7fb | DTH-72c61df6-40ac-4959-b939-420f59ea850f | 1 | 1 |
| REV-1fba9f73-35d7-4aca-a9a1-e77872a7e544 | DTH-457e0d66-b441-49db-a7f1-a990874926f5 | 1 | 1 |
| REV-49720b72-a1dc-44b6-b85b-a1d5a302a402 | DTH-1a8dd448-02e8-4447-89c7-e5769a1973b2 | 1 | 1 |
| REV-3da1d25d-10db-49fc-9c8f-5d42370d270c | DTH-e01c728c-fe87-436a-9aa5-9606eef3c450 | 1 | 1 |
| REV-df7badfd-189b-43f8-852f-2a06aac5ce5d | DTH-66d4fe99-0cd2-4bc6-bc22-5d6ebe4ab8e9 | 1 | 1 |

## Integrity and Conflicts

- Missing file metadata: 0; missing uploader users: 0; project/document ownership and uploader mismatches: 0.
- Duplicate exact upload audits for extant revision/file IDs: 0; duplicate initial upload events: 0.
- Noninitial revisions without an exact revision-referenced Upload Revision audit: 18. Seven have independently unique history evidence; 11 remain ambiguous.
- Conflicting exact stage evidence: 0 under the documented checks. Ambiguity is missing ownership correlation, not proof of contradictory stage values.
- Mutable revision labels differ from the proved upload stage on 11 verified rows. This is a diagnostic comparison only, not stage evidence.
- Nine verified direct rows are Admin edits with fileUploaded=true. Audit metadata revision and exact revision ID distinguish the actual file upload from metadata-only edits; metadata-only edits are not upload evidence.
- All 49 revision.created_at values are approximately +7 hours relative to stored_files.uploaded_at (raw DATETIME delta: 25200000..25200033 ms). This is consistent with default session timestamps versus explicit UTC writes, but no timezone correction or historical inference was applied. Timestamps are retained raw in the inventory.
- Physical file/object existence, content checksum and R2/volume/native identity: NOT CHECKED. No storage calls were made.
- No As-Built upload has strong evidence in this local dataset. This does not prove such uploads cannot exist in another environment.

## Artifacts

- Full inventory: 20261116_revision_stage_recovery_inventory.csv (49 data rows, one classification per revision).
- Recovery proposal: 20261116_revision_stage_recovery_mapping.csv (38 data rows; verified classes only).
- Mapping SHA-256 (actual file bytes): c71b8c54271cf6234be3b975ae29db5df4133d62216e1c0353d59368505231ab.
- evidence_sha256 binds the reviewed revision metadata and the referenced history/audit rows. It is review evidence, not an approval token, backup or ready-to-run recovery mechanism.
- No SQL mutation script was generated. CSV contains internal IDs, required original filenames and uploader IDs, but no credentials, storage paths or secrets.

## Stability and Safety

The revision/file/document diagnostic dataset, all 117 history rows and the 122 relevant audit rows were reread before connection close. Their in-memory SHA-256 comparisons were unchanged. This verifies the reviewed datasets at both observations, not absence of every concurrent backend write. The database connection was closed.

## Recovery Compatibility and Owner Gate

The 38 proposed revision IDs and evidence references are unique. Proposed values are permitted by upload_stage_snapshot CHECK; no dependency on current stage, REV., active file pointers or mutable membership is used. Mapping is suitable for owner review and a separately authorized stage-only recovery plan after Phase B migration.

Before any future write: approve and back up the exact local environment, stop/confirm relevant writers, revalidate target and all evidence (including fingerprints), confirm migration columns/CHECK constraints, verify each target snapshot remains NULL, reject changed/ambiguous rows, and use guarded stage-only updates with independent post-verification. Do not reuse this local mapping on Railway or another database. Do not overwrite non-NULL snapshots or touch username/role snapshots, revision_label, REV., workflow history or active pointers.

Final decision: RECOVERY MAPPING READY FOR OWNER REVIEW - NO BACKFILL APPROVAL OR EXECUTION.

