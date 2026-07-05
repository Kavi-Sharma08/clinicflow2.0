import { Navigate, useParams } from "react-router-dom";
import { useUser } from "../context/UserContext";
import Loader from "../components/common/Loader";
import { resolveOnboardingRedirect } from "./resolveOnboardingRedirect";

type ProtectedRouteProps = {
  children: React.ReactNode;
};

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
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

  if (routeId && routeId !== user.id) {
    return <Navigate to={`/${user.role.toLowerCase()}/dashboard/${user.id}`} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;