import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import Loader from "../components/common/Loader";
import { getRoleDefaultPath } from "./resolveOnboardingRedirect";

type PublicRouteProps = {
  children: ReactNode;
  restrictAuthenticated?: boolean;
};

const PublicRoute = ({ children, restrictAuthenticated = true }: PublicRouteProps) => {
  const { user, loading } = useUser();

  if (loading) {
    return <Loader />;
  }

  if (restrictAuthenticated && user) {
    return <Navigate to={getRoleDefaultPath(user)} replace />;
  }

  return <>{children}</>;
};

export default PublicRoute;
