# EMAIL-INFRASTRUCTURE.md

## Document Information

  Item           Value
  -------------- -------------------------------------------------------
  Project        ReBuild Engineering Document Management System (EDMS)
  Purpose        Source of Truth for email infrastructure
  Status         UAT / Pre-Production
  Last Updated   2026-07-25

------------------------------------------------------------------------

# 1. Purpose

Dokumen ini menjadi acuan resmi konfigurasi infrastruktur email untuk
EDMS, khususnya pengiriman email otomatis menggunakan Resend.

Dokumen ini **tidak** mengatur business workflow maupun template email.

------------------------------------------------------------------------

# 2. Architecture Overview

``` text
                        Internet
                            │
                            ▼
                 beta-int-modernergy.com
                            │
                    DNS Manager
                     (Hostinger)
                            │
          ┌─────────────────┴─────────────────┐
          │                                   │
          ▼                                   ▼
      Titan Email                         Resend
 (Mailbox & Daily Email)          (Application Email Delivery)
          │                                   │
          └─────────────────┬─────────────────┘
                            ▼
                    EDMS Backend API
                            │
                            ▼
                     End User Mailbox
```

------------------------------------------------------------------------

# 3. Responsibilities

  Component      Responsibility
  -------------- ---------------------------------------
  Hostinger      DNS Management
  Titan Email    Mailbox (Send & Receive Manual Email)
  Resend         Automated Email Delivery
  Backend EDMS   Trigger email & business logic

------------------------------------------------------------------------

# 4. Sender Strategy

## Current (UAT)

Display Name

``` text
EDMS Notification
```

Sender

``` text
info@beta-int-modernergy.com
```

Purpose

-   Forgot Password
-   Integration Testing
-   UAT

------------------------------------------------------------------------

## Future (Production)

Recommended Sender

``` text
edms@beta-int-modernergy.com
```

Alternative

``` text
notification@beta-int-modernergy.com
```

Changing sender only requires updating configuration, not application
logic.

------------------------------------------------------------------------

# 5. Email Provider

Current Provider

``` text
Resend
```

Previous Provider

``` text
Dummy Provider (Development)
```

------------------------------------------------------------------------

# 6. DNS Records

## Required

### DKIM

-   Type: TXT
-   Name: resend.\_domainkey

### SPF (Subdomain)

-   Type: TXT
-   Name: send

### MX (Subdomain)

-   Type: MX
-   Name: send

### DMARC

-   Type: TXT
-   Name: \_dmarc
-   Policy: p=none

------------------------------------------------------------------------

# 7. Existing Mail Infrastructure

Current mailbox provider

``` text
Titan Email
```

Current DNS Manager

``` text
Hostinger
```

Important:

-   Do NOT modify existing MX records.
-   Do NOT delete Titan SPF.
-   Do NOT delete Titan DKIM.
-   Only add Resend records.

------------------------------------------------------------------------

# 8. Backend Environment

``` env
EMAIL_PROVIDER=resend
EMAIL_FROM=info@beta-int-modernergy.com
```

------------------------------------------------------------------------

# 9. Current Email Features

Implemented

-   Forgot Password

Planned

-   Approval Notification
-   Workflow Notification
-   Escalation Alert
-   SLA Reminder
-   General System Notification

------------------------------------------------------------------------

# 10. Security

Authentication stack

-   SPF
-   DKIM
-   DMARC

Current DMARC policy

``` text
v=DMARC1; p=none;
```

Future recommendation

-   UAT → p=none
-   Stable Production → evaluate p=quarantine
-   Mature Production → evaluate p=reject

------------------------------------------------------------------------

# 11. Operational Rules

1.  Never replace existing MX records.
2.  Never remove Titan Email records.
3.  Resend is used only for automated application email.
4.  Manual email communication remains on Titan Email.
5.  Sender changes must be configuration-only.

------------------------------------------------------------------------

# 12. Production Migration Checklist

-   Domain Verified
-   SPF Valid
-   DKIM Valid
-   DMARC Active
-   API Key Configured
-   Backend Connected to Resend
-   Forgot Password Tested
-   Email Delivered Successfully
-   Inbox Placement Verified

------------------------------------------------------------------------

# 13. Decision Log

Current official decisions

-   DNS Manager: Hostinger
-   Mailbox Provider: Titan Email
-   Automated Email Provider: Resend
-   Current Sender: info@beta-int-modernergy.com
-   Future Sender: edms@beta-int-modernergy.com (recommended)
-   DMARC Policy: p=none during UAT
