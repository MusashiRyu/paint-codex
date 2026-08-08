/**
 * Render store/privacy-policy.md into a standalone store/privacy.html.
 *
 * Play wants a URL, not a file, and it must not require a login. That means
 * the policy has to be hosted somewhere -- GitHub Pages, a domain, Google
 * Sites -- and each of those treats a bare .md differently. GitHub Pages only
 * renders markdown when Jekyll is configured with a theme; drop the .md in as
 * is and a visitor gets raw text with pipe tables showing.
 *
 * So the markdown stays the source and this produces the page. Self-contained
 * on purpose: no stylesheet, no font, no script fetched from anywhere. It can
 * be dropped on any host, and a privacy policy that phones a CDN while
 * claiming the app contacts nobody would be its own small joke.
 *
 * Usage:
 *   npm run privacy
 */
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..');
const sourcePath = join(repoRoot, 'store', 'privacy-policy.md');
const outPath = join(repoRoot, 'store', 'privacy.html');

/**
 * Light by default and dark when the reader prefers it, rather than the app's
 * near-black in both. This is the one page someone might print, read on a
 * borrowed phone, or be sent by a reviewer -- legibility beats brand here. The
 * gold accent is the only thing carried over.
 */
const CSS = `
  :root {
    --ink: #1c1a17;
    --ink-soft: #55504a;
    --paper: #fbfaf8;
    --rule: #e2ddd4;
    --accent: #8a6d2f;
    --code-bg: #f1eee8;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --ink: #ece4d2;
      --ink-soft: #ab9f8c;
      --paper: #0b0a10;
      --rule: rgba(201, 168, 106, 0.22);
      --accent: #dcb877;
      --code-bg: rgba(255, 255, 255, 0.05);
    }
  }
  * { box-sizing: border-box; }
  body {
    margin: 0 auto;
    padding: 3rem 1.25rem 6rem;
    max-width: 46rem;
    background: var(--paper);
    color: var(--ink);
    font: 1.0625rem/1.7 Georgia, 'Iowan Old Style', 'Times New Roman', serif;
    -webkit-text-size-adjust: 100%;
  }
  h1, h2, h3 { line-height: 1.25; color: var(--accent); font-weight: 600; }
  h1 { font-size: 2rem; margin: 0 0 .5rem; letter-spacing: .01em; }
  h2 { font-size: 1.3rem; margin: 2.75rem 0 .75rem; }
  h3 { font-size: 1.1rem; margin: 2rem 0 .5rem; }
  p, li { color: var(--ink); }
  a { color: var(--accent); text-underline-offset: 2px; }
  hr { border: 0; border-top: 1px solid var(--rule); margin: 2.5rem 0; }
  strong { font-weight: 700; }
  code, pre {
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: .875em;
    background: var(--code-bg);
    border-radius: 4px;
  }
  code { padding: .15em .35em; }
  /* The catalogue URL is long and must not force the page to scroll sideways
     on a phone, which is where most people will open this. */
  pre {
    padding: .9rem 1rem;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-all;
  }
  pre code { background: none; padding: 0; }
  table { border-collapse: collapse; width: 100%; margin: 1.25rem 0; font-size: .95rem; }
  th, td { border: 1px solid var(--rule); padding: .55rem .7rem; text-align: left; vertical-align: top; }
  th { background: var(--code-bg); font-weight: 700; }
  /* A wide table would otherwise widen the whole document. */
  .table-scroll { overflow-x: auto; }
  blockquote {
    margin: 1.5rem 0; padding-left: 1rem;
    border-left: 3px solid var(--rule); color: var(--ink-soft);
  }
  footer {
    margin-top: 4rem; padding-top: 1.25rem;
    border-top: 1px solid var(--rule);
    color: var(--ink-soft); font-size: .9rem;
  }
`;

const markdown = await readFile(sourcePath, 'utf8');
const body = marked.parse(markdown, { async: false });

// Tables are the only element here that can exceed the text column.
const wrapped = body.replace(/<table>[\s\S]*?<\/table>/g, (t) => `<div class="table-scroll">${t}</div>`);

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Privacy Policy — Paco (Paint Codex)</title>
<meta name="description" content="Paco collects no personal data. Paint lists stay on your device.">
<meta name="robots" content="index, follow">
<style>${CSS}</style>
</head>
<body>
${wrapped}
<footer>
  Paco (Paint Codex) — an independent app for miniature painters.
  Not affiliated with Games Workshop Limited, Acrylicos Vallejo S.L., or
  The Army Painter ApS.
</footer>
</body>
</html>
`;

await writeFile(outPath, html, 'utf8');
console.log(`wrote ${outPath.replace(repoRoot, '.')}  (${(Buffer.byteLength(html) / 1024).toFixed(1)} KB, self-contained)`);
console.log('Host it anywhere public and paste the URL into Play Console -> App content -> Privacy policy.');
