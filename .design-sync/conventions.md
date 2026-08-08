## How to build with Paco

A dark, gilt, bookish design system — a grimoire, not a dashboard. Paint Codex
is a paint-collection manager for miniature painters, and everything below
serves that voice.

Designed by [Lukas Stordeur](https://github.com/LukasStordeur). The tokens and
components here are an extraction of that design; when a choice below looks
arbitrary, it is deliberate — follow it rather than improving on it.

### Setup: there is no provider

Nothing to wrap. No theme provider, no context, no registration step. Every
token is a plain CSS custom property defined in `_ds_bundle.css`, so importing
the stylesheet is the whole setup. If a component looks unstyled, the
stylesheet is missing — not a provider.

Two consequences worth knowing:

- **The ground is dark and the page must supply it.** `body` is painted
  `var(--bg-page)` (`#050409`). Rendering these components on white makes most
  of them nearly invisible — every border and label is tuned for a near-black
  ground. When you build a surface inside the page, use `var(--bg-sheet)` for a
  raised panel and `var(--bg-item)` for a row.
- **`Sheet` is self-contained.** It already owns Escape-to-close, the focus
  trap, `role="dialog"` and `aria-modal`. Do not add your own — pass `title`,
  `label` and `onClose` and put content inside.

### The styling idiom: CSS custom properties

There is **no utility-class vocabulary**. Component styles are CSS Modules with
hashed private names, so there is nothing to reuse by class name. For your own
layout glue, style with the tokens directly — `style={{ … }}` or your own CSS,
always through `var(--*)`. Never hard-code a hex; every value below already
exists.

| Group | Tokens |
| --- | --- |
| Grounds | `--bg-page` `--bg-sheet` `--bg-item` `--bg-backdrop` |
| Gold (the only accent) | `--gold` `--gold-bright` `--gold-title` `--gold-pale` `--on-gold` |
| Gold surfaces | `--gold-fill` `--gold-fill-strong` `--gold-line` `--gold-border` |
| Text | `--text-primary` `--text-secondary` `--text-muted` `--text-dim` `--text-brand` |
| State (ΔE only) | `--ok-*` `--warn-*` `--bad-*`, each with `-bg` / `-border` / `-text` |
| Faces | `--font-display` (Cinzel) `--font-body` (EB Garamond) `--font-mono` |
| Sizes | `--size-xxs` … `--size-3xl`; body is `--size-xl` (15px) |
| Tracking | `--track-sm` … `--track-3xl` |
| Radius | `--radius-xs` … `--radius-pill` `--radius-sheet` `--radius-card` `--radius-round` |
| Elevation | `--shadow-card` `--shadow-fab` `--shadow-sheet-lip` `--shadow-swatch` |
| Structure | `--gutter` (22px card padding) `--pad-sheet` `--gap-chip` `--gap-row` `--control-sm/md/lg/xl` |

Three rules the system depends on:

1. **Cinzel labels, EB Garamond reads.** Every title, tab, chip and button is
   `--font-display` *with* letter-spacing. Body copy, inputs and prose empty
   states are `--font-body`. A control set in Garamond, or a sentence set in
   Cinzel, is wrong.
2. **Gold is the only accent, and only one control is filled.** `GoldButton`
   (the gradient) means "add something" and appears at most twice on a screen.
   Everything else is outline-and-tint: `GhostButton` for labelled actions,
   `IconButton` for icon-only ones. Destructive actions use `tone="danger"` —
   outline only, deliberately quieter than the gold beside them.
3. **Never pick a match colour by hand.** A ΔE quality becomes a colour only
   through `getDeltaStyle(delta)`, which returns `{background, border, color}`.
   Pair it with `getDeltaLabel(delta)`.

### Where the truth lives

- `_ds/<folder>/styles.css` and its imports — the real stylesheet closure. Read
  `_ds_bundle.css` for every token definition and every component's actual CSS.
- `components/<group>/<Name>/<Name>.d.ts` — the prop contract.
- `components/<group>/<Name>/<Name>.prompt.md` — per-component usage.

Groups: **shared** (Sheet, Pill, Badge, IconButton, GoldButton, GhostButton,
TextField, Swatch, ListIconSvg), **lists** (ListsPanel, PaintItem,
NewListSheet), **search** (SearchSheet).

### An idiomatic build

```jsx
import { Sheet, TextField, Pill, GhostButton, Swatch, Badge } from 'paco';

<div style={{ position: 'relative', height: 600, background: 'var(--bg-page)' }}>
  <Sheet title="SEARCH PAINTS" label="Search paints" size="tall" onClose={close}>
    <div style={{ marginTop: 14 }}>
      <TextField value={q} onChange={(e) => setQ(e.target.value)}
                 placeholder="Search by name or brand..." autoFocus />
    </div>

    <div style={{ display: 'flex', gap: 'var(--gap-chip)', marginTop: 12 }}>
      {brands.map((b) => (
        <Pill key={b} size="sm" selected={b === brand} onClick={() => setBrand(b)}>{b}</Pill>
      ))}
    </div>

    <div style={{ flex: 1, overflowY: 'auto', marginTop: 16 }}>
      {results.map((p) => (
        <div key={p.id} style={{
          display: 'flex', alignItems: 'center', gap: 'var(--gap-row)',
          background: 'var(--bg-item)', border: '1px solid var(--gold-line)',
          borderRadius: 'var(--radius-xl)', padding: 14, marginBottom: 14,
        }}>
          <Swatch color={p.hex} size="md" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--size-2xl)',
                          color: 'var(--text-primary)' }}>{p.name}</div>
            <div style={{ fontSize: 'var(--size-xs)', letterSpacing: 'var(--track-md)',
                          textTransform: 'uppercase', color: 'var(--text-brand)' }}>{p.brand}</div>
          </div>
          <Badge tone="success">IN LIST</Badge>
        </div>
      ))}
    </div>
  </Sheet>
</div>
```

Note the shape of it: library components for the controls, tokens for the glue.
A sheet needs a positioned ancestor — it is `position: absolute; bottom: 0`.
