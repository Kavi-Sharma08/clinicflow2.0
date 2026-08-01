import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { SpinnerGapIcon } from "@phosphor-icons/react";
import { useUpdateDoctorAvailability } from "../../../../hooks/useDoctorPortal";
import type {
  AvailabilityFormValues,
  DayOfWeek,
  DoctorAvailabilityDTO,
} from "../../../../types/doctorPortal.types";
import Modal from "../../../common/Modal";
import CustomSelectField from "../../../custom-fields/CustomSelectField";
import CustomInputField from "../../../custom-fields/CustomInputField";
import CustomNumberInputField from "../../../custom-fields/CustomNumberInputField";
import CustomToggleField from "../../../custom-fields/CustomToggleField";
import { DAY_OPTIONS } from "./availabilityConstants";

interface AvailabilityEditModalProps {
  slot: DoctorAvailabilityDTO | null;
  onClose: () => void;
}

const AvailabilityEditModal = ({ slot, onClose }: AvailabilityEditModalProps) => {
  const { control, handleSubmit, setError, reset, watch } =
    useForm<AvailabilityFormValues>({
      defaultValues: {
        dayOfWeek: "MONDAY",
        startTime: "09:00",
        endTime: "17:00",
        maxAppointments: 10,
        isAvailable: true,
      },
    });

  const updateMutation = useUpdateDoctorAvailability(setError);
  const startTime = watch("startTime");

  // Sync form with the slot being edited whenever it changes.
  useEffect(() => {
    if (slot) {
      reset({
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        maxAppointments: slot.maxAppointments,
        isAvailable: slot.isAvailable,
      });
    }
  }, [slot, reset]);

  const onSubmit = (values: AvailabilityFormValues) => {
    if (!slot) return;

    updateMutation.mutate(
      {
        id: slot.id,
        payload: {
          dayOfWeek: values.dayOfWeek as DayOfWeek,
          startTime: values.startTime,
          endTime: values.endTime,
          maxAppointments: Number(values.maxAppointments),
          isAvailable: values.isAvailable,
        },
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal isOpen={!!slot} onClose={onClose}>
      <Modal.Header>Edit availability slot</Modal.Header>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Modal.Body>
          <div className="space-y-4">
            <CustomSelectField<AvailabilityFormValues>
              name="dayOfWeek"
              control={control}
              label="Day of week"
              options={DAY_OPTIONS}
              placeholder="Select day"
              isSearchable
              rules={{ required: "Please select a day" }}
            />

            <CustomInputField<AvailabilityFormValues>
              name="startTime"
              control={control}
              label="Start time"
              type="time"
              rules={{ required: "Start time is required" }}
            />

            <CustomInputField<AvailabilityFormValues>
              name="endTime"
              control={control}
              label="End time"
              type="time"
              min={startTime || undefined}
              rules={{
                required: "End time is required",
                validate: (val: string) =>
                  !startTime || val > startTime || "End time must be after start time",
              }}
            />

            <CustomNumberInputField<AvailabilityFormValues>
              name="maxAppointments"
              control={control}
              label="Max patients"
              min={1}
              max={100}
              rules={{
                required: "Required",
                min: { value: 1, message: "At least 1 patient required" },
              }}
            />

            <CustomToggleField<AvailabilityFormValues>
              name="isAvailable"
              control={control}
              label={
                <div>
                  <p className="text-sm font-semibold text-slate-700">Accepting bookings</p>
                  <p className="text-xs text-slate-400">
                    Toggle off to pause bookings without deleting this slot
                  </p>
                </div>
              }
            />
          </div>
        </Modal.Body>

        <Modal.Footer>
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {updateMutation.isPending ? (
              <>
                <SpinnerGapIcon size={15} className="animate-spin" />
                Saving…
              </>
            ) : (
              "Save changes"
            )}
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};

export default AvailabilityEditModal;
