import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import RegistrationLayout from "../components/RegistrationLayout";
import RegistrationProgress from "../components/RegistrationProgress";
import RegistrationSummary from "../components/RegistrationSummary";
import RacerLookupStep from "../components/RacerLookupStep";
import ContactInformationStep, {
  isContactInformationComplete,
} from "../components/ContactInformationStep";
import ClassSelectionStep, {
  isClassSelectionComplete,
} from "../components/ClassSelectionStep";
import WatercraftStep, {
  isWatercraftInformationComplete,
} from "../components/WatercraftStep";
import PaymentMethodStep, {
  isPaymentMethodComplete,
} from "../components/PaymentMethodStep";
import RegistrationReviewStep from "../components/RegistrationReviewStep";
import {
  RegistrationDraftProvider,
  useRegistrationDraft,
} from "../context/registrationDraftContext";
import {
  createStripeCheckout,
  getRegistrationEventBySlug,
  submitRegistration,
  type CreateRaceRegistrationInput,
} from "../services/registrationService";
import type { RegistrationEvent } from "../types/registration.types";
import { clearRegistrationDraft } from "../utils/registrationStorage";

type RegistrationFlowPageProps = {
  eventSlug: string;
};

function RegistrationFlowContent() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    event,
    draft,
    setCurrentStep,
    setRacer,
    updateContact,
    setSelectedClasses,
    updateWatercraft,
    setPaymentMethod,
    setRegisteredByUserId,
    setTermsAccepted,
    setCouponCode,
  } = useRegistrationDraft();

  const [highestCompletedStep, setHighestCompletedStep] = useState(
    Math.max(0, draft.currentStep - 1),
  );

  const accountEmail =
    (user as any)?.email ?? (user as any)?.primaryEmail ?? null;

  const userId =
    (user as any)?.id ?? (user as any)?.userId ?? (user as any)?.uuid ?? null;

  useEffect(() => {
    if (userId && draft.registeredByUserId !== String(userId)) {
      setRegisteredByUserId(String(userId));
    }
  }, [userId, draft.registeredByUserId, setRegisteredByUserId]);

  useEffect(() => {
    if (accountEmail && !draft.contact.email.trim()) {
      updateContact({
        email: String(accountEmail),
      });
    }
  }, [accountEmail, draft.contact.email, updateContact]);

  const stepComplete = useMemo(() => {
    return {
      1: Boolean(draft.racer),
      2: isContactInformationComplete(draft.contact),
      3: isClassSelectionComplete(draft.selectedClasses),
      4: isWatercraftInformationComplete(draft.watercraft),
      5: isPaymentMethodComplete(draft.paymentMethod),
      6: draft.termsAccepted,
    } as Record<number, boolean>;
  }, [draft]);

  function getStepValidationMessage(step: number) {
    switch (step) {
      case 1:
        return "Select the racer being registered.";

      case 2:
        return "Enter a valid email, phone number, city, and country.";

      case 3:
        return "Select at least one class and the required event days for every selected class.";

      case 4:
        return "Enter the boat number, manufacturer, and model.";

      case 5:
        return "Select online payment or cash in person.";

      case 6:
        return "Accept the registration terms before submitting.";

      default:
        return "Complete the required registration information.";
    }
  }

  function continueToNextStep() {
    const currentStep = draft.currentStep;

    if (!stepComplete[currentStep]) {
      toast({
        title: "Complete this step",
        description: getStepValidationMessage(currentStep),
        variant: "destructive",
      });

      return;
    }

    const nextStep = Math.min(6, currentStep + 1);

    setHighestCompletedStep((current) => Math.max(current, currentStep));

    setCurrentStep(nextStep);

    window.requestAnimationFrame(() => {
      document.querySelector("[data-registration-flow-top]")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  function goBack() {
    if (draft.currentStep <= 1) {
      navigate(`/registration/events/${event.slug}`);
      return;
    }

    setCurrentStep(draft.currentStep - 1);

    window.requestAnimationFrame(() => {
      document.querySelector("[data-registration-flow-top]")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  function selectExistingStep(step: number) {
    if (step === draft.currentStep || step <= highestCompletedStep) {
      setCurrentStep(step);
    }
  }

  async function handleSubmitRegistration() {
    if (!event) {
      return;
    }

    setSubmitError(null);

    if (!user) {
      const message = "You must be signed in to submit a race registration.";

      setSubmitError(message);

      toast({
        title: "Sign in required",
        description: message,
        variant: "destructive",
      });

      return;
    }

    if (!draft.racer?.id) {
      setSubmitError("Please select a racer before submitting.");
      return;
    }

    if (!draft.paymentMethod) {
      setSubmitError("Please select a payment method.");
      return;
    }

    if (draft.paymentMethod !== "online" && draft.paymentMethod !== "cash") {
      setSubmitError("Unsupported payment method.");
      return;
    }

    if (!draft.termsAccepted) {
      setSubmitError(
        "You must accept the registration terms before submitting.",
      );

      return;
    }

    if (draft.selectedClasses.length === 0) {
      setSubmitError("Select at least one race class before submitting.");
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);

      const clientRequestId =
        typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const modelYear = draft.watercraft.year?.trim()
        ? Number(draft.watercraft.year)
        : undefined;

      const payload: CreateRaceRegistrationInput = {
        clientRequestId,

        racerId: draft.racer.id,

        contactEmail: draft.contact.email.trim(),

        contactPhone: draft.contact.phone.trim(),

        contactCity: draft.contact.city.trim(),

        contactStateCode: draft.contact.stateCode?.trim() || undefined,

        contactCountryCode: draft.contact.countryCode.trim().toUpperCase(),

        paymentMethod: draft.paymentMethod,

        entries: draft.selectedClasses.map((selection) => ({
          eventClassId: selection.classId,

          selectedEventDayIds: selection.selectedEventDayIds,
        })),

        watercraft: {
          boatNumber: draft.watercraft.boatNumber.trim(),

          manufacturer: draft.watercraft.make.trim(),

          model: draft.watercraft.model.trim(),

          modelYear: Number.isFinite(modelYear) ? modelYear : undefined,

          useForAllClasses: draft.watercraft.useForAllClasses,

          hullIdentificationNumber:
            draft.watercraft.hullIdentificationNumber?.trim() || undefined,

          engineDescription:
            draft.watercraft.engineDescription?.trim() || undefined,

          notes: draft.watercraft.notes?.trim() || undefined,
        },

        termsAccepted: true,

        termsVersion: "registration-v1",

        couponCode: draft.couponCode?.trim() || undefined,
      };

      const result = await submitRegistration(event.slug, payload);

      clearRegistrationDraft(event.slug);

      if (draft.paymentMethod === "online" && result.paymentRequired) {
        const checkoutIdempotencyKey =
          typeof crypto !== "undefined" &&
          typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

        const checkout = await createStripeCheckout(result.registration.id, {
          idempotencyKey: checkoutIdempotencyKey,

          customerEmail: draft.contact.email.trim() || undefined,
        });

        if (!checkout.checkoutUrl) {
          throw new Error("Stripe checkout could not be started.");
        }

        window.location.assign(checkout.checkoutUrl);

        return;
      }

      navigate(`/registration/success/${result.registration.id}`);
    } catch (error: any) {
      const message = error?.message || "Unable to submit registration.";

      setSubmitError(message);

      toast({
        title: "Registration could not be submitted",

        description: message,

        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  function renderStep() {
    switch (draft.currentStep) {
      case 1:
        return (
          <RacerLookupStep
            selectedRacer={draft.racer}
            onSelectRacer={setRacer}
          />
        );

      case 2:
        return (
          <ContactInformationStep
            contact={draft.contact}
            accountEmail={accountEmail}
            onChange={updateContact}
          />
        );

      case 3:
        return (
          <ClassSelectionStep
            event={event}
            selectedClasses={draft.selectedClasses}
            onChange={setSelectedClasses}
          />
        );

      case 4:
        return (
          <WatercraftStep
            watercraft={draft.watercraft}
            onChange={updateWatercraft}
          />
        );

      case 5:
        return (
          <PaymentMethodStep
            event={event}
            paymentMethod={draft.paymentMethod}
            pricing={draft.pricing}
            onChange={setPaymentMethod}
          />
        );

      case 6:
        return (
          <>
            <RegistrationReviewStep
              event={event}
              draft={draft}
              onEditStep={setCurrentStep}
            />

            <div className="mt-5 rounded-[22px] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={draft.termsAccepted}
                  onChange={(inputEvent) =>
                    setTermsAccepted(inputEvent.target.checked)
                  }
                  className="mt-1 h-4 w-4 accent-cyan-300"
                />

                <div>
                  <p className="text-sm font-black text-white">
                    I agree to the registration terms
                  </p>

                  <p className="mt-1 text-xs leading-5 text-white/45">
                    By submitting this registration, you agree to the race
                    organization's registration terms, policies, eligibility
                    requirements, and applicable refund policy.
                  </p>

                  {event.termsText ? (
                    <div className="mt-3 max-h-36 overflow-y-auto rounded-xl border border-white/10 bg-black/20 p-3 text-xs leading-5 text-white/45">
                      {event.termsText}
                    </div>
                  ) : null}
                </div>
              </label>
            </div>

            {event.allowCoupons ? (
              <div className="mt-4 rounded-[22px] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
                <label>
                  <span className="mb-2 block text-[10px] font-black uppercase tracking-[0.13em] text-white/50">
                    Coupon Code
                  </span>

                  <input
                    value={draft.couponCode ?? ""}
                    onChange={(inputEvent) =>
                      setCouponCode(inputEvent.target.value)
                    }
                    maxLength={64}
                    placeholder="Enter coupon code"
                    className="h-12 w-full rounded-[16px] border border-white/10 bg-white/[0.045] px-4 text-sm uppercase text-white outline-none placeholder:text-white/30 focus:border-cyan-300/30"
                  />
                </label>
              </div>
            ) : null}

            {submitError ? (
              <div className="mt-4 rounded-[18px] border border-red-300/20 bg-red-300/[0.06] p-4">
                <p className="text-sm font-bold text-red-100">{submitError}</p>
              </div>
            ) : null}
          </>
        );

      default:
        return null;
    }
  }

  return (
    <RegistrationLayout
      eyebrow={
        event.organization?.abbreviation ||
        event.organization?.name ||
        "Race Registration"
      }
      title={`Register for ${event.name}`}
      description="Complete each step below. Your progress is saved on this device so you can safely return before submitting."
      backHref={`/registration/events/${event.slug}`}
      backLabel="Back to Event"
    >
      <div data-registration-flow-top className="scroll-mt-6 space-y-5">
        <RegistrationProgress
          currentStep={draft.currentStep}
          highestCompletedStep={highestCompletedStep}
          onStepSelect={selectExistingStep}
        />

        <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0">
            <div className="rounded-[28px] border border-cyan-300/10 bg-[#050D18]/82 p-4 shadow-[0_24px_75px_rgba(0,0,0,0.24)] sm:p-6">
              {renderStep()}
            </div>
          </div>

          <div className="hidden xl:block">
            <div className="sticky top-5">
              <RegistrationSummary event={event} draft={draft} />
            </div>
          </div>
        </div>

        <div className="xl:hidden">
          <RegistrationSummary event={event} draft={draft} compact />
        </div>

        <div className="sticky bottom-3 z-30 rounded-[24px] border border-cyan-300/12 bg-[#07111F]/95 p-3 shadow-[0_24px_70px_rgba(0,0,0,0.42)] backdrop-blur-xl sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goBack}
              disabled={submitting}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-4 text-[10px] font-black uppercase tracking-[0.14em] text-white/65 transition hover:bg-white/10 hover:text-white disabled:cursor-wait disabled:opacity-60 sm:px-5"
            >
              <ArrowLeft className="h-4 w-4" />

              <span className="hidden sm:inline">
                {draft.currentStep === 1 ? "Back to Event" : "Previous"}
              </span>

              <span className="sm:hidden">Back</span>
            </button>

            <div className="hidden text-center sm:block">
              <p className="text-[9px] font-black uppercase tracking-[0.13em] text-white/35">
                Step {draft.currentStep} of 6
              </p>

              <p className="mt-1 text-xs text-white/55">
                Progress saves automatically
              </p>
            </div>

            {draft.currentStep < 6 ? (
              <button
                type="button"
                onClick={continueToNextStep}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#FF6B35] px-5 text-[10px] font-black uppercase tracking-[0.14em] text-white shadow-[0_0_28px_rgba(255,107,53,0.2)] transition hover:bg-[#ff7c4d] sm:px-6"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting || !draft.termsAccepted}
                onClick={() => {
                  void handleSubmitRegistration();
                }}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-cyan-300 px-5 text-[10px] font-black uppercase tracking-[0.14em] text-[#06111d] shadow-[0_0_28px_rgba(34,211,238,0.2)] transition hover:bg-cyan-200 disabled:cursor-wait disabled:opacity-60 sm:px-6"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Submit Registration
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </RegistrationLayout>
  );
}

export default function RegistrationFlowPage({
  eventSlug,
}: RegistrationFlowPageProps) {
  const [event, setEvent] = useState<RegistrationEvent | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadEvent() {
      try {
        setLoading(true);
        setError(null);

        const result = await getRegistrationEventBySlug(eventSlug);

        if (cancelled) {
          return;
        }

        setEvent(result);
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Unable to load registration.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadEvent();

    return () => {
      cancelled = true;
    };
  }, [eventSlug]);

  if (loading) {
    return (
      <RegistrationLayout hideHeader>
        <div className="grid min-h-[70vh] place-items-center rounded-[28px] border border-cyan-300/10 bg-[#07111F]/75">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-cyan-200" />

            <p className="mt-3 text-sm font-bold text-white/50">
              Preparing registration...
            </p>
          </div>
        </div>
      </RegistrationLayout>
    );
  }

  if (error || !event) {
    return (
      <RegistrationLayout
        eyebrow="Race Registration"
        title="Registration unavailable"
        description={
          error || "The requested event registration could not be found."
        }
        backHref="/registration/events"
        backLabel="All Events"
      >
        <div className="rounded-[28px] border border-red-300/15 bg-red-950/20 p-8 text-center">
          <p className="text-sm text-red-100/70">
            Return to the event directory and select another event.
          </p>
        </div>
      </RegistrationLayout>
    );
  }

  return (
    <RegistrationDraftProvider event={event}>
      <RegistrationFlowContent />
    </RegistrationDraftProvider>
  );
}
