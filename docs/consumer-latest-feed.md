# Consumer Latest: global chronology and pagination

Apply this follow-up after the local discovery and article collection patches.
Deploy the backend before the consumer. No new dependencies or migration.

The public and signed-in discovery feed now merges organization announcements,
community articles/posts, and eligible external listings **before** slicing a
12-item page. Order is publication time descending, then globally prefixed ID
ascending. Organization posts use publishedAt, falling back to createdAt;
community content uses createdAt; external content uses its recorded source
publication timestamp (stored in sort_at). Verification/import timestamps do
not stand in for publication dates on external news.

External announcements without sourcePublishedAt are excluded from Latest,
including existing published records. No records are deleted or unpublished;
their details and admin records remain accessible. In Review listings, edit
“Source publication time (if known)” using the publisher's actual timestamp
with timezone, then review/publish again. Do not enter today's import time to
make an old article look current. Known-date articles retain their original
chronology. This patch does not fetch article detail pages or infer missing
dates, and it does not backfill existing unknown dates.

Strict chronology replaces reserved external slots in the consumer Latest
feed. The existing externalPerPage setting remains a visibility switch:
zero hides external content; positive values enable it, without imposing a
per-page density cap on this globally ordered feed. Source/global import
pauses, source visibility, publication status, expiration, account privacy,
and blocks continue to apply. Legacy internal feedPage helpers retain their
old quota semantics; the consumer endpoint uses feedCandidates instead.

Request /discovery/feed?cursor=start&page=1, or its signed-in equivalent.
Responses include nextCursor. Send that opaque cursor with the next page
number. All streams use the same timestamp/ID boundary and initial snapshot;
new content appears on Refresh. Each stream reads at most 13 candidates per
cursor page. Plain page-number requests remain supported with a bounded
merged offset, but clients should use cursors to avoid shifts from inserts.
Cursors are validated, untrusted public pagination boundaries, not credentials.
Access/visibility is checked on every request. Withdrawn/expired items may
reduce the available history; cached previous pages refresh when requested.
The UI keeps visited pages for Previous and limits a browsing session to the
existing 50 pages (600 updates), explaining the limit instead of claiming an
empty feed. Refresh starts a new session at the newest stories.

If discovery storage fails, native updates still load with an explicit notice.
Refresh after recovery to include external stories newer than the saved cursor.
A next-page request failure preserves the current page and allows retry.

Validation: npm test -- --runInBand; npm run build. Consumer:
node scripts/test-feed-pagination.cjs; node scripts/test-local-discovery.cjs;
npm run build. Browser QA uses seeded publisher/native content; production
Cloud Run/MySQL deployment is not exercised by this patch's local checks.
