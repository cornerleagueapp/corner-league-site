# Optional team SMS contacts

Apply after waiver-workflow-polish and deploy the matching SMS backend/migration
first. Team season registration shows an optional Team text alerts card for owned
athlete profiles. It is separate from required waivers and Confirm registration.

Open Manage text alerts. Add a player, parent, guardian or other contact. Registration
contact name/phone prefill the inputs only. Read the consent (unchecked by default),
enter a number the recipient controls, request the code, then verify it. A verified
account email is required. The number is not subscribed until verification succeeds.
Guardian/contact relationship is self-declared; no legal identity/authority claim.

Up to three contacts can be active/pending per athlete/season. Disable an old one
before replacing it. Phone verification accepts +1/NANP formatting; international
numbers are not supported in this batch. Codes expire after ten minutes, have
five check attempts, and resends wait a minute. There are account/phone daily limits.

Subscriptions belong to this athlete and season; returning next season requires
opting in again. Unassigned players receive team messages after assignment, when
staff target that team. Shared numbers are deduplicated per campaign. You can opt
out of a season contact here or text STOP for all Corner League sender alerts.
START removes the sender block but requires a new explicit season opt-in. HELP
is supplied by the configured provider's Messaging Service. In-flight messages
can still arrive. Updated factual SMS terms/privacy information lives at /terms#team-sms.

This does not create B2B access, register an athlete, submit a waiver, or change
racing/event registration. When SMS is disabled or fails, existing registration
and email flows remain available. Preferences load only on opening, avoiding a
new request on every registration render. Phone numbers returned to the page are
masked after setup. Modal inputs use 16px fonts, scroll vertically and focus the
title rather than forcing the mobile keyboard open.

Checks: node scripts/test-team-sms.cjs; node scripts/test-season-waivers.cjs;
node scripts/test-registration-empty-profile.cjs; node scripts/test-enrollment-polish.cjs;
npm run build. Tests cover consent gating, profile scope, OTP handling, activation,
revocation and registration remaining separate. Browser fixtures exercise actual
components at 320/390/1440 in light/dark. Live provider delivery, physical Safari
and the full consumer production build are not locally validated.
