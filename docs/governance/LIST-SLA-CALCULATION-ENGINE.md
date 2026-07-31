K. Multiple SLA Calculators Present
| Location | Purpose | Formula/Behavior |
|---|---|---|
| `document.repository.js` | Canonical backend document SLA | `Math.floor(totalMinutes / 1440)` lalu compare days |
| `sla.service.js` | SLA list + At Risk notification | memakai `document.slaStatus` dari repository |
| `escalation.service.js` | Escalation + Overdue notification | current source memakai `document.slaStatus === Overdue` |
| `frontend/sla-engine.service.js` | frontend fallback/live display | formula day-floor |
| `frontend/escalation.service.js` | frontend fallback escalation | masih punya local calculator untuk fallback |

M. GET Side Effects
| Endpoint | Creates Notification? | Evidence |
|---|---|---|
| `GET /api/v1/sla` | YES, At Risk | `sla.service.js → createSlaNotifications()` |
| `GET /api/v1/escalations` | YES, Overdue | `escalation.service.js → createEscalationNotification()` |
| `GET /api/v1/dashboard/summary` | NO notification side effect | hanya build summary dari documents |
| Other GET | Tidak ada bukti SLA notification producer lain | source search |