# **App Name**: YAC Fantasy League

## Core Features:

- League Switcher (Header): Shows all live leagues; “Past Leagues” dropdown for completed. Persist `lastVisitedLeagueId`; default logic below.
- Dashboard Default League: If user has live leagues → pick the one with the earliest `endDate`. Else → most recently active league. If `lastVisitedLeagueId` still valid, prefer it.
- Admin: Create New League: Form mirrors `adminCreateLeague`: `name`, `season`, `game` (`big_brother` | `survivor` | `custom`), `mode` (`points` | `draft_winner`), dates: `startDate`, `endDate`, `settings`: `rosterSize`, `maxTeams`, `draftType` (“snake”|“fixed”), `visibility` (“private”|“link”), Rules preset (choose BB/Survivor defaults) + inline editor
- Admin: Teams & Pre-Draft: Create teams; add two owners (names/emails), pre-draft rosters. Generate invite links; activation attaches users to teams. Admin-only password reset trigger for an email/user.
- Rules Editor (per league): Binds to `rules/default.points`. BB default: `HOH_WIN, POV_WIN, POWER_WIN, COMP_WIN, SURVIVE, NOMINATED, EVICTED, FINAL3, RUNNER_UP, WINNER, AFP`. Survivor default: `IMMUNITY_WIN, REWARD_WIN, IDOL_FOUND, IDOL_PLAYED, ADVANTAGE_FOUND, FIRE_MAKING_WIN, SAFE_AT_TRIBAL, VOTED_OUT, JURY, FINAL_TRIBAL, SOLE_SURVIVOR, FAN_FAVORITE`.
- Event Entry (adapts to game): Big Brother / weekly: `hohWinner`, `nominees`, `vetoWinner`, `powerWinners[]`, `postVetoNominees`, `evicted`, `locked`. Survivor / episode: `immunityWinners[]`, `rewardWinners[]`, `idolFoundBy[]`, `idolPlayedBy[]`, `advantagesFoundBy[]`, `safeAtTribal[]`, `votedOut`, `juryAdds[]`, `finalists[]`, `soleSurvivor`, `locked`. “Apply & Lock” recomputes scores.
- Scoring & Standings: Leaderboard (by total), weekly/episode drilldown, deltas. Draft Winner mode: highlight champion when winner recorded.
- Auth & Invites: Email/password auth. Admin-only callable to send password reset. Invite activation binds user → team → league.
- (Optional) AI Predictions: Stub card for future: “Predictions coming soon.”

## Style Guidelines:

- Primary theme (app-wide): Indigo 800 `#1e40af` (consistent with earlier work).
- Per-league accent override (optional): Big Brother: Indigo 800 `#1e40af`, Survivor: Orange 600 `#FF9933`
- Palette - Text: gray-900 / gray-700 / gray-500. Surfaces: white, gray-50, gray-100. Feedback: green-600, red-600, amber-600
- Headlines: Space Grotesk (keep)
- Body/UI: Inter (swap in for PT Sans to match common UI kits)
- The logo looks like a TV set that's also a trash can. It's a dark shade of indigo on a beige background, and below it the words 'YAC FANTASY LEAGUE' are written.
- Components: Buttons (primary/secondary/ghost; sm/md/lg; loading/disabled), Inputs/Selects, Tabs, Cards, Table (sortable), Modal, Toast, Chips/Badges: Status (Active/Jury/Evicted), Score (+/−), Role (Admin), HG/Player Card, Team Card, Leaderboard Row, Week/Episode Stepper, Invite Pill (unused/used/expired)