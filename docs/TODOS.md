# TODOS

Agent-pullable backlog. Items are added by scheduled review meetings and should be checked off (not deleted) once done.

## 2026-07-16 — GameFinder Review

- [x] Ship or hide "User Crafted" and "Best crafts": either wire real community/low-result data behind these cards now, or relabel/remove until the backing data exists — currently promising a feature that isn't there. (2026-07-23: relabeled "User Crafted" → "Hidden Gem" plus its icon/action-label/footer copy, since the community-search pipeline in `docs/MEMORY.md` item 4 still isn't live — real data wiring remains open as a separate, bigger feature.)
- [ ] Add a visible degraded-state indicator (or at minimum a monitoring alert) for `seo_page_cache` staleness/emptiness so a silent SEO page failure doesn't sit undetected on your main organic-traffic surface.
- [ ] Instrument the Kinguin cookie-redirect flow to confirm cookie-set success/failure per click, since it's an unverified single point of failure on affiliate revenue.
- [x] Resume RECENT_CHANGES.md logging going forward so product state stays auditable given organic traffic is actively growing.
- [x] Instrument outbound click tracking (UTM params + GA event) on all five affiliate partner links, not just Kinguin, to get revenue-per-partner visibility.
- [ ] Re-weight partner rotation logic by commission rate / EPC instead of equal rotation, once click data above exists to inform the weights.
- [ ] Add live or cached pricing for at least Instant Gaming and Eneba (the two most price-competitive resellers) so the "cheaper elsewhere" pitch is provable before the click.
- [ ] Add email capture tied to the saved-games panel to build an owned retargeting channel independent of SEO and affiliate variance.
