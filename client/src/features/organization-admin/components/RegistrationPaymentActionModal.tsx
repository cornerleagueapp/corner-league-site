import { useState } from "react";

import {
  AlertTriangle,
  Banknote,
  CircleDollarSign,
  Loader2,
  Receipt,
  RotateCcw,
  SlidersHorizontal,
  X,
} from "lucide-react";

import type { RegistrationAdminEntry } from "../types/organizationRegistration";

import {
  useConfirmCashPayment,
  useCreateManualAdjustment,
  useRecordManualPayment,
  useRefundRegistration,
  useWaiveRegistrationFees,
} from "../hooks/useOrganizationPayments";

type PaymentAction = "cash" | "manual" | "adjustment" | "waive" | "refund";

type Props = {
  open: boolean;

  eventId: string;

  registration: RegistrationAdminEntry | null;

  allowedActions: {
    cash: boolean;

    manual: boolean;

    adjustment: boolean;

    waive: boolean;

    refund: boolean;
  };

  onClose: () => void;
};

function moneyToCents(value: string) {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return 0;
  }

  return Math.round(amount * 100);
}

function getRegistrationName(registration: RegistrationAdminEntry) {
  return (
    registration.racer?.name ??
    [registration.contactFirstName, registration.contactLastName]
      .filter(Boolean)
      .join(" ") ??
    registration.contactEmail ??
    "Registration"
  );
}

export function RegistrationPaymentActionModal({
  open,
  eventId,
  registration,
  allowedActions,
  onClose,
}: Props) {
  const [action, setAction] = useState<PaymentAction>("cash");

  const [amount, setAmount] = useState("");

  const [reference, setReference] = useState("");

  const [notes, setNotes] = useState("");

  const [reason, setReason] = useState("");

  const [adjustmentLabel, setAdjustmentLabel] = useState("");

  const [adjustmentType, setAdjustmentType] = useState<
    "discount" | "surcharge"
  >("discount");

  const cashMutation = useConfirmCashPayment(eventId);

  const manualMutation = useRecordManualPayment(eventId);

  const adjustmentMutation = useCreateManualAdjustment(eventId);

  const waiveMutation = useWaiveRegistrationFees(eventId);

  const refundMutation = useRefundRegistration(eventId);

  if (!open || !registration) {
    return null;
  }

  const registrationId = registration.id ?? registration.registrationId;

  if (!registrationId) {
    return null;
  }

  const busy =
    cashMutation.isPending ||
    manualMutation.isPending ||
    adjustmentMutation.isPending ||
    waiveMutation.isPending ||
    refundMutation.isPending;

  const error =
    cashMutation.error ||
    manualMutation.error ||
    adjustmentMutation.error ||
    waiveMutation.error ||
    refundMutation.error;

  const reset = () => {
    setAmount("");
    setReference("");
    setNotes("");
    setReason("");
    setAdjustmentLabel("");
  };

  const finish = () => {
    reset();
    onClose();
  };

  const submit = async () => {
    if (action === "cash") {
      const cents = amount.trim() ? moneyToCents(amount) : undefined;

      await cashMutation.mutateAsync({
        registrationId: String(registrationId),

        input: {
          amountCents: cents && cents > 0 ? cents : undefined,

          reference: reference.trim() || undefined,

          notes: notes.trim() || undefined,
        },
      });

      finish();
      return;
    }

    if (action === "manual") {
      const cents = moneyToCents(amount);

      if (cents <= 0 || !reference.trim()) {
        return;
      }

      await manualMutation.mutateAsync({
        registrationId: String(registrationId),

        input: {
          amountCents: cents,

          reference: reference.trim(),

          notes: notes.trim() || undefined,
        },
      });

      finish();
      return;
    }

    if (action === "adjustment") {
      const cents = moneyToCents(amount);

      if (cents <= 0 || !adjustmentLabel.trim() || !reason.trim()) {
        return;
      }

      await adjustmentMutation.mutateAsync({
        registrationId: String(registrationId),

        input: {
          type: adjustmentType,

          amountCents: adjustmentType === "discount" ? -cents : cents,

          label: adjustmentLabel.trim(),

          reason: reason.trim(),
        },
      });

      finish();
      return;
    }

    if (action === "waive") {
      if (!reason.trim()) {
        return;
      }

      await waiveMutation.mutateAsync({
        registrationId: String(registrationId),

        input: {
          reason: reason.trim(),
        },
      });

      finish();
      return;
    }

    if (action === "refund") {
      if (!reason.trim()) {
        return;
      }

      const cents = amount.trim() ? moneyToCents(amount) : undefined;

      await refundMutation.mutateAsync({
        registrationId: String(registrationId),

        input: {
          amountCents: cents && cents > 0 ? cents : undefined,

          reason: reason.trim(),

          reverseTransfer: true,

          refundApplicationFee: true,
        },
      });

      finish();
    }
  };

  const actions: Array<{
    key: PaymentAction;

    label: string;

    icon: React.ComponentType<{
      className?: string;
    }>;

    allowed: boolean;
  }> = [
    {
      key: "cash",

      label: "Cash",

      icon: Banknote,

      allowed: allowedActions.cash,
    },

    {
      key: "manual",

      label: "Manual",

      icon: Receipt,

      allowed: allowedActions.manual,
    },

    {
      key: "adjustment",

      label: "Adjustment",

      icon: SlidersHorizontal,

      allowed: allowedActions.adjustment,
    },

    {
      key: "waive",

      label: "Waive",

      icon: CircleDollarSign,

      allowed: allowedActions.waive,
    },

    {
      key: "refund",

      label: "Refund",

      icon: RotateCcw,

      allowed: allowedActions.refund,
    },
  ];

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-5">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[30px] border border-white/10 bg-[#07111F] shadow-[0_35px_120px_rgba(0,0,0,0.65)]">
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/10 bg-[#07111F]/95 p-5 backdrop-blur sm:p-6">
          <div>
            <div className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-200">
              Payment Actions
            </div>

            <h2 className="mt-2 text-xl font-black text-white">
              {getRegistrationName(registration)}
            </h2>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="p-5 sm:p-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {actions
              .filter((item) => item.allowed)
              .map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.key}
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setAction(item.key);

                      reset();
                    }}
                    className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.11em] transition ${
                      action === item.key
                        ? "border-cyan-300 bg-cyan-300 text-[#04101C]"
                        : "border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />

                    {item.label}
                  </button>
                );
              })}
          </div>

          <div className="mt-6 rounded-[22px] border border-white/10 bg-black/15 p-4">
            {action === "cash" ? (
              <div>
                <h3 className="font-black text-white">Record Cash Payment</h3>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Leave the amount blank to let the backend apply its normal
                  remaining-balance behavior.
                </p>

                <div className="mt-5 grid gap-4">
                  <input
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Amount in dollars (optional)"
                    className="h-12 rounded-xl border border-white/10 bg-[#07111F] px-4 text-sm text-white outline-none"
                  />

                  <input
                    value={reference}
                    onChange={(event) => setReference(event.target.value)}
                    maxLength={150}
                    placeholder="Reference / receipt number (optional)"
                    className="h-12 rounded-xl border border-white/10 bg-[#07111F] px-4 text-sm text-white outline-none"
                  />

                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    maxLength={5000}
                    placeholder="Notes (optional)"
                    className="min-h-28 rounded-xl border border-white/10 bg-[#07111F] p-4 text-sm text-white outline-none"
                  />
                </div>
              </div>
            ) : null}

            {action === "manual" ? (
              <div>
                <h3 className="font-black text-white">Record Manual Payment</h3>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Use this for organizer-verified payments received outside
                  Corner League.
                </p>

                <div className="mt-5 grid gap-4">
                  <input
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Amount in dollars"
                    className="h-12 rounded-xl border border-white/10 bg-[#07111F] px-4 text-sm text-white outline-none"
                  />

                  <input
                    value={reference}
                    onChange={(event) => setReference(event.target.value)}
                    maxLength={150}
                    placeholder="Required payment reference"
                    className="h-12 rounded-xl border border-white/10 bg-[#07111F] px-4 text-sm text-white outline-none"
                  />

                  <textarea
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    maxLength={5000}
                    placeholder="Notes (optional)"
                    className="min-h-28 rounded-xl border border-white/10 bg-[#07111F] p-4 text-sm text-white outline-none"
                  />
                </div>
              </div>
            ) : null}

            {action === "adjustment" ? (
              <div>
                <h3 className="font-black text-white">
                  Manual Price Adjustment
                </h3>

                <div className="mt-5 grid gap-4">
                  <select
                    value={adjustmentType}
                    onChange={(event) =>
                      setAdjustmentType(
                        event.target.value as "discount" | "surcharge",
                      )
                    }
                    className="h-12 rounded-xl border border-white/10 bg-[#07111F] px-4 text-sm text-white outline-none"
                  >
                    <option value="discount">Discount</option>

                    <option value="surcharge">Additional Fee</option>
                  </select>

                  <input
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Amount in dollars"
                    className="h-12 rounded-xl border border-white/10 bg-[#07111F] px-4 text-sm text-white outline-none"
                  />

                  <input
                    value={adjustmentLabel}
                    onChange={(event) => setAdjustmentLabel(event.target.value)}
                    maxLength={150}
                    placeholder="Label, e.g. Promoter Discount"
                    className="h-12 rounded-xl border border-white/10 bg-[#07111F] px-4 text-sm text-white outline-none"
                  />

                  <textarea
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    maxLength={5000}
                    placeholder="Required reason"
                    className="min-h-28 rounded-xl border border-white/10 bg-[#07111F] p-4 text-sm text-white outline-none"
                  />
                </div>
              </div>
            ) : null}

            {action === "waive" ? (
              <div>
                <h3 className="font-black text-white">
                  Waive Remaining Balance
                </h3>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  This marks the unpaid registration balance as waived. A reason
                  is required for the audit trail.
                </p>

                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  maxLength={5000}
                  placeholder="Required waiver reason"
                  className="mt-5 min-h-32 w-full rounded-xl border border-white/10 bg-[#07111F] p-4 text-sm text-white outline-none"
                />
              </div>
            ) : null}

            {action === "refund" ? (
              <div>
                <h3 className="font-black text-white">Stripe Refund</h3>

                <p className="mt-2 text-xs leading-5 text-slate-500">
                  Leave the amount blank for the backend to refund the remaining
                  refundable amount. Enter an amount for a partial refund.
                </p>

                <div className="mt-5 grid gap-4">
                  <input
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Partial refund amount (optional)"
                    className="h-12 rounded-xl border border-white/10 bg-[#07111F] px-4 text-sm text-white outline-none"
                  />

                  <textarea
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    maxLength={5000}
                    placeholder="Required refund reason"
                    className="min-h-32 rounded-xl border border-white/10 bg-[#07111F] p-4 text-sm text-white outline-none"
                  />
                </div>
              </div>
            ) : null}
          </div>

          {error ? (
            <div className="mt-4 flex gap-3 rounded-2xl border border-red-300/15 bg-red-300/[0.05] p-4">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-200" />

              <p className="text-xs leading-5 text-red-100/75">
                {(error as any)?.message ??
                  "Unable to complete payment action."}
              </p>
            </div>
          ) : null}

          <button
            type="button"
            disabled={busy}
            onClick={submit}
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 text-xs font-black uppercase tracking-[0.13em] text-[#04101C] transition hover:bg-cyan-200 disabled:opacity-50"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CircleDollarSign className="h-4 w-4" />
            )}
            Confirm Action
          </button>
        </div>
      </div>
    </div>
  );
}
