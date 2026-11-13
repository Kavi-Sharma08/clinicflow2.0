import api from "../lib/axios";

export interface SettlementLedgerEntry {
  id: string;
  doctorId: string;
  appointmentId: string;
  paymentOrderId: string;
  allocatedAmountPaise: number;
  settlementStatus: "PENDING_COMPLETION" | "ELIGIBLE" | "APPROVED" | "SETTLED" | "ON_HOLD" | "REVERSED";
  transferId?: string | null;
  transferInitiatedAt?: string | null;
  transferSettledAt?: string | null;
  payoutReference?: string | null;
  payoutProofUrl?: string | null;
  createdAt: string;
  doctor: {
    id: string;
    department: string;
    user: {
      firstName: string;
      lastName: string;
      email: string;
    };
  };
  appointment: {
    id: string;
    appointmentDate: string;
    queueNumber?: number | null;
    status: string;
    isGuest: boolean;
    guestName?: string | null;
    bookingReference?: string | null;
    patient?: {
      user: {
        firstName: string;
        lastName: string;
        email: string;
      };
    } | null;
  };
  paymentOrder: {
    razorpayOrderId: string;
    grossAmountPaise: number;
    platformFeePaise: number;
    doctorSharePaise: number;
  };
  authorizedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export interface SettlementLedgerResponse {
  success: boolean;
  data: {
    entries: SettlementLedgerEntry[];
    pagination: {
      page: number;
      limit: number;
      totalCount: number;
      totalPages: number;
    };
  };
}

export interface FinancialOverviewResponse {
  success: boolean;
  data: {
    overview: {
      totalGrossPaise: number;
      totalPlatformFeePaise: number;
      totalDoctorSharePaise: number;
      totalSettledPaise: number;
      totalPendingSettlementPaise: number;
      currency: string;
    };
  };
}

export const adminSettlementService = {
  async getLedger(params?: {
    status?: string;
    doctorId?: string;
    page?: number;
    limit?: number;
  }): Promise<SettlementLedgerResponse> {
    const res = await api.get<SettlementLedgerResponse>("/admin/settlements/ledger", { params });
    return res.data;
  },

  async markAsPaid(payload: {
    ledgerIds: string[];
    payoutReference?: string;
    settlementMethod?: string;
    notes?: string;
  }) {
    const res = await api.post("/admin/settlements/mark-paid", payload);
    return res.data;
  },

  async getFinancialOverview(): Promise<FinancialOverviewResponse> {
    const res = await api.get<FinancialOverviewResponse>("/admin/financials/overview");
    return res.data;
  },
};

