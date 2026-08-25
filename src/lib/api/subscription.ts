import { apiGet, apiPatch, apiPost } from "./client";

export type SubscriptionStatus =
  | "trial"
  | "active"
  | "paused"
  | "cancelled"
  | "expired"
  | "renewal_failed"
  | "pending";

export type PaymentStatus =
  | "pending"
  | "completed"
  | "granted"
  | "failed"
  | "refunded"
  | "partially_refunded";

export type AdminSubscription = {
  id: number;
  status: SubscriptionStatus;
  startAt: string;
  endAt: string;
  autoRenew: boolean;
  createdAt: string;
  userId: number;
  userFullname: string | null;
  userEmail: string | null;
  userPhone: string | null;
  planId: number;
  planName: string;
};

export type AdminPayment = {
  id: number;
  amount: string;
  currency: string;
  status: PaymentStatus;
  paymentType: "trial" | "subscription" | "renewal" | "upgrade";
  paymentMethod: "card" | "upi" | "netbanking" | "wallet" | "emi" | null;
  gateway: "razorpay" | "easebuzz" | "payu" | "cashfree" | null;
  gatewayOrderId: string | null;
  gatewayPaymentId: string | null;
  failureReason: string | null;
  refundAmount: string;
  refundedAt: string | null;
  paidAt: string | null;
  createdAt: string;
  userId: number;
  userFullname: string | null;
  userEmail: string | null;
  userPhone: string | null;
  planName: string;
};

export type PlanDistributionRow = {
  planId: number;
  planName: string;
  count: number;
};

export type AdminListSubscriptionsParams = {
  limit?: number;
  offset?: number;
  status?: SubscriptionStatus | "all";
  planId?: number;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  order?: "asc" | "desc";
  orderBy?: "createdAt" | "endAt";
};

export type AdminListPaymentsParams = {
  limit?: number;
  offset?: number;
  status?: PaymentStatus | "all";
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  order?: "asc" | "desc";
  orderBy?: "createdAt" | "amount";
};

export const adminListSubscriptions = (params: AdminListSubscriptionsParams = {}) =>
  apiGet<{ subscriptions: AdminSubscription[]; total: number }>(
    "/subscription/admin",
    params as Record<string, unknown>,
  );

export const adminListPayments = (params: AdminListPaymentsParams = {}) =>
  apiGet<{ payments: AdminPayment[]; total: number }>(
    "/subscription/admin/payments",
    params as Record<string, unknown>,
  );

// Same filters as adminListSubscriptions — the per-plan cards mirror
// whatever the subscriptions list is currently filtered to.
export const getPlanDistribution = (
  params: Pick<AdminListSubscriptionsParams, "status" | "planId" | "search" | "dateFrom" | "dateTo"> = {},
) =>
  apiGet<{ distribution: PlanDistributionRow[] }>(
    "/subscription/admin/plan-distribution",
    params as Record<string, unknown>,
  );

export const grantSubscription = (body: { userId: number; planId: number; durationDays?: number }) =>
  apiPost<{ subscription: AdminSubscription }>("/subscription/admin/grant", body);

export const extendSubscription = (id: number, extendDays: number) =>
  apiPatch<{ subscription: AdminSubscription }>(`/subscription/admin/${id}/extend`, { extendDays });

export const changeSubscriptionPlan = (id: number, planId: number) =>
  apiPatch<{ subscription: AdminSubscription }>(`/subscription/admin/${id}/change-plan`, { planId });

// ── Gateway Config ─────────────────────────────────────────────────────────────

export type GatewayConfig = {
  gateway: 'razorpay' | 'easebuzz' | 'payu' | 'cashfree';
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
};

export const getGatewayConfig = () =>
  apiGet<{ gateways: GatewayConfig[] }>('/subscription/admin/gateway-config');

export const updateGatewayConfig = (gateways: Pick<GatewayConfig, 'gateway' | 'isActive' | 'isDefault'>[]) =>
  apiPatch<{ gateways: GatewayConfig[] }>('/subscription/admin/gateway-config', { gateways });

// ── Invoice (GST tax invoice — same data the mobile app renders a PDF from) ────

export type InvoiceDetail = {
  id: number;
  invoiceNumber: string;
  status: 'draft' | 'issued' | 'refunded' | 'cancelled';
  issuedAt: string | null;
  createdAt: string;
  payment: {
    amount: string;
    currency: string;
    paymentType: string;
    gateway: string | null;
    gatewayOrderId: string | null;
    gatewayPaymentId: string | null;
    billingState: string | null;
    paidAt: string | null;
  };
  plan: { name: string; billingCycle: string; videoQuality: string };
  subscription: { id: number; startAt: string; endAt: string };
  user: { fullname: string | null; email: string | null; phone: string | null };
  company: {
    companyName: string;
    legalEntityName: string;
    gstin: string;
    pan: string;
    cin: string;
    registeredAddress: string;
    corporateAddress: string;
    website: string;
    supportEmail: string;
    supportWhatsapp: string;
    hsnSac: string;
  };
  tax: {
    placeOfSupply: string;
    taxableAmount: number;
    totalAmount: number;
    cgstRate: number;
    cgstAmount: number;
    sgstRate: number;
    sgstAmount: number;
    igstRate: number;
    igstAmount: number;
  };
};

export const getAdminInvoice = (paymentId: number) =>
  apiGet<{ invoice: InvoiceDetail }>(`/subscription/admin/payments/${paymentId}/invoice`).then(
    (r) => r.invoice,
  );
