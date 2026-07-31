import { FC } from 'react';
import type { CanvasNodeAction } from '@/features/Canvas/constants/canvasNodeActions';

export interface CanvasNodeActionMenuItem {
  action: CanvasNodeAction;
  label: string;
}

interface CanvasNodeActionMenuProps {
  actions: readonly CanvasNodeActionMenuItem[];
  onAction: (action: CanvasNodeAction) => void;
  className?: string;
  itemClassName?: string;
  menuRole?: 'menu' | 'none';
}

const CanvasNodeActionMenu: FC<CanvasNodeActionMenuProps> = ({
  actions,
  onAction,
  className,
  itemClassName,
  menuRole = 'none',
}) => (
  <div className={className} role={menuRole === 'menu' ? 'menu' : undefined}>
    {actions.map(({ action, label }) => (
      <button
        key={action}
        type="button"
        className={itemClassName}
        role={menuRole === 'menu' ? 'menuitem' : undefined}
        onClick={() => onAction(action)}
      >
        {label}
      </button>
    ))}
  </div>
);

export default CanvasNodeActionMenu;
