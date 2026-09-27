import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/agent/StatCard';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { UpcomingTourSummary, AgentActivity, OperationalAlert, AgentStats } from '../../types/agent';
import { getTourSummaries } from '../../services/tours';
import { getAgentActivities, getOperationalAlerts } from '../../services/notifications';
import { getAgentStats } from '../../services/agent-stats';
import {
  Users,
  Map,
  CalendarCheck,
  AlertCircle,
  ArrowRight,
  AlertTriangle,
  Clock,
  Sparkles,
  Calendar
} from 'lucide-react';

export const AgentDashboardPage: React.FC = () => {
  const { agent } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<AgentStats>({
    activeTravelers: 128,
    activeTours: 24,
    upcomingTours: 11,
    pendingActions: 7,
  });
  const [tours, setTours] = useState<UpcomingTourSummary[]>([]);
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [alerts, setAlerts] = useState<OperationalAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [sData, tData, actData, alData] = await Promise.all([
        getAgentStats().catch(() => ({
          activeTravelers: 128,
          activeTours: 24,
          upcomingTours: 11,
          pendingActions: 7,
        })),
        getTourSummaries().catch(() => []),
        getAgentActivities().catch(() => []),
        getOperationalAlerts().catch(() => []),
      ]);
      setStats(sData);
      setTours(tData);
      setActivities(actData);
      setAlerts(alData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className="space-y-8 pb-12">
      {/* Top Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold uppercase tracking-wider mb-2 border border-amber-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Operations Command Center
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-navy-950 tracking-tight">
            Good morning, {agent?.name || 'Alex Vance'}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Agency: <strong className="font-semibold text-slate-800">{agent?.agencyName || 'Voyagar Luxury Expeditions'}</strong> • {stats.activeTours} active departures in transit.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/agent/schedules')}
            className="rounded-xl"
            icon={<Calendar className="w-4 h-4" />}
          >
            <span>Live Schedules</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/agent/tours')}
            className="rounded-xl bg-navy-900 hover:bg-navy-800"
          >
            <span>+ Create Tour</span>
          </Button>
        </div>
      </div>

      {/* STATS ROW (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Active Travelers"
          value={String(stats.activeTravelers)}
          subtext="Across active itineraries"
          trend={{ value: '12% this month', isPositive: true }}
          icon={<Users className="w-6 h-6 text-brand-600" />}
          accentColor="blue"
        />

        <StatCard
          title="Active Tours"
          value={String(stats.activeTours)}
          subtext="Currently running in field"
          trend={{ value: '3 new this week', isPositive: true }}
          icon={<Map className="w-6 h-6 text-emerald-600" />}
          accentColor="emerald"
        />

        <StatCard
          title="Upcoming Tours"
          value={String(stats.upcomingTours)}
          subtext="Departing in next 14 days"
          icon={<CalendarCheck className="w-6 h-6 text-amber-600" />}
          accentColor="amber"
        />

        <StatCard
          title="Pending Actions"
          value={String(stats.pendingActions)}
          subtext="Requires approval or review"
          trend={{ value: 'Real-time sync', isPositive: false }}
          icon={<AlertCircle className="w-6 h-6 text-purple-600" />}
          accentColor="purple"
        />
      </div>

      {/* TWO COLUMN GRID: Upcoming Tours Table (8 cols) + Alerts & Recent Activity (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Upcoming Tours Table */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-navy-950">Upcoming Tours</h3>
                <p className="text-xs text-slate-500 mt-0.5">Departures scheduled for the immediate upcoming cycle</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/agent/tours')}
                className="text-xs font-semibold text-brand-600 cursor-pointer"
              >
                <span>View All Tours</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3.5">Tour</th>
                    <th className="px-6 py-3.5">Traveler</th>
                    <th className="px-6 py-3.5">Destination</th>
                    <th className="px-6 py-3.5">Dates</th>
                    <th className="px-6 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {loading && tours.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-400">
                        Loading upcoming tour departures...
                      </td>
                    </tr>
                  ) : tours.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-400">
                        No upcoming tours scheduled.
                      </td>
                    </tr>
                  ) : (
                    tours.map((item) => {
                      let statusBadge = <Badge variant="success">Confirmed</Badge>;
                      if (item.status === 'Planning' || item.status === 'In Progress') {
                        statusBadge = <Badge variant="warning">{item.status}</Badge>;
                      } else if (item.status === 'Cancelled') {
                        statusBadge = <Badge variant="danger">Cancelled</Badge>;
                      }

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-900">
                            {item.tour}
                          </td>
                          <td className="px-6 py-4 text-slate-700 font-medium">
                            {item.traveler}
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {item.destination}
                          </td>
                          <td className="px-6 py-4 text-slate-500 font-medium">
                            {item.dates}
                          </td>
                          <td className="px-6 py-4">
                            {statusBadge}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div
              onClick={() => navigate('/agent/bookings')}
              className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-brand-500 transition-all cursor-pointer group"
            >
              <div className="text-xs font-bold text-brand-600 uppercase mb-1">Bookings Ledger</div>
              <div className="text-base font-bold text-navy-950">Review Invoices & Payments</div>
              <p className="text-xs text-slate-500 mt-1">Confirmed, pending, and refunded transactions.</p>
            </div>

            <div
              onClick={() => navigate('/agent/schedules')}
              className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-amber-500 transition-all cursor-pointer group"
            >
              <div className="text-xs font-bold text-amber-600 uppercase mb-1">Live Transfers</div>
              <div className="text-base font-bold text-navy-950">Chauffeur & Airport Fleet</div>
              <p className="text-xs text-slate-500 mt-1">Real-time driver assignments and flight gates.</p>
            </div>

            <div
              onClick={() => navigate('/agent/vendors')}
              className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-emerald-500 transition-all cursor-pointer group"
            >
              <div className="text-xs font-bold text-emerald-600 uppercase mb-1">Vendor Network</div>
              <div className="text-base font-bold text-navy-950">Hotels & Excursions</div>
              <p className="text-xs text-slate-500 mt-1">Verified partner listings with instant rates.</p>
            </div>
          </div>
        </div>

        {/* Right: Operational Alerts & Recent Activity */}
        <div className="lg:col-span-4 space-y-6">
          {/* Alerts Section */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-navy-950 uppercase tracking-wider">Operational Alerts</h3>
              </div>
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            </div>

            <div className="space-y-3">
              {alerts.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">No active operational alerts.</p>
              ) : (
                alerts.map((alert) => {
                  let badgeVariant: 'danger' | 'warning' | 'neutral' = 'neutral';
                  if (alert.urgency === 'high') badgeVariant = 'danger';
                  if (alert.urgency === 'medium') badgeVariant = 'warning';

                  return (
                    <div
                      key={alert.id}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-navy-950">{alert.title}</span>
                        <Badge variant={badgeVariant} size="sm" className="uppercase text-[9px]">
                          {alert.urgency}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {alert.description}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* Recent Activity */}
          <Card className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <h3 className="text-sm font-bold text-navy-950 uppercase tracking-wider">Recent Activity</h3>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {activities.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">No recent activity recorded.</p>
              ) : (
                activities.map((act) => (
                  <div key={act.id} className="flex gap-3">
                    <span className="w-2 h-2 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-slate-900">{act.title}</p>
                      <p className="text-slate-500 text-[11px] mt-0.5 leading-relaxed">{act.description}</p>
                      <span className="text-[10px] text-slate-400 font-semibold mt-1 block">{act.timeAgo}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
