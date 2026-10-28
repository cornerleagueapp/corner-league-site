# Public sport statistics

Apply after the matching backend scheduling/statistics patch. No consumer
migration is required. Team/game pages use sport-specific labels, team totals and
percentages computed from combined counts. A team shooting 1/1 and 1/9 displays
20% (2/10), rather than averaging the two percentages. Athlete performance labels
also recognize the expanded metrics. Negative football yardage remains negative;
comparison bars use its magnitude so negative CSS flex values are avoided.

Only existing published season/player data is used. Practices and private team
notes are not exposed. Republish corrected results through the existing workflow.
The registration, racing navigation, consumer-organization.css and
DeferredArcadeCanvas loader are unchanged.

Checks: test-sport-statistics and isolated game/team component rendering with
simulated published data. Full npm build could not run here because the uploaded
source has no installed consumer dependencies and the offline npm cache lacks
zod-validation-error. Run npm run build in your installed repo before deployment.
