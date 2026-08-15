import { SearchSheet } from 'paco';
import type { Paint } from 'paco';

/* Real catalog shapes — a paint carries its cross-brand equivalents inline. */
const CATALOG: Paint[] = [
  {
    id: 'citadel-mephiston-red',
    brand: 'Citadel',
    name: 'Mephiston Red',
    hex: '#9B0E05',
    category: 'Base Layer',
    matches: [
      { brand: 'Army Painter', name: 'Dragon Red', hex: '#9A1B1E', delta: 1.2 },
      { brand: 'Vallejo', name: 'Gory Red', hex: '#810504', delta: 3.65 },
      { brand: 'Vallejo', name: 'Mid Red', hex: '#8D1109', delta: 5.4 },
    ],
  },
  {
    id: 'citadel-macragge-blue',
    brand: 'Citadel',
    name: 'Macragge Blue',
    hex: '#0F4B8F',
    category: 'Base Layer',
    matches: [{ brand: 'Vallejo', name: 'Magic Blue', hex: '#134A86', delta: 2.1 }],
  },
  {
    id: 'vallejo-gory-red',
    brand: 'Vallejo',
    name: 'Gory Red',
    hex: '#810504',
    category: 'Game Color',
    matches: [{ brand: 'Citadel', name: 'Mephiston Red', hex: '#9B0E05', delta: 3.65 }],
  },
  {
    id: 'scale75-abyssal-black',
    brand: 'Scale75',
    name: 'Abyssal Black',
    hex: '#101010',
    category: 'Instant Colors',
    matches: [],
  },
];

const Frame = ({ children }: { children: React.ReactNode }) => (
  <div style={{ position: 'relative', width: 390, height: 620, background: 'var(--bg-page)', borderRadius: 'var(--radius-card)', overflow: 'hidden', boxShadow: 'inset 0 0 0 1px var(--gold-inset)' }}>
    {children}
  </div>
);

const noop = () => {};

/** The resting state: prompt plus the browse escape hatch. */
export const EmptyPrompt = () => (
  <Frame>
    <SearchSheet paintCatalog={CATALOG} listedPaintIds={[]} onAdd={noop} onClose={noop} />
  </Frame>
);
