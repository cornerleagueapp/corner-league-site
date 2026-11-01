# Season pages and profile feed

Apply to consumer upload `corner-league-consumer-20261031-171124.zip`. Companion patches: backend season photos/followers feed and B2B photo assignment. Apply the backend migration before starting the updated backend, then deploy backend, B2B and consumer. No frontend dependencies or environment variables change. SMS remains disabled.

## Season pages

`/sports/:sportKey/seasons/:seasonId?org=:organizationId` opens a published team-sport season, with optional `tab` query parameters. Order: Overview, Schedule & Results, Standings, Stats & Leaders, Awards & All-Stars, Photos. Tabs are ordinary links, support browser Back/direct links, and scroll horizontally on narrow screens. Existing organization/season query links redirect to the new page for team sports; private sandbox previews retain their inline behavior. Team/game breadcrumbs and season discovery links use the new destination.

Registration remains available from the season header on every tab and opens the existing registration flow, which handles eligibility, closing dates and previous registrations. The overview shows counts and up to three future published games. Scheduling preserves list/calendar, divisions, status filters, brackets and paging. Teams remain accessible through standings links, including on mobile. Stats aggregate only published player box scores in final, noncanceled, non-bye games, including tournaments. Team totals are sums of recorded player stats, not a substitute for official scores. Player leaders combine an athlete's stats across team transfers; division filters limit included teams. Awards may show a published All-Star game even without award rows.

Photos are explicitly assigned by the organizer, not inferred from dates, album names or organization membership. The Photos tab requests the existing organization gallery with `seasonId`; it keeps pagination, albums/captions, safe links and the photo viewer. Existing photos remain organization-wide until assigned. This change covers the five team sports; Golf's separate competition/results workflow is unchanged.

## Profile Feed

The Posts navigation label becomes Feed. Owners get My posts and Followers’ posts. Followers means people who follow the signed-in viewer, not people the viewer follows; the existing following feed elsewhere is unchanged. My posts remains the initial filter. The followers request omits a username filter, uses the authenticated endpoint and resets paging on filter/account changes. Visitors and signed-out users see only that profile's public posts and cannot see its personalized filters. Posting, editing, moderation, blocks, reactions and pagination remain in the existing social components.

## Validation and limits

- Consumer TypeScript/build and the focused season/feed, organization gallery, and social profile checks pass.
- 57 browser fixture scenarios cover all tabs, Feed interactions, mobile/desktop, light/dark, scoped gallery requests and error/empty states with WCAG A/AA automated checks; final focused checks also exercise opening a season from its card and visitor/guest privacy.
- The uploaded repository had 18 failing legacy test scripts before this patch, from stale mock imports or old assertions. The full scan after this patch is 46 passing / 18 failing across 64 scripts; the failing script names match the unmodified baseline. The changed Feed-label assertion is updated. This is not a claim that the entire legacy suite is green.
- Backend: 214 suites / 1,221 tests, lint/build and four regression runners pass. B2B: 68 regression runners, TypeScript/lint and web export pass. Photo assignment and explicit unassignment were also tested in browser fixtures at 320/390/1440 widths.
- No production MySQL connection, migration execution, live-account publishing or native-device testing was performed here. Verify the additive migration and actual season/gallery/feed records in staging before production rollout.
