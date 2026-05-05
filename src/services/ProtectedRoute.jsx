// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ element, allowedRoles = [], userRoles = {} }) => {
  const hasAccess = allowedRoles.some((role) => userRoles[role]);
  return hasAccess ? element : <Navigate to="/unauthorized" />;
};

export default ProtectedRoute;
