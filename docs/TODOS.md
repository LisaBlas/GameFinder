# TODOS

Agent-pullable backlog. Items are added by scheduled review meetings and should be checked off (not deleted) once done.

## 2026-07-16 — GameFinder Review

- [x] Ship or hide "User Crafted" and "Best crafts": either wire real community/low-result data behind these cards now, or relabel/remove until the backing data exists — currently promising a feature that isn't there. (2026-07-23: relabeled "User Crafted" → "Hidden Gem" plus its icon/action-label/footer copy, since the community-search pipeline in `docs/MEMORY.md` item 4 still isn't live — real data wiring remains open as a separate, bigger feature.)
- [x] Monitoring alert for `seo_page_cache` staleness/emptiness: `npm run seo:check-cache` (Telegram, 2026-10-13). Needs the cron line and the Telegram env vars (see `docs/ARCHITECTURE.md`).
- [ ] Verify Kinguin attribution per link type (replaces the "cookie-redirect flow" item: that flow was removed in `27dbd14`, and a `kinguin.net` cookie can't be read from our origin). `affiliate_outbound_click` now carries `link_kind` (`search`/`product`) and `offer_price_eur` for Kinguin (2026-10-13); compare GA4 clicks per `link_kind` with Kinguin's affiliate dashboard, (Kinguin confirmed 2026-10-13 that appending the ref to feed links attributes sales; the dashboard cross-check is still worth doing once). Tick off once both link types show matching clicks/sales.
- [ ] Keep `RECENT_CHANGES.md` current after material product or structure changes so product state stays auditable.
- [x] Instrument outbound click tracking (UTM params + GA event) on all five affiliate partner links, not just Kinguin, to get revenue-per-partner visibility.
- [ ] Re-weight partner rotation logic by commission rate / EPC instead of equal rotation, once click data above exists to inform the weights.
- [ ] Add live or cached pricing for at least Instant Gaming and Eneba (the two most price-competitive resellers) so the "cheaper elsewhere" pitch is provable before the click.
- [ ] Add email capture tied to the saved-games panel to build an owned retargeting channel independent of SEO and affiliate variance.
