// Safe to edit by hand
// The Contact form's "Which rooms? / Which of these feels like home?" picks
// (2026-10-03). Pure data and logic, so the rules are unit tested and the form
// component stays a thin view.
//
// The picks ride along as two extra Web3Forms fields (`rooms`, `style_feel`),
// which Web3Forms prints as their own lines in Staci's email. They are never
// folded into the message text, and they are optional: an empty pick omits the
// field from the payload.

export const ROOM_OPTIONS = [
  'Living room',
  'Family room',
  'Kitchen',
  'Dining room',
  'Bedroom',
  'Bathroom',
  'Home office',
  'Entry',
  'Whole home',
] as const;

/** The "pick for me" values. Each one clears the other picks in its list. */
export const WHOLE_HOME = 'Whole home';
export const STYLE_UNSURE = 'Not sure yet';

/** Most styles a visitor can hold at once (the third pick drops the oldest). */
export const MAX_STYLES = 2;

export interface StyleOption {
  label: string;
  notes: string;
  /** Three swatch bands, widest first. Absent on the "not sure" card. */
  bands?: readonly [string, string, string];
}

// Bands are the look of each style, not house colours, and no text sits on
// them: the label and notes sit on paper below.
export const STYLE_OPTIONS: readonly StyleOption[] = [
  {
    label: 'Transitional',
    notes: 'Greige, brass, soft navy',
    bands: ['#cfc6b8', '#3d4a5c', '#b08d57'],
  },
  {
    label: 'Modern farmhouse',
    notes: 'White oak, black iron, shiplap',
    bands: ['#ece8e1', '#a77b4f', '#2b2b2b'],
  },
  {
    label: 'Japandi',
    notes: 'Pale ash, linen, low lines',
    bands: ['#e9e2d5', '#b9a58a', '#4a4642'],
  },
  { label: 'Seaside', notes: 'Sea glass, sand, rope', bands: ['#e6dcc8', '#9fb8b3', '#8c7b68'] },
  { label: 'Art deco', notes: 'Emerald, brass, curves', bands: ['#2f5d50', '#e3c2b4', '#b8924a'] },
  {
    label: 'Modern',
    notes: 'Clean lines, walnut, matte black',
    bands: ['#f2f0ec', '#9a9893', '#5c4033'],
  },
  {
    label: 'Traditional',
    notes: 'Rich wood, pattern, polish',
    bands: ['#efe6d6', '#6e2f2f', '#6b3e26'],
  },
  { label: STYLE_UNSURE, notes: 'Staci will help you find it' },
];

const SEP = '|';

/** Picks are stored in the all-strings draft as one joined string. */
export function parsePicks(stored: string): string[] {
  return stored ? stored.split(SEP).filter(Boolean) : [];
}
export function joinPicks(picks: readonly string[]): string {
  return picks.join(SEP);
}

/** Toggle a room. "Whole home" stands alone; any other room clears it. */
export function toggleRoom(current: readonly string[], label: string): string[] {
  if (label === WHOLE_HOME) return current.includes(label) ? [] : [WHOLE_HOME];
  const rest = current.filter((r) => r !== WHOLE_HOME);
  return rest.includes(label) ? rest.filter((r) => r !== label) : [...rest, label];
}

/** Toggle a style. "Not sure yet" stands alone; otherwise keep the newest two. */
export function toggleStyle(current: readonly string[], label: string): string[] {
  if (label === STYLE_UNSURE) return current.includes(label) ? [] : [STYLE_UNSURE];
  const rest = current.filter((s) => s !== STYLE_UNSURE);
  if (rest.includes(label)) return rest.filter((s) => s !== label);
  return [...rest, label].slice(-MAX_STYLES);
}

/** The line shown on the tag above the message, and echoed to Staci. */
export function summarizePicks(rooms: readonly string[], styles: readonly string[]): string {
  const r = rooms.length ? rooms.join(', ') : 'no rooms picked';
  const s = !styles.length
    ? 'no style picked'
    : styles[0] === STYLE_UNSURE
      ? 'not sure of the style yet'
      : `feels like ${styles.join(' and ')}`;
  return `${r} · ${s}`;
}

/** Message placeholder that follows the first room picked. */
export function messagePlaceholder(rooms: readonly string[]): string {
  const lead = rooms[0] && rooms[0] !== WHOLE_HOME ? rooms[0].toLowerCase() : 'home';
  return `What bugs you about the ${lead} right now? What has to stay?`;
}

/** The two optional Web3Forms fields. A blank pick returns undefined so no empty line is sent. */
export function pickFields(rooms: readonly string[], styles: readonly string[]) {
  return {
    rooms: rooms.length ? rooms.join(', ') : undefined,
    style_feel: styles.length ? styles.join(', ') : undefined,
  };
}
