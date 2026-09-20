import { Navigate, Outlet } from "react-router-dom";
import { getStoredAuth, hasRole } from "../utils/auth";

function ProtectedRoute({ allowedRoles }) {
  const { isValid } = getStoredAuth();

  if (!isValid) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !hasRole(...allowedRoles)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
