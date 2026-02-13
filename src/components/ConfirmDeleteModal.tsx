/**
 * Confirm delete modal: uses design-system Modal with destructive variant.
 * Secondary action (e.g. Cancel/Sluiten) is tertiary style.
 */
import { Modal } from '@tomlievens/design-system';

export type ConfirmDeleteModalProps = {
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDeleteModal({
  title,
  description,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
}: ConfirmDeleteModalProps) {
  return (
    <Modal
      open
      onClose={onCancel}
      title={title}
      variant="destructive"
      primaryAction={{ label: confirmLabel, onClick: onConfirm }}
      secondaryAction={{ label: 'Annuleren', onClick: onCancel }}
    >
      <p>{description}</p>
    </Modal>
  );
}
