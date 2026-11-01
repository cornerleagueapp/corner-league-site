# Basketball stats and season navigation hotfix

Apply after `corner-league-consumer-season-pages-profile-feed.patch`. Consumer only: no backend/B2B change, dependency update, migration or environment change.

Basketball game box scores, team stat tables and season stat tables use Points, Rebounds, Assists, Blocks, Steals, Turnovers, Minutes, followed by any other recorded statistics. Missing categories are not fabricated; other sports keep their current ordering. Box score column names use readable labels.

Season navigation has six sections: Overview, Schedule & Results, Standings, Stats & Leaders, Awards & All-Stars, Photos. The duplicate Teams tab is removed. Legacy `tab=teams` links display Standings. Team pages remain available from standings, including clickable team names in mobile standings.

The former blank team blocks below the season statistics table were shooting-efficiency cards with null calculated values. Teams without a valid recorded rate no longer get a card. When recorded inputs and nonzero attempts are available, a clearly labeled Shooting percentages section shows FG%, 3P% and/or FT% with values and percent signs. A genuine 0% remains visible; missing inputs or zero attempts remain absent. Other sports use Team efficiency for their recorded rates.

Validation: consumer TypeScript/Vite production build, focused season/feed and breadcrumb tests, helper regressions for scrambled metric keys, legacy links, missing shooting fields and real zero rates. Twelve browser fixture scenarios cover basketball box scores, season stats and mobile team links at 320/1440 widths in light/dark mode; automated WCAG A/AA checks and page overflow checks pass. Existing unrelated legacy test failures documented in the previous patch remain outside this UI hotfix. No live backend or production account was changed.
