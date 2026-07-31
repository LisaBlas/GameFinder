# work-on-trello-card-gamefinder-reconcile — started 2026-07-24

Status: done

## Goal
Work on Trello card: [GameFinder] Reconcile the mobile and desktop UX so both experiences follow the same informat

The full Trello card description below is the authoritative task brief. Follow it completely; do not infer missing requirements from the card title.

Project: ~/projects/GameFinder
Why: Recent desktop changes made the keyword flow diverge from mobile, so the two experiences now feel inconsistent.
Model policy: claude_sonnet

Reconcile the mobile and desktop UX so both experiences follow the same information hierarchy, while avoiding showing too much at once.
Requirements:
- Audit the current difference between mobile and desktop, focusing on the keyword section that recent desktop changes altered but mobile did not receive.
- Bring both experiences into alignment on the same flow and information ordering, adapting layout per breakpoint as needed rather than dumping everything on screen simultaneously.
- Order of presentation on both: keyword selection first, then the random and curated roll cards second.
- Keep the amount of information shown at any one step restrained — progressive disclosure over a wall of options.
- On mobile specifically, keyword selection and the roll cards should live on the same screen (a single scrollable view following the order above) rather than being split across separate steps/screens.

---
## Update — 2026-07-24 15:12 UTC
You've hit your session limit · resets 6:30pm (UTC)

The operator attached the following screenshot(s) to this card. View each one with the Read tool before starting — they are part of the task context:
- /home/blas/services/slack/company/logs/attachments/6a637dc7f2b41422d629fdc0/6a637dd7bf622ad5854a8584_gamefinder_home_desktop.jpg

## Plan
(not yet broken into steps)

## Log
- 2026-07-24 21:49 UTC — created

- 2026-07-25 — closed; second attempt (blocked on headless-Chrome approval). See b6472af.

## Handoff
Closed 2026-07-25. The card's code change shipped as `c495a0d` (shared
`renderDiscoveryDeck()` on both breakpoints, mobile browse-shelf collapsed by
default) and is live on gamefinder-app.com. What neither earlier attempt
caught — because visual verification never ran — is that the desktop explorer
it fed the deck into does not fit its own pane: `home.tsx` gives the keyword
panel `lg:w-2/5`, so the fixed `grid-cols-[17rem_24rem_minmax(0,1fr)]` grid
overflowed (565px pane vs 656px of fixed columns at a 1440 viewport) and its
third column collapsed to 2px, clipping the Quick Starts / Keyword Group
panel out of sight. Fixed in `b6472af` by replacing the three columns with
mobile's progressive drill-down. Recorded as a hard rule in
`docs/SYSTEM_INVARIANTS.md` ("The desktop keyword pane is 40% of the
viewport, not full width").
