import { Badge, Swatch } from 'paco';

const Panel = ({ children }: { children: React.ReactNode }) => (
  <div style={{ background: 'var(--bg-sheet)', padding: 22, borderRadius: 'var(--radius-sheet)', display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
    {children}
  </div>
);

export const Sizes = () => (
  <Panel>
    <Swatch color="#9b0e05" size="sm" />
    <Swatch color="#9b0e05" size="md" />
  </Panel>
);

/** The inset ring is what keeps a near-black paint from vanishing into the card. */
export const DarkAndPale = () => (
  <Panel>
    <Swatch color="#101010" size="md" />
    <Swatch color="#ece4d2" size="md" />
    <Swatch color="#0f4b8f" size="md" />
    <Swatch color="#c9a86a" size="md" />
  </Panel>
);

/** Square, so the rest of the tile's first row is free for a status badge. */
export const TileHead = () => (
  <Panel>
    <div style={{ width: 156, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--radius-md)', padding: 9 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--gap-chip)' }}>
        <Swatch color="#8d1109" size="tile" />
        <Badge tone="success" compact>IN LIST</Badge>
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--size-sm)', color: 'var(--text-primary)', marginTop: 7 }}>Mid Red</div>
      <div style={{ fontSize: 'var(--size-xs)', color: 'var(--text-secondary)', marginTop: 2 }}>Vallejo</div>
    </div>
  </Panel>
);
