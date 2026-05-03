# Test Plan

This is what gets written *before* any implementation code. Each user story has tests at multiple layers — when those tests pass, the story is done.

## 1. Test Layers

| Layer | What it tests | Tool | Speed |
|---|---|---|---|
| **Backend unit** | Pure business logic (validators, state machines, rating math) | JUnit 5 | Milliseconds |
| **Backend integration** | Full HTTP request → controller → service → DB → response, against real Postgres | Spring Boot Test + Testcontainers | Seconds |
| **Backend contract** | Every endpoint matches `03-api.yaml` (request/response shapes, status codes) | Spring REST Docs OR a contract-test runner against the OpenAPI spec | Seconds |
| **Frontend unit** | Pure utilities, hooks, form validation logic | Vitest | Milliseconds |
| **Frontend component** | Components render correctly, respond to user interaction, call API client correctly | Vitest + React Testing Library + MSW | Milliseconds |
| **End-to-end (E2E)** | Real browser hits real frontend hits real backend hits real DB | Playwright | Many seconds |

**Pyramid**: lots of unit tests, fewer integration tests, a handful of E2E tests covering the most important flows.

## 2. Coverage Targets

- **Backend integration tests**: every endpoint in `03-api.yaml` has at least one happy-path test and at least one failure-path test (auth failure, validation failure, or business rule violation)
- **Frontend component tests**: every page and every form
- **E2E tests**: 3–5 critical user journeys end-to-end (see §5)
- **Numerical coverage** (line/branch %): not a target. Coverage is a side effect of testing behavior, not the goal.

## 3. Test Data & Fixtures

- **Test users**: a small set of canned users created in test setup (e.g., `alice`, `bob`, `carol`), each with known handles, ZIPs, and ratings
- **Test categories**: a fixed seed of 5 categories used across tests
- **Database state**: every backend integration test runs in a transaction that's rolled back on completion (or against a Testcontainers Postgres that's reset per test class)
- **Frontend mocks**: MSW intercepts API calls and returns canned responses based on the OpenAPI spec — frontend tests never need a running backend

## 4. Per-User-Story Test Lists

### US-1: Sign up
**Backend integration**:
- ✓ Valid registration → 201, returns user + JWT, password is hashed in DB
- ✗ Duplicate email → 409
- ✗ Duplicate handle → 409
- ✗ Invalid email format → 400
- ✗ Password too short (<8 chars) → 400
- ✗ `confirmedAdult: false` → 400
- ✗ Handle with invalid characters → 400
- ✗ ZIP not in v1 allowlist → 400

**Frontend component**:
- Form renders all fields
- Submit button disabled until form is valid
- Shows inline errors for invalid email, short password, missing 18+ checkbox
- On success, stores token in sessionStorage and navigates to home
- On 409 from server, shows "Email already in use" message

### US-2: Profile
**Backend integration**:
- ✓ `GET /me` with valid token → returns current user
- ✗ `GET /me` without token → 401
- ✗ `GET /me` with expired token → 401
- ✓ `PATCH /me { bio }` → bio updated
- ✗ `PATCH /me { bio: <too long> }` → 400
- ✓ `GET /users/{handle}` → returns public profile (no email, no zipCode beyond display)
- ✗ `GET /users/{nonexistent}` → 404

**Frontend component**:
- Profile page shows handle, bio, ZIP, average rating
- Edit bio form saves and refreshes display
- Public profile page hides email

### US-3: Listing offerings
**Backend integration**:
- ✓ Create listing with valid data → 201
- ✗ Create listing without auth → 401
- ✗ Create listing with title too short → 400
- ✗ Create listing with inactive category → 400
- ✓ Update own listing → 200
- ✗ Update someone else's listing → 403
- ✓ Soft-delete own listing → 204; listing.status becomes DELETED; not returned in browse
- ✓ Upload first photo → 201, position 0
- ✓ Upload second photo → 201, position 1
- ✗ Upload third photo → 409
- ✗ Upload photo to someone else's listing → 403
- ✓ Delete a photo → 204

**Frontend component**:
- Create-listing form: category dropdown populated from `/categories`, title/description validation, offerType radio buttons
- Photo upload accepts up to 2 files, shows previews
- Edit page pre-populates with current values
- "My Listings" page shows owned listings with edit/delete buttons

### US-4: Browse
**Backend integration**:
- ✓ `GET /listings` returns active listings only (not PAUSED, not DELETED)
- ✓ `GET /listings?categoryId=X` filters by category
- ✓ `GET /listings?q=keyword` matches in title or description (case-insensitive)
- ✓ `GET /listings?offerType=GIFT_ONLY` filters by offer type
- ✓ Pagination: `limit=10&offset=10` returns the next page; `total` count is correct
- ✓ Listings from non-Sequim users excluded (v1 hard limit)

**Frontend component**:
- Browse page renders list of listings
- Category filter dropdown updates results
- Search input updates results (debounced)
- "Load more" or pagination controls work
- Empty state when no results

### US-5: Listing detail
**Backend integration**:
- ✓ `GET /listings/{id}` returns listing with owner summary, photos, category
- ✗ `GET /listings/{id}` for DELETED listing → 404

**Frontend component**:
- Detail page shows title, description, photos, category, owner handle + rating
- "Make an Offer" button visible only when authenticated and not own listing
- Owner sees Edit/Delete buttons instead of "Make an Offer"

### US-6: Make an offer
**Backend integration**:
- ✓ Trade offer with valid offered listing → 201
- ✓ Gift-request offer (no offered listing) → 201
- ✗ Offer on own listing → 403
- ✗ Trade offer on a GIFT_ONLY listing → 403
- ✗ Gift-request on a TRADE_ONLY listing → 403
- ✗ Trade offer with offered listing not owned by offerer → 403
- ✗ Second pending offer from same user on same listing → 409
- ✗ `POST /offers/{id}/accept` by non-lister → 403
- ✓ Accept offer → creates Deal, status ACCEPTED; sibling pending offers auto-decline
- ✗ Accept already-accepted offer → 409
- ✓ Decline offer → status DECLINED
- ✓ Withdraw own pending offer → status WITHDRAWN
- ✗ Withdraw someone else's offer → 403
- ✗ Withdraw a non-pending offer → 409

**Frontend component**:
- Make-offer modal: choose Trade or Gift Request; if Trade, select from your own listings
- Inbox shows pending offers received with Accept / Decline buttons
- Sent-offers page shows status of each
- After accept, navigates to deal page

### US-7: Messaging
**Backend integration**:
- ✓ Send message as offer participant → 201
- ✗ Send message as non-participant → 403
- ✓ Get messages for offer (chronological) → 200
- ✗ Send message on WITHDRAWN/DECLINED offer → 409
- ✗ Send message on COMPLETED/CANCELLED deal → 409

**Frontend component**:
- Message thread renders messages in order with sender labels
- Send-message form posts and updates the thread
- Read-only banner on closed threads

### US-8: Deal tracking
**Backend integration**:
- ✓ Mark complete by participant A → status COMPLETED_BY_A
- ✓ Then mark complete by participant B → status COMPLETED, completedAt set
- ✗ Mark complete twice by same participant → 409
- ✓ Cancel by either participant before COMPLETED → status CANCELLED
- ✗ Cancel after COMPLETED → 409
- ✗ Cancel/mark-complete by non-participant → 403

**Frontend component**:
- Deal page shows status, both listings (or gift indicator), participants
- "I've completed my side" button transitions correctly
- After full completion, prompts both to rate
- Cancel button confirms before action

### US-9: Rating
**Backend integration**:
- ✓ Rate completed deal → 201
- ✗ Rate non-completed deal → 409
- ✗ Rate twice → 409
- ✗ Rate by non-participant → 403
- ✗ Stars outside 1–5 → 400
- ✓ Average rating updates on user's profile after new rating

**Frontend component**:
- Rate-this-deal form: 1–5 stars + optional review
- After submit, deal page shows your rating; other participant's rating shown when they submit theirs
- Public profile shows aggregated average and rating list

### Inbox polling
**Backend integration**:
- ✓ `GET /me/inbox` returns correct counts for the current user
- Counts reflect: pending offers received, unread messages, deals awaiting my mark-complete, completed deals I haven't yet rated

**Frontend component**:
- Inbox badge updates every 30 seconds while tab is active (test by advancing fake timers)
- Badge clears appropriately when items are addressed

## 5. End-to-End Tests (Playwright)

Slow but high-confidence. Run on every commit to main, not on every save.

1. **Sign up → list an item → log out** — the new-user happy path
2. **Trade flow**: Alice lists a thing → Bob makes a trade offer → Alice accepts → both mark complete → both rate each other → ratings appear on profiles
3. **Gift flow**: Alice lists a gift → Bob requests it → Alice accepts → both mark complete → both rate
4. **Sibling auto-decline**: Bob and Carol both offer on Alice's listing → Alice accepts Bob's → Carol's offer is now DECLINED in her sent-offers list
5. **Cancellation**: trade gets accepted → one party cancels → deal is CANCELLED, no rating possible

## 6. CI Strategy (GitHub Actions)

Every push runs:
1. Backend: `./mvnw test` (unit + integration)
2. Frontend: `npm test` (unit + component) and `npm run build` (catches TS errors)
3. Spec validation: lint `03-api.yaml` against the OpenAPI 3.0 schema
4. E2E suite (slower; runs on PRs to main as a separate job)

Workflow files live in `.github/workflows/`. The monorepo gets one workflow file per concern (e.g., `backend.yml`, `frontend.yml`, `e2e.yml`) so failures are easy to attribute.

## 7. What We're Explicitly Not Testing in v1

- Performance / load testing
- Cross-browser compatibility beyond modern Chrome/Safari/Firefox
- Accessibility audits beyond what React Testing Library catches by default
- Security penetration testing (basic OWASP-aware coding only)
- Visual regression testing (no screenshot comparisons)

These are real concerns but premature for a 20-user v1.
