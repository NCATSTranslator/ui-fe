import { FC } from 'react';
import { createPortal } from 'react-dom';
import WarningModal from '@/features/Core/components/WarningModal/WarningModal';

interface CanvasDeleteWarningModalProps {
  isOpen: boolean;
  canvasLabel?: string;
  onClose: () => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const CanvasDeleteWarningModal: FC<CanvasDeleteWarningModalProps> = ({
  isOpen,
  canvasLabel,
  onClose,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return createPortal(
    <WarningModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      onCancel={onCancel}
      heading={canvasLabel ? `Delete ${canvasLabel}?` : 'Delete Canvas?'}
      content="This action cannot be undone."
      cancelButtonText="Cancel"
      confirmButtonText="Delete Canvas"
    />,
    document.body,
  );
};

export default CanvasDeleteWarningModal;
