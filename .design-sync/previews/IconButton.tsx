import { IconButton } from 'paco';

const Panel = ({ children }: { children: React.ReactNode }) => (
  <div style={{ background: 'var(--bg-sheet)', padding: 22, borderRadius: 'var(--radius-sheet)', display: 'flex', alignItems: 'center', gap: 10 }}>
    {children}
  </div>
);

const noop = () => {};

const glyph = {
  viewBox: '0 0 24 24',
  width: 15,
  height: 15,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/** The list header's three actions, in the order the app shows them. */
export const HeaderActions = () => (
  <Panel>
    <IconButton label="Export list" onClick={noop}>
      <svg {...glyph}><path d="M12 4 V15 M8 11 L12 15 L16 11 M5 19 H19" /></svg>
    </IconButton>
    <IconButton label="Rename list" onClick={noop}>
      <svg {...glyph}>
        <path d="M4 20 L4.8 16.2 L15.5 5.5 C16.3 4.7 17.6 4.7 18.4 5.5 C19.2 6.3 19.2 7.6 18.4 8.4 L7.7 19.1 Z" />
        <path d="M14 7 L17 10" />
      </svg>
    </IconButton>
    <IconButton label="Delete list" tone="danger" onClick={noop}>
      <svg {...glyph}><path d="M5 7 H19 M9 7 V5 C9 4.4 9.4 4 10 4 H14 C14.6 4 15 4.4 15 5 V7 M7 7 L7.7 19 C7.8 19.6 8.3 20 8.9 20 H15.1 C15.7 20 16.2 19.6 16.3 19 L17 7" /></svg>
    </IconButton>
  </Panel>
);

/** Active is the held-down state of a toggle — rename, while renaming. */
export const Tones = () => (
  <Panel>
    <IconButton label="Neutral" onClick={noop}>
      <svg {...glyph}><path d="M14 7 L17 10 M4 20 L4.8 16.2 L15.5 5.5 C16.3 4.7 17.6 4.7 18.4 5.5 C19.2 6.3 19.2 7.6 18.4 8.4 L7.7 19.1 Z" /></svg>
    </IconButton>
    <IconButton label="Active" tone="active" onClick={noop}>
      <svg {...glyph}><path d="M14 7 L17 10 M4 20 L4.8 16.2 L15.5 5.5 C16.3 4.7 17.6 4.7 18.4 5.5 C19.2 6.3 19.2 7.6 18.4 8.4 L7.7 19.1 Z" /></svg>
    </IconButton>
    <IconButton label="Danger" tone="danger" onClick={noop}>
      <svg {...glyph}><path d="M5 7 H19 M9 7 V5 C9 4.4 9.4 4 10 4 H14 C14.6 4 15 4.4 15 5 V7 M7 7 L7.7 19 C7.8 19.6 8.3 20 8.9 20 H15.1 C15.7 20 16.2 19.6 16.3 19 L17 7" /></svg>
    </IconButton>
  </Panel>
);

/** sm is the inline remove that sits at the end of a paint row. */
export const SmallRemove = () => (
  <Panel>
    <IconButton size="sm" tone="danger" label="Remove paint" onClick={noop}>{'\u00d7'}</IconButton>
    <IconButton size="md" tone="danger" label="Delete list" onClick={noop}>{'\u00d7'}</IconButton>
  </Panel>
);
