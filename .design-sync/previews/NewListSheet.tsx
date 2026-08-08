import { NewListSheet } from 'paco';

const Frame = ({ children }: { children: React.ReactNode }) => (
  <div style={{ position: 'relative', width: 390, height: 560, background: 'var(--bg-page)', borderRadius: 'var(--radius-card)', overflow: 'hidden', boxShadow: 'inset 0 0 0 1px var(--gold-inset)' }}>
    {children}
  </div>
);

const noop = () => {};

/** Name, an 8-emblem picker and the 5-colour banner palette. */
export const Open = () => (
  <Frame>
    <NewListSheet onClose={noop} onCreate={noop} />
  </Frame>
);
