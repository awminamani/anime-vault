// Tiny fuzzy matcher for re-ranking AniList search results.
// AniList search is already typo-tolerant-ish, but re-ranking puts the
// obvious match first ("naruto" above "Naruto: Shippuuden filler list").

export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let cur = i;
    let diag = i - 1;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, cur + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
      cur = prev[j];
    }
  }
  return prev[b.length];
}

/** 0–100. Exact > prefix > word-prefix > subsequence > typo > none. */
export function fuzzyScore(rawQuery: string, rawTarget: string): number {
  const q = normalize(rawQuery);
  const t = normalize(rawTarget);
  if (!q || !t) return 0;
  if (t === q) return 100;
  if (t.startsWith(q)) return 90;
  const words = t.split(" ");
  if (words.some((w) => w.startsWith(q))) return 80;
  if (t.includes(q)) return 70;
  // subsequence (compact matches score higher)
  let qi = 0;
  let gaps = 0;
  for (let i = 0; i < t.length && qi < q.length; i++) {
    if (t[i] === q[qi]) qi++;
    else if (qi > 0) gaps++;
  }
  if (qi === q.length) return Math.max(30, 65 - gaps);
  // typo tolerance, word level
  if (q.length >= 4) {
    for (const w of words) {
      if (Math.abs(w.length - q.length) > 2) continue;
      const d = levenshtein(q, w);
      if (d <= 2 && w.length >= 4) return 55 - d * 5;
    }
  }
  return 0;
}

/** Best score across candidate titles. */
export function bestScore(query: string, titles: string[]): number {
  let best = 0;
  for (const t of titles) {
    const s = fuzzyScore(query, t);
    if (s > best) best = s;
  }
  return best;
}

export function demo() {
  const assert = (cond: boolean, msg: string) => {
    if (!cond) throw new Error(`fuzzy: ${msg}`);
  };
  assert(fuzzyScore("naruto", "Naruto") === 100, "exact");
  assert(fuzzyScore("naru", "Naruto Shippuden") === 90, "prefix");
  assert(fuzzyScore("ship", "Naruto Shippuden") === 80, "word-prefix");
  assert(fuzzyScore("shippuden", "Naruto: Shippuden") === 80, "word-prefix 2");
  assert(fuzzyScore("friren", "Frieren") >= 45, "typo");
  assert(fuzzyScore("bleach", "One Piece") === 0, "no match");
  assert(fuzzyScore("aot", "Attack on Titan") > 0, "subsequence");
  assert(bestScore("frieren", ["Sousou no Frieren", "Frieren: Beyond"]) === 100, "best");
}

if (typeof require !== "undefined" && require.main === module) demo();
