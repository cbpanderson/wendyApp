# Sequim Barter — User Testing Script

**Prerequisites**
- Backend running at `localhost:8080`
- Frontend running at `localhost:5173`
- Both Docker containers up (`docker ps` should show `wendyapp-postgres` and `wendyapp-postgres-test`)
- Two browsers open: call them **Browser A (Alice)** and **Browser B (Bob)**

---

## Part 1 — Registration & Validation

### 1A. Happy path registration (Browser A)
1. Go to `http://localhost:5173`
2. Click **Sign up**
3. Fill in:
   - Email: `alice@sequim.test`
   - Password: `correct-horse-battery`
   - Handle: `alice`
   - ZIP: `98382`
   - Check "I confirm I am 18 or older"
4. Click **Create account**
5. ✅ Should land on home page, signed in as **@alice**

### 1B. Happy path registration (Browser B)
Repeat in Browser B with:
- Email: `bob@sequim.test`
- Password: `buzzing-bees-honey`
- Handle: `bob`
- ZIP: `98382`
- ✅ Should land on home page as **@bob**

### 1C. Validation errors (Browser A — sign out first, then try signing up again)
Test each bad input one at a time. After each, fix it and move to the next:

| Field | Bad value | Expected error |
|---|---|---|
| Email | `notanemail` | "Invalid email" |
| Password | `short` | "at least 8 characters" |
| Handle | `no spaces!` | "letters, numbers, underscores only" (or similar) |
| ZIP | `10001` | "not in the Sequim service area" (or similar) |
| Adult checkbox | unchecked | should not allow submit |
| Duplicate email | `alice@sequim.test` | 409 "Email already in use" |
| Duplicate handle | `alice` | 409 "Handle already in use" |

---

## Part 2 — Login & Auth Guards

### 2A. Sign out and log back in (Browser A)
1. Click **Sign out** from home page
2. Click **Log in**
3. Enter `alice@sequim.test` / `correct-horse-battery`
4. ✅ Back on home page as @alice

### 2B. Wrong password
1. Sign out, try logging in with wrong password
2. ✅ Should see "Invalid email or password" error

### 2C. Auth guards — while signed out, try to navigate directly to:
- `localhost:5173/listings/new` → ✅ should redirect to `/login`
- `localhost:5173/me` → ✅ should redirect to `/login`
- `localhost:5173/me/listings` → ✅ should redirect to `/login`
- `localhost:5173/me/deals` → ✅ should redirect to `/login`

---

## Part 3 — Profile

### 3A. Edit bio (Browser A, logged in as Alice)
1. Click **My profile** from home page
2. Click **Edit**
3. Type a bio: `I have backyard hens and trade fresh eggs.`
4. Click **Save**
5. ✅ Bio appears below handle

### 3B. Public profile view
1. Click **Public view** from home page (or navigate to `localhost:5173/users/alice`)
2. ✅ Shows handle, bio, location "Sequim, WA 98382"
3. ✅ No edit controls visible
4. ✅ Ratings section shows (empty for now)

---

## Part 4 — Create Listings (Browser A — Alice)

### 4A. Create first listing
1. Click **Create a listing**
2. Fill in:
   - Category: **Fresh Eggs**
   - Title: `Dozen brown eggs`
   - Description: `Fresh backyard eggs from free-range hens. Available weekly.`
   - What's on offer: **Either** (trade or gift)
3. Optionally add a photo (JPEG or PNG, under 2MB)
4. Click **Create listing**
5. ✅ Redirected to My Listings, listing appears

### 4B. Create second listing
1. Create another listing:
   - Category: **Home & Garden**
   - Title: `Tomato seedlings`
   - Description: `Heirloom varieties, started indoors. Ready to transplant.`
   - What's on offer: **Trade only**
2. ✅ Both listings appear in My Listings

### 4C. Edit a listing
1. Click on the first listing
2. Click **Edit**
3. Change the description
4. Save
5. ✅ Updated description shows

### 4D. Validation errors on create
1. Click **Create a listing**
2. Try submitting with title under 5 characters → ✅ validation error
3. Try submitting with no category selected → ✅ validation error

---

## Part 5 — Browse Listings (Browser B — Bob)

### 5A. Browse all listings
1. Click **Browse listings** (from home page or nav)
2. ✅ Alice's two listings appear
3. ✅ Category, title, offer type visible on each card

### 5B. Filter by category
1. Select **Fresh Eggs** from category filter
2. ✅ Only the egg listing shows
3. Clear filter → both listings reappear

### 5C. Listing detail
1. Click on **Dozen brown eggs**
2. ✅ Full title, description, category, owner handle visible
3. ✅ "Make an offer" button visible (Bob is not the owner)
4. Navigate to `localhost:5173/users/alice` → ✅ Alice's public profile with active listings

### 5D. Own listing — no offer button (Browser A)
1. In Browser A, navigate to Browse listings
2. Click on Alice's own listing
3. ✅ "Make an offer" button should NOT appear (you can't offer on your own listing)

---

## Part 6 — Offers (Browser B — Bob)

### 6A. Make a trade offer
1. In Browser B, go to the **Dozen brown eggs** listing
2. Click **Make an offer**
3. Select **Trade** offer type
4. Select one of Bob's listings as what you're offering in return
   - If Bob has no listings yet: go create one first (e.g., "Raw wildflower honey")
5. Click **Submit offer**
6. ✅ Redirected to My Offers, offer shows as **PENDING**

### 6B. Make a gift request
1. Go to **Tomato seedlings** listing
2. Click **Make an offer**
3. Select **Gift request** (asking for it as a gift)
4. Click **Submit offer**
5. ✅ Second offer shows as PENDING in My Offers

### 6C. Offer validation
1. Try making a second offer on the same listing while one is PENDING
2. ✅ Should get an error "You already have a pending offer on this listing"

### 6D. View received offers (Browser A — Alice)
1. Click **My offers**
2. Click **Received** tab
3. ✅ Bob's offers appear

### 6E. Accept an offer (Browser A)
1. On Bob's trade offer for eggs → click **Accept**
2. ✅ Offer status changes to **ACCEPTED**
3. ✅ Other pending offers on the same listing auto-declined (if any)

### 6F. Decline an offer (Browser A)
1. On the gift request offer → click **Decline**
2. ✅ Status changes to **DECLINED**

### 6G. Withdraw an offer (Browser B)
1. In Browser B, My Offers → Sent tab
2. If there's still a PENDING offer on a different listing → click **Withdraw**
3. ✅ Status changes to **WITHDRAWN**

---

## Part 7 — Messages (after an accepted offer)

### 7A. Send a message (Browser B — Bob)
1. In My Offers → Sent tab, click on the accepted offer to open the thread
2. Type: `Hey Alice, when's a good time to swap?`
3. Click **Send**
4. ✅ Message appears in thread with Bob's handle and timestamp

### 7B. Reply (Browser A — Alice)
1. In My Offers → Received tab, open the same offer thread
2. ✅ Bob's message is visible
3. Reply: `Saturday morning works great!`
4. ✅ Both messages appear in chronological order

### 7C. Non-participant can't message
- The message thread UI should only be reachable by the two participants — a third user navigating directly to `/offers/{id}` should see a 403 error or be redirected.

---

## Part 8 — Deals

### 8A. Find the deal (Browser A — Alice)
1. Click **My deals** from home page
2. ✅ The deal from the accepted offer appears with status **ACCEPTED**
3. Click on the deal
4. ✅ Deal detail shows: listing title(s), both participants, status chip

### 8B. Mark complete — first side (Browser A)
1. On the deal page, click **Mark as complete**
2. ✅ Status changes to **COMPLETED_BY_A** (one side marked)
3. ✅ "Mark as complete" button disappears for Alice (already marked)

### 8C. Mark complete — second side (Browser B — Bob)
1. In Browser B → My deals → click the deal
2. ✅ Status shows COMPLETED_BY_A (one side done)
3. Click **Mark as complete**
4. ✅ Status changes to **COMPLETED**
5. ✅ "Leave a rating" button appears for both participants

### 8D. Cancel a deal (separate deal — create a new offer and accept it)
1. Create a fresh offer, accept it to create a new deal
2. On the new deal, click **Cancel**
3. ✅ Status changes to **CANCELLED**
4. ✅ "Mark as complete" is gone
5. Try to cancel again → ✅ button should be gone (or show an error)

---

## Part 9 — Ratings

### 9A. Rate the other person (Browser A — Alice rates Bob)
1. On the COMPLETED deal page, click **Leave a rating**
2. Select **5 stars**
3. Write a review: `Bob's honey was incredible. Smooth transaction!`
4. Click **Submit**
5. ✅ Success — redirected back to deal or Bob's profile
6. ✅ Bob's public profile at `/users/bob` now shows: ⭐ 5.0 / 5 (1 rating) and the review text

### 9B. Rate the other person (Browser B — Bob rates Alice)
1. In Browser B, go to the same completed deal → **Leave a rating**
2. Select **4 stars**, write: `Alice's eggs were super fresh. Would trade again.`
3. ✅ Alice's profile at `/users/alice` shows ⭐ 4.0 / 5 (1 rating)

### 9C. Try to rate twice (Browser A)
1. Go back to the deal page → click **Leave a rating** again
2. ✅ Should show error "You have already rated this deal" (409)

### 9D. Try to rate an incomplete deal
1. Create a new offer, accept it (deal = ACCEPTED, not COMPLETED)
2. Try navigating directly to `/deals/{id}/rate`
3. ✅ Should show an error — can't rate until deal is complete

---

## Part 10 — Edge Cases & Cleanup

### 10A. Unauthenticated API access
While signed out in Browser A, try:
- `localhost:5173/me` → redirects to login ✅
- `localhost:5173/me/deals` → redirects to login ✅

### 10B. Photo upload limits
1. Try uploading a file that is not a JPEG or PNG (e.g. a `.pdf` or `.gif`)
2. ✅ Client-side error: "Only JPEG and PNG files are allowed"
3. Try uploading an image over 2MB
4. ✅ Client-side error: "File must be under 2MB"

### 10C. Someone else's listing — no edit/delete controls
1. In Browser B (Bob), navigate to one of Alice's listings by URL
2. ✅ No Edit or Delete buttons visible

### 10D. Cross-browser session isolation
1. Sign out of both browsers
2. Sign back in as Alice in Browser A, Bob in Browser B
3. ✅ Each session is independent — signing out of one doesn't affect the other

---

## What to Note During Testing

Keep a list of anything that:
- **Breaks** — errors, crashes, wrong data
- **Looks wrong** — confusing labels, layout issues, missing feedback
- **Feels slow** — more than 1–2 seconds for a simple action
- **Is missing** — something you expected to see that wasn't there

That list feeds directly into the design pass.
