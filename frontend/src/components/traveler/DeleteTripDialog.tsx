import React, { useState } from 'react';
import { Trip } from '../../types/traveler';
import { deleteTrip } from '../../services/trips';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useToast } from '../../context/ToastContext';
import { Trash2, AlertTriangle } from 'lucide-react';

export interface DeleteTripDialogProps {
  trip: Trip | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted: (deletedTripId: string) => void;
}

export const DeleteTripDialog: React.FC<DeleteTripDialogProps> = ({
  trip,
  isOpen,
  onClose,
  onDeleted,
}) => {
  const { showToast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);

  if (!trip) return null;

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteTrip(trip.id);
      showToast('success', `Trip "${trip.title}" deleted successfully.`, 'Trip Removed');
      onDeleted(trip.id);
      onClose();
    } catch (err: any) {
      console.error('Failed to delete trip:', err);
      showToast(
        'error',
        err?.response?.data?.detail || 'Failed to delete trip. Please try again.',
        'Delete Error'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Trip"
      subtitle={`Are you sure you want to delete "${trip.title}"?`}
      maxWidth="sm"
    >
      <div className="space-y-4">
        <div className="p-3.5 bg-rose-50 border border-rose-200/80 rounded-2xl flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-xs text-rose-900 leading-relaxed">
            <p className="font-bold mb-0.5">Permanent action</p>
            <p className="text-rose-700">
              This will remove the itinerary to <span className="font-semibold">{trip.destination}</span> ({trip.days} days, {trip.startDate} — {trip.endDate}). This cannot be undone.
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={isDeleting}
            onClick={onClose}
            className="rounded-xl text-xs"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            disabled={isDeleting}
            isLoading={isDeleting}
            onClick={handleConfirmDelete}
            icon={<Trash2 className="w-3.5 h-3.5" />}
            className="rounded-xl text-xs bg-rose-600 hover:bg-rose-700 text-white font-semibold"
          >
            <span>{isDeleting ? 'Deleting...' : 'Delete Trip'}</span>
          </Button>
        </div>
      </div>
    </Modal>
  );
};
