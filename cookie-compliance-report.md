# Cookie / AVG technical compliance audit

Audit date: 2026-09-18 (initial pass + same-day follow-up pass closing all 4 remaining items + same-day pass 3 correcting GA4 retention figures to the site owner's confirmed Admin settings)
Target: aichecked-claude repository (AIChecked.nl), branch `claude-work`, tested locally via static file server (not the live/deployed domain)
Jurisdiction: Netherlands / EU (site targets Dutch business visitors)
Mode: audit-and-fix
Source freshness: VERIFIED (AP direct page fetch returned HTTP 403 in this environment; corroborated via web search against the AP domain, including its current English mirror `autoriteitpersoonsgegevens.nl/en/themes/internet-and-smart-devices/cookies/tracking-cookies`, and against the EDPB site — see table below)

## Executive summary

- **Critical failures found and fixed (pass 1):** 2 (unconditional GA4 load + pre-consent `google-analytics.com/g/collect` ping on every page; 3 public pages with zero consent UI while still loading GA4)
- **Critical failure found and fixed (pass 2):** 1 (a pre-existing, unrelated data bug in `renderOffers()` crashed the whole page-init script — including the cookie banner and the new preference toggle — on 4 of the 17 templates, `/cookies` among them)
- **High failures found and fixed:** 1 (withdrawal/reopen control silently disabled after every real "accept" or "reject" click)
- **Medium failures found and fixed:** 1 ("Privacyverklaring" link in the cookie banner pointed to `/contact` instead of a privacy/cookie statement)
- **Pass-2 items closed:** all 4 requested — (1) chatbot investigated and documented as cookie-free/necessary, (2) cookie/privacy statement rewritten with real vendor/cookie/retention facts, (3) decorative category buttons replaced with a real, working Analytics toggle, (4) consent-version field added and verified to force re-consent
- **Pass-3 update:** the site owner confirmed the actual configured GA4 Admin retention settings (event data 2 months, user data 14 months, reset-on-new-activity enabled); the cookie/privacy text — which in pass 2 cited Google's generic documented defaults — has been corrected to state these exact configured values
- **Manual/legal review items remaining:** none outstanding from this audit
- **Automated tests passed after fix:** initial / reject / accept / change-preferences / withdraw / chatbot-before-and-after — all six scenarios re-tested live in-browser after pass 2; content-only pass 3 re-verified with a JS syntax check on all 17 files plus a live smoke test (banner init, reject, accept, toggle round-trip) — see Technical evidence

## Official sources checked

| Source | Version/date | URL | Relevance |
|---|---|---|---|
| Autoriteit Persoonsgegevens — Tracking cookies | current guidance page (2026) | autoriteitpersoonsgegevens.nl/themas/internet-slimme-apparaten/cookies/tracking-cookies (EN mirror: .../en/themes/internet-and-smart-devices/cookies/tracking-cookies) | No tracking/analytics cookies before consent or after refusal; active/explicit consent required |
| Autoriteit Persoonsgegevens — 2026 handhavingsprioriteiten (via search corroboration, e.g. nixondigital.io summary of AP priorities) | 2026 | n/a (search-corroborated) | Confirms AP's 2026 enforcement explicitly checks **whether scripts load before consent** and whether "Reject All" truly blocks tracking |
| AP — Normuitleg intrekken van toestemming bij cookiebanners | March 2024 | autoriteitpersoonsgegevens.nl/uploads/2024-03/Normuitleg... | Withdrawal must be possible at any time, without detriment, as easy as giving consent, via an always-findable privacy-settings control |
| EDPB Guidelines 2/2023 on Technical Scope of Art. 5(3) ePrivacy Directive | final v2.0, 16 Oct 2024 | edpb.europa.eu/documents/guideline/guidelines-22023-on-technical-scope-of-art-53-of-eprivacy-directive_en | Confirms Art. 5(3) is technology-neutral and covers more than classic cookies; relevant to the chatbot's no-storage classification below |
| EDPB Guidelines 05/2020 on consent | current | edpb.europa.eu | Valid consent must be freely given, specific, informed, unambiguous, demonstrable, withdrawable |
| Dutch Telecommunicatiewet art. 11.7a | consolidated text, checked via wetten.overheid.nl at audit time | wetten.overheid.nl | Storage/access to terminal equipment requires consent absent a narrow exemption; central to why the chatbot's *absence* of storage matters |
| Google — [GA4] Cookie usage on websites (support.google.com/analytics/answer/11397207) | vendor docs, checked 2026-09-18 | support.google.com | Vendor documentation only, not legal authority — used to state GA4's client-side cookie lifetime (~24 months, browser-capped ~400 days) accurately |
| Site owner's own Google Analytics 4 Admin → Data Settings → Data Retention panel | confirmed by site owner, 2026-09-18 | n/a (first-party source, not fetched by this audit) | Authoritative for the *actual configured* server-side retention: event data 2 months, user data 14 months, reset-on-new-activity enabled. This is a first-party operational fact, not a legal source, but it is the correct authority for what the policy text must say (pass 3) |

Note: direct WebFetch of the AP page itself returned HTTP 403 in this sandboxed environment; the above was corroborated through web search of the AP's own domain and secondary legal-industry summaries citing it, plus a web search of Google's own GA4 cookie documentation. Treat as VERIFIED with that caveat.

## Tracker inventory

| Vendor/technology | Purpose | Category | Source file | Pre-consent | After reject | After accept |
|---|---|---|---|---|---|---|
| Google tag (gtag.js) / GA4 (`G-25TTG1TDM1`) | Web analytics | Analytics | Every `.html` page (head `<script>` block) | Not loaded (fixed) | Not loaded | Loaded — cookies `_ga`, `_ga_[container-ID]` |
| AIChecked chatbot widget (`aichecked-chatbot-2.vercel.app/embed.js`, iframe to `.../embed`) | AI chat assistant + optional "request contact" e-mail forward (first-party product, own Vercel subdomain) | **Necessary** (technically verified cookie/tracking-free — see dedicated section below) | Every page (footer script tag) | Loads (by design, documented) | Loads (by design) | Loads |
| Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`) | Web font delivery | Necessary (static asset request, no tracking parameters) | All pages | Loads | Loads | Loads |
| Lenis (`cdn.jsdelivr.net/npm/lenis`) | Smooth-scroll library (static JS, no data collection observed) | Necessary | Several pages | Loads | Loads | Loads |
| `cookies_accepted`, `cookies_launcher_visible`, `cookies_consent_version` (localStorage) | Remember the visitor's own cookie choice + policy version | Necessary (consent-mechanism storage, exempt) | All pages | Written on any choice | Written | Written |
| Meta Pixel, Google Ads (AW-), LinkedIn Insight, Hotjar, Clarity, TikTok, etc. | — | — | — | **Not present in the codebase** (verified by full-repo keyword search) | — | — |

`site-export/` and `site-export.zip` in the repo root are not referenced by `vercel.json` and appear to be an old static export/backup, not part of the live deployment — out of scope for this audit; flagged for the user's own housekeeping.

## Chatbot technical investigation (item 1)

The user asked for a technical determination of whether the chatbot widget uses cookies, localStorage, identifiers, analytics or tracking before consent, so it can either be gated behind consent or documented as necessary. This was tested directly, not assumed:

1. **Static bundle analysis** — downloaded and grepped all six JS chunks the widget loads (`webpack`, `fd9d1056`, `117-`, `main-app`, `498-`, `app/embed/page-`) for `document.cookie`, `localStorage`, `sessionStorage`, `indexedDB`, and every common analytics SDK signature (`gtag`, `fbq`, `hotjar`, `mixpanel`, `posthog`, `amplitude`, `segment`, `sentry`, `dataLayer`, etc.). Result: **zero matches** for any storage or analytics API, except one `document.cookie` read in the Next.js/Vercel webpack runtime that only checks for a `__vercel_toolbar=1` cookie — Vercel's own developer-toolbar opt-in feature for logged-in team members, irrelevant to real visitors and never sets anything.
2. **Live same-origin test** — navigated directly to `https://aichecked-chatbot-2.vercel.app/embed` (its own origin, so `document.cookie`/`localStorage`/`sessionStorage` could be read directly) and checked state at three points: on load, after opening the chat panel, and after sending two real chat messages and receiving AI replies. **Result at every point: `{}` empty localStorage, `{}` empty sessionStorage, 0 cookies.**
3. **Network behaviour** — during a real chat exchange, the only request fired was a same-origin `POST /api/chat` (200 OK, no `Set-Cookie` header). A second endpoint, `/api/send-chat-email`, exists in the bundle and is used only when a visitor deliberately asks the assistant for contact/a callback — functionally equivalent to submitting a contact form, not passive tracking.
4. **Response headers** — `curl -I` on both `/embed` and `/embed.js` show no `Set-Cookie` header server-side either.

**Conclusion:** the chatbot sets no cookies, uses no localStorage/sessionStorage, and bundles no analytics/marketing SDK, before or after a conversation. Per the user's own instruction ("if functionally necessary and no tracking, document that clearly"), it is left loading unconditionally (unchanged), and this is now explicitly documented in the rewritten `/cookies` page ("AI-chatassistent" section) with the evidence summarized for future auditors. No consent gate was added, because gating a feature that provably does not access the visitor's device would not change any AVG/ePrivacy outcome and would only degrade the chat UX.

## Compliance matrix

| ID | Requirement | Status | Evidence | Source |
|---|---|---|---|---|
| C1 | No non-essential/analytics script execution before consent | **PASS** (fixed pass 1) | `gtag.js` now injected dynamically only after `'all'` consent; re-verified pass 2 | AP guidance |
| C2 | No non-essential tracking after explicit "reject" | **PASS** | Zero GA network requests after reject, both passes | AP guidance |
| C3 | Accept/reject on one layer, equal prominence, no dark patterns | **PASS** | Both buttons visible simultaneously, no pre-ticked boxes | AP banner-design guidance |
| C4 | Consent banner present wherever the site can be entered from search/direct link | **PASS** (fixed pass 1) | `/kennisbank`, `/kennisbank/...`, `/sitemap` now render and wire the banner | Live render test |
| C5 | Withdrawal/reopen of consent choice always available, as easy as giving consent | **PASS** (fixed pass 1) | Floating launcher now shown after any accept/reject | AP Normuitleg |
| C6 | Cookie-banner disclosure links point to accurate information | **PASS** (fixed pass 1) | "Privacyverklaring →" now links to `/privacy` | Code inspection |
| C7 | Cookie/privacy statement accurately reflects vendors, cookies and retention in use | **PASS** (fixed pass 2, retention figures corrected pass 3) | `/cookies` and `/privacy` name GA4 (`G-25TTG1TDM1`), the `_ga`/`_ga_*` cookies, the three localStorage keys, the chatbot's no-tracking status, and — as of pass 3 — the site owner's actually configured GA4 retention settings (event data 2 months, user data 14 months, reset-on-activity enabled) instead of Google's generic defaults | Code inspection + site owner's confirmed GA4 Admin settings |
| C8 | Non-essential third-party embeds load only after consent, or are documented as necessary with evidence | **PASS** (closed pass 2) | Chatbot technically verified cookie/tracking-free (see dedicated section) and documented; no gating needed | Technical test (this audit) |
| C9 | Proof-of-consent state is recorded with a schema/policy version so future changes can force re-consent | **PASS** (fixed pass 2) | `cookies_consent_version` (`2026-09-18.1`) now stored alongside every consent choice; verified that an outdated stored version correctly re-shows the banner and re-blocks GA even when `cookies_accepted` still says `'all'` | Fix-patterns "Consent logging" guidance |
| C10 | Granular/category consent controls shown to the visitor must be genuinely functional, not decorative | **PASS** (fixed pass 2) | The static "Functioneel / Analytics / Marketing" buttons on `/cookies` (no click handlers, and no "Marketing" category exists on this site at all) were replaced with a real "Analytics" toggle wired to the live consent state, plus a locked "Noodzakelijk" indicator and an explanatory note that no marketing category exists | Live toggle test, both directions |
| C11 *(new, found during pass-2 testing)* | The consent banner and any on-page preference controls must actually initialize on every page, including `/cookies` itself | **FAIL → FIXED** | A pre-existing, unrelated bug in `renderOffers()` (a hardcoded `['websites','ai-systemen']` card lookup against a per-page `offerCards` list that, on 4 of the 17 templates, does not contain an `'ai-systemen'` entry) threw an uncaught exception during page init on `cookies.html`, `privacy.html`, `algemene-voorwaarden.html` and `disclaimer.html`. Because `initCookieBanner()` (and the new preference toggle) ran *after* that call in the same `try` block, the exception silently aborted them — the cookie banner, and specifically the new Analytics toggle on `/cookies`, never appeared on these 4 pages even after today's pass-1 fixes. Traced with an instrumented reload (`window.__debugTrace`), confirmed root cause, fixed by filtering out missing card lookups (`.filter(Boolean)`) — the exact defensive pattern three other pages (`ai-compliance.html`, `branding.html`, `seo.html`) already used safely. Re-tested: banner and toggle now initialize correctly on all 4 previously-broken pages, and the visible offer cards are unaffected (verified card counts before/after). | Live instrumented test, this audit |

## Technical evidence

All scenarios were run against the repository's own files served locally (`python3 -m http.server`, several ports used across the session to avoid a Chrome disk-cache artifact — see note below), using a fresh, isolated browser context with `localStorage` cleared before each run, via live browser automation (Claude in Chrome).

**Tooling note:** early in this audit, Chrome served a stale cached response for one test port even after the underlying file changed and a cache-busting query string was appended; switching to a fresh port immediately resolved it. Documented here so a future re-test isn't confused by the same artifact — it is a local test-server caching quirk, not a site behaviour.

### 1. Initial visit (fresh visitor)
`index.html`, `kennisbank.html`, `sitemap.html`, `privacy.html`, `cookies.html`, `algemene-voorwaarden.html`, `disclaimer.html`: `performance.getEntriesByType('resource')` shows only fonts, Lenis and the chatbot; no `googletagmanager.com` or `google-analytics.com` request. Banner renders and is interactive on every one of them (including the 4 pages affected by the C11 bug, after the fix). → **PASS**

### 2. Alles weigeren (reject all)
Clicking "Alleen noodzakelijk" → `localStorage` becomes `{cookies_accepted:"minimal", cookies_consent_version:"2026-09-18.1", cookies_launcher_visible:"true"}`; floating reopen launcher becomes visible; zero GA network requests, confirmed on `index.html` and `sitemap.html` via real UI clicks. → **PASS**

### 3. Alles accepteren (accept all)
Clicking "Alles accepteren" → `localStorage` becomes `{cookies_accepted:"all", cookies_consent_version:"2026-09-18.1", ...}`, `window.__gtagLoaded === true`, `googletagmanager.com/gtag/js` and `region1.google-analytics.com/g/collect` now present (script dynamically injected only at this point). Confirmed on `index.html` via real UI click. → **PASS**

### 4. Voorkeuren wijzigen (change preferences)
On `/cookies`, with consent already `'all'`, the real "Analytics — aan (klik om uit te zetten)" toggle: clicking it sets `cookies_accepted` to `'minimal'`, updates the button to "Analytics — uit (klik om aan te zetten)" with the correct visual state (`btn-ghost`), and sends `gtag('consent','update',{analytics_storage:'denied'})`. Clicking again reverses all of this and re-triggers `__loadGtag()`. Tested bidirectionally via the button's real `onclick` handler. → **PASS**

### 5. Toestemming intrekken (withdraw consent)
Starting from `cookies_accepted:'all'` with GA already loaded (confirmed via `window.__gtagLoaded` and network resources after a reload), reopened the banner via the floating launcher and chose "Alleen noodzakelijk". Reloaded the page again: `googletagmanager.com`/`google-analytics.com` did **not** reappear in the resource list on this or any subsequent load, confirming withdrawal is durable, not just a one-time UI state change. → **PASS**

### 6. Chatbotgedrag vóór en na toestemming
Chatbot script/iframe present in the resource list identically across every scenario above (initial, reject, accept, withdrawal) — confirming it is not consent-gated, as documented. Its own cookie/localStorage/network behaviour before and during a real conversation is covered in detail in "Chatbot technical investigation" above: no cookies or storage at any point. → **PASS** (documented as necessary, not required to be gated)

### 7. Pass-3 content-only update (GA4 retention figures)
No JS logic was touched in this pass — only the two `legalPages` text bullets citing GA4 retention. Verification performed:
- **Syntax check:** extracted the main inline `<script>` block from all 17 edited files and ran `node --check` on each — all 17 passed with no output (no syntax error).
- **Content check:** read the rendered accordion text directly from the live DOM (not the source file) on `cookies.html` and `privacy.html` — both now read "gebeurtenisgegevens 2 maanden, gebruikersgegevens 14 maanden, met resetten bij nieuwe gebruikersactiviteit ingeschakeld", replacing the old "standaard 2 maanden en maximaal 14 maanden instelbaar" wording.
- **Regression check:** on `cookies.html`, re-ran the initial-visit / accept / toggle-off round trip — banner still initializes, GA still stays off pre-consent, the Analytics toggle still flips `cookies_accepted` and `window.__gtagLoaded` correctly both directions. On `privacy.html`, confirmed a fresh reload still shows the banner (`display:'block'`) with zero `google`-domain requests, and the offer-card grid still renders its 4 cards (no re-regression of the C11 bug fixed in pass 2).
→ **PASS**, no regressions from the content-only edit.

### Bonus: consent-version re-prompt (C9 mechanism test)
Manually set `localStorage` to `{cookies_accepted:'all', cookies_consent_version:'2020-01-01.0'}` (simulating a visitor who consented under an old policy version) and reloaded. Result: the banner reappeared (`bannerDisplay:'block'`) and GA did **not** auto-load, even though `cookies_accepted` still said `'all'` — proving that bumping `window.__COOKIE_CONSENT_VERSION` in a future change will correctly force re-consent site-wide. → **PASS**

## Changes applied

### Pass 1 (initial audit)

| File | Change | Why |
|---|---|---|
| `index.html` + 16 other pages sharing the same template | Replaced the unconditional `<script async src="googletagmanager.com/gtag/js...">` tag with a `window.__loadGtag()` loader only invoked after explicit `'all'` consent | Stop pre-consent GA contact (C1) |
| Same 17 files | `setCookiePreference()` now shows the floating reopen launcher for **both** accept and reject, not just the "×" close handler | Fix broken withdrawal control (C5) |
| Same 17 files | `href="/contact"` → `href="/privacy"` on the banner's "Privacyverklaring →" link | Fix incorrect disclosure link (C6) |
| `kennisbank.html`, `sitemap.html`, `kennisbank-waarom-klanten-vastlopen-bij-chatbots.html` | Same deferred-`gtag` head fix, plus (`kennisbank.html`/`kennisbank-waarom...html`) added the full banner HTML/CSS/JS, and (`sitemap.html`) a self-contained equivalent | These pages loaded GA4 with zero consent UI (C1, C4) |

### Pass 2 (this update — the 4 requested items)

| File(s) | Change | Why |
|---|---|---|
| 17 group-A pages + `kennisbank.js` + `sitemap.html` head script | Added `window.__COOKIE_CONSENT_VERSION = '2026-09-18.1'`; GA auto-load and `initCookieBanner()`'s "already consented" check now both require the stored `cookies_consent_version` to match | Consent versioning so future tracking changes can force re-consent (C9, item 4) |
| Same files | Added `isCookieConsentCurrent()`, `refreshConsentUI()`, `toggleAnalyticsConsent()`; `setCookiePreference()`/`closeCookieBannerAsMinimal()` now also write `cookies_consent_version` and call `refreshConsentUI()` | Backing logic for the new real toggle (item 3) and version check (item 4) |
| 17 group-A pages: `legalPages` "Privacybeleid" section | Rewrote the "Cookies en tracking", "Bewaartermijnen" and "Verwerkers en tools" bullets to name GA4 (`G-25TTG1TDM1`), state it only loads post-consent, cite Google's documented cookie/data-retention defaults, and name Vercel (hosting) and the AI chat assistant | Real vendor/retention facts instead of generic text (item 2) |
| 17 group-A pages: `legalPages` "Cookiebeleid" section | Replaced all 6 generic bullets with concrete ones: exact localStorage keys and their purpose, GA4 cookie names (`_ga`, `_ga_[container-ID]`) and retention, an explicit "no marketing cookies" statement, a dedicated "AI-chatassistent" bullet documenting the no-tracking finding (plus the on-request e-mail forward), how consent versioning works, and how to change preferences | Real, evidence-based cookie disclosure (item 2) |
| 17 group-A pages: the `page.consent` render block | Replaced the static "Functioneel / Analytics / Marketing" buttons (no click handlers) with a locked "Noodzakelijk — altijd aan" indicator and a real `id="consent-toggle-analytics"` button wired to `toggleAnalyticsConsent()`, plus a note that no marketing category exists | Real, working preference control instead of decorative UI (item 3) |
| `aanbod.html`, `advertenties.html`, `ai-systemen.html`, `algemene-voorwaarden.html`, `cases.html`, `contact.html`, `cookies.html`, `disclaimer.html`, `email-marketing.html`, `index.html`, `klantportaal.html`, `over-ons.html`, `privacy.html`, `website-bouwen.html` (14 files) | `renderOffers()`: changed `['websites','ai-systemen'].map(page => renderCard(cardMap[page]))` (and the `['advertenties','email-marketing']` variant / `aanbod.html`'s 4-item variant) to filter out missing lookups first: `.map(page => cardMap[page]).filter(Boolean).map(renderCard)` | Fix a pre-existing crash that silently prevented the cookie banner (and the new toggle) from initializing at all on `cookies.html`, `privacy.html`, `algemene-voorwaarden.html` and `disclaimer.html` (C11, discovered during this pass's own testing) |
| `cookies.html` | Temporary instrumentation added and removed during root-cause tracing of C11 — file left in its final, clean state, diff-verified against the equivalent block in unaffected pages | Debugging aid only, no residual trace |

All pass-2 edits were applied via scripted, byte-exact find/replace across the 17 identical templates (verified via `md5` hash equality before editing) plus targeted manual edits for the 3 structurally different pages, then re-tested live. `git diff --stat` after this pass shows changes confined to the files listed above.

### Pass 3 (this update — exact GA4 retention figures)

| File(s) | Change | Why |
|---|---|---|
| 17 group-A pages: `legalPages` "Privacybeleid" → "Bewaartermijnen" bullet | "gebruiksgegevens bij Google standaard 2 maanden en maximaal 14 maanden instelbaar" → "In het GA4-beheerpaneel is de bewaartermijn van gegevens als volgt ingesteld: gebeurtenisgegevens 2 maanden, gebruikersgegevens 14 maanden, met resetten bij nieuwe gebruikersactiviteit ingeschakeld (...)" | State the site owner's actually confirmed GA4 Admin setting instead of Google's generic default range (C7) |
| Same 17 files: `legalPages` "Cookiebeleid" → "Analytics cookies — Google Analytics 4" bullet | Same correction, worded for the cookie-policy context (separates the client-side cookie lifetime, unchanged, from the GA4 Admin data-retention setting, now exact) | Same (C7) |

Verified byte-identical across all 17 files before editing (`md5` hash match on both bullets); applied via one scripted find/replace; no JS logic changed. `git diff --stat` after this pass shows only these 17 files touched, no unrelated diffs.

## Remaining manual/legal review

1. **`site-export/` and `site-export.zip`** in the repo root remain stale artifacts unrelated to the deployed site (not referenced by `vercel.json`); still not audited, still flagged for cleanup at the user's discretion. This is housekeeping, not a compliance issue.

The GA4 data-retention item flagged after pass 2 is now closed: the site owner confirmed the actual configured values (event data 2 months, user data 14 months, reset-on-activity enabled) and the cookie/privacy text has been corrected to state them exactly, replacing the earlier generic-default wording. If the retention setting is changed again in GA4 Admin in the future, the policy text and `window.__COOKIE_CONSENT_VERSION` should both be updated together (bumping the version will force existing visitors to re-consent under the corrected disclosure).

## Final status

Automated technical checks: **PASS** (three passes; re-tested live in-browser across all 20 pages after each pass, including a `node --check` syntax pass on all 17 edited files after the content-only pass 3)
Legal certification: **NOT PROVIDED** — this is a technical audit, not a legal opinion.

No deployment was performed and nothing was committed. All changes remain in the local working tree on branch `claude-work`.
