import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types/auth';

interface PublicRouteProps {
  children: React.ReactNode;
  restrictForRole?: Role;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({
  children,
  restrictForRole
}) => {
  const { role, isAuthenticated, onboardingCompleted, authLoading } = useAuth();

  // Wait for the JWT-validated session to settle before deciding redirects.
  if (authLoading) {
    return null;
  }

  if (isAuthenticated && role === restrictForRole) {
    if (role === 'traveler') {
      return <Navigate to={onboardingCompleted ? '/user/dashboard' : '/user/onboarding'} replace />;
    }
    if (role === 'agent') {
      return <Navigate to="/agent/dashboard" replace />;
    }
  }

  return <>{children}</>;
};
