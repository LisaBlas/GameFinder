// IGDB platform names are long and include dead services. Cards show short
// labels, current platforms first, and push obsolete ones out of the summary.

const SHORT_LABELS: Record<string, string> = {
  'PC (Microsoft Windows)': 'PC',
  'Xbox Series X|S': 'Xbox Series',
  'Web browser': 'Browser',
  'Meta Quest 2': 'Quest 2',
  'Meta Quest 3': 'Quest 3',
};

const ORDER = [
  'PC (Microsoft Windows)',
  'PlayStation 5',
  'Xbox Series X|S',
  'Nintendo Switch 2',
  'Nintendo Switch',
  'PlayStation 4',
  'Xbox One',
  'Mac',
  'Linux',
  'iOS',
  'Android',
];

const OBSOLETE = new Set([
  'Google Stadia',
  'Ouya',
  'OnLive Game System',
  'Windows Phone',
  'BlackBerry OS',
  'N-Gage',
  'Zeebo',
]);

export const platformLabel = (name: string): string => SHORT_LABELS[name] ?? name;

export const isObsoletePlatform = (name: string): boolean => OBSOLETE.has(name);

/** Current platforms in a stable, familiar order; unknown ones keep their input order. */
export function sortPlatforms<T extends { name: string }>(platforms: T[]): T[] {
  const rank = (p: T) => {
    const i = ORDER.indexOf(p.name);
    return i === -1 ? ORDER.length : i;
  };
  return platforms
    .map((p, i) => ({ p, i }))
    .sort((a, b) => rank(a.p) - rank(b.p) || a.i - b.i)
    .map(({ p }) => p);
}
