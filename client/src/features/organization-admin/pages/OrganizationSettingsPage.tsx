import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Loader2,
  Save,
  Settings2,
  ShieldCheck,
} from "lucide-react";
import { OrganizationAdminLayout } from "../components/OrganizationAdminLayout";
import { useOrganizationEvents } from "../hooks/useOrganizationRegistrations";
import {
  useCreateRegistrationEventSettings,
  useRaceScheduleSettings,
  useRegistrationEventConfiguration,
  useUpdateRaceScheduleSettings,
  useUpdateRegistrationEventSettings,
} from "../hooks/useOrganizationSettings";
import type {
  RaceScheduleSettings,
  RegistrationEventSettings,
} from "../types/organizationSettings";

type Props = {
  organizationId: string;
};

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.025] p-4">
      <div>
        <div className="text-sm font-black text-white">{label}</div>

        {description ? (
          <div className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </div>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 shrink-0 rounded-full transition ${
          checked ? "bg-cyan-300" : "bg-white/10"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
      {children}
    </label>
  );
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}

export default function OrganizationSettingsPage({ organizationId }: Props) {
  const eventsQuery = useOrganizationEvents(organizationId);

  const events = eventsQuery.data ?? [];

  const [selectedEventId, setSelectedEventId] = useState("");

  const selectedEvent =
    events.find((event) => event.id === selectedEventId) ?? null;

  const [registrationForm, setRegistrationForm] =
    useState<RegistrationEventSettings | null>(null);

  const [scheduleForm, setScheduleForm] = useState<RaceScheduleSettings | null>(
    null,
  );

  const [registrationSaved, setRegistrationSaved] = useState(false);

  const [scheduleSaved, setScheduleSaved] = useState(false);

  useEffect(() => {
    if (!selectedEventId && events.length) {
      setSelectedEventId(events[0].id);
    }
  }, [events, selectedEventId]);

  const registrationQuery = useRegistrationEventConfiguration(selectedEventId);

  const scheduleQuery = useRaceScheduleSettings(selectedEventId);

  const createRegistrationMutation =
    useCreateRegistrationEventSettings(selectedEventId);

  const updateRegistrationMutation =
    useUpdateRegistrationEventSettings(selectedEventId);

  const updateScheduleMutation = useUpdateRaceScheduleSettings(selectedEventId);

  const hasRegistrationSettings = !!registrationQuery.data?.settings;

  useEffect(() => {
    const data = registrationQuery.data;

    if (!data) {
      setRegistrationForm(null);
      return;
    }

    const settings = data.settings ?? data.registrationSettings ?? null;

    if (!settings) {
      setRegistrationForm(null);
      return;
    }

    setRegistrationForm({
      publicSlug: settings.publicSlug ?? "",

      isRegistrationEnabled: settings.isRegistrationEnabled ?? false,

      registrationOpensAt: settings.registrationOpensAt ?? null,

      registrationClosesAt: settings.registrationClosesAt ?? null,

      allowOnlinePayment: settings.allowOnlinePayment ?? true,

      allowCashPayment: settings.allowCashPayment ?? false,

      allowManualPayment: settings.allowManualPayment ?? false,

      allowCoupons: settings.allowCoupons ?? true,

      allowWaitlist: settings.allowWaitlist ?? true,

      showPublicEntryList: settings.showPublicEntryList ?? true,

      showPendingCashEntries: settings.showPendingCashEntries ?? false,

      requireAccount: settings.requireAccount ?? true,

      maxClassesPerRegistration: settings.maxClassesPerRegistration ?? 10,

      platformFeeFixedCents: settings.platformFeeFixedCents ?? 0,

      platformFeeBasisPoints: settings.platformFeeBasisPoints ?? 0,

      currency: settings.currency ?? "USD",

      termsText: settings.termsText ?? null,

      refundPolicyText: settings.refundPolicyText ?? null,

      confirmationMessage: settings.confirmationMessage ?? null,
    });
  }, [registrationQuery.data]);

  useEffect(() => {
    if (!scheduleQuery.data) {
      return;
    }

    const settings = scheduleQuery.data;

    setScheduleForm({
      defaultRacesPerClass: settings.defaultRacesPerClass ?? 2,

      minimumRestRaceGap: settings.minimumRestRaceGap ?? 1,

      suggestClassMerges: settings.suggestClassMerges ?? true,

      smallClassRacerThreshold: settings.smallClassRacerThreshold ?? 3,

      maximumCombinedRacerCount: settings.maximumCombinedRacerCount ?? 20,

      maximumClassesPerCombinedRace:
        settings.maximumClassesPerCombinedRace ?? 2,

      insertLunchBreak: settings.insertLunchBreak ?? true,

      lunchBreakLabel: settings.lunchBreakLabel ?? "Lunch Break",

      lunchBreakDurationMinutes: settings.lunchBreakDurationMinutes ?? 60,

      allowConflictOverride: settings.allowConflictOverride ?? false,
    });
  }, [scheduleQuery.data]);

  const setupRegistration = async () => {
    if (!selectedEventId || !selectedEvent) {
      return;
    }

    const publicSlug =
      slugify(selectedEvent.name) || `event-${selectedEventId.slice(0, 8)}`;

    await createRegistrationMutation.mutateAsync({
      publicSlug,

      isRegistrationEnabled: false,

      registrationOpensAt: null,
      registrationClosesAt: null,

      allowOnlinePayment: true,
      allowCashPayment: false,
      allowManualPayment: true,

      allowCoupons: true,
      allowWaitlist: false,

      showPublicEntryList: true,
      showPendingCashEntries: false,

      requireAccount: true,

      maxClassesPerRegistration: 10,

      platformFeeFixedCents: 0,
      platformFeeBasisPoints: 0,

      currency: "USD",

      termsText: null,
      refundPolicyText: null,
      confirmationMessage: null,
    });
  };

  const saveRegistration = async () => {
    if (!registrationForm) {
      return;
    }

    setRegistrationSaved(false);

    await updateRegistrationMutation.mutateAsync({
      ...registrationForm,

      currency: registrationForm.currency?.trim().toUpperCase(),
    });

    setRegistrationSaved(true);
  };

  const saveSchedule = async () => {
    if (!scheduleForm) {
      return;
    }

    setScheduleSaved(false);

    await updateScheduleMutation.mutateAsync(scheduleForm);

    setScheduleSaved(true);
  };

  const loading = eventsQuery.isLoading || registrationQuery.isLoading;

  return (
    <OrganizationAdminLayout organizationId={organizationId}>
      <section>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[#FFB199]">
              Administration
            </div>

            <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] text-white sm:text-3xl">
              Settings
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
              Configure registration behavior, payments, public visibility,
              racer limits, race generation, safety spacing, and event-day
              scheduling defaults.
            </p>
          </div>

          <div className="w-full xl:w-[360px]">
            <FieldLabel>Event</FieldLabel>

            <select
              value={selectedEventId}
              onChange={(event) => {
                setSelectedEventId(event.target.value);

                setRegistrationSaved(false);

                setScheduleSaved(false);
              }}
              className="h-12 w-full rounded-2xl border border-white/10 bg-[#07111F] px-4 text-sm font-bold text-white outline-none"
            >
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="mt-8 flex min-h-72 items-center justify-center rounded-[28px] border border-white/10 bg-white/[0.025]">
            <Loader2 className="h-7 w-7 animate-spin text-cyan-200" />
          </div>
        ) : !selectedEventId ? (
          <div className="mt-8 rounded-[28px] border border-dashed border-white/10 p-10 text-center">
            <Settings2 className="mx-auto h-7 w-7 text-slate-600" />

            <h3 className="mt-4 font-black text-white">No event available</h3>
          </div>
        ) : !hasRegistrationSettings ? (
          <div className="mt-8 overflow-hidden rounded-[28px] border border-cyan-300/15 bg-cyan-300/[0.035]">
            <div className="p-6 sm:p-7">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-300/10">
                <CreditCard className="h-5 w-5 text-cyan-200" />
              </div>

              <div className="mt-5 text-[9px] font-black uppercase tracking-[0.18em] text-cyan-200">
                Registration Setup
              </div>

              <h3 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] text-white">
                Registration not configured
              </h3>

              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
                {selectedEvent?.name ?? "This event"} exists as an organization
                event, but race registration has not been configured yet. Create
                the registration setup before adding race days, classes, opening
                public registration, or generating a race schedule.
              </p>

              {createRegistrationMutation.isError ? (
                <div className="mt-5 rounded-2xl border border-red-300/15 bg-red-300/[0.05] p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-200" />

                    <p className="text-xs leading-5 text-red-100/70">
                      {createRegistrationMutation.error instanceof Error
                        ? createRegistrationMutation.error.message
                        : "Unable to create registration settings."}
                    </p>
                  </div>
                </div>
              ) : null}

              <button
                type="button"
                onClick={setupRegistration}
                disabled={createRegistrationMutation.isPending}
                className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-cyan-300 px-6 text-[10px] font-black uppercase tracking-[0.14em] text-[#04101C] transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {createRegistrationMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Set Up Registration
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            {registrationForm ? (
              <section className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.025]">
                <header className="border-b border-white/10 p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300/10">
                      <CreditCard className="h-5 w-5 text-cyan-200" />
                    </div>

                    <div>
                      <div className="text-[9px] font-black uppercase tracking-[0.16em] text-cyan-200">
                        Registration
                      </div>

                      <h3 className="mt-1 text-xl font-black text-white">
                        Registration Settings
                      </h3>

                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        Controls how racers register, pay, join waitlists and
                        view event entries.
                      </p>
                    </div>
                  </div>
                </header>

                <div className="space-y-7 p-5 sm:p-6">
                  <div className="grid gap-4 lg:grid-cols-3">
                    <div className="lg:col-span-2">
                      <FieldLabel>Public Registration Slug</FieldLabel>

                      <input
                        value={registrationForm.publicSlug}
                        onChange={(event) =>
                          setRegistrationForm({
                            ...registrationForm,

                            publicSlug: event.target.value,
                          })
                        }
                        maxLength={160}
                        className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none"
                      />
                    </div>

                    <div>
                      <FieldLabel>Currency</FieldLabel>

                      <input
                        value={registrationForm.currency ?? "USD"}
                        onChange={(event) =>
                          setRegistrationForm({
                            ...registrationForm,

                            currency: event.target.value
                              .toUpperCase()
                              .slice(0, 3),
                          })
                        }
                        maxLength={3}
                        className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm font-black uppercase text-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <Toggle
                      checked={!!registrationForm.isRegistrationEnabled}
                      onChange={(value) =>
                        setRegistrationForm({
                          ...registrationForm,

                          isRegistrationEnabled: value,
                        })
                      }
                      label="Registration Enabled"
                      description="Allow racers to submit registrations."
                    />

                    <Toggle
                      checked={!!registrationForm.requireAccount}
                      onChange={(value) =>
                        setRegistrationForm({
                          ...registrationForm,

                          requireAccount: value,
                        })
                      }
                      label="Require Corner League Account"
                      description="Require registrants to sign into Corner League."
                    />

                    <Toggle
                      checked={!!registrationForm.allowOnlinePayment}
                      onChange={(value) =>
                        setRegistrationForm({
                          ...registrationForm,

                          allowOnlinePayment: value,
                        })
                      }
                      label="Online Payments"
                      description="Allow Stripe checkout."
                    />

                    <Toggle
                      checked={!!registrationForm.allowCashPayment}
                      onChange={(value) =>
                        setRegistrationForm({
                          ...registrationForm,

                          allowCashPayment: value,
                        })
                      }
                      label="Cash Payments"
                      description="Allow racers to choose cash payment."
                    />

                    <Toggle
                      checked={!!registrationForm.allowManualPayment}
                      onChange={(value) =>
                        setRegistrationForm({
                          ...registrationForm,

                          allowManualPayment: value,
                        })
                      }
                      label="Manual Payments"
                      description="Permit organizer-verified external payments."
                    />

                    <Toggle
                      checked={!!registrationForm.allowCoupons}
                      onChange={(value) =>
                        setRegistrationForm({
                          ...registrationForm,

                          allowCoupons: value,
                        })
                      }
                      label="Coupons"
                      description="Allow coupon codes during registration."
                    />

                    <Toggle
                      checked={!!registrationForm.allowWaitlist}
                      onChange={(value) =>
                        setRegistrationForm({
                          ...registrationForm,

                          allowWaitlist: value,
                        })
                      }
                      label="Waitlists"
                      description="Allow full classes to accept waitlisted racers."
                    />

                    <Toggle
                      checked={!!registrationForm.showPublicEntryList}
                      onChange={(value) =>
                        setRegistrationForm({
                          ...registrationForm,

                          showPublicEntryList: value,
                        })
                      }
                      label="Public Entry List"
                      description="Show registered racers publicly."
                    />

                    <Toggle
                      checked={!!registrationForm.showPendingCashEntries}
                      onChange={(value) =>
                        setRegistrationForm({
                          ...registrationForm,

                          showPendingCashEntries: value,
                        })
                      }
                      label="Show Pending Cash Entries"
                      description="Include unpaid cash registrations on the public roster."
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <FieldLabel>Max Classes Per Registration</FieldLabel>

                      <input
                        type="number"
                        min={1}
                        value={registrationForm.maxClassesPerRegistration ?? 1}
                        onChange={(event) =>
                          setRegistrationForm({
                            ...registrationForm,

                            maxClassesPerRegistration: Number(
                              event.target.value,
                            ),
                          })
                        }
                        className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none"
                      />
                    </div>

                    <div>
                      <FieldLabel>Fixed Platform Fee ($)</FieldLabel>

                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={(
                          Number(registrationForm.platformFeeFixedCents ?? 0) /
                          100
                        ).toFixed(2)}
                        onChange={(event) =>
                          setRegistrationForm({
                            ...registrationForm,

                            platformFeeFixedCents: Math.round(
                              Number(event.target.value) * 100,
                            ),
                          })
                        }
                        className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none"
                      />
                    </div>

                    <div>
                      <FieldLabel>Platform Fee (%)</FieldLabel>

                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="0.01"
                        value={
                          Number(registrationForm.platformFeeBasisPoints ?? 0) /
                          100
                        }
                        onChange={(event) =>
                          setRegistrationForm({
                            ...registrationForm,

                            platformFeeBasisPoints: Math.round(
                              Number(event.target.value) * 100,
                            ),
                          })
                        }
                        className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <FieldLabel>Registration Opens</FieldLabel>

                      <input
                        type="datetime-local"
                        value={
                          registrationForm.registrationOpensAt
                            ? registrationForm.registrationOpensAt.slice(0, 16)
                            : ""
                        }
                        onChange={(event) =>
                          setRegistrationForm({
                            ...registrationForm,

                            registrationOpensAt: event.target.value || null,
                          })
                        }
                        className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none"
                      />
                    </div>

                    <div>
                      <FieldLabel>Registration Closes</FieldLabel>

                      <input
                        type="datetime-local"
                        value={
                          registrationForm.registrationClosesAt
                            ? registrationForm.registrationClosesAt.slice(0, 16)
                            : ""
                        }
                        onChange={(event) =>
                          setRegistrationForm({
                            ...registrationForm,

                            registrationClosesAt: event.target.value || null,
                          })
                        }
                        className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div>
                      <FieldLabel>Terms</FieldLabel>

                      <textarea
                        value={registrationForm.termsText ?? ""}
                        onChange={(event) =>
                          setRegistrationForm({
                            ...registrationForm,

                            termsText: event.target.value || null,
                          })
                        }
                        rows={4}
                        className="w-full resize-y rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white outline-none"
                      />
                    </div>

                    <div>
                      <FieldLabel>Refund Policy</FieldLabel>

                      <textarea
                        value={registrationForm.refundPolicyText ?? ""}
                        onChange={(event) =>
                          setRegistrationForm({
                            ...registrationForm,

                            refundPolicyText: event.target.value || null,
                          })
                        }
                        rows={4}
                        className="w-full resize-y rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white outline-none"
                      />
                    </div>

                    <div>
                      <FieldLabel>Confirmation Message</FieldLabel>

                      <textarea
                        value={registrationForm.confirmationMessage ?? ""}
                        onChange={(event) =>
                          setRegistrationForm({
                            ...registrationForm,

                            confirmationMessage: event.target.value || null,
                          })
                        }
                        rows={3}
                        className="w-full resize-y rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-3 border-t border-white/10 pt-5">
                    {registrationSaved ? (
                      <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-200">
                        <CheckCircle2 className="h-4 w-4" />
                        Saved
                      </div>
                    ) : null}

                    <button
                      type="button"
                      disabled={updateRegistrationMutation.isPending}
                      onClick={saveRegistration}
                      className="inline-flex h-11 items-center gap-2 rounded-full bg-cyan-300 px-5 text-[10px] font-black uppercase tracking-[0.12em] text-[#04101C] disabled:opacity-40"
                    >
                      {updateRegistrationMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Save Registration Settings
                    </button>
                  </div>
                </div>
              </section>
            ) : null}

            {scheduleForm ? (
              <section className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.025]">
                <header className="border-b border-white/10 p-5 sm:p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FFB199]/10">
                      <CalendarClock className="h-5 w-5 text-[#FFB199]" />
                    </div>

                    <div>
                      <div className="text-[9px] font-black uppercase tracking-[0.16em] text-[#FFB199]">
                        Race Operations
                      </div>

                      <h3 className="mt-1 text-xl font-black text-white">
                        Race Schedule Defaults
                      </h3>

                      <p className="mt-2 text-xs leading-5 text-slate-500">
                        Configure race repetition, racer-rest requirements,
                        automatic class merging and lunch-break generation.
                      </p>
                    </div>
                  </div>
                </header>

                <div className="space-y-7 p-5 sm:p-6">
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <div>
                      <FieldLabel>Default Races Per Class</FieldLabel>

                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={scheduleForm.defaultRacesPerClass ?? 2}
                        onChange={(event) =>
                          setScheduleForm({
                            ...scheduleForm,

                            defaultRacesPerClass: Number(event.target.value),
                          })
                        }
                        className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-white outline-none"
                      />
                    </div>

                    <div>
                      <FieldLabel>Minimum Rest Race Gap</FieldLabel>

                      <input
                        type="number"
                        min={0}
                        max={20}
                        value={scheduleForm.minimumRestRaceGap ?? 1}
                        onChange={(event) =>
                          setScheduleForm({
                            ...scheduleForm,

                            minimumRestRaceGap: Number(event.target.value),
                          })
                        }
                        className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-white outline-none"
                      />
                    </div>

                    <div>
                      <FieldLabel>Small Class Threshold</FieldLabel>

                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={scheduleForm.smallClassRacerThreshold ?? 3}
                        onChange={(event) =>
                          setScheduleForm({
                            ...scheduleForm,

                            smallClassRacerThreshold: Number(
                              event.target.value,
                            ),
                          })
                        }
                        className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-white outline-none"
                      />
                    </div>

                    <div>
                      <FieldLabel>Max Racers in Combined Race</FieldLabel>

                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={scheduleForm.maximumCombinedRacerCount ?? 20}
                        onChange={(event) =>
                          setScheduleForm({
                            ...scheduleForm,

                            maximumCombinedRacerCount: Number(
                              event.target.value,
                            ),
                          })
                        }
                        className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-white outline-none"
                      />
                    </div>

                    <div>
                      <FieldLabel>Max Classes Per Combined Race</FieldLabel>

                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={scheduleForm.maximumClassesPerCombinedRace ?? 2}
                        onChange={(event) =>
                          setScheduleForm({
                            ...scheduleForm,

                            maximumClassesPerCombinedRace: Number(
                              event.target.value,
                            ),
                          })
                        }
                        className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <Toggle
                      checked={!!scheduleForm.suggestClassMerges}
                      onChange={(value) =>
                        setScheduleForm({
                          ...scheduleForm,

                          suggestClassMerges: value,
                        })
                      }
                      label="Suggest Class Merges"
                      description="Allow the scheduler to identify small compatible classes."
                    />

                    <Toggle
                      checked={!!scheduleForm.insertLunchBreak}
                      onChange={(value) =>
                        setScheduleForm({
                          ...scheduleForm,

                          insertLunchBreak: value,
                        })
                      }
                      label="Automatically Insert Lunch"
                      description="Insert the configured lunch break into generated schedules."
                    />

                    <Toggle
                      checked={!!scheduleForm.allowConflictOverride}
                      onChange={(value) =>
                        setScheduleForm({
                          ...scheduleForm,

                          allowConflictOverride: value,
                        })
                      }
                      label="Allow Conflict Override"
                      description="Permit publishing high-severity racer-rest conflicts after organizer review."
                    />
                  </div>

                  {scheduleForm.insertLunchBreak ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <FieldLabel>Lunch Break Label</FieldLabel>

                        <input
                          value={scheduleForm.lunchBreakLabel ?? ""}
                          maxLength={120}
                          onChange={(event) =>
                            setScheduleForm({
                              ...scheduleForm,

                              lunchBreakLabel: event.target.value,
                            })
                          }
                          className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none"
                        />
                      </div>

                      <div>
                        <FieldLabel>Lunch Duration (minutes)</FieldLabel>

                        <input
                          type="number"
                          min={1}
                          max={240}
                          value={scheduleForm.lunchBreakDurationMinutes ?? 60}
                          onChange={(event) =>
                            setScheduleForm({
                              ...scheduleForm,

                              lunchBreakDurationMinutes: Number(
                                event.target.value,
                              ),
                            })
                          }
                          className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-white outline-none"
                        />
                      </div>
                    </div>
                  ) : null}

                  <div className="rounded-2xl border border-amber-300/15 bg-amber-300/[0.04] p-4">
                    <div className="flex gap-3">
                      <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />

                      <p className="text-xs leading-5 text-amber-100/70">
                        The minimum racer-rest race gap is a safety constraint
                        used by schedule generation and validation. Reducing it
                        can create more back-to-back race situations for racers
                        entered in multiple classes.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-3 border-t border-white/10 pt-5">
                    {scheduleSaved ? (
                      <div className="inline-flex items-center gap-2 text-xs font-bold text-emerald-200">
                        <CheckCircle2 className="h-4 w-4" />
                        Saved
                      </div>
                    ) : null}

                    <button
                      type="button"
                      disabled={updateScheduleMutation.isPending}
                      onClick={saveSchedule}
                      className="inline-flex h-11 items-center gap-2 rounded-full bg-[#FFB199] px-5 text-[10px] font-black uppercase tracking-[0.12em] text-[#07111F] disabled:opacity-40"
                    >
                      {updateScheduleMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      Save Schedule Settings
                    </button>
                  </div>
                </div>
              </section>
            ) : null}

            {updateRegistrationMutation.error ||
            updateScheduleMutation.error ? (
              <div className="flex items-start gap-3 rounded-2xl border border-red-300/15 bg-red-300/[0.05] p-4">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-red-200" />

                <p className="text-xs leading-5 text-red-100/70">
                  {(updateRegistrationMutation.error as any)?.message ??
                    (updateScheduleMutation.error as any)?.message ??
                    "Unable to save settings."}
                </p>
              </div>
            ) : null}
          </div>
        )}
      </section>
    </OrganizationAdminLayout>
  );
}
