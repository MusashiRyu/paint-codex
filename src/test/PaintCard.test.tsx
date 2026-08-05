import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import type { Paint } from '../domain/types';
import { PaintCard } from '../features/browse/PaintCard';

afterEach(cleanup);

const mockPaint: Paint = {
  id: 'citadel-mephiston-red',
  brand: 'Citadel',
  name: 'Mephiston Red',
  hex: '#9b0e05',
  category: 'Base Layer',
  matches: [
    { brand: 'Vallejo', name: 'Gory Red', hex: '#810504', delta: 6.78 },
    { brand: 'Army Painter', name: 'Dragon Red', hex: '#9a1b1e', delta: 4.47 },
  ],
};

const paintWithGreenDelta: Paint = {
  id: 'test-green',
  brand: 'Citadel',
  name: 'Test Green',
  hex: '#ffffff',
  category: 'Base',
  matches: [{ brand: 'Vallejo', name: 'Perfect Match', hex: '#ffffff', delta: 1.0 }],
};

const paintWithRedDelta: Paint = {
  id: 'test-red',
  brand: 'Citadel',
  name: 'Test Red',
  hex: '#ff0000',
  category: 'Base',
  matches: [{ brand: 'Vallejo', name: 'Bad Match', hex: '#ff0000', delta: 10.5 }],
};

describe('PaintCard', () => {
  it('renders the paint name', () => {
    render(<PaintCard paint={mockPaint} />);
    expect(screen.getByText('Mephiston Red')).toBeInTheDocument();
  });

  it('renders the brand name', () => {
    render(<PaintCard paint={mockPaint} />);
    expect(screen.getByText('Citadel')).toBeInTheDocument();
  });

  it('renders the hex code', () => {
    render(<PaintCard paint={mockPaint} />);
    expect(screen.getByText('#9b0e05')).toBeInTheDocument();
  });

  it('renders the category', () => {
    render(<PaintCard paint={mockPaint} />);
    expect(screen.getByText('Base Layer')).toBeInTheDocument();
  });

  it('renders all match names', () => {
    render(<PaintCard paint={mockPaint} />);
    expect(screen.getByText('Gory Red')).toBeInTheDocument();
    expect(screen.getByText('Dragon Red')).toBeInTheDocument();
  });

  it('renders delta values for each match', () => {
    render(<PaintCard paint={mockPaint} />);
    expect(screen.getByText(/6\.78/)).toBeInTheDocument();
    expect(screen.getByText(/4\.47/)).toBeInTheDocument();
  });

  it('does not render an add-to-list button when onAddToList is not provided', () => {
    render(<PaintCard paint={mockPaint} />);
    expect(screen.queryByTitle('Add this paint to a list')).not.toBeInTheDocument();
  });

  it('renders an add-to-list button when onAddToList is provided', () => {
    render(<PaintCard paint={mockPaint} onAddToList={() => {}} />);
    expect(screen.getByTitle('Add this paint to a list')).toBeInTheDocument();
  });

  it('applies delta-green class for delta < 3', () => {
    render(<PaintCard paint={paintWithGreenDelta} />);
    expect(screen.getByTitle('Very close')).toHaveClass('delta-green');
  });

  it('applies delta-yellow class for delta between 3 and 7', () => {
    render(<PaintCard paint={mockPaint} />);
    // Both matches are in the 3-7 range; check all badges are delta-yellow
    const badges = screen.getAllByTitle('Close');
    badges.forEach((badge) => expect(badge).toHaveClass('delta-yellow'));
  });

  it('applies delta-red class for delta >= 7', () => {
    render(<PaintCard paint={paintWithRedDelta} />);
    expect(screen.getByTitle('Distant')).toHaveClass('delta-red');
  });

  it('renders "Equivalent Paints:" heading', () => {
    render(<PaintCard paint={mockPaint} />);
    expect(screen.getByText('Equivalent Paints:')).toBeInTheDocument();
  });
});
