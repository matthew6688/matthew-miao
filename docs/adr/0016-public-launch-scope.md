# Public launch scope uses repository skills and Cal.com

Status: Accepted — 2026-08-10

## Decision

The production product is the bilingual public site, repository-owned blog and
photo publication, and the Cal.com AMA handoff. Cal.com owns booking, Stripe
payment, Google Meet, notifications, rescheduling, cancellation, and refunds.
The public offer is 30 minutes for US$299.

Blog and photo operations use the repository Agent Skills. The inherited
self-hosted owner Admin, PostgreSQL catalog, Checkout, calendar, email, and rate
limit implementation remains fail-closed reference code and is not part of the
production launch contract. Neon, Clerk, SendGrid/Resend, application-owned
Stripe, Google Calendar, and Upstash credentials are therefore not required to
operate the current site.

## Consequences

- `/ama/book` and `/en/ama/book` continue to redirect to the canonical Cal.com
  Event Type while preserving the approved public-route exception.
- Production deployment verifies the Event Type's public API contract before
  deploying. A real charge, notification, cancellation, or refund remains a
  Cal.com operational check; the repository does not claim to automate or prove
  those provider-owned effects.
- Blog and photo changes go through `publish-matthew-blog` and
  `manage-matthew-photos`, including Preview and protected Production gates.
- The preserved upstream component structure plus the current bilingual,
  multi-viewport, theme, and reduced-motion golden matrix is the accepted 1:1
  visual evidence. A cross-content pixel subtraction against Cali's personal
  text and assets would not be meaningful and is not a release requirement.
- `/admin` and inherited provider APIs remain non-public and fail closed without
  complete credentials. Enabling them later is a separate product decision with
  its own threat model, provider setup, and acceptance plan.
