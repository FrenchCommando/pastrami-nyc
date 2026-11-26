// Pure game rules, no DOM: imported by game.js and by the tests.

export const PERFECT_PX = 5;
export const PERFECT_GROW = 8;
export const PERFECT_STREAK_TO_GROW = 3;

// prev, cur: { x, w } with x the left edge. Returns what lands and what falls off.
export function resolveDrop(prev, cur, baseW, streak) {
  const left = Math.max(cur.x, prev.x);
  const right = Math.min(cur.x + cur.w, prev.x + prev.w);
  const overlap = right - left;

  if (overlap <= 0) return { kind: 'miss', streak: 0 };

  if (Math.abs(cur.x - prev.x) <= PERFECT_PX) {
    const nextStreak = streak + 1;
    let x = prev.x;
    let w = prev.w;
    if (nextStreak >= PERFECT_STREAK_TO_GROW && w < baseW) {
      const grow = Math.min(PERFECT_GROW, baseW - w);
      w += grow;
      x -= grow / 2;
    }
    return { kind: 'perfect', placed: { x, w }, streak: nextStreak };
  }

  const side = cur.x < prev.x ? -1 : 1;
  return {
    kind: 'trim',
    placed: { x: left, w: overlap },
    cut: { x: side < 0 ? cur.x : right, w: cur.w - overlap, side },
    streak: 0,
  };
}

export function verdict(n) {
  if (n === 0) return 'That’s just bread, friend.';
  if (n < 5) return 'Lean on rye. Your doctor approves.';
  if (n < 12) return 'A respectable sandwich.';
  if (n < 25) return 'Mile high. Bring a friend.';
  if (n < 40) return 'You’ll need to unhinge your jaw.';
  if (n < 60) return 'They’re putting your photo on the wall.';
  return 'Legendary. The pile will be studied.';
}

// About 0.12 in and 0.6 oz per hand-cut slice.
export function pileStats(n) {
  const oz = n * 0.6;
  return {
    inches: (n * 0.12).toFixed(1) + ' in',
    weight: oz >= 16 ? (oz / 16).toFixed(2) + ' lb' : oz.toFixed(1) + ' oz',
  };
}
