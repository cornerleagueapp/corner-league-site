import {
  Banknote,
  Check,
  CreditCard,
  Info,
  LockKeyhole,
  WalletCards,
} from "lucide-react";

import type {
  RegistrationEvent,
  RegistrationPaymentMethod,
  RegistrationPricingSummary,
} from "../types/registration.types";

type PaymentMethodStepProps = {
  event: RegistrationEvent;

  paymentMethod: RegistrationPaymentMethod | null | undefined;

  pricing: RegistrationPricingSummary;

  onChange: (paymentMethod: RegistrationPaymentMethod) => void;
};

function formatCurrency(cents: number, currency = "USD") {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(cents || 0) / 100);
}

export function isPaymentMethodComplete(
  paymentMethod: RegistrationPaymentMethod | null | undefined,
) {
  return paymentMethod === "online" || paymentMethod === "cash";
}

export default function PaymentMethodStep({
  event,
  paymentMethod,
  pricing,
  onChange,
}: PaymentMethodStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <div className="text-[9px] font-black uppercase tracking-[0.16em] text-cl-accent">
          Step 5 of 6
        </div>

        <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.035em] text-cl-ink sm:text-3xl">
          Select payment method
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-7 text-cl-muted">
          Choose how this registration will be paid. Final pricing is verified
          by Corner League before payment is processed.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {event.allowOnlinePayment ? (
          <button
            type="button"
            onClick={() => onChange("online")}
            className={`relative overflow-hidden rounded-[26px] border p-5 text-left transition ${
              paymentMethod === "online"
                ? "border-cl-accent/[0.35] bg-cl-accent/[0.085] shadow-cl-panel"
                : "border-cl-border bg-cl-surface hover:border-cl-accent/20 hover:bg-cl-accent/[0.045]"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div
                className={`grid h-12 w-12 place-items-center rounded-2xl border ${
                  paymentMethod === "online"
                    ? "border-cl-accent/30 bg-cl-accent text-cl-contrast"
                    : "border-cl-border bg-cl-subtle text-cl-accent"
                }`}
              >
                <WalletCards className="h-5 w-5" />
              </div>

              <div
                className={`grid h-8 w-8 place-items-center rounded-full border ${
                  paymentMethod === "online"
                    ? "border-cl-accent/30 bg-cl-accent text-cl-contrast"
                    : "border-cl-border bg-cl-subtle text-cl-muted"
                }`}
              >
                {paymentMethod === "online" ? (
                  <Check className="h-4 w-4" />
                ) : null}
              </div>
            </div>

            <h3 className="mt-5 text-xl font-black uppercase text-cl-ink">
              Pay online
            </h3>

            <p className="mt-2 text-sm leading-6 text-cl-muted">
              Submit the registration and continue to secure Stripe Checkout to
              complete payment.
            </p>

            <div className="mt-5 flex items-center gap-2 rounded-[18px] border border-cl-border bg-cl-surface p-3">
              <LockKeyhole className="h-4 w-4 shrink-0 text-cl-accent" />

              <p className="text-xs leading-5 text-cl-muted">
                Card information is handled securely by Stripe and is not stored
                by Corner League.
              </p>
            </div>
          </button>
        ) : null}

        {event.allowCashPayment ? (
          <button
            type="button"
            onClick={() => onChange("cash")}
            className={`relative overflow-hidden rounded-[26px] border p-5 text-left transition ${
              paymentMethod === "cash"
                ? "border-cl-accent/[0.35] bg-cl-accent/[0.085]"
                : "border-cl-border bg-cl-surface hover:border-cl-accent/20 hover:bg-cl-accent/[0.04]"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div
                className={`grid h-12 w-12 place-items-center rounded-2xl border ${
                  paymentMethod === "cash"
                    ? "border-cl-accent/30 bg-cl-accent text-cl-contrast"
                    : "border-cl-border bg-cl-subtle text-cl-accent"
                }`}
              >
                <Banknote className="h-5 w-5" />
              </div>

              <div
                className={`grid h-8 w-8 place-items-center rounded-full border ${
                  paymentMethod === "cash"
                    ? "border-cl-accent/30 bg-cl-accent text-cl-contrast"
                    : "border-cl-border bg-cl-subtle text-cl-muted"
                }`}
              >
                {paymentMethod === "cash" ? (
                  <Check className="h-4 w-4" />
                ) : null}
              </div>
            </div>

            <h3 className="mt-5 text-xl font-black uppercase text-cl-ink">
              Pay cash in person
            </h3>

            <p className="mt-2 text-sm leading-6 text-cl-muted">
              Submit the registration now and complete payment directly with the
              race organization.
            </p>

            <div className="mt-5 flex items-start gap-2 rounded-[18px] border border-cl-accent/[0.15] bg-cl-accent/[0.045] p-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-cl-accent" />

              <p className="text-xs leading-5 text-cl-muted">
                The entry remains pending until an authorized organizer confirms
                the cash payment.
              </p>
            </div>
          </button>
        ) : null}
      </div>

      <div className="rounded-[26px] border border-cl-accent/10 bg-cl-surface p-5">
        <div className="mb-4 flex items-center gap-3">
          <CreditCard className="h-5 w-5 text-cl-accent" />

          <h3 className="text-sm font-black uppercase text-cl-ink">
            Estimated registration total
          </h3>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between gap-4 text-sm text-cl-muted">
            <span>Class entry subtotal</span>

            <span>
              {formatCurrency(pricing.classSubtotalCents, pricing.currency)}
            </span>
          </div>

          <div className="flex justify-between gap-4 text-sm text-cl-muted">
            <span>Estimated platform fee</span>

            <span>
              {formatCurrency(pricing.platformFeeCents, pricing.currency)}
            </span>
          </div>

          <div className="flex justify-between gap-4 text-sm text-cl-muted">
            <span>Estimated processing fee</span>

            <span>
              {formatCurrency(pricing.processingFeeCents, pricing.currency)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-cl-border pt-4">
            <span className="text-sm font-black uppercase tracking-[0.1em] text-cl-ink">
              Estimated Total
            </span>

            <span className="text-2xl font-black text-cl-ink">
              {formatCurrency(pricing.totalCents, pricing.currency)}
            </span>
          </div>
        </div>

        <p className="mt-4 text-[11px] leading-5 text-cl-muted">
          Corner League will calculate the authoritative final price when the
          registration is submitted.
        </p>
      </div>
    </div>
  );
}
