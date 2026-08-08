import { GoldButton } from 'paco';

const Panel = ({ children }: { children: React.ReactNode }) => (
  <div style={{ background: 'var(--bg-sheet)', padding: 22, borderRadius: 'var(--radius-sheet)', display: 'flex', alignItems: 'center', gap: 20 }}>
    {children}
  </div>
);

const noop = () => {};

/** md sits inline in a search result row; lg is the floating action. */
export const Sizes = () => (
  <Panel>
    <GoldButton size="md" label="Add Mephiston Red to list" onClick={noop}>+</GoldButton>
    <GoldButton size="lg" label="Add paint" onClick={noop}>+</GoldButton>
  </Panel>
);

export const InAResultRow = () => (
  <Panel>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: 320 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--size-2xl)', color: 'var(--text-primary)' }}>Mephiston Red</div>
        <div style={{ fontSize: 'var(--size-xs)', letterSpacing: 'var(--track-md)', textTransform: 'uppercase', color: 'var(--text-brand)', marginTop: 3 }}>Citadel</div>
      </div>
      <GoldButton label="Add Mephiston Red to list" onClick={noop}>+</GoldButton>
    </div>
  </Panel>
);
