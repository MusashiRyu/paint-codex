import { TextField } from 'paco';

const Panel = ({ children }: { children: React.ReactNode }) => (
  <div style={{ background: 'var(--bg-sheet)', padding: 22, borderRadius: 'var(--radius-sheet)', width: 340 }}>
    {children}
  </div>
);

const noop = () => {};

export const Pill = () => (
  <Panel>
    <TextField value="Mephiston" onChange={noop} placeholder="Search by name or brand..." />
  </Panel>
);

export const PillEmpty = () => (
  <Panel>
    <TextField value="" onChange={noop} placeholder="List name..." />
  </Panel>
);

/** Edit-in-place: it replaces a Cinzel label, so it wears that face itself. */
export const Inline = () => (
  <Panel>
    <TextField variant="inline" value="Death Guard" onChange={noop} aria-label="List name" />
  </Panel>
);
