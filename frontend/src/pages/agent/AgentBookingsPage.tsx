import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { getBookings, updateBookingStatus as apiUpdateBookingStatus } from '../../services/bookings';
import { Booking } from '../../types/agent';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { LoadingState } from '../../components/ui/LoadingState';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../context/ToastContext';
import { Search, Download, AlertCircle, RefreshCw } from 'lucide-react';

export const AgentBookingsPage: React.FC = () => {
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await getBookings();
      setBookings(data);
    } catch (err) {
      console.error('Failed to load bookings:', err);
      setErrorMessage('Unable to load bookings ledger. Please check your connection and retry.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchesSearch =
        b.traveler.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.tour.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.bookingCode.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || b.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchQuery, statusFilter]);

  const handleUpdateBookingStatus = async (id: string, newStatus: Booking['status']) => {
    try {
      const updated = await apiUpdateBookingStatus(id, newStatus);
      setBookings((prev) =>
        prev.map((b) => (b.id === id ? updated : b))
      );
      showToast('success', `Booking ${updated.bookingCode} updated to ${newStatus}`, 'Status Updated');
    } catch (err) {
      console.error('Failed to update booking status:', err);
      showToast('error', 'Could not update booking status. Please try again.', 'Update Failed');
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-1">
            Financial & Invoicing Ledger
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
            Bookings Ledger
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor client payments, confirm pending itineraries, and handle cancellations.
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => showToast('info', 'Exporting bookings ledger CSV...', 'Export')}
          icon={<Download className="w-4 h-4" />}
          className="rounded-xl"
        >
          <span>Export Ledger</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search traveler, tour, or booking code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500">Status:</span>
          {(['All', 'Confirmed', 'Pending', 'Cancelled'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                statusFilter === st
                  ? 'bg-navy-950 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <LoadingState message="Loading client bookings from ledger..." />
      ) : errorMessage ? (
        <div className="bg-red-50/70 border border-red-200 rounded-3xl p-8 text-center max-w-lg mx-auto">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">Error loading bookings</h3>
          <p className="text-xs text-slate-600 mt-1 mb-5">{errorMessage}</p>
          <Button variant="primary" onClick={fetchBookings} className="rounded-xl inline-flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </Button>
        </div>
      ) : filteredBookings.length === 0 ? (
        <EmptyState
          title={searchQuery || statusFilter !== 'All' ? 'No matching bookings' : 'No bookings in ledger'}
          description={
            searchQuery || statusFilter !== 'All'
              ? 'Try adjusting your search query or status filter.'
              : 'Bookings initiated by travelers will appear in this ledger.'
          }
          action={
            searchQuery || statusFilter !== 'All' ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('All');
                }}
                className="rounded-xl"
              >
                Reset filters
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Booking Code</th>
                  <th className="px-6 py-4">Traveler</th>
                  <th className="px-6 py-4">Tour Package</th>
                  <th className="px-6 py-4">Service</th>
                  <th className="px-6 py-4">Departure Date</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredBookings.map((b) => {
                  let badge = <Badge variant="success">Confirmed</Badge>;
                  if (b.status === 'Pending') badge = <Badge variant="warning">Pending</Badge>;
                  if (b.status === 'Cancelled') badge = <Badge variant="danger">Cancelled</Badge>;

                  return (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-700">
                        {b.bookingCode}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{b.traveler}</div>
                        <div className="text-[11px] text-slate-400">{b.travelerEmail}</div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        {b.tour}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {b.service}
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {b.date}
                      </td>
                      <td className="px-6 py-4 font-bold text-navy-950 text-sm">
                        {b.amount}
                      </td>
                      <td className="px-6 py-4">
                        {badge}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {b.status === 'Pending' && (
                          <button
                            onClick={() => handleUpdateBookingStatus(b.id, 'Confirmed')}
                            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 cursor-pointer"
                          >
                            Confirm
                          </button>
                        )}
                        {b.status === 'Confirmed' && (
                          <button
                            onClick={() => handleUpdateBookingStatus(b.id, 'Cancelled')}
                            className="text-xs font-semibold text-rose-500 hover:text-rose-700 cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          onClick={() => showToast('info', `Receipt for ${b.bookingCode} generated`, 'Receipt')}
                          className="text-xs font-semibold text-brand-600 hover:underline cursor-pointer"
                        >
                          Receipt
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
