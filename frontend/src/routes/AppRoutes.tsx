import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import { TravelerLayout } from '../layouts/TravelerLayout';
import { AgentLayout } from '../layouts/AgentLayout';

// Route Guards
import { ProtectedRoute } from './ProtectedRoute';
import { PublicRoute } from './PublicRoute';

// Public Pages
import { LandingPage } from '../pages/public/LandingPage';
import { EnterPage } from '../pages/public/EnterPage';

// Traveler Pages
import { TravelerAuthPage } from '../pages/traveler/TravelerAuthPage';
import { TravelerOnboardingPage } from '../pages/traveler/TravelerOnboardingPage';
import { TravelerDashboardPage } from '../pages/traveler/TravelerDashboardPage';
import { TravelerExplorePage } from '../pages/traveler/TravelerExplorePage';
import { TravelerTripsPage } from '../pages/traveler/TravelerTripsPage';
import { TravelerNewTripPage } from '../pages/traveler/TravelerNewTripPage';
import { TravelerProfilePage } from '../pages/traveler/TravelerProfilePage';
import { AiTripCopilotPage } from '../pages/traveler/AiTripCopilotPage';
import { TravelerBillingPage } from '../pages/traveler/TravelerBillingPage';

// Agent Pages
import { AgentAuthPage } from '../pages/agent/AgentAuthPage';
import { AgentDashboardPage } from '../pages/agent/AgentDashboardPage';
import { AgentTravelersPage } from '../pages/agent/AgentTravelersPage';
import { AgentToursPage } from '../pages/agent/AgentToursPage';
import { AgentBookingsPage } from '../pages/agent/AgentBookingsPage';
import { AgentSchedulesPage } from '../pages/agent/AgentSchedulesPage';
import { AgentVendorsPage } from '../pages/agent/AgentVendorsPage';
import { AgentNotificationsPage } from '../pages/agent/AgentNotificationsPage';
import { AgentSettingsPage } from '../pages/agent/AgentSettingsPage';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/enter" element={<EnterPage />} />

      {/* Traveler Auth */}
      <Route
        path="/user/auth"
        element={
          <PublicRoute restrictForRole="traveler">
            <TravelerAuthPage />
          </PublicRoute>
        }
      />

      {/* Traveler Onboarding (protected, but onboarding not yet completed) */}
      <Route
        path="/user/onboarding"
        element={
          <ProtectedRoute allowedRole="traveler" requireOnboarding={false}>
            <TravelerOnboardingPage />
          </ProtectedRoute>
        }
      />

      {/* Protected Traveler Portal (requires onboarding completed) */}
      <Route
        path="/user"
        element={
          <ProtectedRoute allowedRole="traveler" requireOnboarding={true}>
            <TravelerLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/user/dashboard" replace />} />
        <Route path="dashboard" element={<TravelerDashboardPage />} />
        <Route path="explore" element={<TravelerExplorePage />} />
        <Route path="ai-trip-copilot" element={<AiTripCopilotPage />} />
        <Route path="trips" element={<TravelerTripsPage />} />
        <Route path="trips/new" element={<TravelerNewTripPage />} />
        <Route path="profile" element={<TravelerProfilePage />} />
        <Route path="billing" element={<TravelerBillingPage />} />
      </Route>

      {/* Agent Auth */}
      <Route
        path="/agent/auth"
        element={
          <PublicRoute restrictForRole="agent">
            <AgentAuthPage />
          </PublicRoute>
        }
      />

      {/* Protected Agent Operations Command Portal */}
      <Route
        path="/agent"
        element={
          <ProtectedRoute allowedRole="agent">
            <AgentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/agent/dashboard" replace />} />
        <Route path="dashboard" element={<AgentDashboardPage />} />
        <Route path="travelers" element={<AgentTravelersPage />} />
        <Route path="tours" element={<AgentToursPage />} />
        <Route path="bookings" element={<AgentBookingsPage />} />
        <Route path="schedules" element={<AgentSchedulesPage />} />
        <Route path="vendors" element={<AgentVendorsPage />} />
        <Route path="notifications" element={<AgentNotificationsPage />} />
        <Route path="settings" element={<AgentSettingsPage />} />
      </Route>

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
