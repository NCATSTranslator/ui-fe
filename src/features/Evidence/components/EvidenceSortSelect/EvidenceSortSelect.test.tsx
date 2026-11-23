import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import EvidenceSortSelect from '@/features/Evidence/components/EvidenceSortSelect/EvidenceSortSelect';
import { TRIAL_SORT_OPTIONS } from '@/features/Evidence/utils/evidenceSortOptions';

const renderSelect = (onChange = vi.fn(), disabled = false) => {
  render(
    <EvidenceSortSelect
      label="clinical trials"
      options={TRIAL_SORT_OPTIONS}
      value="dateHighLow"
      onChange={onChange}
      disabled={disabled}
    />,
  );
  return onChange;
};

const getTrigger = () => screen.getByRole('button', { name: /sort clinical trials by/i });

describe('EvidenceSortSelect', () => {
  it('shows the current order and keeps the menu closed until asked', () => {
    renderSelect();
    expect(getTrigger().textContent).toBe('Sort by Date: Newest to Oldest');
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('lists the offered orders with the current one checked', () => {
    renderSelect();
    fireEvent.click(getTrigger());
    const items = screen.getAllByRole('menuitemradio');
    expect(items.map((item) => item.textContent)).toEqual([
      'Date: Newest to Oldest',
      'Date: Oldest to Newest',
      'Title: A to Z',
      'Title: Z to A',
      'Participants: High to Low',
      'Participants: Low to High',
    ]);
    expect(items.map((item) => item.getAttribute('aria-checked'))).toEqual(['true', 'false', 'false', 'false', 'false', 'false']);
  });

  it('reports a new choice and closes', () => {
    const onChange = renderSelect();
    fireEvent.click(getTrigger());
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Title: A to Z' }));
    expect(onChange).toHaveBeenCalledWith('titleLowHigh');
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('does not report the order already in use', () => {
    const onChange = renderSelect();
    fireEvent.click(getTrigger());
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Date: Newest to Oldest' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('closes on Escape from the trigger', () => {
    renderSelect();
    fireEvent.click(getTrigger());
    fireEvent.keyDown(getTrigger(), { key: 'Escape' });
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('moves focus into the menu when it opens and through it with the arrow keys', () => {
    renderSelect();
    fireEvent.click(getTrigger());
    const items = screen.getAllByRole('menuitemradio');
    expect(document.activeElement).toBe(items[0]);
    fireEvent.keyDown(items[0], { key: 'ArrowDown' });
    expect(document.activeElement).toBe(items[1]);
    fireEvent.keyDown(items[1], { key: 'ArrowUp' });
    fireEvent.keyDown(items[0], { key: 'ArrowUp' });
    expect(document.activeElement).toBe(items[items.length - 1]);
  });

  it('returns focus to the trigger on Escape from the menu, without the key reaching the page', () => {
    const onPageKeyDown = vi.fn();
    document.addEventListener('keydown', onPageKeyDown);
    renderSelect();
    fireEvent.click(getTrigger());
    fireEvent.keyDown(screen.getAllByRole('menuitemradio')[0], { key: 'Escape' });
    document.removeEventListener('keydown', onPageKeyDown);
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.activeElement).toBe(getTrigger());
    expect(onPageKeyDown).not.toHaveBeenCalled();
  });

  it('returns focus to the trigger after a choice', () => {
    renderSelect();
    fireEvent.click(getTrigger());
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Title: A to Z' }));
    expect(document.activeElement).toBe(getTrigger());
  });

  it('cannot be opened while disabled', () => {
    renderSelect(vi.fn(), true);
    fireEvent.click(getTrigger());
    expect(getTrigger()).toHaveProperty('disabled', true);
    expect(screen.queryByRole('menu')).toBeNull();
  });
});
