import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { io, type Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useUser } from "./UserContext";
import type { ClinicNotification } from "../types/notification.types";

interface RealtimeContextValue {
  socket: Socket | null;
}

const RealtimeContext = createContext<RealtimeContextValue | undefined>(undefined);

const getSocketOrigin = () => {
  const configured = import.meta.env.VITE_SOCKET_URL as string | undefined;
  if (configured) return configured;
  if (import.meta.env.DEV) return "http://localhost:3000";
  return window.location.origin;
};

export const RealtimeProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const queryClient = useQueryClient();

  const socket = useMemo(() => {
    if (!user) return null;
    return io(getSocketOrigin(), {
      withCredentials: true,
      auth: { userId: user.id, role: user.role },
      transports: ["websocket", "polling"],
    });
  }, [user]);

  useEffect(() => {
    if (!socket || !user) return undefined;

    const handleNotification = (payload: ClinicNotification) => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["patient-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["doctor-dashboard"] });
      toast(payload.title, { icon: payload.priority === "HIGH" ? "🔔" : "•" });
    };

    const handleQueueUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["doctor-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["patient-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["patient-dashboard"] });
    };

    socket.on("notification:new", handleNotification);
    socket.on("queue:updated", handleQueueUpdated);

    return () => {
      socket.off("notification:new", handleNotification);
      socket.off("queue:updated", handleQueueUpdated);
      socket.disconnect();
    };
  }, [queryClient, socket, user]);

  const value = useMemo(() => ({ socket }), [socket]);
  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
};

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) throw new Error("useRealtime must be used within RealtimeProvider");
  return context;
};
