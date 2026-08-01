import { useForm } from "react-hook-form";
import { PlusIcon, SpinnerGapIcon } from "@phosphor-icons/react";
import { useCreateAvailability } from "../../../../hooks/useDoctorPortal";
import type { AvailabilityFormValues, DayOfWeek } from "../../../../types/doctorPortal.types";
import CustomSelectField from "../../../custom-fields/CustomSelectField";
import CustomInputField from "../../../custom-fields/CustomInputField";
import CustomNumberInputField from "../../../custom-fields/CustomNumberInputField";
import { DAY_OPTIONS, DEFAULT_AVAILABILITY_FORM_VALUES } from "./availabilityConstants";

const AvailabilityCreateForm = () => {
  const { control, handleSubmit, setError, reset, watch } =
    useForm<AvailabilityFormValues>({
      defaultValues: DEFAULT_AVAILABILITY_FORM_VALUES,
    });

  const createMutation = useCreateAvailability(setError);

  const startTime = watch("startTime");

  const onSubmit = (values: AvailabilityFormValues) => {
    if (!values.dayOfWeek) return;

    createMutation.mutate(
      {
        dayOfWeek: values.dayOfWeek as DayOfWeek,
        startTime: values.startTime,
        endTime: values.endTime,
        maxAppointments: Number(values.maxAppointments),
        isAvailable: true,
      },
      { onSuccess: () => reset(DEFAULT_AVAILABILITY_FORM_VALUES) },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_0.8fr_auto] lg:items-end">
        {/* Day selector */}
        <CustomSelectField<AvailabilityFormValues>
          name="dayOfWeek"
          control={control}
          options={DAY_OPTIONS}
          placeholder="Select day"
          label="Day of week"
          isSearchable
          rules={{ required: "Please select a day" }}
        />

        {/* Start time */}
        <CustomInputField<AvailabilityFormValues>
          name="startTime"
          control={control}
          label="Start time"
          type="time"
          rules={{ required: "Start time is required" }}
        />

        {/* End time — min is dynamically set to 1 minute after startTime */}
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

        {/* Max appointments */}
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

        {/* Submit */}
        <button
          type="submit"
          disabled={createMutation.isPending}
          className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {createMutation.isPending ? (
            <>
              <SpinnerGapIcon size={16} className="animate-spin" />
              Adding…
            </>
          ) : (
            <>
              <PlusIcon size={16} weight="bold" />
              Add Slot
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default AvailabilityCreateForm;
