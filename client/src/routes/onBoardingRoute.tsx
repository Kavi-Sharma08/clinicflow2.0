import { Navigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import Loader from "../components/common/Loader";
import { resolveOnboardingRedirect } from "./resolveOnboardingRedirect";

type OnboardingRouteProps = {
  children: React.ReactNode;
  destination: "verification" | "status";
};

const OnboardingRoute = ({ children, destination }: OnboardingRouteProps) => {
  const { user, loading } = useUser();

  if (loading) {
    return <Loader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const decision = resolveOnboardingRedirect(user, destination);
  if (decision.action === "redirect") {
    return <Navigate to={decision.to} replace />;
  }

  return <>{children}</>;
};

export default OnboardingRoute;