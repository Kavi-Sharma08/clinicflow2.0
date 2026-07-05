import { Navigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import Loader from "../components/common/Loader";

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
    return <Navigate to={`/${user.role.toLowerCase()}/dashboard/${user.id}`} replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;