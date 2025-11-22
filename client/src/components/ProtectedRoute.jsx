// client/src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token"); // or however you store JWT

  if (!token) {
    // if no token, redirect to login
    return <Navigate to="/login" replace />;
  }

  // if logged in, show the page
  return children;
}
