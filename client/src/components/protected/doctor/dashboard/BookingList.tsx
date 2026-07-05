import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../../../../lib/axios";
import { useUser } from "../../../../context/UserContext";
import { CustomTable } from "../../../common/CustomTable";
import TableSkeleton from "../../../common/TableSkeleton";
import { toDateString } from "../../../../utils/dateUtil";

interface BookingSummaryRow {
  date: string; // YYYY-MM-DD
  totalBooked: number;
  maxQueueSize: number;
}

interface BookingsListResponse {
  data: BookingSummaryRow[];
}

const QUERY_KEY = ["doctor-bookings-list"];

const BookingsList = () => {
  const navigate = useNavigate();
  const { user } = useUser();

  const { data, isLoading } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      const { data } = await api.get<BookingsListResponse>("/doctor/bookings/list");
      return data;
    },
  });
  console.log(data)


  const rows: BookingSummaryRow[] = data?.data ?? [];

  const handleRowClick = (row: BookingSummaryRow) => {
    if (!user) return;
    navigate(`/doctor/dashboard/${user.id}/bookings/${row.date}`);
  };

  return (
    <div className="px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[#0A1628]">Bookings</h1>
      </div>

      {isLoading ? (
        <TableSkeleton rows={4} columns={3} />
      ) : (
        <CustomTable<BookingSummaryRow>
          list={rows}
          itemKey={(row) => row.date}
          columns={{
            DATE: "Date",
            BOOKED: "Patients Booked",
            CAPACITY: "Capacity",
          }}
          renderRow={(row) => ({
            DATE: (
              <span
                className="cursor-pointer text-[#0057A8] hover:underline"
                onClick={() => handleRowClick(row)}
              >
                {toDateString(row.date)}
              </span>
            ),
            BOOKED: row.totalBooked,
            CAPACITY: row.maxQueueSize,
          })}
          hasMore={false}
          next={() => {}}
          loader={false}
          noDataMessage="No bookings yet."
        />
      )}
    </div>
  );
};

export default BookingsList;