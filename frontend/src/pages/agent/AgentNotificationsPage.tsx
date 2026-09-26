import React, { useState } from 'react';
import { mockNotifications } from '../../data/notifications';
import { AgentNotification } from '../../types/agent';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';
import {
  Bell,
  CheckCircle2,
  Calendar,
  CreditCard,
  UserCheck,
  AlertTriangle,
  Clock,
  Trash2
} from 'lucide-react';

export const AgentNotificationsPage: React.FC = () => {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<AgentNotification[]>(mockNotifications);
  const [filterCategory, setFilterCategory] = useState<string>('All');

  const filteredNotifs = filterCategory === 'All'
    ? notifications
    : notifications.filter((n) => n.category === filterCategory);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    showToast('success', 'All operational alerts marked as read.');
  };

  const toggleRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n))
    );
  };

  const getCategoryBadge = (category: AgentNotification['category']) => {
    switch (category) {
      case 'New booking':
        return <Badge variant="success" size="sm">New Booking</Badge>;
      case 'Traveler request':
        return <Badge variant="primary" size="sm">Traveler Request</Badge>;
      case 'Schedule update':
        return <Badge variant="warning" size="sm">Schedule Update</Badge>;
      case 'Pending approval':
      default:
        return <Badge variant="danger" size="sm">Pending Approval</Badge>;
    }
  };

  const getCategoryIcon = (category: AgentNotification['category']) => {
    switch (category) {
      case 'New booking':
        return <CreditCard className="w-5 h-5 text-emerald-600" />;
      case 'Traveler request':
        return <UserCheck className="w-5 h-5 text-brand-600" />;
      case 'Schedule update':
        return <Clock className="w-5 h-5 text-amber-600" />;
      case 'Pending approval':
      default:
        return <AlertTriangle className="w-5 h-5 text-rose-600" />;
    }
  };

  return (
    <div className="space-y-8 pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-1">
            Dispatch Center
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
            Operational Notifications
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time feed of traveler requests, schedule modifications, and partner confirmations.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={markAllRead}
          className="rounded-xl"
          icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
        >
          <span>Mark All Read</span>
        </Button>
      </div>

      {/* Categories */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {['All', 'New booking', 'Traveler request', 'Schedule update', 'Pending approval'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterCategory === cat
                ? 'bg-navy-950 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div className="space-y-3.5">
        {filteredNotifs.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center">
            <Bell className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No notifications in this filter.</h3>
            <p className="text-xs text-slate-500 mt-1">All operational items are currently clear.</p>
          </div>
        ) : (
          filteredNotifs.map((item) => (
            <div
              key={item.id}
              className={`p-5 rounded-2xl border transition-all duration-200 flex items-start gap-4 ${
                item.read
                  ? 'bg-white border-slate-200/80 opacity-75'
                  : 'bg-white border-brand-200/80 shadow-card ring-1 ring-brand-500/10'
              }`}
            >
              <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                {getCategoryIcon(item.category)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-navy-950">{item.title}</h3>
                    {getCategoryBadge(item.category)}
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">{item.time}</span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed mb-3">
                  {item.message}
                </p>

                <div className="flex items-center gap-3 text-xs">
                  <button
                    onClick={() => toggleRead(item.id)}
                    className="font-semibold text-slate-500 hover:text-slate-900"
                  >
                    {item.read ? 'Mark Unread' : 'Mark as Read'}
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    onClick={() => showToast('info', `Action taken for: ${item.title}`)}
                    className="font-bold text-brand-600 hover:underline"
                  >
                    Take Action
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
