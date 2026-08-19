export type RegistrationAdjustmentType =
  | "discount"
  | "surcharge"
  | "waiver"
  | string;

export type StripeConnectStatus = {
  connected?: boolean;

  accountId?: string | null;

  stripeAccountId?: string | null;

  chargesEnabled?: boolean;

  payoutsEnabled?: boolean;

  detailsSubmitted?: boolean;

  onboardingComplete?: boolean;

  country?: string | null;

  email?: string | null;

  status?: string;

  requirements?: {
    currentlyDue?: string[];

    eventuallyDue?: string[];

    pastDue?: string[];

    disabledReason?: string | null;
  } | null;

  [key: string]: unknown;
};

export type StripeConnectActionResult = {
  url?: string;

  onboardingUrl?: string;

  dashboardUrl?: string;

  accountId?: string;

  [key: string]: unknown;
};

export type ConfirmCashPaymentInput = {
  amountCents?: number;

  reference?: string;

  notes?: string;
};

export type RecordManualPaymentInput = {
  amountCents: number;

  reference: string;

  notes?: string;
};

export type CreateManualAdjustmentInput = {
  type: RegistrationAdjustmentType;

  /**
   * Signed cents.
   *
   * Negative = discount
   * Positive = additional fee
   */
  amountCents: number;

  label: string;

  reason: string;
};

export type WaiveRegistrationFeesInput = {
  reason: string;
};

export type CreateRegistrationRefundInput = {
  amountCents?: number;

  reason: string;

  reverseTransfer?: boolean;

  refundApplicationFee?: boolean;
};

export type CreateStripeConnectedAccountInput = {
  country: string;

  email?: string;
};
