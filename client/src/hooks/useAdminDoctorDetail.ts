import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { adminDoctorService } from "../services/adminDoctorService";
import { QUERY_KEYS } from "../constants/queryKeys";

export const useAdminDoctorDetail = (doctorUserId: string | undefined) => {
  return useQuery({
    queryKey: QUERY_KEYS.adminDoctorDetail(doctorUserId ?? "unknown"),
    queryFn: () => adminDoctorService.getDoctorDetail(doctorUserId ?? ""),
    enabled: Boolean(doctorUserId),
    staleTime: 5 * 60 * 1000,
  });
};

export const useDoctorVerificationActions = (doctorUserId: string | undefined) => {
  const queryClient = useQueryClient();

  const invalidateDoctor = async () => {
    if (!doctorUserId) return;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.adminDoctorDetail(doctorUserId) }),
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.adminUsers] }),
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.userStats] }),
    ]);
  };

  const verifyDoctor = useMutation({
    mutationFn: (doctorProfileId: string) => adminDoctorService.verifyDoctor(doctorProfileId),
    onSuccess: async () => {
      toast.success("Doctor verified successfully");
      await invalidateDoctor();
    },
    onError: () => {
      toast.error("Could not verify this doctor. Please try again.");
    },
  });

  const rejectDoctor = useMutation({
    mutationFn: ({ doctorProfileId, reason }: { doctorProfileId: string; reason: string }) =>
      adminDoctorService.rejectDoctor(doctorProfileId, reason),
    onSuccess: async () => {
      toast.success("Doctor rejected successfully");
      await invalidateDoctor();
    },
    onError: () => {
      toast.error("Could not reject this doctor. Please try again.");
    },
  });

  return { verifyDoctor, rejectDoctor };
};
