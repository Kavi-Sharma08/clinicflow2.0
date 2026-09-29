import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { io, type Socket } from "socket.io-client";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useUser } from "./UserContext";
import type { ClinicNotification } from "../types/notification.types";
import { getSocketUrl } from "../config/env";

interface RealtimeContextValue {
  socket: Socket | null;
  joinQueueRoom: (doctorId: string, date: string) => void;
  leaveQueueRoom: (doctorId: string, date: string) => void;
}

const RealtimeContext = createContext<RealtimeContextValue | undefined>(undefined);

export const RealtimeProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useUser();
  const queryClient = useQueryClient();

  const socket = useMemo(() => {
    if (!user) return null;
    return io(getSocketUrl(), {
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
      queryClient.invalidateQueries({ queryKey: ["doctor-live-queue"] });
      queryClient.invalidateQueries({ queryKey: ["patient-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["patient-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["patient-queue-status"] });
      queryClient.invalidateQueries({ queryKey: ["admin-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-appointment-stats"] });
    };

    const handleRescheduleUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ["admin-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-appointment-stats"] });
      queryClient.invalidateQueries({ queryKey: ["admin-reschedule-requests"] });
      queryClient.invalidateQueries({ queryKey: ["patient-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["patient-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["doctor-appointments"] });
      queryClient.invalidateQueries({ queryKey: ["doctor-live-queue"] });
    };

    const handleSnapshot = () => {
      queryClient.invalidateQueries({ queryKey: ["doctor-live-queue"] });
      queryClient.invalidateQueries({ queryKey: ["patient-queue-status"] });
      queryClient.invalidateQueries({ queryKey: ["admin-appointments"] });
    };

    socket.on("notification:new", handleNotification);
    socket.on("queue:updated", handleQueueUpdated);
    socket.on("queue:snapshot", handleSnapshot);
    socket.on("queue:patient-started", handleQueueUpdated);
    socket.on("queue:patient-completed", handleQueueUpdated);
    socket.on("queue:patient-no-show", handleQueueUpdated);
    socket.on("queue:patient-cancelled", handleQueueUpdated);
    socket.on("appointment:updated", handleQueueUpdated);
    socket.on("appointment:no_show", handleQueueUpdated);
    socket.on("appointment:rescheduled", handleRescheduleUpdated);
    socket.on("reschedule:requested", handleRescheduleUpdated);
    socket.on("reschedule:approved", handleRescheduleUpdated);
    socket.on("reschedule:rejected", handleRescheduleUpdated);

    return () => {
      socket.off("notification:new", handleNotification);
      socket.off("queue:updated", handleQueueUpdated);
      socket.off("queue:snapshot", handleSnapshot);
      socket.off("queue:patient-started", handleQueueUpdated);
      socket.off("queue:patient-completed", handleQueueUpdated);
      socket.off("queue:patient-no-show", handleQueueUpdated);
      socket.off("queue:patient-cancelled", handleQueueUpdated);
      socket.off("appointment:updated", handleQueueUpdated);
      socket.off("appointment:no_show", handleQueueUpdated);
      socket.off("appointment:rescheduled", handleRescheduleUpdated);
      socket.off("reschedule:requested", handleRescheduleUpdated);
      socket.off("reschedule:approved", handleRescheduleUpdated);
      socket.off("reschedule:rejected", handleRescheduleUpdated);
      socket.disconnect();
    };
  }, [queryClient, socket, user]);

  const joinQueueRoom = (doctorId: string, date: string) => {
    socket?.emit("queue:join", { doctorId, date });
  };

  const leaveQueueRoom = (doctorId: string, date: string) => {
    socket?.emit("queue:leave", { doctorId, date });
  };

  const value = useMemo(() => ({ socket, joinQueueRoom, leaveQueueRoom }), [socket]);
  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
};

export const useRealtime = () => {
  const context = useContext(RealtimeContext);
  if (!context) throw new Error("useRealtime must be used within RealtimeProvider");
  return context;
};
