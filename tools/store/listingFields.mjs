/**
 * Reading the fenced fields out of a listing file.
 *
 * Shared because two tools need the same parse and the pattern below has a
 * property that is easy to lose in a copy: `check-listing.mjs` measures the
 * fields, `paste-field.mjs` prints one ready to paste into a store console.
 */

/**
 * `**Field name** (80 char limit)` followed by the next fenced block.
 *
 * The `[^`]*` between the two is what keeps a field bound to its own fence: it
 * cannot cross a backtick, so a heading whose fence is missing fails to match
 * rather than silently measuring some later block. It also means the prose
 * between a heading and its fence must not contain inline code.
 */
const FIELD = /\*\*(.+?)\*\*\s*\((\d+)\s*char limit\)[^`]*```\r?\n([\s\S]*?)```/g;

export function parseFields(markdown) {
  return [...markdown.matchAll(FIELD)].map(([, name, limit, body]) => ({
    name,
    limit: Number(limit),
    // The store counts the field's content; the fence's trailing newline is ours.
    body: body.replace(/\r\n/g, '\n').trimEnd(),
  }));
}

/**
 * Undo the hard wrap, and nothing else.
 *
 * These files are wrapped at 80 columns because they are read and reviewed as
 * markdown. A store console is not: pasting the raw block puts a line break in
 * the middle of every sentence, and the reviewer reads the result.
 *
 * What has to survive is the structure that is *meant* to be there — the
 * headings and the numbered steps. So a line joins the one above it unless it
 * begins a list item or follows a blank line. Everything else is a wrap and
 * goes. The leading indent on a continuation line goes with it, which is why
 * the unwrapped text is a little shorter than the source:
 * `check-listing.mjs` measures the source, so it can only ever over-count, and
 * a field that passes the check cannot be rejected by the store for length.
 */
export function unwrap(body) {
  const out = [];
  for (const line of body.split('\n')) {
    const text = line.trim();
    if (text === '') {
      out.push('');
      continue;
    }
    // A dot is required, so a paragraph opening "2026 was..." is not an item.
    const opensItem = /^(\d+\.|[-*•])\s/.test(text);
    const previous = out[out.length - 1];
    if (previous === undefined || previous === '' || opensItem) out.push(text);
    else out[out.length - 1] = `${previous} ${text}`;
  }
  return out.join('\n');
}
