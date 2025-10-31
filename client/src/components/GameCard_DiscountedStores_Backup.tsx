// BACKUP: Discounted Stores Section Logic
// This code was removed from GameCard.tsx but saved for future use

// Lines 474-539 from original GameCard.tsx:

{/* New Affiliate Links Section with Golden Highlight */}
<div className="mt-2">
  <div className="text-center text-sm font-medium mb-2 text-amber-400">Discounted Stores</div>
  <div className="h-px bg-amber-500/30 mb-3"></div>
  <div className="affiliate-buttons grid grid-cols-5 gap-2">
    {/* Kinguin - Special handling for cookie */}
    <button
      onClick={handleKinguinClick}
      className="aspect-square bg-slate-700 hover:bg-slate-600 text-white rounded-[4px] transition-all duration-200 flex items-center justify-center group relative"
      title={affiliateLinks.kinguin.name}
    >
      <affiliateLinks.kinguin.icon />
      <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        {affiliateLinks.kinguin.name}
      </span>
    </button>
    
    {/* GamersGate */}
    <button
      onClick={(e) => handleLinkClick(e, affiliateLinks.gamersgate.url, 'GamersGate', 'affiliate')}
      className="aspect-square bg-slate-700 hover:bg-slate-600 text-white rounded-[4px] transition-all duration-200 flex items-center justify-center group relative"
      title={affiliateLinks.gamersgate.name}
    >
      <affiliateLinks.gamersgate.icon />
      <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        {affiliateLinks.gamersgate.name}
      </span>
    </button>
    
    {/* Eneba */}
    <button
      onClick={(e) => handleLinkClick(e, affiliateLinks.eneba.url, 'Eneba', 'affiliate')}
      className="aspect-square bg-slate-700 hover:bg-slate-600 text-white rounded-[4px] transition-all duration-200 flex items-center justify-center group relative"
      title={affiliateLinks.eneba.name}
    >
      <affiliateLinks.eneba.icon />
      <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        {affiliateLinks.eneba.name}
      </span>
    </button>
    
    {/* G2A */}
    <button
      onClick={(e) => handleLinkClick(e, affiliateLinks.g2a.url, 'G2A', 'affiliate')}
      className="aspect-square bg-slate-700 hover:bg-slate-600 text-white rounded-[4px] transition-all duration-200 flex items-center justify-center group relative"
      title={affiliateLinks.g2a.name}
    >
      <affiliateLinks.g2a.icon />
      <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        {affiliateLinks.g2a.name}
      </span>
    </button>
    
    {/* Instant Gaming */}
    <button
      onClick={(e) => handleLinkClick(e, affiliateLinks.instantGaming.url, 'Instant Gaming', 'affiliate')}
      className="aspect-square bg-slate-700 hover:bg-slate-600 text-white rounded-[4px] transition-all duration-200 flex items-center justify-center group relative"
      title={affiliateLinks.instantGaming.name}
    >
      <affiliateLinks.instantGaming.icon />
      <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
        {affiliateLinks.instantGaming.name}
      </span>
    </button>
  </div>
</div>

// Related functions and hooks that support this section:
// - getAffiliateLinks() (lines 109-140)
// - useKinguinRedirect() (lines 142-243)
// - handleLinkClick() (lines 300-308)
// - trackExternalClick() (lines 13-23)
