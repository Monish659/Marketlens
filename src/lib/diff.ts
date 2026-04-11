export type DiffRow = {
  competitor: string; // domain
  overlapPct: number; // 0..1
  uniqueGaps: string[]; // features we have that competitor lacks
  sourceUrl?: string;
  sourceScore?: number;
};

// naive keyword/phrase mining — split on punctuation, keep short phrases
export function extractFeatureCandidates(text: string): string[] {
  const phrases = text
    .split(/\.|\n|\r|;|:|\(|\)|\[|\]|\{|\}|\||\u2022|\-/)
    .map((p) => p.trim().toLowerCase())
    .filter((p) => p.length >= 3 && p.length <= 80);

  const keywords = phrases
    .flatMap((p) => p.split(/,|\s{2,}/))
    .map((k) => k.trim())
    .filter((k) => k.length >= 3 && k.length <= 50);

  const bag = new Set<string>();
  const include = [
    'rsvp',
    'poll',
    'reminder',
    'ticket',
    'waitlist',
    'group chat',
    'message',
    'calendar',
    'invite',
    'share',
    'guest list',
    'qr',
    'check in',
    'announcement',
    'template',
    'registration',
  ];

  for (const kw of keywords) {
    for (const seed of include) {
      if (kw.includes(seed)) {
        bag.add(kw);
        break;
      }
    }
  }

  return Array.from(bag).slice(0, 50);
}

export function computeOverlap(ourFeatures: string[], competitorFeatures: string[]) {
  const ours = new Set(ourFeatures.map((f) => f.toLowerCase()));
  const theirs = new Set(competitorFeatures.map((f) => f.toLowerCase()));

  let overlap = 0;
  for (const f of ours) if (theirs.has(f)) overlap++;
  const overlapPct = ours.size ? overlap / ours.size : 0;
  const unique: string[] = Array.from(ours).filter((f) => !theirs.has(f));
  return { overlapPct, unique };
}

export function differentiationScore(overlapPct: number) {
  // simple complement
  return 1 - overlapPct;
}
