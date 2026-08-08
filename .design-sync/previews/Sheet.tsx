import { GhostButton, Sheet, TextField } from 'paco';

/**
 * A sheet is `position: absolute; bottom: 0`, so it needs a positioned frame.
 * This one stands in for the app's phone card.
 */
const Frame = ({ children }: { children: React.ReactNode }) => (
  <div style={{ position: 'relative', width: 390, height: 460, background: 'var(--bg-page)', borderRadius: 'var(--radius-card)', overflow: 'hidden', boxShadow: 'inset 0 0 0 1px var(--gold-inset)' }}>
    <div style={{ padding: 22, fontFamily: 'var(--font-display)', fontSize: 'var(--size-3xl)', letterSpacing: 'var(--track-xl)', color: 'var(--gold-title)' }}>
      PAINT CODEX
    </div>
    {children}
  </div>
);

const noop = () => {};

/** Sizes to its content — the sheet a short form lives in. */
export const AutoHeight = () => (
  <Frame>
    <Sheet title="FORGE A NEW LIST" label="Create a new list" onClose={noop}>
      <div style={{ marginTop: 16 }}>
        <TextField value="" onChange={noop} placeholder="List name..." autoFocus />
      </div>
      <div style={{ marginTop: 24 }}>
        <GhostButton size="lg" block onClick={noop}>CREATE LIST</GhostButton>
      </div>
    </Sheet>
  </Frame>
);

/** Fixed tall sheet: a child with flex:1 is what scrolls. */
export const TallScrolling = () => (
  <Frame>
    <Sheet title="SEARCH PAINTS" label="Search paints" closeLabel="Close search" size="tall" onClose={noop}>
      <div style={{ marginTop: 14, flexShrink: 0 }}>
        <TextField value="" onChange={noop} placeholder="Search by name or brand..." autoFocus />
      </div>
      <div style={{ flex: 1, overflowY: 'auto', marginTop: 16 }}>
        <div style={{ textAlign: 'center', padding: '50px 10px 0' }}>
          <div style={{ color: 'var(--text-muted)', fontStyle: 'italic', fontSize: 'var(--size-xl)', marginBottom: 18 }}>
            Search the grimoire for a paint...
          </div>
          <GhostButton tone="quiet" size="sm" onClick={noop}>BROWSE FULL CATALOG</GhostButton>
        </div>
      </div>
    </Sheet>
  </Frame>
);
