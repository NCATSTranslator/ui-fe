import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ProjectDeletedState from './ProjectDeletedState';

const renderState = (props: Partial<Parameters<typeof ProjectDeletedState>[0]> = {}) => {
  const onRestore = vi.fn();
  render(
    <MemoryRouter>
      <ProjectDeletedState onRestore={onRestore} {...props} />
    </MemoryRouter>
  );
  return { onRestore };
};

describe('ProjectDeletedState', () => {
  it('tells the user the project is deleted and links back to projects', () => {
    renderState();
    expect(screen.getByText('This project has been deleted')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Projects' })).toHaveAttribute('href', '/projects');
  });

  it('calls onRestore when the restore button is clicked', async () => {
    const { onRestore } = renderState();
    await userEvent.click(screen.getByTestId('restore-project-button'));
    expect(onRestore).toHaveBeenCalledTimes(1);
  });

  it('disables the restore button while a restore is in flight', () => {
    renderState({ restoring: true });
    expect(screen.getByTestId('restore-project-button')).toBeDisabled();
  });
});
