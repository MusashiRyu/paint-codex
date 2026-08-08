import { ListIconSvg } from 'paco';

const ICONS = ['skull', 'star', 'shield', 'wing', 'crown', 'flame', 'moon', 'drop'] as const;

const Panel = ({ children }: { children: React.ReactNode }) => (
  <div style={{ background: 'var(--bg-sheet)', padding: 22, borderRadius: 'var(--radius-sheet)' }}>{children}</div>
);

/** The closed set. A ninth emblem means editing the union in the store. */
export const AllEmblems = () => (
  <Panel>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
      {ICONS.map((icon) => (
        <div key={icon} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: 72, justifyContent: 'center', borderRadius: 'var(--radius-lg)', background: 'rgba(255,255,255,0.03)', border: '1.5px solid rgba(255,255,255,0.08)', color: 'var(--gold-bright)' }}>
          <ListIconSvg icon={icon} size={22} />
          <span style={{ fontSize: 'var(--size-xxs)', letterSpacing: 'var(--track-md)', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{icon}</span>
        </div>
      ))}
    </div>
  </Panel>
);

/** They are drawn on a 24px grid with currentColor, so they take the tone around them. */
export const Sizes = () => (
  <Panel>
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, color: 'var(--gold)' }}>
      <ListIconSvg icon="crown" size={13} />
      <ListIconSvg icon="crown" size={20} />
      <ListIconSvg icon="crown" size={32} />
      <ListIconSvg icon="crown" size={52} />
    </div>
  </Panel>
);
