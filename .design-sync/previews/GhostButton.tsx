import { GhostButton } from 'paco';

/**
 * The design system is dark, but preview cards render on a white ground the
 * card harness sets inline. Every preview brings its own surface so the
 * component is seen the way the app shows it.
 */
const Panel = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      background: 'var(--bg-sheet)',
      padding: 22,
      borderRadius: 'var(--radius-sheet)',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
      flexWrap: 'wrap',
    }}
  >
    {children}
  </div>
);

const noop = () => {};

export const Primary = () => (
  <Panel>
    <GhostButton onClick={noop}>+ ADD FIRST PAINT</GhostButton>
  </Panel>
);

export const Quiet = () => (
  <Panel>
    <GhostButton tone="quiet" size="sm" onClick={noop}>
      BROWSE FULL CATALOG
    </GhostButton>
  </Panel>
);

export const Sizes = () => (
  <Panel>
    <GhostButton size="sm" onClick={noop}>SMALL</GhostButton>
    <GhostButton size="md" onClick={noop}>MEDIUM</GhostButton>
    <GhostButton size="lg" onClick={noop}>LARGE</GhostButton>
  </Panel>
);

export const BlockAndDisabled = () => (
  <Panel>
    <div style={{ width: 300, display: 'grid', gap: 12 }}>
      <GhostButton size="lg" block onClick={noop}>
        CREATE LIST
      </GhostButton>
      <GhostButton size="lg" block disabled onClick={noop}>
        CREATE LIST
      </GhostButton>
    </div>
  </Panel>
);
