# Consumer event date scroller

Apply after the launch-draft-officials consumer/backend patches. Deploy the backend companion first. No B2B changes, database migration or dependency changes.

Sport hub game strips, hub event lists and organization Events sections start on today's local date. Racing organization overview event highlights use the same selected day. Seven days are shown on desktop and three on narrow screens, with the selected day centered. Previous/next moves one day; Today returns to the current local day; Choose date uses the browser date picker. Times and day boundaries use the viewer's local timezone. If left on today across midnight, it advances to the new day on the next minute tick or window focus. A deliberately selected other day stays selected.

The /team-sports/games and /sport-event public endpoints accept optional paired from/to ISO timestamps with explicit timezones, at most 32 days apart. Organization /sport-event/organization/:id supports the same filters. Games use inclusive from and exclusive to; racing events use start < to and end >= from to cover multi-day events. Filters are applied before counts and pagination. Requests without ranges retain their existing behavior. Sport and organization scopes remain in the requests and query cache keys. Previous dates are available; an empty day does not silently substitute another day's games.

The full sport Events directory remains available through All events. Existing season month calendars are unchanged. The protected consumer-organization.css and DeferredArcadeCanvas are unchanged. No actual draft, registration, scoring or permissions changes.

Validation: backend public-date/filter/lifecycle tests; frontend date/DST and hub regression scripts; TypeScript/Vite build; browser checks on real components with mocked transport at 320, 390 and 1440px in light/dark modes. Native device date-picker appearance, production MySQL and deployed endpoint data still need a live check. The existing test-organization-community.cjs has a pre-existing assertion expecting the deferred Shop page; this batch does not change that assertion or claim the full suite passes.

After deployment: open the Basketball and Jet Ski hubs and an organization's Events section. Confirm today's date, move backward/forward, choose a past date with known games, and verify the same fixture isn't shifted into the wrong local day. Check a multi-day race on each day it covers, pagination for a busy date, organization isolation, dark/light mode and mobile touch navigation.
