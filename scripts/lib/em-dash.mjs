// The one rule for turning an em-dash into something Staci's house style
// allows (CLAUDE.md "no em-dashes", sharpened 2026-10-01 to "everywhere").
//
// Used by:
//   - scripts/sweep-em-dashes.mjs   (every text file in the repo)
//   - scripts/strip-em-dashes.mjs   (every string in the Sanity dataset)
// so the repo and the content get the SAME treatment. Tested in
// src/lib/em-dash.test.ts.
//
// The rules, in order (EM is written as an escape so this file does not
// contain the character itself):
//   1. "Services EM Reid Design LLC"   -> "Services | Reid Design LLC" (a title)
//   2. a lone EM, or a table cell     -> "n/a"
//   3. "$450 EM $695", "2 EM 3"       -> "$450 to $695" (a range)
//   4. a dash right after punctuation -> dropped
//   5. a dash opening or closing a line, or right after a comment marker
//                                     -> dropped
//   6. a pair in one sentence         -> two commas (a parenthesis)
//   7. a dash that opens a list       -> a colon  ("One room: layout, furniture, paint")
//   8. a lowercase / number / quote continuation -> a comma ("fast, and cheap")
//   9. anything else (a new clause)   -> a colon  ("Two options: the first...")
// Commas fit a continuing thought and colons fit an explanation, which are the
// two things people use the dash for. Both are on the house-style list.
export const EM = '\u2014';

const re = (s, flags = 'g') => new RegExp(s.replaceAll('EM', EM), flags);

/** Replace every em-dash in a string. Returns the string unchanged if none. */
export function deDash(text) {
  if (typeof text !== 'string' || !text.includes(EM)) return text;
  if (text.trim() === EM) return text.replace(EM, 'n/a');

  let t = text;
  // 1. A page title with the brand on the end.
  t = t.replace(re('^(.+?)[ \\t]*EM[ \\t]*(Reid Design(?: LLC)?)$', 'm'), '$1 | $2');
  // 2. An empty markdown table cell.
  t = t.replace(re('(\\|[ \\t]*)EM([ \\t]*\\|)'), '$1n/a$2');
  // 3. A numeric range.
  t = t.replace(re('(\\d)[ \\t]*EM[ \\t]*(\\$?\\d)'), '$1 to $2');
  // 4. Straight after punctuation: the punctuation already did the job.
  t = t.replace(re('([,;:.!?])[ \\t]*EM[ \\t]*'), '$1 ');
  // 5. Opening or closing a line, or straight after a comment marker.
  t = t.replace(re('(\\/\\/|\\*|#|<!--|\\/\\*)[ \\t]*EM[ \\t]*'), '$1 ');
  t = t.replace(re('^([ \\t]*)EM[ \\t]*', 'm'), '$1');
  t = t.replace(re('[ \\t]*EM[ \\t]*$', 'm'), '');
  // 6 and 7. What is left sits between two clauses. Decide per dash:
  //   - a PAIR inside one sentence ("the room EM all nine feet of it EM was dark")
  //     is a parenthesis, so both become commas;
  //   - a dash that introduces a LIST (two or more commas follow it in the
  //     sentence) is an explanation, so it becomes a colon;
  //   - otherwise a lowercase / number / quote continuation is a comma, and a
  //     capitalised new clause is a colon.
  let closing = false;
  t = t.replace(re('[ \\t]*EM[ \\t]*'), (match, offset, whole) => {
    if (closing) {
      closing = false;
      return ', ';
    }
    const rest = whole.slice(offset + match.length);
    const sentence = rest.split(/[.!?](?:\s|$)/)[0];
    if (sentence.includes(EM)) {
      closing = true;
      return ', ';
    }
    if ((sentence.match(/,/g) ?? []).length >= 2) return ': ';
    return /^[a-z0-9"'`($]/.test(rest) ? ', ' : ': ';
  });
  return t;
}

/**
 * Walk any JSON value and apply deDash to every string inside it.
 * @param {unknown} value
 * @param {(key: string) => boolean} [skipKey]  true for keys whose value must not change
 * @returns {any}
 */
export function deDashDeep(value, skipKey = (_key) => false) {
  if (typeof value === 'string') return deDash(value);
  if (Array.isArray(value)) return value.map((v) => deDashDeep(v, skipKey));
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, skipKey(k) ? v : deDashDeep(v, skipKey)]),
    );
  }
  return value;
}
