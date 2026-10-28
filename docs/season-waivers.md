# Season registration waivers

Apply after scheduling/stats and deploy the backend waiver patch/migration first.
Required documents load after the owned sport athlete profile is identified. The
confirmation button explains loading, errors and missing required signatures.
Backend registration enforcement is authoritative, including if a client bypasses
that button. Optional/disabled documents do not block registration.

Review the full text, type the signer's full name and affirm consent/authority.
Under-18 athletes use guardian capacity and Parent/Legal guardian relationship.
The signed-in profile-owning account needs verified email; guardian identity is
self-attested. This is a typed electronic-signature workflow, not an independently
verified identity or certified digital-signature product. Organizations supply
reviewed waiver text.

Already-registered players can sign a new revision without registering again. New
required revisions leave old records intact. Download current PDFs or open signing
history for older ones. The receipt email points to a private, authenticated
/season-waiver-records page; it does not depend on a public/open season. Auth return
paths accept only the strict UUID receipt URL, with no arbitrary redirects.
Signing alone does not register the athlete. Complete the separate confirmation.

Private cache keys include account/profile/season, and receipt/history responses
are checked against the requested scope. Error responses preserve the form.
Fields use 16px text; dialogs scroll and follow the existing light/dark theme.
No consumer-organization.css or DeferredArcadeCanvas changes.

Checks: test-season-waivers, test-registration-empty-profile and
test-enrollment-polish. Actual waiver/Radix Dialog components were exercised in
browser fixtures at 320/390/1440 in light/dark modes with simulated API responses;
private receipt login/download was checked independently of public season data.
A full consumer npm build could not run here because installed dependencies are
absent from the workspace; run npm run build in your installed repo. Physical
Safari, live email and live DB migration remain unverified.

## Completion clarity follow-up

Apply after the initial season-waivers patches. Required waivers show an accessible
progress bar and signed/required count. Optional documents do not block or inflate
progress; under-18 progress requires guardian capacity. Successful signing displays
an explicit receipt message while explaining registration must be confirmed
separately. Already-registered players retain their existing-registration screen.

Staff reminder emails link to the season registration page. Sign in to the same
profile-owning account; complete the missing documents there. A reminder is not
an invitation or registration acceptance, and does not add B2B access. Guardian
authority remains self-attested through that account. This follow-up does not
add a separate guardian invitation flow or change racing/event registrations.

QA: open reminder link logged out, sign in and return to the same season; confirm
existing membership is displayed without a duplicate form. Sign each required
revision and verify progress, receipt PDF and final registration gating. Check
optional-only seasons and a new required revision. Full production build, real
email delivery and physical mobile Safari remain unverified locally.
