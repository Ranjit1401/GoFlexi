import React, { useState, useEffect, useCallback } from 'react';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  dismissNotification as apiDismissNotification,
} from '../../services/notifications';
import { AgentNotification } from '../../types/agent';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { LoadingState } from '../../components/ui/LoadingState';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../context/ToastContext';
import {
  Bell,
  CheckCircle2,
  CreditCard,
  UserCheck,
  AlertTriangle,
  Clock,
  Trash2,
  RefreshCw,
} from 'lucide-react';

export const AgentNotificationsPage: React.FC = () => {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<AgentNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('All');

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch (err) {
      console.error('Failed to load notifications:', err);
      setErrorMessage('Unable to load operational notifications. Please verify your connection.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const filteredNotifs =
    filterCategory === 'All'
      ? notifications
      : notifications.filter((n) => n.category === filterCategory);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      showToast('success', 'All operational alerts marked as read.');
    } catch (err) {
      console.error('Failed to mark all read:', err);
      showToast('error', 'Could not mark all notifications as read.');
    }
  };

  const handleToggleRead = async (id: string, currentRead: boolean) => {
    const nextRead = !currentRead;
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: nextRead } : n))
    );

    try {
      await markNotificationRead(id, nextRead);
    } catch (err) {
      console.error('Failed to update notification read status:', err);
      // Revert on failure
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: currentRead } : n))
      );
      showToast('error', 'Failed to update notification status.');
    }
  };

  const handleDismiss = async (id: string) => {
    const backup = [...notifications];
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    try {
      await apiDismissNotification(id);
      showToast('info', 'Notification dismissed.');
    } catch (err) {
      console.error('Failed to dismiss notification:', err);
      setNotifications(backup);
      showToast('error', 'Failed to dismiss notification.');
    }
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

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchNotifications}
            className="rounded-xl"
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            <span>Refresh</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            disabled={notifications.length === 0 || !notifications.some((n) => !n.read)}
            className="rounded-xl"
            icon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
          >
            <span>Mark All Read</span>
          </Button>
        </div>
      </div>

      {/* Error state */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0" />
            <p className="text-sm font-medium">{errorMessage}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={fetchNotifications}>
            Retry
          </Button>
        </div>
      )}

      {/* Categories */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        {['All', 'New booking', 'Traveler request', 'Schedule update', 'Pending approval'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
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
        {isLoading && notifications.length === 0 ? (
          <LoadingState message="Loading operational notifications..." />
        ) : filteredNotifs.length === 0 ? (
          <EmptyState
            icon={<Bell className="w-7 h-7 text-amber-500" />}
            title={filterCategory === 'All' ? 'No notifications' : `No ${filterCategory} notifications`}
            description="All operational items in this filter are currently clear and up to date."
            action={
              filterCategory !== 'All' ? (
                <Button variant="secondary" size="sm" onClick={() => setFilterCategory('All')}>
                  View All Notifications
                </Button>
              ) : undefined
            }
          />
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

                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-3 text-xs">
                    <button
                      onClick={() => handleToggleRead(item.id, item.read)}
                      className="font-semibold text-slate-500 hover:text-slate-900 cursor-pointer"
                    >
                      {item.read ? 'Mark Unread' : 'Mark as Read'}
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      onClick={() => showToast('info', `Action handled for: ${item.title}`)}
                      className="font-bold text-brand-600 hover:underline cursor-pointer"
                    >
                      Take Action
                    </button>
                  </div>

                  <button
                    onClick={() => handleDismiss(item.id)}
                    title="Dismiss notification"
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
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
