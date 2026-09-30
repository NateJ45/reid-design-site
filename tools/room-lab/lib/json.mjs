// Prettier-style JSON (printWidth 100, 2-space indent, trailing newline) so files written
// into src/assets stay a fixed point for the repo's `npm run format:check`.
// Objects and arrays of objects always break; arrays of plain numbers/strings stay on one
// line when they fit, like prettier's output for machine-written JSON.
export function prettyJson(value, width = 100) {
  const isPrim = (v) => v === null || typeof v !== 'object';
  const fmt = (v, indent, lead) => {
    if (isPrim(v)) return JSON.stringify(v);
    const pad = '  '.repeat(indent + 1);
    const end = '  '.repeat(indent);
    if (Array.isArray(v)) {
      if (!v.length) return '[]';
      if (v.every(isPrim)) {
        const one = '[' + v.map((x) => JSON.stringify(x)).join(', ') + ']';
        if (lead + one.length <= width) return one;
      }
      return (
        '[\n' + v.map((x) => pad + fmt(x, indent + 1, pad.length)).join(',\n') + '\n' + end + ']'
      );
    }
    const keys = Object.keys(v).filter((k) => v[k] !== undefined);
    if (!keys.length) return '{}';
    return (
      '{\n' +
      keys
        .map((k) => {
          const head = pad + JSON.stringify(k) + ': ';
          return head + fmt(v[k], indent + 1, head.length);
        })
        .join(',\n') +
      '\n' +
      end +
      '}'
    );
  };
  return fmt(value, 0, 0) + '\n';
}
