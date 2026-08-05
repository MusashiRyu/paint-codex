import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import type { Paint } from '../domain/types';
import { ResultsGrid } from '../features/browse/ResultsGrid';

afterEach(cleanup);

const mockPaints: Paint[] = [
  {
    id: 'citadel-ceramite-white',
    brand: 'Citadel',
    name: 'Ceramite White',
    hex: '#ffffff',
    category: 'Base Layer',
    matches: [{ brand: 'Vallejo', name: 'Dead White', hex: '#ffffff', delta: 0 }],
  },
  {
    id: 'citadel-mephiston-red',
    brand: 'Citadel',
    name: 'Mephiston Red',
    hex: '#9b0e05',
    category: 'Base Layer',
    matches: [{ brand: 'Army Painter', name: 'Dragon Red', hex: '#9a1b1e', delta: 4.47 }],
  },
];

describe('ResultsGrid', () => {
  it('shows a loading indicator when isLoading is true', () => {
    render(<ResultsGrid paints={[]} isLoading={true} />);
    expect(screen.getByText('Loading paints...')).toBeInTheDocument();
  });

  it('shows no-results message when paints array is empty', () => {
    render(<ResultsGrid paints={[]} />);
    expect(screen.getByText('No paints found. Try a different search.')).toBeInTheDocument();
  });

  it('shows the correct count of results', () => {
    render(<ResultsGrid paints={mockPaints} />);
    expect(screen.getByText('Found 2 paint(s)')).toBeInTheDocument();
  });

  it('renders a card for each paint', () => {
    render(<ResultsGrid paints={mockPaints} />);
    expect(screen.getByText('Ceramite White')).toBeInTheDocument();
    expect(screen.getByText('Mephiston Red')).toBeInTheDocument();
  });

  it('shows singular count for 1 result', () => {
    render(<ResultsGrid paints={[mockPaints[0]]} />);
    expect(screen.getByText('Found 1 paint(s)')).toBeInTheDocument();
  });
});
