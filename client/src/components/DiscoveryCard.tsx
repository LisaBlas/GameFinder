/**
 * DiscoveryCard — reusable shell for the 6 homepage discovery cards.
 *
 * Each card cycles through three visual states:
 *
 *   idle          No rarity, no hasResult. Shows actionLabel + idleFooterCopy.
 *   unidentified  isPostClick=true, no rarity yet. "Unidentified" overlay visible.
 *   revealed      hasResult=true, activeRarity set. Shows revealedContent + rarity badge.
 *
 * CSS class responsibility lives here — the parent only passes plain data.
 * To add a 7th card, render one more <DiscoveryCard> with the appropriate props.
 */

import React from "react";
import type { RarityTier, RevealCard } from "../lib/discoveryCards";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface DiscoveryCardProps {
  /** Human-readable name, e.g. "Popular" or "Unique Combo". Used for aria-label. */
  name: string;
  /** RevealCard id — kept for reference / future data-attr use. */
  id: RevealCard;

  // ── CSS variant ──────────────────────────────────────────────────────────
  /** Modifier class that identifies this specific card, e.g. "qs-card-rnd-kw". */
  variantClass: string;
  /** Extra wrapper class (only needed for Unique cards: "qs-unique-wrap"). */
  extraWrapClass?: string;

  // ── State ────────────────────────────────────────────────────────────────
  /** True while the reveal-pulse animation fires (brief, auto-clears). */
  isPulsing: boolean;
  /** True from click until the next mouseLeave — drives the post-click glow. */
  isPostClick: boolean;
  /**
   * Rarity once a search completes.
   * undefined  = never searched (idle)
   * null       = searched, 0 results
   * RarityTier = searched, N results
   */
  activeRarity: RarityTier | null | undefined;
  /** True once the card has a revealed result to display. */
  hasResult: boolean;

  // ── Icons ────────────────────────────────────────────────────────────────
  /** Column-header icon: KeyRound for Key cards, Hammer for Craft cards. */
  typeIcon: React.ComponentType<{ className?: string }>;
  /** Action icon shown next to actionLabel in the idle state. */
  actionIcon: React.ComponentType<{ className?: string }>;

  // ── Content ──────────────────────────────────────────────────────────────
  /** Verb label shown in idle state, e.g. "Roll popular". */
  actionLabel: string;
  /** Content swapped in once revealed: keyword name, combo title, etc. */
  revealedContent: React.ReactNode;
  /** Footer text shown in idle state, e.g. "Top key this week". */
  idleFooterCopy: React.ReactNode;
  /**
   * Footer meta area (always visible):
   * - Roll cards: step counter string, e.g. "1/2"
   * - Random card: <InfinityIcon>
   * - Unique cards: full <span class="qs-sequence-track"> node
   */
  footerMeta: React.ReactNode;
  /**
   * When true, renders the sequence-style footer layout used by Unique cards
   * (no qs-card-footer-copy wrapper around idleFooterCopy).
   */
  isSequence?: boolean;

  // ── Handlers ─────────────────────────────────────────────────────────────
  onClick: () => void;
  onMouseLeave: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const DiscoveryCard: React.FC<DiscoveryCardProps> = ({
  name,
  variantClass,
  extraWrapClass,
  isPulsing,
  isPostClick,
  activeRarity,
  hasResult,
  typeIcon: TypeIcon,
  actionIcon: ActionIcon,
  actionLabel,
  revealedContent,
  idleFooterCopy,
  footerMeta,
  isSequence,
  onClick,
  onMouseLeave,
}) => {
  // Wrapper: grows the unique glow ring when rarity === "unique"
  const wrapClass = [
    "qs-card-wrap",
    activeRarity === "unique" ? "qs-card-wrap--unique" : "",
    extraWrapClass ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  // Button: accumulates state modifiers for CSS-driven three-state transitions
  const buttonClass = [
    "qs-card",
    variantClass,
    hasResult                ? "qs-card-has-result"           : "",
    isPulsing                ? "qs-card-reveal-pulse"          : "",
    activeRarity             ? `qs-card-rarity-${activeRarity}` : "",
    isPostClick              ? "qs-card-post-click"            : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={wrapClass}>
      <button
        type="button"
        onClick={onClick}
        onMouseLeave={onMouseLeave}
        className={buttonClass}
        aria-label={name}
      >
        {/* Hover/reveal shine overlay */}
        <span className="qs-card-shine" aria-hidden="true" />

        {/* Column type icon (Key / Craft) */}
        <TypeIcon className="qs-card-type-icon" aria-hidden />

        {/* Rarity badge — only once a search result is captured */}
        {activeRarity && (
          <span className="qs-card-rarity-label">{activeRarity}</span>
        )}

        {/* "Unidentified" label — shown during the searching state via CSS */}
        <span className="qs-card-unidentified-label" aria-hidden="true">
          Unidentified
        </span>

        {/* Main body: action label (idle) ↔ revealed content (revealed) */}
        <span className="qs-card-main">
          <span className="qs-card-action-label">
            <ActionIcon className="qs-card-action-icon" aria-hidden />
            {actionLabel}
          </span>
          <span className="qs-state-revealed qs-card-state-line">
            {revealedContent}
          </span>
        </span>

        {/* Footer: differs between Roll cards and Unique (sequence) cards */}
        {isSequence ? (
          <span className="qs-card-footer qs-card-footer-sequence">
            <span className="qs-state-initial qs-card-state-line">
              {idleFooterCopy}
            </span>
            {/* footerMeta is the full qs-sequence-track node for Unique cards */}
            {footerMeta}
          </span>
        ) : (
          <span className="qs-card-footer">
            <span className="qs-state-initial qs-card-state-line qs-card-footer-copy">
              {idleFooterCopy}
            </span>
            <span className="qs-card-meta">{footerMeta}</span>
          </span>
        )}
      </button>
    </div>
  );
};
