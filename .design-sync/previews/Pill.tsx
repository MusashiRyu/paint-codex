import { ListIconSvg, Pill } from 'paco';

const Panel = ({ children }: { children: React.ReactNode }) => (
  <div style={{ background: 'var(--bg-sheet)', padding: 22, borderRadius: 'var(--radius-sheet)', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
    {children}
  </div>
);

const noop = () => {};

/** The list tab bar: an active tab tinted with the list's own banner colour. */
export const ListTabs = () => (
  <Panel>
    <Pill style={{ border: '1px solid #c9a86a', background: '#c9a86a26', color: 'var(--gold-bright)' }} onClick={noop}>
      <ListIconSvg icon="skull" size={13} />
      <span>Death Guard</span>
    </Pill>
    <Pill onClick={noop}>
      <ListIconSvg icon="crown" size={13} />
      <span>Ultramarines</span>
    </Pill>
    <Pill dashed onClick={noop}>
      <span style={{ fontSize: 'var(--size-2xl)', lineHeight: 1, color: 'var(--gold)' }}>+</span>
      <span>New</span>
    </Pill>
  </Panel>
);

/** Brand filters in the search sheet — the small size, one selected. */
export const BrandFilters = () => (
  <Panel>
    <Pill size="sm" selected onClick={noop}>All</Pill>
    <Pill size="sm" onClick={noop}>Citadel</Pill>
    <Pill size="sm" onClick={noop}>Vallejo</Pill>
    <Pill size="sm" onClick={noop}>Army Painter</Pill>
    <Pill size="sm" onClick={noop}>Scale75</Pill>
  </Panel>
);

export const Sizes = () => (
  <Panel>
    <Pill size="sm" onClick={noop}>Small</Pill>
    <Pill size="sm" selected onClick={noop}>Small selected</Pill>
    <Pill size="md" onClick={noop}>Medium</Pill>
    <Pill size="md" selected onClick={noop}>Medium selected</Pill>
  </Panel>
);
