import { Navigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import Loader from "../components/common/Loader";
import AccessDenied from "../components/common/AccessDenied";

type AdminRouteProps = {
  children: React.ReactNode;
};

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { user, loading } = useUser();

  if (loading) {
    return <Loader />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "ADMIN") {
    return <AccessDenied />;
  }

  return <>{children}</>;
};

export default AdminRoute;