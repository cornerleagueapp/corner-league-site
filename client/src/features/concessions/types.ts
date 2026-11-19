export type Stand = {
  id: string;
  name: string;
  location: string;
  instructions: string;
  open: boolean;
  serviceState?: string;
  closesAt?: string | null;
  opensAt?: string | null;
  serviceLabel?: string;
  prepMinutes: number;
  taxBps: number;
  revision: number;
};
export type MenuItem = {
  id: string;
  name: string;
  category: string;
  description: string;
  allergens: string;
  priceCents: number;
  stock: number | null;
  reserved: number;
  remaining: number | null;
  available: boolean;
  revision: number;
};
export type Order = {
  id: string;
  standId: string;
  standName: string;
  customerName: string;
  pickupCode: string;
  location: string;
  instructions: string;
  prepMinutes: number;
  state: string;
  lines: {
    itemId: string;
    name: string;
    quantity: number;
    unitCents: number;
  }[];
  subtotalCents: number;
  taxCents: number;
  totalCents: number;
  refundedCents: number;
  refundReason: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
};
export const money = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    cents / 100,
  );
export const statusLabel = (state: string) =>
  ({
    awaiting_payment: "Awaiting payment",
    queued: "Order received",
    preparing: "Preparing",
    ready: "Ready for pickup",
    collected: "Collected",
    cancelled: "Cancelled",
    refund_pending: "Refund processing",
    refunded: "Refunded",
    refund_failed: "Refund needs attention",
  })[state] || state;
