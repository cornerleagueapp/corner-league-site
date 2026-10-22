import {
  AtSign,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  MapPin,
  Phone,
  ShipWheel,
  UserRound,
} from "lucide-react";
import type {
  RegistrationDraft,
  RegistrationEvent,
} from "../types/registration.types";

type RegistrationReviewStepProps = {
  event: RegistrationEvent;
  draft: RegistrationDraft;
  onEditStep: (step: number) => void;
};

function formatCurrency(cents: number, currency = "USD") {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(cents || 0) / 100);
}

function ReviewSection({
  title,
  step,
  icon,
  children,
  onEditStep,
}: {
  title: string;
  step: number;
  icon: React.ReactNode;
  children: React.ReactNode;
  onEditStep: (step: number) => void;
}) {
  return (
    <section className="rounded-[24px] border border-cl-border bg-cl-surface p-4 sm:p-5">
      <div className="flex items-center justify-between gap-4 border-b border-cl-border pb-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-2xl border border-cl-accent/[0.15] bg-cl-accent/10 text-cl-accent">
            {icon}
          </div>

          <h3 className="text-sm font-black uppercase text-cl-ink">{title}</h3>
        </div>

        <button
          type="button"
          onClick={() => onEditStep(step)}
          className="rounded-full border border-cl-border bg-cl-subtle px-4 py-2 text-[9px] font-black uppercase tracking-[0.12em] text-cl-muted transition hover:border-cl-accent/20 hover:bg-cl-accent/10 hover:text-cl-ink"
        >
          Edit
        </button>
      </div>

      <div className="pt-4">{children}</div>
    </section>
  );
}

export default function RegistrationReviewStep({
  event,
  draft,
  onEditStep,
}: RegistrationReviewStepProps) {
  return (
    <div className="space-y-5">
      <div>
        <div className="text-[9px] font-black uppercase tracking-[0.18em] text-cl-accent">
          Step 6 of 6
        </div>

        <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.035em] text-cl-ink sm:text-3xl">
          Review registration
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-7 text-cl-muted">
          Verify the racer, classes, watercraft, contact information, and
          payment selection before submitting the demo registration.
        </p>
      </div>

      <div className="rounded-[20px] border border-emerald-300/15 bg-emerald-300/[0.055] p-4">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-cl-success" />

          <div>
            <p className="text-sm font-black uppercase text-cl-ink">
              Ready for review
            </p>

            <p className="mt-1 text-xs leading-5 text-cl-muted">
              Submitting in the next batch will save this entry locally and
              update the event’s demo registration activity.
            </p>
          </div>
        </div>
      </div>

      <ReviewSection
        title="Racer"
        step={1}
        icon={<UserRound className="h-4 w-4" />}
        onEditStep={onEditStep}
      >
        <p className="text-base font-black uppercase text-cl-ink">
          {draft.racer?.name || "No racer selected"}
        </p>

        {draft.racer?.nickname ? (
          <p className="mt-1 text-sm text-cl-accent">
            “{draft.racer.nickname}”
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-2 text-xs text-cl-muted">
          {draft.racer?.raceNumber ? (
            <span className="rounded-full border border-cl-border bg-cl-surface px-3 py-1.5">
              Racer #{draft.racer.raceNumber}
            </span>
          ) : null}

          <span className="inline-flex items-center gap-1.5 rounded-full border border-cl-border bg-cl-surface px-3 py-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {draft.racer?.formattedLocation || "Location not listed"}
          </span>
        </div>
      </ReviewSection>

      <ReviewSection
        title="Contact"
        step={2}
        icon={<Phone className="h-4 w-4" />}
        onEditStep={onEditStep}
      >
        <div className="space-y-3 text-sm text-cl-muted">
          <div className="flex items-center gap-2">
            <AtSign className="h-4 w-4 text-cl-accent" />
            <span>{draft.contact.email}</span>
          </div>

          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-cl-accent" />
            <span>{draft.contact.phone}</span>
          </div>

          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-cl-accent" />

            <span>
              {[
                draft.contact.city,
                draft.contact.stateCode,
                draft.contact.countryCode,
              ]
                .filter(Boolean)
                .join(", ")}
            </span>
          </div>
        </div>
      </ReviewSection>

      <ReviewSection
        title="Race classes"
        step={3}
        icon={<CalendarDays className="h-4 w-4" />}
        onEditStep={onEditStep}
      >
        <div className="space-y-3">
          {draft.selectedClasses.map((selection) => (
            <div
              key={selection.classId}
              className="flex flex-col gap-2 rounded-[18px] border border-cl-border bg-cl-surface p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="text-sm font-black uppercase text-cl-ink">
                  {selection.className}
                </p>

                <p className="mt-1 text-xs text-cl-muted">
                  {selection.selectedEventDays
                    .map((day) => day.label)
                    .join(" & ")}
                </p>
              </div>

              <p className="text-sm font-black text-cl-ink">
                {formatCurrency(selection.estimatedPriceCents, event.currency)}
              </p>
            </div>
          ))}
        </div>
      </ReviewSection>

      <ReviewSection
        title="Watercraft"
        step={4}
        icon={<ShipWheel className="h-4 w-4" />}
        onEditStep={onEditStep}
      >
        <p className="text-base font-black uppercase text-cl-ink">
          #{draft.watercraft.boatNumber} {draft.watercraft.make}{" "}
          {draft.watercraft.model}
        </p>

        {draft.watercraft.year ? (
          <p className="mt-2 text-sm text-cl-muted">
            Model year {draft.watercraft.year}
          </p>
        ) : null}
      </ReviewSection>

      <ReviewSection
        title="Payment"
        step={5}
        icon={<CreditCard className="h-4 w-4" />}
        onEditStep={onEditStep}
      >
        <p className="text-base font-black uppercase text-cl-ink">
          {draft.paymentMethod === "online"
            ? "Online card payment"
            : "Cash in person"}
        </p>

        <p className="mt-2 text-sm leading-6 text-cl-muted">
          {draft.paymentMethod === "online"
            ? "After submitting, you will continue to secure Stripe Checkout to complete payment."
            : "The registration will remain pending until the organization confirms the cash payment."}
        </p>
      </ReviewSection>

      <section className="rounded-[26px] border border-cl-accent/[0.15] cl-panel-wash p-5">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.15em] text-cl-accent">
              Final total
            </p>

            <p className="mt-2 text-3xl font-black text-cl-ink">
              {formatCurrency(draft.pricing.totalCents, draft.pricing.currency)}
            </p>

            <p className="mt-2 text-xs text-cl-muted">{event.name}</p>
          </div>

          <div className="text-left text-xs leading-6 text-cl-muted sm:text-right">
            <p>
              Class subtotal:{" "}
              {formatCurrency(
                draft.pricing.classSubtotalCents,
                draft.pricing.currency,
              )}
            </p>

            <p>
              Platform fee:{" "}
              {formatCurrency(
                draft.pricing.platformFeeCents,
                draft.pricing.currency,
              )}
            </p>

            <p>
              Processing fee:{" "}
              {formatCurrency(
                draft.pricing.processingFeeCents,
                draft.pricing.currency,
              )}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
