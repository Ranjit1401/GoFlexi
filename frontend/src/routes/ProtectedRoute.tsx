import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole: Role;
  requireOnboarding?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRole,
  requireOnboarding = true
}) => {
  const { role, isAuthenticated, onboardingCompleted, authLoading } = useAuth();
  const location = useLocation();

  // While the session is being restored from the backend/JWT, block rendering
  // so we never briefly expose (or block) protected routes on stale localStorage.
  if (authLoading) {
    return null;
  }

  // Authentication state is sourced exclusively from the JWT-validated session.
  if (!isAuthenticated || role !== allowedRole) {
    const redirectPath = allowedRole === 'agent' ? '/agent/auth' : '/user/auth';
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // If user is traveler, check onboarding status
  if (allowedRole === 'traveler' && requireOnboarding && !onboardingCompleted) {
    if (location.pathname !== '/user/onboarding') {
      return <Navigate to="/user/onboarding" replace />;
    }
  }

  return <>{children}</>;
};
