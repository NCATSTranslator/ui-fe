import { FC } from 'react';
import { createPortal } from 'react-dom';
import WarningModal from '@/features/Core/components/WarningModal/WarningModal';

interface CanvasLayoutWarningModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const CanvasLayoutWarningModal: FC<CanvasLayoutWarningModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return createPortal(
    <WarningModal
      isOpen={isOpen}
      onClose={onCancel}
      onConfirm={onConfirm}
      onCancel={onCancel}
      heading="Change layout?"
      content="Changing the layout will replace your custom node positions with an automatic layout."
      cancelButtonText="Keep custom layout"
      confirmButtonText="Change layout"
    />,
    document.body,
  );
};

export default CanvasLayoutWarningModal;
