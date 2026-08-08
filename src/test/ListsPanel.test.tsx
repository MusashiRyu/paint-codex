import React from 'react';
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import type { PaintList } from '../app/providers/store';
import type { Paint } from '../domain/types';
import { ListsPanel } from '../features/lists/ListsPanel';

afterEach(cleanup);

const macraggeBlue: Paint = {
  id: 'citadel-macragge-blue',
  brand: 'Citadel',
  name: 'Macragge Blue',
  hex: '#0f4b8f',
  category: 'Base Layer',
  matches: [],
};

const mockList: PaintList = {
  id: 'list-1',
  name: 'Ultramarines',
  icon: 'star',
  color: '#c9a86a',
  paintIds: [macraggeBlue.id],
};

function renderPanel(overrides: Partial<React.ComponentProps<typeof ListsPanel>> = {}) {
  const props = {
    lists: [mockList],
    activeListId: mockList.id,
    activePaints: [macraggeBlue],
    onSelectList: vi.fn(),
    onOpenNewList: vi.fn(),
    onOpenSearch: vi.fn(),
    onRemovePaint: vi.fn(),
    onDeleteList: vi.fn(),
    onRenameList: vi.fn(),
    onExportList: vi.fn(),
    exportFlash: false,
    ...overrides,
  };
  render(<ListsPanel {...props} />);
  return props;
}

describe('ListsPanel export action', () => {
  it('renders the export button when a handler is supplied', () => {
    renderPanel();
    expect(screen.getByTitle('Export list')).toBeInTheDocument();
  });

  it('hides the export button when the markdownExport flag is off', () => {
    renderPanel({ onExportList: undefined });
    expect(screen.queryByTitle('Export list')).not.toBeInTheDocument();
  });
});

describe('ListsPanel header on an empty list', () => {
  const emptyList: PaintList = { ...mockList, paintIds: [] };

  it('still offers rename and delete when the list has no paints', () => {
    renderPanel({ lists: [emptyList], activePaints: [] });

    expect(screen.getByLabelText('Rename list')).toBeInTheDocument();
    expect(screen.getByLabelText('Delete list')).toBeInTheDocument();
    expect(screen.getByText('Your grimoire is empty')).toBeInTheDocument();
  });

  it('renames an empty list', () => {
    const props = renderPanel({ lists: [emptyList], activePaints: [] });

    fireEvent.click(screen.getByLabelText('Rename list'));
    const input = screen.getByLabelText('List name');
    fireEvent.change(input, { target: { value: 'Renamed Empty' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(props.onRenameList).toHaveBeenCalledWith('list-1', 'Renamed Empty');
  });

  it('hides the header entirely when there is no list at all', () => {
    renderPanel({ lists: [], activeListId: undefined, activePaints: [] });

    expect(screen.queryByLabelText('Rename list')).not.toBeInTheDocument();
    expect(screen.getByText('No lists yet')).toBeInTheDocument();
  });
});

describe('ListsPanel delete', () => {
  it('deletes the only list, rather than disabling the action', () => {
    const props = renderPanel();

    const deleteBtn = screen.getByLabelText('Delete list');
    expect(deleteBtn).toBeEnabled();
    fireEvent.click(deleteBtn);

    expect(props.onDeleteList).toHaveBeenCalledWith('list-1');
  });
});

describe('ListsPanel rename', () => {
  it('swaps the list name for an input when the edit button is clicked', () => {
    renderPanel();
    expect(screen.queryByLabelText('List name')).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Rename list'));

    const input = screen.getByLabelText('List name') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('Ultramarines');
  });

  it('commits the new name on Enter', () => {
    const props = renderPanel();
    fireEvent.click(screen.getByLabelText('Rename list'));

    const input = screen.getByLabelText('List name');
    fireEvent.change(input, { target: { value: 'Blood Angels' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(props.onRenameList).toHaveBeenCalledWith('list-1', 'Blood Angels');
    expect(screen.queryByLabelText('List name')).not.toBeInTheDocument();
  });

  it('commits the new name on blur', () => {
    const props = renderPanel();
    fireEvent.click(screen.getByLabelText('Rename list'));

    const input = screen.getByLabelText('List name');
    fireEvent.change(input, { target: { value: 'Death Guard' } });
    fireEvent.blur(input);

    expect(props.onRenameList).toHaveBeenCalledWith('list-1', 'Death Guard');
  });

  it('discards the edit on Escape', () => {
    const props = renderPanel();
    fireEvent.click(screen.getByLabelText('Rename list'));

    const input = screen.getByLabelText('List name');
    fireEvent.change(input, { target: { value: 'Discarded' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(props.onRenameList).not.toHaveBeenCalled();
    expect(screen.queryByLabelText('List name')).not.toBeInTheDocument();
    // Shown in both the tab pill and the list header, unchanged.
    expect(screen.getAllByText('Ultramarines')).toHaveLength(2);
    expect(screen.queryByText('Discarded')).not.toBeInTheDocument();
  });

  it('does not commit a stale name if a blur follows an Escape', () => {
    const props = renderPanel();
    fireEvent.click(screen.getByLabelText('Rename list'));

    const input = screen.getByLabelText('List name');
    fireEvent.change(input, { target: { value: 'Discarded' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    fireEvent.blur(input);

    expect(props.onRenameList).not.toHaveBeenCalled();
  });

  it('leaves paint removal available without an edit mode', () => {
    const props = renderPanel();
    fireEvent.click(screen.getByLabelText('Remove paint'));
    expect(props.onRemovePaint).toHaveBeenCalledWith('citadel-macragge-blue');
  });
});
