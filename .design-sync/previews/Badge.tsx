import { Badge, getDeltaLabel, getDeltaStyle } from 'paco';

const Panel = ({ children }: { children: React.ReactNode }) => (
  <div style={{ background: 'var(--bg-sheet)', padding: 22, borderRadius: 'var(--radius-sheet)', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
    {children}
  </div>
);

export const InList = () => (
  <Panel>
    <Badge tone="success">IN LIST</Badge>
  </Panel>
);

/**
 * `compact` is the tile-sized IN LIST badge, cut down until it stands exactly
 * as tall as the delta pill it shares a tile with — the two are side by side
 * here for that reason.
 */
export const CompactBesideDelta = () => (
  <Panel>
    <Badge tone="success" compact>IN LIST</Badge>
    <Badge block style={{ background: 'var(--ok-bg)', border: '1px solid var(--ok-border)', color: 'var(--ok-text)' }}>
      {'Δ 1.20'}
    </Badge>
  </Panel>
);

/**
 * The delta pill. Its colour is never picked by hand — it comes from
 * getDeltaStyle, the one place a ΔE becomes a colour.
 */
export const DeltaScale = () => (
  <Panel>
    {[1.2, 3.65, 6.4].map((delta) => {
      const s = getDeltaStyle(delta);
      return (
        <div key={delta} style={{ width: 104 }}>
          <Badge block title={getDeltaLabel(delta)} style={{ background: s.background, border: `1px solid ${s.border}`, color: s.color }}>
            {`\u0394 ${delta.toFixed(2)}`}
          </Badge>
          <div style={{ fontSize: 'var(--size-xs)', color: 'var(--text-muted)', textAlign: 'center', marginTop: 6 }}>
            {getDeltaLabel(delta)}
          </div>
        </div>
      );
    })}
  </Panel>
);
