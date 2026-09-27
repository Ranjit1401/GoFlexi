import React, { useState, useEffect } from 'react';
import { Trip } from '../../types/traveler';
import { updateTrip } from '../../services/trips';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useToast } from '../../context/ToastContext';

export interface EditTripModalProps {
  trip: Trip | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (updatedTrip: Trip) => void;
}

export const EditTripModal: React.FC<EditTripModalProps> = ({
  trip,
  isOpen,
  onClose,
  onSaved,
}) => {
  const { showToast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [title, setTitle] = useState('');
  const [destination, setDestination] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [travelersCount, setTravelersCount] = useState(1);
  const [budget, setBudget] = useState('');
  const [summary, setSummary] = useState('');
  const [stopsText, setStopsText] = useState('');

  useEffect(() => {
    if (trip) {
      setTitle(trip.title || '');
      setDestination(trip.destination || '');
      setStartDate(trip.startDate || '');
      setEndDate(trip.endDate || '');
      setTravelersCount(trip.travelersCount || 1);
      setBudget(trip.budget || '');
      setSummary(trip.itinerarySummary || '');
      setStopsText((trip.stops || []).join(', '));
    }
  }, [trip]);

  if (!trip) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (trip.paymentStatus === 'Paid') {
      showToast('error', 'Paid trips cannot be edited as reservations are locked.', 'Editing Locked');
      return;
    }

    setIsSaving(true);
    try {
      const stopsArray = stopsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const updated = await updateTrip(trip.id, {
        title: title.trim() || trip.title,
        destination: destination.trim() || trip.destination,
        start_date: startDate.trim() || trip.startDate,
        end_date: endDate.trim() || trip.endDate,
        travelers_count: Number(travelersCount) || trip.travelersCount,
        budget: budget.trim() || trip.budget,
        itinerary_summary: summary.trim() || trip.itinerarySummary,
        stops: stopsArray,
      });

      onSaved(updated);
      showToast('success', `Trip "${updated.title}" updated successfully!`, 'Changes Saved');
      onClose();
    } catch (err: any) {
      console.error('Failed to update trip:', err);
      showToast(
        'error',
        err?.response?.data?.detail || 'Unable to update trip details. Please try again.',
        'Update Failed'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Trip: ${trip.title}`}
      subtitle="Update destination, dates, travelers, or itinerary before completing payment."
      maxWidth="lg"
    >
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Trip Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Goa Coastal Escape"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Destination</label>
            <Input
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Goa, India"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Travelers Count</label>
            <Input
              type="number"
              min={1}
              max={50}
              value={travelersCount}
              onChange={(e) => setTravelersCount(Number(e.target.value))}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
            <Input
              type="text"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              placeholder="e.g. 12 Oct 2026"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">End Date</label>
            <Input
              type="text"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              placeholder="e.g. 16 Oct 2026"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Budget</label>
          <Input
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            placeholder="e.g. ₹35,000"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Itinerary Overview</label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
            className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-800"
            placeholder="Describe the plan, activities, or notes for this trip..."
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Key Stops (comma-separated)</label>
          <Input
            value={stopsText}
            onChange={(e) => setStopsText(e.target.value)}
            placeholder="e.g. Calangute Beach, Fontainhas, Morjim Sunset Shack"
          />
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSaving}
            className="rounded-xl text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSaving}
            isLoading={isSaving}
            className="rounded-xl text-xs bg-navy-900 hover:bg-navy-800"
          >
            <span>{isSaving ? 'Saving Changes...' : 'Save Changes'}</span>
          </Button>
        </div>
      </form>
    </Modal>
  );
};
