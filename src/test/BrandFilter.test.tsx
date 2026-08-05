import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrandFilter } from '../features/browse/BrandFilter';

afterEach(cleanup);

const brands = ['Army Painter', 'Citadel', 'Vallejo'];

describe('BrandFilter', () => {
  it('renders an "All Brands" button', () => {
    render(<BrandFilter brands={brands} selectedBrand={undefined} onBrandChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'All Brands' })).toBeInTheDocument();
  });

  it('renders a button for each brand', () => {
    render(<BrandFilter brands={brands} selectedBrand={undefined} onBrandChange={() => {}} />);
    brands.forEach((brand) => {
      expect(screen.getByRole('button', { name: brand })).toBeInTheDocument();
    });
  });

  it('marks "All Brands" as active when no brand is selected', () => {
    render(<BrandFilter brands={brands} selectedBrand={undefined} onBrandChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'All Brands' })).toHaveClass('active');
  });

  it('marks the selected brand button as active', () => {
    render(<BrandFilter brands={brands} selectedBrand="Citadel" onBrandChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Citadel' })).toHaveClass('active');
    expect(screen.getByRole('button', { name: 'All Brands' })).not.toHaveClass('active');
  });

  it('calls onBrandChange with the brand name when a brand button is clicked', async () => {
    const onBrandChange = vi.fn();
    render(<BrandFilter brands={brands} selectedBrand={undefined} onBrandChange={onBrandChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Citadel' }));
    expect(onBrandChange).toHaveBeenCalledWith('Citadel');
  });

  it('calls onBrandChange with undefined when "All Brands" is clicked', async () => {
    const onBrandChange = vi.fn();
    render(<BrandFilter brands={brands} selectedBrand="Citadel" onBrandChange={onBrandChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'All Brands' }));
    expect(onBrandChange).toHaveBeenCalledWith(undefined);
  });

  it('renders the filter label', () => {
    render(<BrandFilter brands={brands} selectedBrand={undefined} onBrandChange={() => {}} />);
    expect(screen.getByText('Filter by Brand:')).toBeInTheDocument();
  });
});
