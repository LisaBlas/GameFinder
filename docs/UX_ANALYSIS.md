# GameFinder UX Analysis: Conversion Optimization

**Date:** 2026-03-31
**Objective:** Increase clicks to affiliate websites
**Current Flow:** 7 steps from landing to purchase links

---

## Executive Summary

**Primary issue:** Users invest too much effort before seeing value or purchase links. Affiliate links are buried 7 steps deep, reducing conversion significantly.

**Recommended priority:** Expose purchase options earlier in the flow (Step 6 → Step 5).

---

## Critical Issues (Prioritized by Impact)

### 1. Purchase links are buried too deep ⚠️ HIGHEST IMPACT

**Problem:** Users click 5+ times before discovering affiliate links exist

Current path to conversion:
- Step 1-4: Navigate keyword maze
- Step 5: See results
- Step 6: Click specific game
- Step 7: Click "Purchase Options" button
- **Only then** see actual links

**Fix:**
- Show "Buy from $X" on every game card in results grid (Step 6)
- Add key reseller icons directly on cards (instant visual: "deals available here")
- Make cards clickable to purchase modal, not just expansion
- **Impact:** Current flow: 7 steps to conversion. New flow: 5 steps.

---

### 2. No value prop reinforcement after landing

**Problem:** After Step 1, user never sees why they should buy through you
- Landing promises "smarter recommendations" but results page looks like a basic grid
- No price savings shown
- No deal indicators

**Fix:**
- Add price comparison on game cards: ~~$59.99~~ **$42.50** (Save 29%)
- Badge system: "🔥 Deal", "💰 Lowest Price", "⭐ Verified Seller"
- Top banner on results: "Compare prices across 20+ stores instantly"

---

### 3. Refinement section timing is backwards

**Problem:** Platform filters appear AFTER keyword selection
- Console-only users waste time browsing PC-exclusive keywords
- Creates dead-ends ("0 results for Nintendo + Space Battles")

**Fix:**
- Move platform selection to Step 1 or 2 (before subcategories)
- Or: Auto-detect from IP/browser and pre-filter (with override option)
- Show platform icons on keyword chips in Step 4 (e.g., "Duels 🎮🖥️" means PS/PC only)

---

### 4. Purchase modal language reduces trust

**Problem:** "KEY RESELLERS" sounds grey-market
- Users hesitate on third-party sites
- No explanation of safety/legitimacy

**Fix:**
- Rename: "OFFICIAL STORES" → "Full Price Retailers"
- Rename: "KEY RESELLERS" → "Verified Discount Stores" or "Compare Deals"
- Add trust micro-copy: "✓ All sellers verified | 💰 Best price guarantee"
- Show star ratings under each reseller icon

---

### 5. Results page has no urgency

**Problem:** Nothing motivates immediate clicks
- No scarcity (deals ending soon)
- No social proof (X people bought this)
- No FOMO triggers

**Fix:**
- Time-sensitive badges: "Deal ends in 4h"
- Social proof: "127 bought via GameFinder today"
- Trending indicator: "🔥 Trending +340% this week"

---

### 6. Keyword navigation is fatiguing

**Problem:** 3 layers of menus before seeing games
- Each click = 20-30% drop-off (industry standard)
- Users might exit before Step 4

**Fix:**
- **Shortcut option:** Add "Popular keywords" on Step 2 (skip subcategories)
- **Smart defaults:** If user clicks category, show top 3 keywords immediately
- **Speed mode:** Search bar should show keyword suggestions with game count ("Duels - 127 games")

---

## Quick Wins (Implement First)

### 1. Add price + "Buy" CTA to game cards in results (Step 6)
- Show lowest price
- Click card → purchase modal (skip expansion step)
- **Effort:** Medium | **Impact:** High

### 2. Move platform filter earlier (Step 2 or make sticky sidebar)
- Reduces wasted browsing
- Increases result relevance
- **Effort:** Low | **Impact:** Medium

### 3. Rename affiliate sections in purchase modal
- "Verified Discount Stores" sounds safer than "Key Resellers"
- Add "💰 Save up to 40%" label
- **Effort:** Low | **Impact:** Medium

### 4. Add one urgency element to results page
- Either: deal timers, trending badges, or stock indicators
- Pick whichever fits your data availability
- **Effort:** Medium | **Impact:** Medium-High

---

## Conversion Funnel Analysis

### Current Flow:
```
Landing (Step 1)
    ↓ Click "Find One Keyword"
Categories (Step 2)
    ↓ Select category
Subcategories (Step 3)
    ↓ Select subcategory
Keywords (Step 4)
    ↓ Select keyword
Refinement (Step 5)
    ↓ Click "Search"
Results (Step 6)
    ↓ Click game card
    ↓ Click "Purchase Options"
Purchase Modal (Step 7) ← FIRST SIGHT OF AFFILIATE LINKS
```

### Recommended Flow:
```
Landing (Step 1)
    ↓ Click "Find One Keyword"
Categories + Platform Selection (Step 2) ← MOVE PLATFORM FILTER HERE
    ↓ Select category + platform
Keywords (Step 3) ← MERGE SUBCATEGORIES INTO KEYWORD VIEW
    ↓ Select keyword
Results with Prices Visible (Step 4) ← SHOW PRICES + BUY BUTTONS
    ↓ Click any game card
Purchase Modal (Step 5) ← AFFILIATE LINKS NOW 2 STEPS EARLIER
```

**Reduction:** 7 steps → 5 steps (28% fewer clicks to conversion)

---

## Open Questions

1. **Do you have price data for games?** (To show actual savings)
2. **Are key reseller conversions lower than official stores?** (May need to push resellers harder)
3. **What's the drop-off rate between steps?** (Analytics data would reveal biggest leak)
4. **Can you track which keywords lead to purchases?** (Would inform which to promote)

---

## Implementation Priority

### Phase 1: Low-hanging fruit (1-2 weeks)
- [ ] Rename "Key Resellers" to "Verified Discount Stores"
- [ ] Add platform filter to Step 2
- [ ] Show price on game cards in results

### Phase 2: Conversion boosters (2-4 weeks)
- [ ] Make game cards clickable → purchase modal
- [ ] Add urgency badges (deals ending, trending, social proof)
- [ ] Merge subcategories into keyword selection

### Phase 3: Advanced optimization (4-6 weeks)
- [ ] Implement price comparison display
- [ ] Add "Popular keywords" shortcuts
- [ ] A/B test different urgency messaging

---

**Next Step:** Choose Phase 1 item to implement first. Recommend starting with "Show price on game cards" for immediate conversion lift.
