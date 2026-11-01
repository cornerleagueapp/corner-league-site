# Local discovery in All Sports → Latest

Deploy the backend local-discovery patch and migration first, then the admin screen and consumer. No extra packages, API keys or environment variables.

```sh
git apply --check ~/Downloads/corner-league-consumer-local-discovery.patch
git apply ~/Downloads/corner-league-consumer-local-discovery.patch
node scripts/test-local-discovery.cjs
npm run type-check
npm run build
```

All Sports → Latest merges native cards with up to three external cards by default (backend setting 0–4). External cards clearly say Local discovery and show the sport, location, age/eligibility, applicable dates, attributed source and last verification. The CTA opens the official registration/details page. Internal detail pages are `/local-discovery/:id`; they explain that the source organizes the activity and that availability/fees/eligibility must be confirmed there. Known sports use bundled artwork; other supported sports have a generic location illustration, with no image hotlinking.

Only reviewed published records appear. Expired, stale or hidden-source records are removed by backend filtering. Set external quota to 0 for native-only feed and unavailable external details. Feed queries cache for 60 seconds; detail queries 30 seconds. Refresh an already open feed after changing visibility. An unavailable local subsystem does not take down native feed content.

No content is automatically imported or seeded. Add verified manual/CSV listings through Super Admin → Local discovery after deploying the admin patch. This adds discovery cards only; it does not create real teams, organizations or registrations. There are no changes to the existing season/profile features or SMS/Stripe.

Validation: focused local-discovery rendering, source-link and payload validation tests, TypeScript and production build pass. Browser checks of Latest with native + external cards and external detail layouts at 320, 390 and 1440 pixels in light/dark themes found no horizontal overflow or WCAG A/AA axe violations in tested states. The repository's older broad script suite has 18 previously known failing runners; this batch does not claim to fix that unrelated baseline.
