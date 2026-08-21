// pages/updateEventPage.tsx
import React, { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useLocation, useRoute } from "wouter";
import { apiFetch } from "@/lib/apiClient";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  CreditCard,
  Layers3,
  Save,
  Trophy,
  ChevronLeft,
  Flag,
  AlertTriangle,
  Loader2,
  Users,
  ExternalLink,
  LockKeyhole,
  Radio,
  RotateCcw,
} from "lucide-react";
import RaceClassEditor from "./raceClassEditor";
import {
  LocationAutocomplete,
  type LocationSelection,
} from "@/components/LocationAutocomplete";
import {
  useRegistrationEventConfiguration,
  useSyncRegistrationEventDays,
} from "@/features/organization-admin/hooks/useOrganizationRaceDays";
import {
  useGenerateRaceSchedule,
  useInitializeRaceScheduleDay,
  useRaceScheduleDay,
  useUpdateRaceScheduleClassConfig,
} from "@/features/organization-admin/hooks/useOrganizationRaceSchedule";
import { RaceScheduleEditor } from "@/features/organization-admin/components/RaceScheduleEditor";
import { RaceSchedulePublishPanel } from "@/features/organization-admin/components/RaceSchedulePublishPanel";
import type { RaceScheduleClassConfig } from "@/features/organization-admin/types/organizationRaceSchedule";
import {
  useCreateRegistrationEventSettings,
  useUpdateRegistrationEventSettings,
} from "@/features/organization-admin/hooks/useOrganizationSettings";
import type { RegistrationEventSettings } from "@/features/organization-admin/types/organizationSettings";
import { RaceScheduleSettingsPanel } from "@/features/organization-admin/components/RaceScheduleSettingsPanel";

type SportEnum = "jet ski";

const SPORT_OPTIONS: SportEnum[] = ["jet ski"];

type UpdateEventPageProps = {
  organizationId?: string;
  eventId?: string;
};

function classNameForScheduleConfig(config: RaceScheduleClassConfig) {
  return (
    config.eventClass.displayName?.trim() ||
    config.eventClass.division?.name?.trim() ||
    "Unnamed Class"
  );
}

function RaceDayClassCard({
  config,
  dayId,
}: {
  config: RaceScheduleClassConfig;
  dayId: string;
}) {
  const mutation = useUpdateRaceScheduleClassConfig(dayId);

  const racerCount = config.racerCount ?? config.participants?.length ?? 0;

  const updateRaceCount = (raceCount: number) => {
    mutation.mutate({
      classConfigId: config.id,
      input: {
        raceCount,
      },
    });
  };

  return (
    <article
      className={`rounded-[22px] border p-4 transition ${
        config.raceCount > 0
          ? "border-cyan-300/15 bg-cyan-300/[0.045]"
          : "border-white/10 bg-white/[0.025]"
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[9px] font-black uppercase tracking-[0.15em] text-[#FFB199]">
            Event Class
          </div>

          <h4 className="mt-1 truncate text-base font-black text-white">
            {classNameForScheduleConfig(config)}
          </h4>

          <div className="mt-2 flex items-center gap-1.5 text-xs text-white/40">
            <Users className="h-3.5 w-3.5" />
            {racerCount} racer
            {racerCount === 1 ? "" : "s"}
            {config.participantSource === "registration"
              ? " · Registration"
              : config.participantSource === "historical_match"
                ? " · Historical class"
                : ""}
          </div>
        </div>

        {mutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin text-cyan-200" />
        ) : (
          <span
            className={`rounded-full border px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.12em] ${
              config.raceCount > 0
                ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-200"
                : "border-white/10 bg-white/[0.04] text-white/35"
            }`}
          >
            {config.raceCount > 0 ? "Racing Today" : "Off Today"}
          </span>
        )}
      </div>

      <div className="mt-5">
        <div className="text-[9px] font-black uppercase tracking-[0.14em] text-white/35">
          Races / Motos Today
        </div>

        <div className="mt-2 grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map((count) => (
            <button
              key={count}
              type="button"
              disabled={mutation.isPending}
              onClick={() => updateRaceCount(count)}
              className={`h-10 rounded-xl border text-sm font-black transition ${
                config.raceCount === count
                  ? "border-cyan-300 bg-cyan-300 text-[#04101C]"
                  : "border-white/10 bg-white/[0.035] text-white/55 hover:bg-white/[0.07]"
              }`}
            >
              {count === 0 ? "Off" : count}
            </button>
          ))}
        </div>

        <p className="mt-2 text-[10px] leading-5 text-white/30">
          Set Off when this class does not compete on this race day.
        </p>
      </div>
    </article>
  );
}

function RaceDayWorkspace({
  day,
  eventId,
  onBack,
}: {
  day: any;
  eventId: string;
  onBack: () => void;
}) {
  const dayQuery = useRaceScheduleDay(day.id);

  const generateMutation = useGenerateRaceSchedule(day.id);

  const dayData: any = dayQuery.data;

  const schedule =
    dayData?.schedule ??
    dayData?.data?.schedule ??
    dayData?.result?.schedule ??
    (dayData?.id ? dayData : null) ??
    (dayData?.data?.id ? dayData.data : null) ??
    (dayData?.result?.id ? dayData.result : null);

  const classConfigs: RaceScheduleClassConfig[] =
    schedule?.classConfigs ??
    dayData?.classConfigs ??
    dayData?.data?.classConfigs ??
    dayData?.result?.classConfigs ??
    [];

  const enabledClasses = classConfigs.filter(
    (config: RaceScheduleClassConfig) => config.raceCount > 0,
  );

  const canGenerateRaceList =
    enabledClasses.length > 0 && !!schedule?.id && !generateMutation.isPending;

  const notInitialized = dayQuery.isError;

  const generateRaceList = () => {
    if (!schedule?.id) {
      return;
    }

    generateMutation.mutate(schedule.id, {
      onSuccess: () => {
        dayQuery.refetch();
      },
    });
  };

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] font-black uppercase tracking-[0.13em] text-white/60 transition hover:bg-white/[0.08] hover:text-white"
      >
        <ChevronLeft className="h-4 w-4" />
        All Race Days
      </button>

      <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-200">
            Race Day
          </div>

          <h2 className="mt-2 text-3xl font-black uppercase tracking-[-0.04em] text-white">
            {day.label}
          </h2>

          <p className="mt-2 text-sm text-white/45">
            {new Date(`${day.eventDate}T00:00:00`).toLocaleDateString(
              undefined,
              {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              },
            )}
          </p>
        </div>

        {!notInitialized && schedule ? (
          <div className="flex gap-2">
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-[9px] font-black uppercase tracking-[0.12em] text-white/50">
              {enabledClasses.length} Classes Racing
            </span>

            <span className="rounded-full border border-cyan-300/15 bg-cyan-300/[0.06] px-3 py-2 text-[9px] font-black uppercase tracking-[0.12em] text-cyan-100">
              Draft Schedule
            </span>
          </div>
        ) : null}
      </div>

      <RaceScheduleSettingsPanel
        eventId={eventId}
        onChanged={() => {
          dayQuery.refetch();
        }}
      />

      {dayQuery.isLoading ? (
        <div className="mt-6 flex min-h-56 items-center justify-center rounded-[24px] border border-white/10 bg-white/[0.025]">
          <Loader2 className="h-6 w-6 animate-spin text-cyan-200" />
        </div>
      ) : notInitialized ? (
        <div className="mt-6 rounded-[24px] border border-red-300/15 bg-red-300/[0.04] p-6">
          <AlertTriangle className="h-6 w-6 text-red-200" />

          <h3 className="mt-4 text-xl font-black uppercase text-white">
            Unable to Load Race Day
          </h3>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/45">
            This race day could not be loaded. Return to the race-day list and
            try opening it again.
          </p>

          <button
            type="button"
            onClick={onBack}
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-5 text-[10px] font-black uppercase tracking-[0.14em] text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Race Days
          </button>
        </div>
      ) : (
        <>
          <section className="mt-7">
            <div>
              <div className="text-[9px] font-black uppercase tracking-[0.18em] text-[#FFB199]">
                Daily Competition
              </div>

              <h3 className="mt-2 text-xl font-black uppercase text-white">
                Classes Racing Today
              </h3>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-white/40">
                Event classes are defined once in Classes & Results. Here you
                decide whether each class runs on this day and how many races or
                motos it receives.
              </p>
            </div>

            {classConfigs.length === 0 ? (
              <div className="mt-5 rounded-[22px] border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
                <div className="text-sm font-black text-white">
                  No event classes found
                </div>

                <p className="mt-2 text-xs text-white/35">
                  Add classes under Classes & Results first.
                </p>
              </div>
            ) : (
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {classConfigs.map((config) => (
                  <RaceDayClassCard
                    key={config.id}
                    config={config}
                    dayId={day.id}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="mt-8">
            <div className="rounded-[24px] border border-cyan-300/10 bg-black/15 p-5 sm:p-6">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <div className="text-[9px] font-black uppercase tracking-[0.16em] text-cyan-200/60">
                    Daily Schedule
                  </div>

                  <h3 className="mt-2 text-xl font-black uppercase text-white">
                    Race List
                  </h3>

                  <p className="mt-2 max-w-3xl text-xs leading-6 text-white/40">
                    Generate the race order from today's enabled classes, then
                    manually adjust the schedule, insert practice sessions,
                    lunch, meetings, or other custom schedule blocks.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={!canGenerateRaceList}
                  onClick={generateRaceList}
                  className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-cyan-300 px-5 text-[10px] font-black uppercase tracking-[0.13em] text-[#04101C] transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-35"
                >
                  {generateMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Flag className="h-4 w-4" />
                  )}

                  {schedule?.generatedAt
                    ? "Regenerate Race List"
                    : "Generate Race List"}
                </button>
              </div>

              {enabledClasses.length === 0 ? (
                <div className="mt-5 rounded-[18px] border border-amber-300/15 bg-amber-300/[0.05] p-4 text-xs leading-6 text-amber-100/60">
                  Enable at least one class for this race day before generating
                  the race list.
                </div>
              ) : null}
            </div>

            {schedule?.slots?.length ? (
              <>
                <div className="mt-6">
                  <RaceScheduleEditor
                    dayId={day.id}
                    schedule={schedule}
                    classConfigs={classConfigs}
                    minimumRestRaceGap={
                      dayData?.minimumRestRaceGap ??
                      schedule?.minimumRestRaceGap ??
                      2
                    }
                    onChanged={() => {
                      dayQuery.refetch();
                    }}
                  />
                </div>

                <div className="mt-6">
                  <RaceSchedulePublishPanel
                    dayId={day.id}
                    schedule={schedule}
                    onChanged={() => {
                      dayQuery.refetch();
                    }}
                  />
                </div>
              </>
            ) : (
              <div className="mt-5 rounded-[22px] border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
                <div className="text-sm font-black text-white">
                  No race list generated yet
                </div>

                <p className="mt-2 text-xs leading-6 text-white/35">
                  Configure today's classes above, then generate the race order.
                </p>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function getRegistrationAvailability(
  settings: RegistrationEventSettings | null | undefined,
) {
  if (!settings) {
    return {
      status: "not-configured" as const,
      label: "Not Configured",
      description: "Registration has not been configured for this event.",
    };
  }

  if (settings.registrationAvailabilityOverride === "open") {
    return {
      status: "open" as const,
      label: "Open",
      description: "Registration has been manually opened by the organizer.",
    };
  }

  if (settings.registrationAvailabilityOverride === "closed") {
    return {
      status: "closed" as const,
      label: "Closed",
      description: "Registration has been manually closed by the organizer.",
    };
  }

  if (!settings.isRegistrationEnabled) {
    return {
      status: "closed" as const,
      label: "Closed",
      description: "Scheduled registration is currently disabled.",
    };
  }

  const now = Date.now();

  const opensAt = settings.registrationOpensAt
    ? new Date(settings.registrationOpensAt).getTime()
    : null;

  const closesAt = settings.registrationClosesAt
    ? new Date(settings.registrationClosesAt).getTime()
    : null;

  if (opensAt && opensAt > now) {
    return {
      status: "upcoming" as const,
      label: "Upcoming",
      description: "Registration will open automatically on schedule.",
    };
  }

  if (closesAt && closesAt <= now) {
    return {
      status: "closed" as const,
      label: "Closed",
      description: "The configured registration window has ended.",
    };
  }

  return {
    status: "open" as const,
    label: "Open",
    description: "Registration is currently following its scheduled window.",
  };
}

function formatRegistrationDate(value?: string | null) {
  if (!value) {
    return "No date set";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function RegistrationWorkspace({
  eventId,
  eventName,
  settings,
  loading,
  onChanged,
}: {
  eventId: string;
  eventName: string;
  settings: RegistrationEventSettings | null | undefined;
  loading: boolean;
  onChanged: () => void;
}) {
  const createMutation = useCreateRegistrationEventSettings(eventId);

  const updateMutation = useUpdateRegistrationEventSettings(eventId);

  const availability = getRegistrationAvailability(settings);

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const slugify = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 160);

  const setupRegistration = async () => {
    const publicSlug = slugify(eventName) || `event-${eventId.slice(0, 8)}`;

    await createMutation.mutateAsync({
      publicSlug,

      isRegistrationEnabled: false,

      registrationAvailabilityOverride: null,

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

    onChanged();
  };

  const setAvailabilityOverride = async (value: "open" | "closed" | null) => {
    await updateMutation.mutateAsync({
      registrationAvailabilityOverride: value,
    });

    onChanged();
  };

  if (loading) {
    return (
      <div className="mt-6 flex min-h-64 items-center justify-center rounded-[28px] border border-white/10 bg-white/[0.02]">
        <Loader2 className="h-6 w-6 animate-spin text-cyan-200" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="mt-6 rounded-[28px] border border-cyan-300/15 bg-cyan-300/[0.035] p-6 sm:p-8">
        <CreditCard className="h-7 w-7 text-cyan-200" />

        <div className="mt-5 text-[9px] font-black uppercase tracking-[0.18em] text-cyan-200">
          Registration Setup
        </div>

        <h3 className="mt-2 text-2xl font-black uppercase text-white">
          Registration Not Configured
        </h3>

        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/45">
          Create the registration configuration for this event. This does not
          publish registration or allow racers to register yet.
        </p>

        <button
          type="button"
          disabled={createMutation.isPending}
          onClick={setupRegistration}
          className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-cyan-300 px-5 text-[10px] font-black uppercase tracking-[0.14em] text-[#04101C] hover:bg-cyan-200 disabled:opacity-50"
        >
          {createMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CreditCard className="h-4 w-4" />
          )}
          Configure Registration
        </button>
      </div>
    );
  }

  const manuallyOverridden =
    settings.registrationAvailabilityOverride !== null &&
    settings.registrationAvailabilityOverride !== undefined;

  return (
    <div className="mt-6 space-y-5">
      <section
        className={`rounded-[28px] border p-6 sm:p-7 ${
          availability.status === "open"
            ? "border-emerald-300/20 bg-emerald-300/[0.045]"
            : availability.status === "upcoming"
              ? "border-cyan-300/15 bg-cyan-300/[0.035]"
              : "border-[#FFB199]/15 bg-[#FF6B35]/[0.035]"
        }`}
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  availability.status === "open"
                    ? "bg-emerald-300"
                    : availability.status === "upcoming"
                      ? "bg-cyan-300"
                      : "bg-[#FF8A66]"
                }`}
              />

              <div className="text-[9px] font-black uppercase tracking-[0.18em] text-white/45">
                Public Registration
              </div>
            </div>

            <h3 className="mt-3 text-2xl font-black uppercase text-white">
              {availability.label}
            </h3>

            <p className="mt-2 text-sm leading-6 text-white/45">
              {availability.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => setAvailabilityOverride("open")}
              className="inline-flex h-11 items-center gap-2 rounded-full bg-emerald-300 px-5 text-[9px] font-black uppercase tracking-[0.13em] text-emerald-950 transition hover:bg-emerald-200 disabled:opacity-50"
            >
              <Radio className="h-4 w-4" />
              Open Now
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={() => setAvailabilityOverride("closed")}
              className="inline-flex h-11 items-center gap-2 rounded-full border border-red-300/15 bg-red-300/[0.07] px-5 text-[9px] font-black uppercase tracking-[0.13em] text-red-100 transition hover:bg-red-300/10 disabled:opacity-50"
            >
              <LockKeyhole className="h-4 w-4" />
              Close Now
            </button>

            {manuallyOverridden ? (
              <button
                type="button"
                disabled={isSaving}
                onClick={() => setAvailabilityOverride(null)}
                className="inline-flex h-11 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 text-[9px] font-black uppercase tracking-[0.13em] text-white/60 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />
                Follow Schedule
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-[24px] border border-white/10 bg-white/[0.025] p-5">
          <div className="text-[9px] font-black uppercase tracking-[0.16em] text-cyan-200/60">
            Scheduled Window
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-[8px] font-black uppercase tracking-[0.14em] text-white/30">
                Opens
              </div>

              <div className="mt-2 text-sm font-bold text-white">
                {formatRegistrationDate(settings.registrationOpensAt)}
              </div>
            </div>

            <div>
              <div className="text-[8px] font-black uppercase tracking-[0.14em] text-white/30">
                Closes
              </div>

              <div className="mt-2 text-sm font-bold text-white">
                {formatRegistrationDate(settings.registrationClosesAt)}
              </div>
            </div>
          </div>

          {manuallyOverridden ? (
            <p className="mt-5 text-xs leading-5 text-amber-100/45">
              A manual availability override is active. These dates are
              preserved, but they do not currently determine whether
              registration is open.
            </p>
          ) : (
            <p className="mt-5 text-xs leading-5 text-white/35">
              Registration is currently following these configured dates.
            </p>
          )}
        </section>

        <section className="rounded-[24px] border border-white/10 bg-white/[0.025] p-5">
          <div className="text-[9px] font-black uppercase tracking-[0.16em] text-[#FFB199]">
            Public Registration Page
          </div>

          <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
            <div className="text-[8px] font-black uppercase tracking-[0.13em] text-white/30">
              Public Slug
            </div>

            <div className="mt-2 break-all text-sm font-bold text-white">
              {settings.publicSlug}
            </div>
          </div>

          <a
            href={`/registration/events/${encodeURIComponent(
              settings.publicSlug,
            )}`}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex h-11 items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.07] px-5 text-[9px] font-black uppercase tracking-[0.13em] text-cyan-100 transition hover:bg-cyan-300/10"
          >
            <ExternalLink className="h-4 w-4" />
            Preview Public Registration
          </a>
        </section>
      </div>
    </div>
  );
}

export default function UpdateEventPage({
  organizationId,
  eventId: eventIdProp,
}: UpdateEventPageProps = {}) {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Legacy Super Admin route:
  // /organization/events/:id
  const [, legacyParams] = useRoute("/organization/events/:id");

  // Organization admins receive the event id directly from App.tsx.
  const eventId = eventIdProp || legacyParams?.id || "";

  const eventListPath = organizationId
    ? `/organizations/${encodeURIComponent(organizationId)}/admin/events`
    : "/organization/event-list";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  type WorkspaceTab = "details" | "classes" | "registration" | "race-days";

  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>("details");
  const [selectedRaceDayId, setSelectedRaceDayId] = useState<string | null>(
    null,
  );

  const [openingRaceDayId, setOpeningRaceDayId] = useState<string | null>(null);
  const registrationConfigurationQuery =
    useRegistrationEventConfiguration(eventId);

  const syncRaceDaysMutation = useSyncRegistrationEventDays(eventId);
  const lastAutoSyncedEventIdRef = useRef<string | null>(null);

  const raceDays =
    registrationConfigurationQuery.data?.settings?.eventDays ?? [];

  const selectedRaceDay =
    raceDays.find((day: any) => day.id === selectedRaceDayId) ?? null;

  const initializeRaceDayMutation = useInitializeRaceScheduleDay();

  async function handleOpenRaceDay(dayId: string) {
    if (openingRaceDayId) {
      return;
    }

    setOpeningRaceDayId(dayId);

    /**
     * Enter the Race Day workspace immediately.
     */
    setSelectedRaceDayId(dayId);

    try {
      await initializeRaceDayMutation.mutateAsync(dayId);
    } catch (error: any) {
      console.error("Unable to initialize race day:", error);

      toast({
        variant: "destructive",
        title: "Unable to initialize race day",
        description:
          error?.body?.message ||
          error?.message ||
          "The race day opened, but its schedule could not be initialized.",
      });
    } finally {
      setOpeningRaceDayId(null);
    }
  }

  useEffect(() => {
    if (
      workspaceTab !== "race-days" ||
      !eventId ||
      !registrationConfigurationQuery.isSuccess ||
      syncRaceDaysMutation.isPending ||
      lastAutoSyncedEventIdRef.current === eventId
    ) {
      return;
    }

    lastAutoSyncedEventIdRef.current = eventId;

    syncRaceDaysMutation.mutate(undefined, {
      onError: () => {
        // Allow another automatic attempt if synchronization failed.
        lastAutoSyncedEventIdRef.current = null;
      },
    });
  }, [
    workspaceTab,
    eventId,
    registrationConfigurationQuery.isSuccess,
    syncRaceDaysMutation.isPending,
  ]);

  const [draft, setDraft] = useState({
    name: "",
    description: "",
    sport: "jet ski" as SportEnum,
    location: "",

    formattedAddress: "",
    latitude: "",
    longitude: "",
    placeId: "",
    locationProvider: "",
    city: "",
    stateCode: "",
    countryCode: "",

    startDate: "", // yyyy-mm-dd
    endDate: "", // yyyy-mm-dd
  });

  const set = <K extends keyof typeof draft>(k: K, v: (typeof draft)[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  function handleLocationSelect(location: LocationSelection) {
    setDraft((d) => ({
      ...d,
      location: location.location || location.formattedAddress || "",
      formattedAddress: location.formattedAddress || location.location || "",
      latitude: location.latitude || "",
      longitude: location.longitude || "",
      placeId: location.placeId || "",
      locationProvider: location.locationProvider || "mapbox",
      city: location.city || "",
      stateCode: location.stateCode || "",
      countryCode: location.countryCode || "",
    }));
  }

  const toDateInput = (iso?: string) => {
    if (!iso) return "";
    const d = iso.includes("T") ? new Date(iso) : new Date(`${iso}T00:00:00Z`);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  async function load() {
    if (!eventId) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/sport-event/${eventId}`, { method: "GET" });
      const json = await res.json();

      if (!res.ok) throw new Error(json?.message || "Failed to load event.");

      const ev = json?.data?.sportEvent ?? json?.sportEvent;
      if (!ev) throw new Error("Event not found in response.");

      setDraft({
        name: ev.name ?? "",
        description: ev.description ?? "",
        sport: (ev.sport ?? "jet ski") as SportEnum,
        location: ev.location ?? "",

        formattedAddress: ev.formattedAddress ?? ev.formatted_address ?? "",
        latitude:
          ev.latitude !== null && ev.latitude !== undefined
            ? String(ev.latitude)
            : "",
        longitude:
          ev.longitude !== null && ev.longitude !== undefined
            ? String(ev.longitude)
            : "",
        placeId: ev.placeId ?? ev.place_id ?? "",
        locationProvider: ev.locationProvider ?? ev.location_provider ?? "",
        city: ev.city ?? "",
        stateCode: ev.stateCode ?? ev.state_code ?? "",
        countryCode: ev.countryCode ?? ev.country_code ?? "",

        startDate: toDateInput(ev.startDate),
        endDate: toDateInput(ev.endDate),
      });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: e?.message || "Could not fetch event.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!eventId) return;
    setSaving(true);
    try {
      const payload = {
        name: draft.name.trim(),
        description: draft.description.trim(),
        sport: draft.sport,
        location: draft.location.trim(),

        formattedAddress: draft.formattedAddress || null,
        latitude: draft.latitude || null,
        longitude: draft.longitude || null,
        placeId: draft.placeId || null,
        locationProvider: draft.locationProvider || null,
        city: draft.city || null,
        stateCode: draft.stateCode || null,
        countryCode: draft.countryCode || null,

        startDate: draft.startDate ? `${draft.startDate}T00:00:00Z` : undefined,
        endDate: draft.endDate ? `${draft.endDate}T00:00:00Z` : undefined,
      };

      const res = await apiFetch(`/sport-event/${eventId}`, {
        method: "PATCH",
        body: payload,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Update failed.");

      toast({ title: "Saved", description: json?.message || "Event updated." });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: e?.message || "Could not update event.",
      });
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-[#030913] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(255,107,53,0.10),transparent_24%),linear-gradient(180deg,#030913_0%,#07111F_48%,#02050A_100%)]" />
        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:72px_72px]" />
      </div>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 pb-24 sm:px-6 sm:py-12 lg:px-8">
        <section className="relative overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[linear-gradient(180deg,rgba(7,17,31,0.94)_0%,rgba(4,10,19,0.98)_100%)] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.42)] sm:rounded-[38px] sm:p-8">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-[#FF6B35]/10 blur-3xl" />
            <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:72px_72px]" />
          </div>

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => navigate(eventListPath)}
                className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold uppercase tracking-[0.14em] text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

              <div className="mb-4 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
                  <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.95)]" />
                  Admin Events
                </div>

                <div className="inline-flex items-center rounded-full border border-[#FF6B35]/20 bg-[#FF6B35]/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#FFB199]">
                  Update Event
                </div>
              </div>

              <h1 className="max-w-4xl text-3xl font-black uppercase leading-[0.95] tracking-[-0.04em] text-white sm:text-5xl">
                Update{" "}
                <span className="bg-[linear-gradient(90deg,#19E3FF_0%,#7CF4FF_35%,#FF7849_100%)] bg-clip-text text-transparent">
                  Event
                </span>
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Edit event details, dates, location, and sport classification.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Button
                variant="outline"
                className="h-12 rounded-full border-white/10 bg-white/[0.04] px-6 text-xs font-black uppercase tracking-[0.16em] text-white/70 hover:bg-white/10 hover:text-white"
                onClick={() => navigate(eventListPath)}
              >
                Back
              </Button>

              <Button
                className="h-12 rounded-full bg-cyan-300 px-6 text-xs font-black uppercase tracking-[0.16em] text-[#06111d] shadow-[0_0_28px_rgba(34,211,238,0.25)] hover:bg-cyan-200 disabled:opacity-50"
                onClick={handleSave}
                disabled={saving}
              >
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[26px] border border-cyan-300/10 bg-[#07111F]/85 p-2">
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <button
              type="button"
              onClick={() => setWorkspaceTab("details")}
              className={`flex min-h-16 items-center gap-3 rounded-[20px] border px-4 text-left transition ${
                workspaceTab === "details"
                  ? "border-cyan-300/25 bg-cyan-300/10 text-white"
                  : "border-transparent text-white/50 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <CalendarDays className="h-5 w-5 shrink-0 text-cyan-200" />

              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.14em]">
                  Event Details
                </div>

                <div className="mt-1 text-[11px] text-white/35">
                  Dates, location & info
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setWorkspaceTab("classes")}
              className={`flex min-h-16 items-center gap-3 rounded-[20px] border px-4 text-left transition ${
                workspaceTab === "classes"
                  ? "border-cyan-300/25 bg-cyan-300/10 text-white"
                  : "border-transparent text-white/50 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <Layers3 className="h-5 w-5 shrink-0 text-cyan-200" />

              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.14em]">
                  Classes & Results
                </div>

                <div className="mt-1 text-[11px] text-white/35">
                  Classes, motos & scoring
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setWorkspaceTab("registration")}
              className={`flex min-h-16 items-center gap-3 rounded-[20px] border px-4 text-left transition ${
                workspaceTab === "registration"
                  ? "border-cyan-300/25 bg-cyan-300/10 text-white"
                  : "border-transparent text-white/50 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <CreditCard className="h-5 w-5 shrink-0 text-[#FFB199]" />

              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.14em]">
                  Registration
                </div>

                <div className="mt-1 text-[11px] text-white/35">
                  Publish & registration setup
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setWorkspaceTab("race-days")}
              className={`flex min-h-16 items-center gap-3 rounded-[20px] border px-4 text-left transition ${
                workspaceTab === "race-days"
                  ? "border-cyan-300/25 bg-cyan-300/10 text-white"
                  : "border-transparent text-white/50 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              <ClipboardList className="h-5 w-5 shrink-0 text-[#FFB199]" />

              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.14em]">
                  Race Days
                </div>

                <div className="mt-1 text-[11px] text-white/35">
                  Daily classes & race lists
                </div>
              </div>
            </button>
          </div>
        </section>

        {workspaceTab === "details" ? (
          <Card className="mt-6 overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[#07111F]/90 p-0 shadow-[0_28px_80px_rgba(0,0,0,0.32)]">
            <div className="border-b border-white/10 px-5 py-5 sm:px-6">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
                  <CalendarDays className="h-5 w-5" />
                </div>

                <div>
                  <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300/80">
                    Event Details
                  </div>
                  <p className="mt-1 text-sm text-white/55">
                    Update the form below and save changes.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5 p-5 sm:p-6 md:p-8">
              {loading ? (
                <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-6 text-sm text-white/60">
                  Loading event…
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">
                        Event Name *
                      </label>
                      <Input
                        className="h-12 rounded-[14px] border-white/10 bg-white/[0.055] text-white placeholder:text-white/35 focus-visible:ring-cyan-300/30"
                        value={draft.name}
                        onChange={(e) => set("name", e.target.value)}
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <LocationAutocomplete
                        label="Location *"
                        value={draft.location}
                        placeholder="Search city, venue, lake, or full address..."
                        onTextChange={(value) =>
                          setDraft((d) => ({
                            ...d,
                            location: value,
                            formattedAddress: "",
                            latitude: "",
                            longitude: "",
                            placeId: "",
                            locationProvider: "",
                            city: "",
                            stateCode: "",
                            countryCode: "",
                          }))
                        }
                        onSelect={handleLocationSelect}
                      />

                      {draft.latitude && draft.longitude ? (
                        <div className="rounded-[14px] border border-cyan-300/10 bg-cyan-300/[0.04] px-3 py-2 text-xs leading-5 text-cyan-100/70">
                          Coordinates attached:{" "}
                          {Number(draft.latitude).toFixed(5)},{" "}
                          {Number(draft.longitude).toFixed(5)}
                        </div>
                      ) : (
                        <div className="text-xs leading-5 text-white/40">
                          Select a location from the dropdown to attach map
                          coordinates.
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 md:col-span-2">
                      <label className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">
                        Description *
                      </label>
                      <textarea
                        className="min-h-28 rounded-[14px] border border-white/10 bg-white/[0.055] px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 transition focus:border-cyan-300/30 focus:ring-2 focus:ring-cyan-300/10"
                        value={draft.description}
                        onChange={(e) => set("description", e.target.value)}
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">
                        Sport *
                      </label>

                      <div className="relative">
                        <select
                          className="h-12 w-full appearance-none rounded-[14px] border border-white/10 bg-white/[0.055] px-4 text-sm text-white outline-none transition focus:border-cyan-300/30 focus:ring-2 focus:ring-cyan-300/10"
                          value={draft.sport}
                          onChange={(e) =>
                            set("sport", e.target.value as SportEnum)
                          }
                        >
                          {SPORT_OPTIONS.map((s) => (
                            <option
                              className="bg-[#07111F] text-white"
                              key={s}
                              value={s}
                            >
                              {s}
                            </option>
                          ))}
                        </select>

                        <Trophy className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">
                        Start Date *
                      </label>
                      <Input
                        type="date"
                        className="h-12 rounded-[14px] border-white/10 bg-white/[0.055] text-white focus-visible:ring-cyan-300/30"
                        value={draft.startDate}
                        onChange={(e) => set("startDate", e.target.value)}
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">
                        End Date *
                      </label>
                      <Input
                        type="date"
                        className="h-12 rounded-[14px] border-white/10 bg-white/[0.055] text-white focus-visible:ring-cyan-300/30"
                        value={draft.endDate}
                        onChange={(e) => set("endDate", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="rounded-[20px] border border-[#FF6B35]/15 bg-[#FF6B35]/[0.06] px-4 py-4 text-sm leading-6 text-[#FFB199]/80">
                    <div className="mb-1 flex items-center gap-2 font-black uppercase tracking-[0.16em] text-[#FFB199]">
                      <ClipboardList className="h-4 w-4" />
                      Results Setup
                    </div>
                    Once the event details are correct, manage classes, motos,
                    and racer results from the controls below.
                  </div>

                  <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <Button
                      variant="outline"
                      className="h-12 rounded-full border-cyan-300/15 bg-cyan-300/10 px-6 text-xs font-black uppercase tracking-[0.16em] text-cyan-100 hover:bg-cyan-300/15 hover:text-white"
                      onClick={() => setWorkspaceTab("classes")}
                    >
                      Manage Classes & Results
                    </Button>

                    <div className="flex flex-col gap-3 sm:flex-row">
                      <Button
                        variant="ghost"
                        className="h-12 rounded-full border border-white/10 px-6 text-xs font-black uppercase tracking-[0.16em] text-white/70 hover:bg-white/10 hover:text-white"
                        onClick={() => navigate(eventListPath)}
                      >
                        Cancel
                      </Button>

                      <Button
                        className="h-12 rounded-full bg-cyan-300 px-6 text-xs font-black uppercase tracking-[0.16em] text-[#06111d] shadow-[0_0_28px_rgba(34,211,238,0.25)] hover:bg-cyan-200 disabled:opacity-50"
                        onClick={handleSave}
                        disabled={saving}
                      >
                        <Save className="mr-2 h-4 w-4" />
                        {saving ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Card>
        ) : null}

        {/* ------------------------------------------------------------ */}
        {/* Classes & Results                                            */}
        {/* ------------------------------------------------------------ */}

        {workspaceTab === "classes" ? (
          <section className="mt-6">
            <RaceClassEditor
              organizationId={organizationId}
              eventId={eventId}
              embedded
            />
          </section>
        ) : null}

        {/* ------------------------------------------------------------ */}
        {/* Registration                                                 */}
        {/* ------------------------------------------------------------ */}

        {workspaceTab === "registration" ? (
          <section className="mt-6 rounded-[30px] border border-cyan-300/10 bg-[#07111F]/90 p-6 shadow-[0_28px_80px_rgba(0,0,0,0.32)] sm:p-8">
            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-200">
              Registration Management
            </div>

            <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-[-0.03em] text-white sm:text-3xl">
                  Public Registration
                </h2>

                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
                  Publish, close, reopen, and preview registration for this
                  event without changing the event itself.
                </p>
              </div>
            </div>

            <RegistrationWorkspace
              eventId={eventId}
              eventName={draft.name}
              settings={registrationConfigurationQuery.data?.settings ?? null}
              loading={registrationConfigurationQuery.isLoading}
              onChanged={() => {
                registrationConfigurationQuery.refetch();
              }}
            />
          </section>
        ) : null}

        {/* ------------------------------------------------------------ */}
        {/* Race Days                                                    */}
        {/* ------------------------------------------------------------ */}

        {workspaceTab === "race-days" ? (
          <section className="mt-6 rounded-[30px] border border-cyan-300/10 bg-[#07111F]/90 p-6 shadow-[0_28px_80px_rgba(0,0,0,0.32)] sm:p-8">
            {selectedRaceDay ? (
              <RaceDayWorkspace
                key={selectedRaceDay.id}
                day={selectedRaceDay}
                eventId={eventId}
                onBack={() => {
                  setSelectedRaceDayId(null);
                  setOpeningRaceDayId(null);
                }}
              />
            ) : (
              <>
                <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-cyan-200">
                      Event Operations
                    </div>

                    <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] text-white sm:text-3xl">
                      Race Days
                    </h2>

                    <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
                      Race days are generated automatically from the event date
                      range. Each day will eventually contain its participating
                      classes, race counts, race list, practices, breaks, lunch,
                      and custom schedule items.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={syncRaceDaysMutation.isPending}
                    onClick={() => syncRaceDaysMutation.mutate()}
                    className="inline-flex h-11 shrink-0 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-100 transition hover:bg-cyan-300/15 disabled:opacity-50"
                  >
                    {syncRaceDaysMutation.isPending
                      ? "Syncing..."
                      : "Sync Race Days"}
                  </button>
                </div>

                <div className="mt-6 rounded-[22px] border border-cyan-300/10 bg-cyan-300/[0.035] p-5">
                  <div className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-200/60">
                    Event Date Range
                  </div>

                  <div className="mt-2 text-sm font-black uppercase tracking-[0.08em] text-white">
                    {draft.startDate || "Start date"} →{" "}
                    {draft.endDate || "End date"}
                  </div>
                </div>

                {registrationConfigurationQuery.isLoading ||
                syncRaceDaysMutation.isPending ? (
                  <div className="mt-6 rounded-[24px] border border-white/10 bg-white/[0.03] p-8 text-center text-sm text-white/50">
                    Preparing race days…
                  </div>
                ) : raceDays.length === 0 ? (
                  <div className="mt-6 rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] p-8 text-center">
                    <div className="text-sm font-black text-white">
                      No race days available
                    </div>

                    <p className="mt-2 text-xs leading-6 text-white/40">
                      Save valid event start and end dates, then sync the race
                      days.
                    </p>
                  </div>
                ) : (
                  <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    {raceDays.map((day: any) => (
                      <button
                        key={day.id}
                        type="button"
                        disabled={
                          openingRaceDayId !== null &&
                          openingRaceDayId !== day.id
                        }
                        onClick={() => handleOpenRaceDay(day.id)}
                        className="group rounded-[22px] border border-white/10 bg-white/[0.03] p-5 text-left transition hover:border-cyan-300/25 hover:bg-cyan-300/[0.04] disabled:cursor-wait disabled:opacity-60"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-[14px] border border-cyan-300/15 bg-cyan-300/10">
                            <CalendarDays className="h-4 w-4 text-cyan-200" />
                          </div>

                          <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-white/40">
                            Race Day
                          </span>
                        </div>

                        <div className="mt-4 text-lg font-black text-white">
                          {day.label}
                        </div>

                        <div className="mt-1 text-sm text-white/45">
                          {new Date(
                            `${day.eventDate}T00:00:00`,
                          ).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>

                        <div className="mt-5 text-[9px] font-black uppercase tracking-[0.14em] text-cyan-200/60">
                          {openingRaceDayId === day.id
                            ? "Opening..."
                            : "Manage Day →"}
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        ) : null}
      </main>
    </div>
  );
}
