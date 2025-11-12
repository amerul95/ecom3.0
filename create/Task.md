# Task.md — Milestone Plan & Checklists

This file contains actionable tasks to build the full‑stack e‑commerce app (Next.js + PostgreSQL + OxPay + SMTP).  
Use the checkboxes to track progress. Milestones are designed to be shippable increments.

---

## Milestone 1 — Foundation & Scaffolding
**Goal:** Project bootstrapped, core infrastructure ready.

- [x] Initialize mono‑repo/repo and Next.js (App Router, TS, ESLint, Tailwind). **Status: DONE**
- [x] Add base UI shell (layout, nav, auth modals, toasts). **Status: DONE** (Navbar, Footer, basic layout exists)
- [ ] Configure environment handling and `.env.example`. **Status: NOT DONE**
- [x] Install core deps: Prisma, NextAuth, Zod, Nodemailer, Axios. **Status: DONE** (All dependencies installed)
- [x] Define **Prisma schema** (User, SellerProfile, Product, Variant, Category, CartItem, Order, OrderItem, ShippingInfo, Payment). **Status: DONE** (Full PRD schema implemented)
- [x] Run initial migration & create `seed.ts` (admin/seller/buyer users + sample products). **Status: DONE** (seed.ts updated for new schema)
- [x] Implement **DB client** singleton and error handler. **Status: DONE** (lib/prisma.ts exists)
- [x] Set up **NextAuth** (credentials + optional Google OAuth). **Status: DONE** (Basic auth works, Google OAuth configured)
- [x] Add **RBAC** helpers & middleware (`requireRole`). **Status: DONE** (requireRole, requireBuyer, requireSeller, requireAdmin implemented)
- [x] Choose storage provider (Cloudinary/S3) and add upload adapter. **Status: DONE** (S3 upload implemented)
- [ ] Basic logging (pino) and request ID propagation. **Status: NOT DONE**
- [ ] CI: lint, typecheck, unit test workflow. **Status: NOT DONE**
- [x] README + Cursor.md + Planning.md updated. **Status: DONE**

**Exit Criteria**
- [ ] `npm run dev` works; migrations applied; seed successful.
- [ ] Sign‑in/out works; roles applied to session.
- [ ] CI green on main branch.

---

## Milestone 2 — Buyer MVP
**Goal:** Shippable storefront with browse → cart → checkout (intent stub).

- [x] Catalog pages: Home, Category listing (filters/sort), Product detail. **Status: PARTIALLY DONE** (Home page exists, category pages exist, Products API with filters implemented)
- [ ] Search endpoint + UI (debounced, server‑side). **Status: NOT DONE**
- [ ] Reviews: display + create (auth required). **Status: NOT DONE**
- [x] Cart service: add/update/remove; server‑persisted per user. **Status: DONE** (Cart API routes implemented: GET, POST, PATCH, DELETE)
- [x] Checkout page (address capture + order summary). **Status: PARTIALLY DONE** (Checkout page exists, order creation API ready)
- [x] Create Order + Payment records (status: PENDING/INITIATED). **Status: DONE** (Order API with payment record creation implemented)
- [ ] Email: order confirmation (SMTP) after order creation (stub for payment). **Status: NOT DONE**
- [x] Order history pages (list/detail) for buyer. **Status: PARTIALLY DONE** (Order API routes implemented: GET /api/orders, GET /api/orders/[id], frontend pages need connection)
- [ ] Accessibility pass (keyboard, aria) and responsive layouts. **Status: NOT DONE**
- [ ] E2E test: browse → add to cart → checkout intent. **Status: NOT DONE**

**Exit Criteria**
- [ ] Buyer can place an order through intent stub without payment capture.
- [ ] >90 Lighthouse perf on key pages (local).

---

## Milestone 3 — Seller MVP
**Goal:** Seller can manage products and fulfill orders.

- [x] Seller onboarding flow + KYC fields (admin approval flag). **Status: PARTIALLY DONE** (Seller signup exists, need KYC fields)
- [x] Seller dashboard shell (protected). **Status: PARTIALLY DONE** (Dashboard exists but needs completion)
- [x] Product CRUD: create/edit/delete products & variants. **Status: PARTIALLY DONE** (Basic CRUD exists via /api/items, need variants support)
- [x] Image upload (Cloudinary/S3) with client & server validation. **Status: DONE** (S3 upload implemented)
- [ ] Bulk import (CSV/XLSX) with preview + error reporting. **Status: NOT DONE**
- [ ] Orders list for seller; update status; add tracking details. **Status: NOT DONE**
- [ ] Inventory updates on order transitions (PROCESSING/SHIPPED). **Status: NOT DONE**
- [ ] Sales analytics (basic): revenue, top products, last 30 days. **Status: NOT DONE**
- [ ] Unit tests: stock math, ownership/authorization. **Status: NOT DONE**

**Exit Criteria**
- [ ] Seller can publish products & fulfill an order to SHIPPED.
- [ ] Stock levels adjust correctly and are reflected in catalog.

---

## Milestone 4 — Admin MVP
**Goal:** Operational control, moderation, and reporting.

- [ ] Admin dashboard KPIs (sales, active users, products). **Status: NOT DONE**
- [ ] Approve/reject sellers; suspend users. **Status: NOT DONE**
- [ ] Moderate products (approve/disable, flagged items queue). **Status: NOT DONE**
- [ ] Category management (CRUD, parent/child). **Status: NOT DONE**
- [ ] View all transactions & refund requests (read‑only for now). **Status: NOT DONE**
- [ ] Platform reports (CSV export): sales by date/seller/category. **Status: NOT DONE**
- [ ] Activity/audit log for sensitive actions. **Status: NOT DONE**

**Exit Criteria**
- [ ] Admin can onboard sellers, curate catalog, and export reports.
- [ ] Audit trail present for admin actions.

---

## Milestone 5 — Payments & Webhooks (OxPay)
**Goal:** Real payment flow with webhook reconciliation.

- [ ] Implement `services/payments/oxpay.ts` with createIntent/capture/refund. **Status: NOT DONE**
- [ ] Configure OxPay sandbox keys & endpoints from vendor docs. **Status: NOT DONE**
- [ ] Build `POST /api/payments/oxpay/intent` (Zod validation + RBAC). **Status: NOT DONE**
- [ ] Implement `/api/webhooks/oxpay` with signature verification + idempotency. **Status: NOT DONE**
- [ ] Update Order/Payment state machine and error handling. **Status: NOT DONE**
- [ ] Refund flow (admin‑initiated) with partial refunds supported if API allows. **Status: NOT DONE**
- [ ] Store raw webhook payloads for audit. **Status: NOT DONE**
- [ ] E2E test: full payment happy path (sandbox). **Status: NOT DONE**

**Exit Criteria**
- [ ] Orders move to PAID/PROCESSING after OxPay confirmation.
- [ ] Failed/expired intents are handled and surfaced to the user.

---

## Milestone 6 — Email & Notifications
**Goal:** Reliable transactional messaging.

- [ ] SMTP transport with pooling & retries; configurable from env. **Status: NOT DONE**
- [ ] Templates: order confirmation, shipping update, password reset, seller approval. **Status: NOT DONE**
- [ ] Central `mailer` service with typed inputs. **Status: NOT DONE**
- [ ] Optional: in‑app notifications center and unread counters. **Status: NOT DONE**
- [ ] E2E: verify emails captured via MailHog/dev inbox in local. **Status: NOT DONE**

**Exit Criteria**
- [ ] All critical user flows trigger the right email within seconds.
- [ ] No secrets in logs; PII minimized in email payloads.

---

## Milestone 7 — Quality, Observability & Scale
**Goal:** Production readiness.

- [ ] Rate limiting (auth/payment routes) — Upstash Redis or adapter. **Status: NOT DONE**
- [ ] Error boundaries & user‑friendly error pages. **Status: NOT DONE**
- [ ] Performance profiling & caching (ISR/Redis where applicable). **Status: NOT DONE**
- [ ] Monitoring: basic logs, request metrics, 4xx/5xx alerts. **Status: NOT DONE**
- [ ] Security hardening: headers (CSP, HSTS), CSRF verification, input limits. **Status: NOT DONE**
- [ ] Backup & restore docs for Postgres; migration strategy. **Status: NOT DONE**
- [ ] CI: add Playwright e2e to pipeline; flaky test budget. **Status: NOT DONE**
- [ ] Load test critical endpoints (k6/Artillery). **Status: NOT DONE**

**Exit Criteria**
- [ ] P95 < 500ms on key APIs; homepage TTFB < 200ms (edge/ISR).
- [ ] CI/CD fully automated with checks gating production deploys.

---

## Milestone 8 — Launch & Post‑Launch
**Goal:** Public release and iterative improvements.

- [ ] Configure domains, SSL, and CDN caching rules. **Status: NOT DONE**
- [ ] Final content pass (SEO, meta tags, OG images). **Status: NOT DONE**
- [ ] Seed production categories and initial sellers. **Status: NOT DONE**
- [ ] Run smoke tests in production environment. **Status: NOT DONE**
- [ ] Incident playbook & on‑call rotation (lightweight). **Status: NOT DONE**
- [ ] Analytics dashboard (PostHog): funnels for add‑to‑cart/checkout. **Status: NOT DONE**
- [ ] Roadmap grooming for Phase 2 (loyalty, chat, multi‑currency). **Status: NOT DONE**

**Exit Criteria**
- [ ] Public launch checklist complete; rollback plan documented.
- [ ] Tracking shows baseline conversion and retention metrics.

---

## Cross‑Cutting Tasks (Ongoing)
- [x] Zod validation for all API boundaries. **Status: PARTIALLY DONE** (Some validation exists, need to expand)
- [ ] Strict TypeScript, no unhandled `any`. **Status: NOT DONE** (Need to review and fix)
- [ ] Accessibility (WCAG AA) and keyboard support. **Status: NOT DONE**
- [ ] Internationalization & currency formatting hooks (future‑ready). **Status: NOT DONE**
- [ ] Documentation updates with every feature PR. **Status: ONGOING**

---

## Owners & Estimates (Template)
> Duplicate this table per milestone in your issue tracker.

| Task | Owner | Estimate | Status |
|------|------:|---------:|:------:|
| e.g., Implement OxPay intent API | @you | 2d | ☐ |

---

**Tip:** Convert each checkbox to a GitHub issue and link them to a Milestone for tracking. Keep PRs small; one migration per PR when possible.
