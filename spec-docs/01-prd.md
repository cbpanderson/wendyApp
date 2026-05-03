# Product Requirements Document: Sequim Barter (working title)

## 1. Problem

People in Sequim, WA have skills, goods, and time they could exchange with neighbors, but existing platforms (Craigslist, Facebook Marketplace, Buy Nothing groups) are either money-focused, unstructured, or lack any reputation system. There's no purpose-built way to find a local trade partner, agree on a swap, and build trust over time.

## 2. Users

**Primary**: Adults (18+) in Sequim, WA who have a good or service to offer and want to trade or gift it without using money.

**Why they choose this over alternatives**: Structured matching by category, a reputation system that rewards honest dealing, and a community norm that money is explicitly not part of the exchange.

## 3. User Stories

### Account & Profile
**US-1** — As a new user, I want to sign up with email and password so I can access the app.
- AC: Email + password signup; must confirm 18+; email format validated; password min length enforced.
- AC: Duplicate emails rejected.

**US-2** — As a new user, I want to create a profile with a handle, ZIP code, and short bio so others can learn about me.
- AC: Handle is unique, displayed publicly; real name never shown.
- AC: ZIP code stored; only the city/ZIP is shown publicly, never an address.
- AC: Profile shows aggregate rating (avg + count) once user has any ratings.

### Listing Offerings
**US-3** — As a user, I want to list something I'm offering by selecting from preset categories so others can find it.
- AC: Categories chosen from a fixed preset list (admin-defined).
- AC: Listing has: title, category, description, optional photos (max 2), and a flag for "open to trade," "gift only," or "either."
- AC: User can edit or delete their own listings.
- AC: User sees their own listings on a "My Listings" page.

### Browsing & Discovery
**US-4** — As a user, I want to browse offerings from people in Sequim so I can find something I want.
- AC: List view of active listings, newest first.
- AC: Filter by category.
- AC: Search by keyword in title/description.
- AC: Only listings from users with a Sequim ZIP code are shown (v1 hard limit).

**US-5** — As a user, I want to view a listing and the person behind it so I can decide whether to make an offer.
- AC: Listing detail page shows the listing + lister's handle, bio, rating, and other active listings.

### Making & Tracking Deals
**US-6** — As a user, I want to make an offer on someone's listing so we can start a deal.
- AC: From a listing, user clicks "Make an Offer."
- AC: Offer can be a **trade** (propose one of my own listings as the return) or a **gift request** (asking them to gift it).
- AC: Offer includes an optional message.
- AC: Lister receives the offer in-app; can accept, decline, or counter via message.

**US-7** — As a user, I want to message the other party to coordinate so we can finalize timing and details.
- AC: In-app messaging tied to an offer/deal; no off-platform contact required.
- AC: Conversation history preserved per deal.

**US-8** — As a user, I want a deal to be formally tracked so the rating is tied to a real exchange.
- AC: When an offer is accepted, a Deal record is created with: type (trade or gift), participants, listing(s), timestamps, status.
- AC: Deal status: `pending` → `accepted` → `completed` → `rated` (or `cancelled` at any point).
- AC: Either party can mark the deal as completed; once both confirm, it moves to `completed`.

### Rating
**US-9** — As a user, I want to rate the other party after a completed deal so I can contribute to the trust system.
- AC: Rating is enabled only when deal status is `completed`.
- AC: Rating is 1–5 stars + optional short text review.
- AC: Both parties rate each other (gifts included — both giver and receiver leave a rating).
- AC: Ratings are public on the rated user's profile.
- AC: A user can only rate a deal once.

## 4. Non-Goals (Explicitly OUT of v1)

- "What I'm looking for" lists / automated two-way matching
- More than 2 photos per listing
- Scheduling or calendar features
- Dispute resolution tooling (handled manually via email)
- Identity verification beyond email signup
- User-created custom categories
- Native mobile apps (web responsive only)
- Email or SMS notifications (in-app only)
- Group/multi-party trades
- User reporting/blocking
- Discovery beyond Sequim (no radius slider, no other cities, no map)
- External payment of any kind

## 5. Success Metrics (first 3 months post-launch)

1. **20+ active users** in Sequim
2. **15+ completed deals**
3. **80%+ of completed deals rated by both parties**
4. **Average platform rating ≥ 4.0/5**
5. **30%+ of users complete a 2nd deal within 60 days**

## 6. Constraints

- **Auth**: Email + password; 18+ confirmation at signup
- **Privacy**: Location stored as ZIP; users use handles, not real names
- **Geographic scope**: Sequim, WA only in v1 (hard-filtered by ZIP)
- **Compliance**: Terms of Service and Privacy Policy are TBD — must be drafted before public launch *(reminder logged)*
- **Stack**: React frontend, Java backend (Spring Boot recommended); database TBD (Postgres recommended)
- **Hosting**: Self-hosted; budget-conscious. Frontend can go on GitHub Pages; backend + DB will need a free-tier PaaS (Render / Railway / Fly.io / Oracle Cloud Free Tier)
- **Scale target**: Small (tens of users in v1) — no premature optimization
- **Timeline**: No fixed deadline

## 7. Open Questions / Deferred Decisions

- Final preset category list (recommend drafting ~20–30 categories before US-3 implementation)
- Backend hosting provider choice (decide before deployment)
- Domain name (decide before launch)
- Terms of Service / Privacy Policy (must exist before public launch)
