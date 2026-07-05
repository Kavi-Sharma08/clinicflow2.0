import { useMutation } from "@tanstack/react-query";
import { doctorVerificationService, type SubmitDoctorVerificationPayload } from "../services/doctorVerificationService";

export const useSubmitDoctorVerification = () => {
  return useMutation({
    mutationFn: (payload: SubmitDoctorVerificationPayload) => doctorVerificationService.submitVerification(payload),
  });
};
