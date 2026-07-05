import { useNavigate } from "react-router-dom";
import { useUser } from "../context/UserContext";
import api from "../lib/axios";

export function useLogout() {
  const { setUser } = useUser();
  const navigate = useNavigate();

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      navigate("/login");
    }
  };

  return logout;
}