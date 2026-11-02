# Discovery news freshness, thumbnails and pagination follow-up

Apply after the article collection and consumer Latest pagination patches. No
new migration, package or environment variable. Deploy backend, then consumer
and B2B. Fetch now must be run again for each enabled source after deployment;
new/changed drafts still require review and publication.

## What changed

HTML source collection discovers an advertised, approved-host RSS/Atom feed,
combines it with category headlines, and sorts original publication dates
before applying the maximum import count. HTML card extraction stays within a
single story container and excludes common popular/related/sidebar sections.
Publisher publication dates are read from RSS pubDate/Atom published,
article:published_time, datePublished JSON-LD and publication time elements.
Modified dates, verification/import time, headlines and dates without timezone
are not substituted for original publication timestamps. Never relabel a 2018
story with today's date.

At most four linked pages per check are read for missing date/image metadata,
using the existing approved hosts, robots, DNS/IP pinning, redirect, HTTPS,
size and timeout checks. Only metadata is retained, not article bodies.
A rotating metadata offset lets later candidates be checked on subsequent
runs. Upgrading forces a fresh listing read instead of an old ETag/304 reply.
HTML listings are re-read on each scheduled check; RSS validators are used
only after the current pipeline has no deferred/undated candidates.

Undated or older-than-configured-window articles cannot become new imported
drafts. Dated stories whose original date is now outside the window are
skipped. A previously published auto-imported story found at that URL with an
old original date is reversibly returned to draft, with an audit entry and
review note. Manually authored listings are not rewritten. Deleted/off-index
archive records cannot be rediscovered by this scan; use Review listings to
correct or withdraw those manually. No data is deleted.

Public Latest also excludes external news with missing dates or original
dates older than 30 days, including existing published records. Source detail
pages are not a historical archive search. Native platform/community posts
remain pageable through their existing history. Publishing external news now
requires its original publication date within the last 30 days.

Thumbnail URLs from publisher feeds, listing images, Open Graph and article
JSON-LD are stored in the existing JSON data column as optional imageUrl.
Only public HTTPS URLs without credentials/IP/private hostnames are accepted.
Image bytes are not fetched or stored by the backend; the consumer renders
publisher thumbnails without a referrer, with lazy loading and a fallback if
loading fails. Existing sport photos remain the fallback for supported sports;
volleyball/other additional sports get an illustration instead of a map pin.
The image URL is editable in the admin. No third-party image is required to
render a readable card. Publishers/CDNs can decline hotlink requests, in which
case the illustration is expected. Source access/permissions still apply.

The first consumer feed page counts the same eligible, visible content and
snapshot used by the queries. The UI displays Page X of Y and the item range
when totals are available. Cursor order is unchanged; a 72-item tied-timestamp
regression traverses six complete pages without duplicates/gaps. Page counts
can legitimately shrink after stale/undated/unpublished/expired content is
excluded, or because each new page holds 12 mixed-source items rather than
reserved per-source slots. Missing old pages must not be filled with stale
news merely to preserve the old page count. Storage outages do not claim a
complete feed. The existing 50-page browsing limit remains in effect.

The B2B Collect request alone has a 180-second client timeout to accommodate
bounded metadata requests. All other API requests keep their normal timeout;
writes are not automatically retried. Check collection status after a timeout.

## Deployment and recovery

1. Apply/build/deploy the backend patch.
2. Apply/build/deploy the consumer and B2B patches.
3. For each source, run Fetch now. Leave maximum article age at 30 days (or a
   stricter value). Review newly created/changed drafts, confirm the original
   publication dates and publisher thumbnails, then publish approved records.
4. Refresh consumer Latest. Its total is the number of currently eligible
   published items; unpublished drafts are not included. A source without
   recent sports news can correctly produce zero new records.
5. For any old URL not on the source's current page/feed, withdraw that old
   listing manually. Do not change its publication date to today.

Automated validation covers extraction, old/undated filtering, recovery,
thumbnail validation/rendering, exact totals and six-page cursor traversal.
Production DB rows and live scheduled collections are not modified by local
validation.

The backend patch also freezes the clock in the existing participation test
fixture at its November 2026 date, so that fixture's fixed event end date does
not cause unrelated test failures as calendar time advances. No participation
production behavior changes.
