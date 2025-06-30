// RouteGuard.js
import { Navigate, useLocation } from "react-router-dom";
import { Fragment } from "react";

function RouteGuard({ authenticated, user, element, allowedRoles, loading }) {
  const location = useLocation();

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  // If not authenticated and trying to access protected route, redirect to auth with return location
  if (!authenticated && !location.pathname.includes("/auth")) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If authenticated but trying to access auth page, redirect based on role
  if (authenticated && location.pathname.includes("/auth")) {
    return <Navigate to={getDefaultRoute(user?.role)} state={{ from: location }} replace />;
  }

  // Check if user has permission to access the route
  if (authenticated) {
    const userRole = user?.role;
    const path = location.pathname;

    // Admin can access everything except student/staff specific routes if not allowed
    if (userRole === "admin") {
      if (path.includes("/student") && !allowedRoles?.includes("admin")) {
        return <Navigate to="/admin" replace />;
      }
      if (path.includes("/guide") && !allowedRoles?.includes("admin")) {
        return <Navigate to="/admin" replace />;
      }
    }
    // Staff can only access staff routes
    else if (userRole === "staff") {
      if (!path.includes("/guide") || !allowedRoles?.includes("staff")) {
        return <Navigate to="/guide" replace />;
      }
    }
    // Student can only access student routes
    else if (userRole === "student") {
      if (!path.includes("/student") || !allowedRoles?.includes("student")) {
        return <Navigate to="/student" replace />;
      }
    }
    // Unknown role - handle appropriately (maybe logout)
    else {
      return <Navigate to="/auth" replace />;
    }
  }

  return <Fragment>{element}</Fragment>;
}

// Helper function to get default route based on role
function getDefaultRoute(role) {
  switch (role) {
    case "admin":
      return "/admin";
    case "staff":
      return "/guide";
    case "student":
      return "/student";
    default:
      return "/auth";
  }
}

export default RouteGuard;