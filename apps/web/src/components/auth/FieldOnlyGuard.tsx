import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

/**
 * FieldOnlyGuard
 *
 * This guard ensures that users who are meant to only have access to the field module
 * (like Operators or Residents) cannot access global organizational routes like Dashboard,
 * Projects list, Settings, etc.
 *
 * If a strictly field-only user accesses an unauthorized route, they are redirected
 * to the field dashboard of their first assigned project.
 */
export const FieldOnlyGuard: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 1. Identify if the user is a Global Admin/Owner. They can access everything.
  const isGlobalStaff = ['ADMIN', 'ORG_ADMIN', 'PLATFORM_ADMIN'].includes(user.role);

  // 2. Identify if the user has ONLY field roles across all their projects.
  // We consider "Field Roles" to be FIELD_OPERATOR and RESIDENTE (assuming FIELD_OPERATOR is the canonical one for UAT)
  const isStrictlyFieldUser =
    !isGlobalStaff &&
    user.projectMembers &&
    user.projectMembers.length > 0 &&
    user.projectMembers.every((m) => ['FIELD_OPERATOR', 'RESIDENTE'].includes(m.role));

  // 3. Logic: If strictly field user, they can ONLY access /field/*
  const isAllowedPath = location.pathname.startsWith('/field');

  if (isStrictlyFieldUser && !isAllowedPath) {
    // Redirect to the field dashboard
    return <Navigate to="/field/today" replace />;
  }

  return <>{children}</>;
};
