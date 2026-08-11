import { PaintItem } from 'paco';

const Panel = ({ children }: { children: React.ReactNode }) => (
  <div style={{ background: 'var(--bg-sheet)', padding: 22, borderRadius: 'var(--radius-sheet)', width: 360 }}>{children}</div>
);

const noop = () => {};

export const Row = () => (
  <Panel>
    <PaintItem name="Mephiston Red" brand="Citadel" type="Base Layer" hex="#9B0E05" onShowEquivalents={noop} onRemove={noop} />
  </Panel>
);

/** A category section as the list actually renders it — heading plus rows.
 *  The row itself is a button: it opens the paint's equivalents. */
export const CategorySection = () => (
  <Panel>
    <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--size-xs)', letterSpacing: 'var(--track-2xl)', textTransform: 'uppercase', color: 'var(--text-brand)', paddingBottom: 6, borderBottom: '1px solid var(--gold-line)', margin: '0 0 12px' }}>
      Base Layer
    </div>
    <PaintItem name="Mephiston Red" brand="Citadel" type="Base Layer" hex="#9B0E05" onShowEquivalents={noop} onRemove={noop} />
    <PaintItem name="Macragge Blue" brand="Citadel" type="Base Layer" hex="#0F4B8F" onShowEquivalents={noop} onRemove={noop} />
    <PaintItem name="Abaddon Black" brand="Citadel" type="Base Layer" hex="#141414" onShowEquivalents={noop} onRemove={noop} />
  </Panel>
);

/** Long names ellipsize rather than wrap, so the hex stays on the row. */
export const LongNameAndNoType = () => (
  <Panel>
    <PaintItem name="Incubi Darkness Contrast Special Edition" brand="Citadel" type="Contrast" hex="#094345" onShowEquivalents={noop} onRemove={noop} />
    <PaintItem name="Gory Red" brand="Vallejo" hex="#810504" onShowEquivalents={noop} onRemove={noop} />
  </Panel>
);
