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

function formatCurrency(value: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
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
    <div className="space-y-5">
      <div>
        <div className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-200/60">
          Step 5 of 6
        </div>

        <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.035em] text-white sm:text-3xl">
          Select payment method
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
          Choose how the registration will be paid. Online card payment is
          simulated in this frontend demo.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {event.allowOnlinePayment ? (
          <button
            type="button"
            onClick={() => onChange("online")}
            className={`relative overflow-hidden rounded-[26px] border p-5 text-left transition ${
              paymentMethod === "online"
                ? "border-cyan-300/35 bg-cyan-300/[0.085] shadow-[0_0_30px_rgba(34,211,238,0.1)]"
                : "border-white/10 bg-[#07111F]/82 hover:border-cyan-300/20 hover:bg-cyan-300/[0.045]"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div
                className={`grid h-12 w-12 place-items-center rounded-2xl border ${
                  paymentMethod === "online"
                    ? "border-cyan-300/30 bg-cyan-300 text-[#06111d]"
                    : "border-white/10 bg-white/[0.04] text-cyan-200"
                }`}
              >
                <WalletCards className="h-5 w-5" />
              </div>

              <div
                className={`grid h-8 w-8 place-items-center rounded-full border ${
                  paymentMethod === "online"
                    ? "border-cyan-300/30 bg-cyan-300 text-[#06111d]"
                    : "border-white/10 bg-white/[0.04] text-white/20"
                }`}
              >
                {paymentMethod === "online" ? (
                  <Check className="h-4 w-4" />
                ) : null}
              </div>
            </div>

            <h3 className="mt-5 text-xl font-black uppercase text-white">
              Pay online
            </h3>

            <p className="mt-2 text-sm leading-6 text-white/45">
              Simulate a secure card payment and immediately confirm the
              registration.
            </p>

            <div className="mt-5 flex items-center gap-2 rounded-[18px] border border-white/10 bg-black/15 p-3">
              <LockKeyhole className="h-4 w-4 shrink-0 text-cyan-200" />

              <p className="text-xs leading-5 text-white/45">
                Square checkout will replace this demo when the backend
                integration is ready.
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
                ? "border-[#FF6B35]/35 bg-[#FF6B35]/[0.085] shadow-[0_0_30px_rgba(255,107,53,0.08)]"
                : "border-white/10 bg-[#07111F]/82 hover:border-[#FF6B35]/20 hover:bg-[#FF6B35]/[0.04]"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div
                className={`grid h-12 w-12 place-items-center rounded-2xl border ${
                  paymentMethod === "cash"
                    ? "border-[#FF6B35]/30 bg-[#FF6B35] text-white"
                    : "border-white/10 bg-white/[0.04] text-[#FFB199]"
                }`}
              >
                <Banknote className="h-5 w-5" />
              </div>

              <div
                className={`grid h-8 w-8 place-items-center rounded-full border ${
                  paymentMethod === "cash"
                    ? "border-[#FF6B35]/30 bg-[#FF6B35] text-white"
                    : "border-white/10 bg-white/[0.04] text-white/20"
                }`}
              >
                {paymentMethod === "cash" ? (
                  <Check className="h-4 w-4" />
                ) : null}
              </div>
            </div>

            <h3 className="mt-5 text-xl font-black uppercase text-white">
              Pay cash in person
            </h3>

            <p className="mt-2 text-sm leading-6 text-white/45">
              Submit the entry now and complete payment directly with the race
              organization.
            </p>

            <div className="mt-5 flex items-start gap-2 rounded-[18px] border border-[#FF6B35]/15 bg-[#FF6B35]/[0.045] p-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#FFB199]" />

              <p className="text-xs leading-5 text-white/45">
                Cash entries remain pending and will not appear publicly until
                the organizer confirms payment.
              </p>
            </div>
          </button>
        ) : null}
      </div>

      <div className="rounded-[26px] border border-cyan-300/10 bg-[#07111F]/82 p-5">
        <div className="mb-4 flex items-center gap-3">
          <CreditCard className="h-5 w-5 text-cyan-200" />

          <h3 className="text-sm font-black uppercase text-white">
            Registration total
          </h3>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between gap-4 text-sm text-white/50">
            <span>Class entry subtotal</span>
            <span>{formatCurrency(pricing.classSubtotal)}</span>
          </div>

          <div className="flex justify-between gap-4 text-sm text-white/50">
            <span>Corner League platform fee</span>
            <span>{formatCurrency(pricing.platformFee)}</span>
          </div>

          <div className="flex justify-between gap-4 text-sm text-white/50">
            <span>Demo processing fee</span>
            <span>{formatCurrency(pricing.processingFee)}</span>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-4">
            <span className="text-sm font-black uppercase tracking-[0.1em] text-white">
              Total
            </span>

            <span className="text-2xl font-black text-white">
              {formatCurrency(pricing.total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
