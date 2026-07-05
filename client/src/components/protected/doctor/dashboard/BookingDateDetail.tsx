import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../../../../lib/axios";
import { CustomTable } from "../../../common/CustomTable";
import TableSkeleton from "../../../common/TableSkeleton";

type BookingStatus = "BOOKED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";

interface PatientBookingRow {
  id: string;
  queueNumber: number;
  fullName: string;
  reasonForVisit?: string | null;
  status: BookingStatus;
  cancellationReason?: string | null;
}

interface BookingsDateResponse {
  data: PatientBookingRow[];
}

const STATUS_BADGE_STYLES: Record<BookingStatus, string> = {
  BOOKED: "bg-[#eaf2fd] text-[#0057A8]",
  COMPLETED: "bg-[#e6f4ea] text-[#1a7f37]",
  CANCELLED: "bg-[#fde8e8] text-[#b42318]",
  NO_SHOW: "bg-gray-100 text-gray-700",
};

const formatDateLabel = (dateStr: string) =>
  new Date(dateStr + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

const BookingsDateDetail = () => {
  const { date } = useParams<{ date: string }>();

  const { data, isLoading } = useQuery({
    queryKey: ["doctor-bookings-detail", date],
    queryFn: async () => {
      const { data } = await api.get<BookingsDateResponse>("/doctor/bookings/date", {
        params: { date },
      });
      console.log("Bookings for date:", data);
      return data;
    },
    enabled: !!date,
  });

  const rows: PatientBookingRow[] = data?.data ?? [];
  const sortedRows = [...rows].sort((a, b) => a.queueNumber - b.queueNumber);

  return (
    <div className="px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#0A1628]">
          {date ? formatDateLabel(date) : "Bookings"}
        </h1>
        <p className="mt-1 text-sm text-[#6b7b94]">
          {rows.length} {rows.length === 1 ? "patient" : "patients"} booked
        </p>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} columns={5} />
      ) : (
        <CustomTable<PatientBookingRow>
          list={sortedRows}
          itemKey={(row) => row.id}
          columns={{
            QUEUE: "Queue",
            NAME: "Patient Name",
            REASON_VISIT: "Reason for Visit",
            REASON_CANCEL: "Cancellation Reason",
            STATUS: "Status",
          }}
          renderRow={(row) => ({
            QUEUE: (
              <span className="font-medium text-[#0A1628]">
                {row.queueNumber}
              </span>
            ),
            NAME: <span className="text-[#0A1628]">{row.fullName}</span>,
            REASON_VISIT: (
              <span className="text-[#6b7b94]">{row.reasonForVisit ?? "—"}</span>
            ),
            REASON_CANCEL: (
                <span className="text-[#6b7b94]">
                    {row.status === "CANCELLED" 
                    ? (row.cancellationReason?.trim() || "--") 
                    : null}
                </span>
            ),
            STATUS: (
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE_STYLES[row.status]}`}
              >
                {row.status.replace("_", " ")}
              </span>
            ),
          })}
          hasMore={false}
          next={() => {}}
          loader={false}
          noDataMessage="No patients booked for this date."
        />
      )}
    </div>
  );
};

export default BookingsDateDetail;