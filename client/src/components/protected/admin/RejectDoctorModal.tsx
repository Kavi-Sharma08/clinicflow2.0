import { useForm } from "react-hook-form";
import Modal from "../../common/Modal";
import CustomButton from "../../custom-fields/CustomButton";

interface RejectDoctorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReject: (reason: string) => void;
  isSubmitting: boolean;
}

interface RejectFormValues {
  reason: string;
}

const RejectDoctorModal = ({ isOpen, onClose, onReject, isSubmitting }: RejectDoctorModalProps) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RejectFormValues>({ defaultValues: { reason: "" } });

  const onSubmit = (data: RejectFormValues) => {
    onReject(data.reason.trim());
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Modal.Header>Reject doctor profile</Modal.Header>

        <Modal.Body>
          <label className="mb-2 block text-sm font-semibold text-gray-950">Reason</label>
          <textarea
            {...register("reason", {
              required: "Tell the doctor what needs to be fixed.",
              minLength: {
                value: 10,
                message: "Give a bit more detail so the doctor can act on it.",
              },
            })}
            rows={4}
            className="w-full rounded-xl border border-gray-200 p-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="Example: The registration document is not readable. Please upload a clearer copy."
          />
          {errors.reason && <p className="mt-2 text-xs font-medium text-rose-600">{errors.reason.message}</p>}
        </Modal.Body>

        <Modal.Footer>
          <CustomButton variant="secondary" type="button" fullWidth={false} className="rounded-xl px-5" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </CustomButton>
          <CustomButton variant="danger" type="submit" fullWidth={false} className="rounded-xl px-5" loading={isSubmitting} loadingText="Rejecting...">
            Reject Doctor
          </CustomButton>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

export default RejectDoctorModal;
