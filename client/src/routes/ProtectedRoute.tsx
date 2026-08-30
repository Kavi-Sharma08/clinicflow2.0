import { Navigate, useParams } from "react-router-dom";
import { useUser } from "../context/UserContext";
import Loader from "../components/common/Loader";
import { resolveOnboardingRedirect } from "./resolveOnboardingRedirect";
import AccessDenied from "../components/common/AccessDenied";
import type { UserRole } from "../types/role.types";

type ProtectedRouteProps = {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
};

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, loading } = useUser();
  const { id: routeId } = useParams();

  if (loading) {
    return <Loader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const decision = resolveOnboardingRedirect(user, "dashboard");
  if (decision.action === "redirect") {
    return <Navigate to={decision.to} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <AccessDenied />;
  }

  if (routeId && routeId !== user.id) {
    return <Navigate to={`/${user.role.toLowerCase()}/dashboard/${user.id}`} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;