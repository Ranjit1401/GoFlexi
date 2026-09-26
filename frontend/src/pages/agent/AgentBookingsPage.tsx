import React, { useState, useMemo } from 'react';
import { mockBookings } from '../../data/bookings';
import { Booking } from '../../types/agent';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';
import { CreditCard, Search, Filter, Download, CheckCircle2, XCircle, Clock } from 'lucide-react';

export const AgentBookingsPage: React.FC = () => {
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>(mockBookings);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

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

  const updateBookingStatus = (id: string, newStatus: Booking['status']) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status: newStatus } : b))
    );
    showToast('success', `Booking status updated to ${newStatus}`);
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
          onClick={() => showToast('info', 'Exporting bookings ledger CSV...')}
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

      {/* Bookings Table */}
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
                          onClick={() => updateBookingStatus(b.id, 'Confirmed')}
                          className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                        >
                          Confirm
                        </button>
                      )}
                      {b.status === 'Confirmed' && (
                        <button
                          onClick={() => updateBookingStatus(b.id, 'Cancelled')}
                          className="text-xs font-semibold text-rose-500 hover:text-rose-700"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        onClick={() => showToast('info', `Receipt for ${b.bookingCode} downloaded`)}
                        className="text-xs font-semibold text-brand-600 hover:underline"
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
    </div>
  );
};
