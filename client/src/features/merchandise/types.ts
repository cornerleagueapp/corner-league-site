export type Policies = {
  sellerName: string;
  supportEmail: string;
  shippingPolicy: string;
  returnPolicy: string;
  privacyPolicy: string;
  terms: string;
  dispatchDays: number;
  returnDays: number;
};
export type Shop = {
  organizationId: string;
  revision: number;
  enabled: boolean;
  shippingCents: number;
  policies: Policies;
};
export type Variant = {
  id?: string;
  sku: string;
  size: string;
  color: string;
  priceCents: number;
  onHand: number;
  reserved: number;
  available?: number;
  active: boolean;
};
export type Product = {
  id?: string;
  organizationId?: string;
  revision: number;
  name: string;
  description: string;
  category: string;
  taxCode: string;
  images: string[];
  published: boolean;
  variants: Variant[];
};
export type Case = {
  id: string;
  kind: "support" | "return";
  status: "open" | "approved" | "denied" | "received" | "closed";
  reason: string;
  messages: { id: string; staff: boolean; text: string; at: string }[];
};
export type Order = {
  id: string;
  paymentState: string;
  fulfillment: string;
  createdAt: string;
  expiresAt: string;
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  feeCents?: number;
  totalCents: number;
  refundedCents: number;
  email?: string;
  policies: Policies;
  shippingAddress: {
    name?: string;
    address?: {
      line1?: string;
      line2?: string;
      city?: string;
      state?: string;
      postal_code?: string;
      country?: string;
    };
  } | null;
  tracking: { carrier: string; number: string; url: string } | null;
  lines: {
    variantId: string;
    productId: string;
    name: string;
    size: string;
    color: string;
    sku: string;
    image: string;
    quantity: number;
    unitCents: number;
  }[];
  cases?: Case[];
};
export const money = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n / 100,
  );
