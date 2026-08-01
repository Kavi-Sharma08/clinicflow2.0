import { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import toast from "react-hot-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  PlusIcon,
  TrashIcon,
  DotsThreeVerticalIcon,
  PencilSimpleIcon,
} from "@phosphor-icons/react";
import { doctorPortalService } from "../../../../services/doctorPortalService";
import {
  DOCTOR_PORTAL_KEYS,
  useDoctorAvailability,
  useUpdateDoctorAvailability,
} from "../../../../hooks/useDoctorPortal";
import type { DayOfWeek, DoctorAvailabilityDTO } from "../../../../types/doctorPortal.types";
import { EmptyState, SectionCard, SkeletonBlock } from "../shared/DoctorPortalAtoms";
import CustomSelect from "../../../custom-tags/CustomSelect";
import CustomInputField from "../../../custom-fields/CustomInputField";
import CustomNumberInputField from "../../../custom-fields/CustomNumberInputField";
import { handleFormError } from "../../../../utils/handleFormError";
import Modal from "../../../common/Modal";
import CustomToggleField from "../../../custom-fields/CustomToggleField";
import CustomSelectField from "../../../custom-fields/CustomSelectField"

const DAYS: DayOfWeek[] = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];

const dayOptions = DAYS.map((day) => ({
  label: day.charAt(0) + day.slice(1).toLowerCase(),
  value: day,
}));

type AvailabilityFormValues = {
  dayOfWeek: DayOfWeek | "";
  startTime: string;
  endTime: string;
  maxAppointments: number | "";
  isAvailable: boolean;
};

interface ActionsMenuProps {
  onEdit: () => void;
  onDelete: () => void;
}

const ActionsMenu = ({ onEdit, onDelete }: ActionsMenuProps) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Actions"
        className="rounded-2xl border border-slate-100 bg-white p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
      >
        <DotsThreeVerticalIcon size={18} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-10 mt-1 w-36 overflow-hidden rounded-xl border border-slate-100 bg-white py-1 shadow-lg">
          <button
            type="button"
            onClick={() => {
              onEdit();
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
          >
            <PencilSimpleIcon size={16} /> Edit
          </button>
          <button
            type="button"
            onClick={() => {
              onDelete();
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-rose-600 transition hover:bg-rose-50"
          >
            <TrashIcon size={16} /> Delete
          </button>
        </div>
      )}
    </div>
  );
};

const DoctorAvailability = () => {
  const queryClient = useQueryClient();
  const { data, isLoading } = useDoctorAvailability();
  const updateMutation = useUpdateDoctorAvailability();

  const [editingSlot, setEditingSlot] = useState<DoctorAvailabilityDTO | null>(null);
  const [deletingSlot, setDeletingSlot] = useState<DoctorAvailabilityDTO | null>(null);

  const {
    control,
    handleSubmit,
    setError,
    reset,
  } = useForm<AvailabilityFormValues>({
    defaultValues: {
      dayOfWeek: "",
      startTime: "10:00",
      endTime: "14:00",
      maxAppointments: 10,
      isAvailable: true,
    },
  });

  const {
    control: editControl,
    handleSubmit: handleEditSubmit,
    reset: resetEditForm,
  } = useForm<AvailabilityFormValues>({
    defaultValues: {
      dayOfWeek: "MONDAY",
      startTime: "10:00",
      endTime: "14:00",
      maxAppointments: 10,
      isAvailable: true,
    },
  });

  useEffect(() => {
    if (editingSlot) {
      resetEditForm({
        dayOfWeek: editingSlot.dayOfWeek,
        startTime: editingSlot.startTime,
        endTime: editingSlot.endTime,
        maxAppointments: editingSlot.maxAppointments,
        isAvailable: editingSlot.isAvailable,
      });
    }
  }, [editingSlot, resetEditForm]);

  const createMutation = useMutation({
    mutationFn: (values: AvailabilityFormValues) =>
      doctorPortalService.createAvailability({
        dayOfWeek: values.dayOfWeek as DayOfWeek,
        startTime: values.startTime,
        endTime: values.endTime,
        maxAppointments: Number(values.maxAppointments),
        isAvailable: true,
      }),
    onSuccess: () => {
      toast.success("Availability slot created.");
      queryClient.invalidateQueries({ queryKey: DOCTOR_PORTAL_KEYS.availability });
      queryClient.invalidateQueries({ queryKey: DOCTOR_PORTAL_KEYS.dashboard });
      reset();
    },
    onError: (error) => handleFormError(error, setError),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => doctorPortalService.deleteAvailability(id),
    onSuccess: () => {
      toast.success("Availability slot removed.");
      queryClient.invalidateQueries({ queryKey: DOCTOR_PORTAL_KEYS.availability });
      queryClient.invalidateQueries({ queryKey: DOCTOR_PORTAL_KEYS.dashboard });
      setDeletingSlot(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Something went wrong");
      setDeletingSlot(null);
    },
  });

  const onSubmit = (values: AvailabilityFormValues) => {
    createMutation.mutate({
      ...values,
      maxAppointments: Number(values.maxAppointments),
      isAvailable: true,
    });
  };

  const onEditSubmit = (values: AvailabilityFormValues) => {
    if (!editingSlot) return;
    updateMutation.mutate(
      {
        id: editingSlot.id,
        payload: {
          dayOfWeek: values.dayOfWeek as DayOfWeek,
          startTime: values.startTime,
          endTime: values.endTime,
          maxAppointments: Number(values.maxAppointments),
          isAvailable: values.isAvailable,
        },
      },
      {
        onSuccess: () => setEditingSlot(null),
      }
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">Availability Management</h1>
        <p className="mt-1 text-sm text-slate-500">
          Define weekly working windows. Patient bookings are constrained by this backend availability.
        </p>
      </div>

      <SectionCard title="Create availability slot" description="Set a day, consultation window, and maximum queue capacity.">
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid gap-4 lg:grid-cols-[1fr_1fr_1fr_1fr_auto] lg:items-end">
            <CustomSelectField
              name="dayOfWeek"
              control={control}
              options={dayOptions}
              placeholder="Select day"
              isSearchable
              rules={{ required: "Please select a day" }}
            />

            <CustomInputField
              name="startTime"
              control={control}
              label="Start time"
              type="time"
              rules={{ required: "Start time is required" }}
            />

            <CustomInputField
              name="endTime"
              control={control}
              label="End time"
              type="time"
              rules={{ required: "End time is required" }}
            />

            <CustomNumberInputField
              name="maxAppointments"
              control={control}
              label="Max appointments"
              min={1}
              rules={{ required: "Max appointments is required" }}
            />

            <button
              type="submit"
              disabled={createMutation.isPending}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:bg-slate-300"
            >
              <PlusIcon size={16} /> Add Slot
            </button>
          </div>
        </form>
      </SectionCard>

      <SectionCard title="Weekly availability" description="Slots are used by patient booking and doctor dashboard capacity metrics.">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <SkeletonBlock key={index} className="h-20" />
            ))}
          </div>
        ) : data?.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {data.map((slot: DoctorAvailabilityDTO) => (
              <div
                key={slot.id}
                className="flex items-center justify-between rounded-3xl border border-slate-100 bg-white p-4 shadow-sm transition hover:bg-slate-50"
              >
                <div>
                  <p className="font-semibold text-slate-950">{slot.dayOfWeek}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {slot.startTime} – {slot.endTime} · {slot.maxAppointments} patients
                  </p>
                  {!slot.isAvailable && (
                    <span className="mt-1 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                      Inactive
                    </span>
                  )}
                </div>
                <ActionsMenu
                  onEdit={() => setEditingSlot(slot)}
                  onDelete={() => setDeletingSlot(slot)}
                />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No availability configured"
            description="Create your first weekly slot so patients can start booking appointments."
          />
        )}
      </SectionCard>

      {/* Edit Modal */}
      <Modal isOpen={!!editingSlot} onClose={() => setEditingSlot(null)}>
        <Modal.Header>Edit availability slot</Modal.Header>
        <form onSubmit={handleEditSubmit(onEditSubmit)} noValidate>
          <Modal.Body>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Day</label>
                <Controller
                  name="dayOfWeek"
                  control={editControl}
                  rules={{ required: "Please select a day" }}
                  render={({ field, fieldState: { error } }) => (
                    <>
                      <CustomSelect
                        options={dayOptions}
                        placeholder="Select day"
                        hasError={!!error}
                        value={dayOptions.find((option) => option.value === field.value) ?? null}
                        onChange={(option) => {
                          if (option) field.onChange(option.value as DayOfWeek);
                        }}
                        onBlur={field.onBlur}
                        isSearchable={true}
                      />
                      {error && <span className="mt-1 block text-xs text-red-600">{error.message}</span>}
                    </>
                  )}
                />
              </div>

              <CustomInputField
                name="startTime"
                control={editControl}
                label="Start time"
                type="time"
                rules={{ required: "Start time is required" }}
              />

              <CustomInputField
                name="endTime"
                control={editControl}
                label="End time"
                type="time"
                rules={{ required: "End time is required" }}
              />

              <CustomNumberInputField
                name="maxAppointments"
                control={editControl}
                label="Max appointments"
                min={1}
                rules={{ required: "Max appointments is required" }}
              />

              <CustomToggleField
                name="isAvailable"
                control={editControl}
                label={
                  <div>
                    <p className="text-sm font-semibold text-slate-700">Available</p>
                  </div>
                }
              />
            </div>
          </Modal.Body>
          <Modal.Footer>
            <button
              type="button"
              onClick={() => setEditingSlot(null)}
              className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="rounded-2xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:bg-slate-300 cursor-pointer"
            >
              Save changes
            </button>
          </Modal.Footer>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!deletingSlot} onClose={() => setDeletingSlot(null)}>
        <Modal.Header>Delete availability slot</Modal.Header>
        <Modal.Body>
          <p className="text-sm text-slate-600">
            Are you sure you want to delete the{" "}
            <span className="font-semibold text-slate-950">{deletingSlot?.dayOfWeek}</span>{" "}
            slot ({deletingSlot?.startTime} – {deletingSlot?.endTime})? This action cannot be undone.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            onClick={() => setDeletingSlot(null)}
            className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => deletingSlot && deleteMutation.mutate(deletingSlot.id)}
            disabled={deleteMutation.isPending}
            className="rounded-2xl bg-rose-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
          >
            Delete
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default DoctorAvailability;