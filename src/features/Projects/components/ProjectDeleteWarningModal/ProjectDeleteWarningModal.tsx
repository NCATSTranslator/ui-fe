import WarningModal from "@/features/Common/components/WarningModal/WarningModal";

interface ProjectDeleteWarningModalProps {
  cancelButtonText: string;
  confirmButtonText: string;
  content: string;
  heading: string;
  isOpen: boolean;
  onCancel: () => void;
  onClose: () => void;
  onConfirm: () => void;
  setStorageKeyFn: (hide: boolean) => void;
}
const ProjectDeleteWarningModal = ({
  cancelButtonText,
  confirmButtonText,
  content,
  heading,
  isOpen,
  onCancel,
  onClose,
  onConfirm,
  setStorageKeyFn,
}: ProjectDeleteWarningModalProps) => {
  return (
    <WarningModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      onCancel={onCancel}
      heading={heading}
      content={content}
      cancelButtonText={cancelButtonText}
      confirmButtonText={confirmButtonText}
      setStorageKeyFn={setStorageKeyFn}
    />
  );
};

export default ProjectDeleteWarningModal;