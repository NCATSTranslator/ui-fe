interface CanvasNodeActionMenuProps<T extends string = string> {
  actions: readonly { action: T; label: string }[];
  onAction: (action: T) => void;
  className?: string;
  itemClassName?: string;
  menuRole?: 'menu' | 'none';
}

const CanvasNodeActionMenu = <T extends string = string>({
  actions,
  onAction,
  className,
  itemClassName,
  menuRole = 'none',
}: CanvasNodeActionMenuProps<T>) => (
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
export type CanvasNodeActionMenuItem<T extends string = string> = { action: T; label: string };
