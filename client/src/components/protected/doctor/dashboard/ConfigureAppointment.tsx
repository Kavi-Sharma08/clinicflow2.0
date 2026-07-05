import { useMemo, useState, useCallback } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import toast from "react-hot-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../../../../lib/axios";
import Modal from "../../../common/Modal";
import CustomNumberInput from "../../../common/CustomNumberInput";
import CustomButton from "../../../custom-fields/CustomButton";
import { CustomTable } from "../../../common/CustomTable";
import TableSkeleton from "../../../common/TableSkeleton";
import useOutsideClick from "../../../common/OutsideClickHandler";
import { toDateString } from "../../../../utils/dateUtil";
import Dropdown from "../../../common/Dropdown";

const MAX_DAYS_AHEAD = 10;

interface AvailabilityRow {
  id: string;
  date: string; // YYYY-MM-DD
  maxQueueSize: number;
  bookedCount: number;
}

interface AvailabilityResponse {
  data: AvailabilityRow[];
}

const QUERY_KEY = ["doctor-availability"];

const ConfigureAppointments = () => {
  const queryClient = useQueryClient();

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const maxAllowedDate = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + MAX_DAYS_AHEAD);
    return d;
  }, [today]);

  const [isPickingDate, setIsPickingDate] = useState(false);
  const [pickedDate, setPickedDate] = useState<Date | null>(null);

  const [modalMode, setModalMode] = useState<"edit" | "delete" | null>(null);
  const [activeRow, setActiveRow] = useState<AvailabilityRow | null>(null);
  const [inputValue, setInputValue] = useState<number | "">("");
  const [error, setError] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const activeDate = activeRow ? activeRow.date : pickedDate ? toDateString(pickedDate) : null;

  const closeDatePicker = useCallback(() => setIsPickingDate(false), []);
  const datePickerRef = useOutsideClick<HTMLDivElement>(closeDatePicker);

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data } = await api.get<AvailabilityResponse>("/doctor/availability/list");
      return data;
    },
  });

  const rows: AvailabilityRow[] = data?.data ?? [];

  const openNewDatePicker = () => setIsPickingDate((prev) => !prev);

  const openCreate = (date: Date) => {
    setPickedDate(date);
    setActiveRow(null);
    setInputValue("");
    setError(undefined);
    setModalMode("edit");
  };

  const handleDatePicked = (date: Date | null) => {
    setIsPickingDate(false);
    if (!date) return;
    openCreate(date);
  };

  const openEdit = (row: AvailabilityRow) => {
    setActiveRow(row);
    setPickedDate(null);
    setInputValue(row.maxQueueSize);
    setError(undefined);
    setModalMode("edit");
  };

  const confirmDelete = (row: AvailabilityRow) => {
    setActiveRow(row);
    setModalMode("delete");
  };

  const closeModal = () => {
    setModalMode(null);
    setActiveRow(null);
    setPickedDate(null);
    setError(undefined);
  };

  const handleSave = async () => {
    if (!activeDate) return;
    if (inputValue === "" || inputValue < 1) {
      setError("Enter a number of at least 1.");
      return;
    }

    setIsSaving(true);
    try {
      if (activeRow) {
        await api.put(`/doctor/availability/${activeRow.id}`, { maxQueueSize: inputValue });
        toast.success("Updated");
      } else {
        await api.post("/doctor/availability", { date: activeDate, maxQueueSize: inputValue });
        toast.success("Availability set");
      }

      await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      closeModal();
    } catch (err: any) {
      const message = err?.response?.data?.message ?? "Something went wrong. Try again.";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!activeRow) return;
    setIsDeleting(true);
    try {
      await api.delete(`/doctor/availability/${activeRow.id}`);
      toast.success("Deleted");
      await queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      closeModal();
    } catch (err: any) {
      const message = err?.response?.data?.message ?? "Could not delete this date.";
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDateLabel = (dateStr: string) =>
    new Date(dateStr + "T00:00:00").toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <div className="px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[#0A1628]">Configure Appointments</h1>

        <div className="relative">
          <CustomButton variant="primary" onClick={openNewDatePicker}>
            + Configure New Date
          </CustomButton>

          {isPickingDate && (
            <div
              ref={datePickerRef}
              className="absolute right-0 z-30 mt-2 rounded-2xl border border-[#d9e6f7] bg-white p-2 shadow-lg"
            >
              <DatePicker
                inline
                selected={null}
                onChange={handleDatePicked}
                minDate={today}
                maxDate={maxAllowedDate}
                filterDate={(date) => !rows.some((r) => r.date === toDateString(date))}
              />
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton rows={4} columns={4} />
      ) : (
        <CustomTable<AvailabilityRow>
          list={rows}
          itemKey={(row) => row.id}
          columns={{
            DATE: "Date",
            CAPACITY: "Max Capacity",
            BOOKED: "Booked",
            STATUS: "Status",
          }}
          renderRow={(row) => {
            const isFull = row.bookedCount >= row.maxQueueSize;
            return {
              DATE: formatDateLabel(row.date),
              CAPACITY: row.maxQueueSize,
              BOOKED: row.bookedCount,
              STATUS: (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    isFull
                      ? "bg-[#fde8e8] text-[#b42318]"
                      : "bg-[#e6f4ea] text-[#1a7f37]"
                  }`}
                >
                  {isFull ? "Full" : "Open"}
                </span>
              ),
            };
          }}
          renderAction={(row) => (
            <Dropdown.Container>
              <Dropdown.Trigger>
                <span className="text-lg leading-none">⋮</span>
              </Dropdown.Trigger>
              <Dropdown.Menu align="right">
                <Dropdown.Item onClick={() => openEdit(row)}>Edit</Dropdown.Item>
                <Dropdown.Item variant="danger" onClick={() => confirmDelete(row)}>
                  Delete
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown.Container>
          )}
          hasMore={false}
          next={() => {}}
          loader={false}
          noDataMessage="No dates configured yet. Click 'Configure New Date' to get started."
        />
      )}

      <Modal isOpen={modalMode !== null} onClose={closeModal}>
        <Modal.Header>
          {modalMode === "delete"
            ? "Delete availability?"
            : activeDate &&
              new Date(activeDate + "T00:00:00").toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
        </Modal.Header>

        <Modal.Body>
          {modalMode === "delete" ? (
            <p className="text-sm text-[#6b7b94]">
              {activeRow && (
                <>
                  This will remove availability for{" "}
                  <span className="font-medium text-[#0A1628]">
                    {formatDateLabel(activeRow.date)}
                  </span>
                  . This action cannot be undone.
                </>
              )}
            </p>
          ) : (
            <>
              {activeRow && (
                <p className="mb-3 text-xs text-[#6b7b94]">
                  {activeRow.bookedCount} of {activeRow.maxQueueSize} already booked
                </p>
              )}
              <CustomNumberInput
                label="Max patients"
                value={inputValue}
                onChange={(v) => {
                  setInputValue(v);
                  setError(undefined);
                }}
                error={error}
                min={1}
                required
              />
            </>
          )}
        </Modal.Body>

        <Modal.Footer>
          <CustomButton variant="secondary" onClick={closeModal}>
            Cancel
          </CustomButton>
          {modalMode === "delete" ? (
            <CustomButton variant="danger" loading={isDeleting} onClick={handleDelete}>
              Delete
            </CustomButton>
          ) : (
            <CustomButton variant="primary" loading={isSaving} onClick={handleSave}>
              {activeRow ? "Update" : "Set availability"}
            </CustomButton>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ConfigureAppointments;