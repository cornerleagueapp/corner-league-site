import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarDays,
  Check,
  ChevronRight,
  Clock3,
  Combine,
  Flag,
  Loader2,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { OrganizationAdminLayout } from "../components/OrganizationAdminLayout";
import { useOrganizationEvents } from "../hooks/useOrganizationRegistrations";
import { useRegistrationEventConfiguration } from "../hooks/useOrganizationRaceDays";
import {
  useGenerateRaceSchedule,
  useInitializeRaceScheduleDay,
  useRaceScheduleDay,
  useRaceScheduleSettings,
  useUpdateRaceScheduleClassConfig,
  useUpdateRaceScheduleSettings,
} from "../hooks/useOrganizationRaceSchedule";
import { RaceScheduleEditor } from "../components/RaceScheduleEditor";
import type {
  RaceScheduleClassConfig,
  RaceScheduleSettings,
} from "../types/organizationRaceSchedule";
import { RaceSchedulePublishPanel } from "../components/RaceSchedulePublishPanel";

type Props = {
  organizationId: string;
};

function classNameForConfig(config: RaceScheduleClassConfig) {
  return (
    config.eventClass.displayName?.trim() ||
    config.eventClass.division?.name?.trim() ||
    "Unnamed Class"
  );
}

function SettingsToggle({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;

  description: string;

  checked: boolean;

  disabled?: boolean;

  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex w-full items-start justify-between gap-4 rounded-[20px] border border-white/10 bg-white/[0.025] p-4 text-left transition hover:bg-white/[0.04] disabled:opacity-50"
    >
      <div>
        <div className="text-sm font-black text-white">{label}</div>

        <div className="mt-1 max-w-xl text-xs leading-5 text-slate-500">
          {description}
        </div>
      </div>

      <div
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition ${
          checked ? "bg-cyan-300" : "bg-white/10"
        }`}
      >
        <div
          className={`absolute top-1 h-4 w-4 rounded-full bg-[#04101C] transition ${
            checked ? "left-6" : "left-1"
          }`}
        />
      </div>
    </button>
  );
}

function NumberSetting({
  label,
  description,
  value,
  min,
  max,
  disabled,
  onChange,
}: {
  label: string;

  description: string;

  value: number;

  min: number;

  max: number;

  disabled?: boolean;

  onChange: (value: number) => void;
}) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-white/[0.025] p-4">
      <div className="flex items-center justify-between gap-5">
        <div>
          <div className="text-sm font-black text-white">{label}</div>

          <div className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </div>
        </div>

        <input
          type="number"
          min={min}
          max={max}
          disabled={disabled}
          value={value}
          onChange={(event) => {
            const next = Number(event.target.value);

            if (Number.isFinite(next)) {
              onChange(next);
            }
          }}
          className="h-11 w-20 shrink-0 rounded-xl border border-white/10 bg-black/20 px-3 text-center text-sm font-black text-white outline-none focus:border-cyan-300/30 disabled:opacity-50"
        />
      </div>
    </div>
  );
}

function ClassConfigCard({
  config,
  dayId,
}: {
  config: RaceScheduleClassConfig;

  dayId: string;
}) {
  const mutation = useUpdateRaceScheduleClassConfig(dayId);

  const update = (input: {
    raceCount?: number;

    allowCombinedRace?: boolean;

    mergeCompatibilityGroup?: string | null;
  }) => {
    mutation.mutate({
      classConfigId: config.id,

      input,
    });
  };

  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[9px] font-black uppercase tracking-[0.15em] text-[#FFB199]">
            Race Class
          </div>

          <h4 className="mt-1 truncate text-base font-black text-white">
            {classNameForConfig(config)}
          </h4>

          <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
            <Users className="h-3.5 w-3.5" />
            {config.racerCount ?? config.participants?.length ?? 0} registered
            racer
            {(config.racerCount ?? config.participants?.length ?? 0) === 1
              ? ""
              : "s"}
          </div>
        </div>

        {mutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin text-cyan-200" />
        ) : null}
      </div>

      <div className="mt-5">
        <label className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
          Races / Rounds Today
        </label>

        <div className="mt-2 grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map((count) => (
            <button
              key={count}
              type="button"
              disabled={mutation.isPending}
              onClick={() =>
                update({
                  raceCount: count,
                })
              }
              className={`h-10 rounded-xl border text-sm font-black transition ${
                config.raceCount === count
                  ? "border-cyan-300 bg-cyan-300 text-[#04101C]"
                  : "border-white/10 bg-white/[0.035] text-slate-300 hover:bg-white/[0.07]"
              }`}
            >
              {count === 0 ? "Off" : count}
            </button>
          ))}
        </div>

        <p className="mt-2 text-[10px] leading-4 text-slate-600">
          Use Off to exclude this class from today's generated race order.
        </p>
      </div>

      <div className="mt-5 border-t border-white/[0.07] pt-4">
        <button
          type="button"
          disabled={mutation.isPending}
          onClick={() =>
            update({
              allowCombinedRace: !config.allowCombinedRace,
            })
          }
          className="flex w-full items-center justify-between gap-4"
        >
          <div className="text-left">
            <div className="text-xs font-black text-white">
              Allow combined race
            </div>

            <div className="mt-1 text-[10px] leading-4 text-slate-600">
              Permit this class to share one physical race with a compatible
              small class.
            </div>
          </div>

          <div
            className={`relative h-6 w-11 shrink-0 rounded-full ${
              config.allowCombinedRace ? "bg-emerald-300" : "bg-white/10"
            }`}
          >
            <div
              className={`absolute top-1 h-4 w-4 rounded-full bg-[#04101C] transition ${
                config.allowCombinedRace ? "left-6" : "left-1"
              }`}
            />
          </div>
        </button>

        {config.allowCombinedRace ? (
          <div className="mt-4">
            <label className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
              Compatibility Group
            </label>

            <input
              key={config.mergeCompatibilityGroup ?? "empty"}
              defaultValue={config.mergeCompatibilityGroup ?? ""}
              disabled={mutation.isPending}
              onBlur={(event) =>
                update({
                  mergeCompatibilityGroup: event.target.value.trim() || null,
                })
              }
              placeholder="Example: ski-small"
              className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none placeholder:text-slate-700 focus:border-cyan-300/30"
            />

            <p className="mt-2 text-[10px] leading-4 text-slate-600">
              Only classes using the same compatibility group may be
              automatically combined.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default function OrganizationRaceSchedulePage({
  organizationId,
}: Props) {
  const eventsQuery = useOrganizationEvents(organizationId);

  const events = eventsQuery.data ?? [];

  const [selectedEventId, setSelectedEventId] = useState("");

  const [selectedDayId, setSelectedDayId] = useState("");

  useEffect(() => {
    if (selectedEventId || !events.length) {
      return;
    }

    setSelectedEventId(events[0].id);
  }, [events, selectedEventId]);

  const configurationQuery = useRegistrationEventConfiguration(selectedEventId);

  const registrationSettings = configurationQuery.data?.settings ?? null;

  const hasRegistrationConfiguration =
    configurationQuery.isSuccess && !!registrationSettings;

  const registrationDays = registrationSettings?.eventDays ?? [];

  useEffect(() => {
    setSelectedDayId(registrationDays[0]?.id ?? "");
  }, [selectedEventId, registrationDays[0]?.id]);

  const settingsQuery = useRaceScheduleSettings(
    selectedEventId,
    hasRegistrationConfiguration,
  );

  const dayQuery = useRaceScheduleDay(selectedDayId);

  const initializeMutation = useInitializeRaceScheduleDay();

  const settingsMutation = useUpdateRaceScheduleSettings(selectedEventId);

  const generateMutation = useGenerateRaceSchedule(selectedDayId);

  const schedule = dayQuery.data?.schedule;

  const classConfigs = dayQuery.data?.classConfigs ?? [];

  const settings = settingsQuery.data;

  const enabledClassCount = useMemo(
    () => classConfigs.filter((config) => config.raceCount > 0).length,
    [classConfigs],
  );

  const handleSetting = (input: Partial<RaceScheduleSettings>) => {
    settingsMutation.mutate(input);
  };

  const generate = () => {
    if (!schedule?.id) {
      return;
    }

    generateMutation.mutate(schedule.id);
  };

  const dayNotInitialized = !!selectedDayId && dayQuery.isError;

  return (
    <OrganizationAdminLayout organizationId={organizationId}>
      <section>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
              Race Operations
            </div>

            <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.03em] text-white sm:text-3xl">
              Race Scheduling
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
              Configure how each class races, protect multi-class racers with
              rest spacing, combine compatible small classes, and generate the
              physical race order.
            </p>
          </div>

          <div className="grid w-full gap-3 sm:grid-cols-2 xl:w-[620px]">
            <div>
              <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.15em] text-slate-500">
                Event
              </label>

              <select
                value={selectedEventId}
                onChange={(event) => {
                  setSelectedEventId(event.target.value);

                  setSelectedDayId("");
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

            <div>
              <label className="mb-2 block text-[9px] font-black uppercase tracking-[0.15em] text-slate-500">
                Race Day
              </label>

              <select
                value={selectedDayId}
                onChange={(event) => setSelectedDayId(event.target.value)}
                className="h-12 w-full rounded-2xl border border-white/10 bg-[#07111F] px-4 text-sm font-bold text-white outline-none"
              >
                {registrationDays.map((day) => (
                  <option key={day.id} value={day.id}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {eventsQuery.isLoading || configurationQuery.isLoading ? (
          <div className="flex min-h-[420px] items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-cyan-200" />
          </div>
        ) : !hasRegistrationConfiguration ? (
          <div className="mt-8 rounded-[28px] border border-cyan-300/15 bg-cyan-300/[0.035] p-7">
            <ShieldCheck className="h-7 w-7 text-cyan-200" />

            <div className="mt-4 text-[9px] font-black uppercase tracking-[0.17em] text-cyan-200">
              Registration Setup Required
            </div>

            <h3 className="mt-2 text-xl font-black uppercase text-white">
              Race scheduling is not ready
            </h3>

            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-400">
              This event has not been configured for registration yet.
              Registration settings, race days, and classes must exist before
              the race schedule can be initialized.
            </p>

            <a
              href={`/organizations/${encodeURIComponent(
                organizationId,
              )}/admin/settings?eventId=${encodeURIComponent(selectedEventId)}`}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-cyan-300 px-5 text-[10px] font-black uppercase tracking-[0.14em] text-[#04101C] transition hover:bg-cyan-200"
            >
              Set Up Registration
            </a>
          </div>
        ) : !selectedDayId ? (
          <div className="mt-8 rounded-[26px] border border-dashed border-white/10 p-10 text-center">
            <CalendarDays className="mx-auto h-7 w-7 text-slate-700" />

            <div className="mt-4 text-[9px] font-black uppercase tracking-[0.16em] text-[#FFB199]">
              Race Days Required
            </div>

            <h3 className="mt-2 font-black text-white">
              No race days configured
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Registration exists for this event, but race days have not been
              created yet.
            </p>

            <a
              href={`/organizations/${encodeURIComponent(
                organizationId,
              )}/admin/race-days`}
              className="mt-5 inline-flex h-11 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 text-[10px] font-black uppercase tracking-[0.14em] text-cyan-100 transition hover:bg-cyan-300 hover:text-[#04101C]"
            >
              Configure Race Days
            </a>
          </div>
        ) : dayNotInitialized ? (
          <div className="mt-8 rounded-[28px] border border-cyan-300/15 bg-cyan-300/[0.04] p-7">
            <Sparkles className="h-7 w-7 text-cyan-200" />

            <h3 className="mt-4 text-xl font-black text-white">
              Initialize race scheduling
            </h3>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              This race day has not been initialized yet. Initialization creates
              its schedule and class-level race configuration from the current
              registrations.
            </p>

            <button
              type="button"
              disabled={initializeMutation.isPending}
              onClick={() =>
                initializeMutation.mutate(selectedDayId, {
                  onSuccess: () => dayQuery.refetch(),
                })
              }
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-cyan-300 px-5 py-3 text-xs font-black uppercase tracking-[0.12em] text-[#04101C] transition hover:bg-cyan-200 disabled:opacity-50"
            >
              {initializeMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Initialize Race Day
            </button>
          </div>
        ) : dayQuery.isLoading ? (
          <div className="flex min-h-[420px] items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-cyan-200" />
          </div>
        ) : (
          <>
            <div className="mt-7 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
                <Flag className="h-5 w-5 text-cyan-200" />

                <div className="mt-4 text-2xl font-black text-white">
                  {classConfigs.length}
                </div>

                <div className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                  Classes
                </div>
              </div>

              <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
                <Check className="h-5 w-5 text-emerald-200" />

                <div className="mt-4 text-2xl font-black text-white">
                  {enabledClassCount}
                </div>

                <div className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                  Racing Today
                </div>
              </div>

              <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
                <Clock3 className="h-5 w-5 text-[#FFB199]" />

                <div className="mt-4 text-2xl font-black text-white">
                  {dayQuery.data?.minimumRestRaceGap ?? "—"}
                </div>

                <div className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                  Min Rest Gap
                </div>
              </div>

              <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
                <Combine className="h-5 w-5 text-purple-200" />

                <div className="mt-4 text-2xl font-black text-white">
                  {schedule?.version ?? 1}
                </div>

                <div className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-500">
                  Schedule Version
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
              <section>
                <div>
                  <div className="text-[9px] font-black uppercase tracking-[0.18em] text-[#FFB199]">
                    Class Configuration
                  </div>

                  <h3 className="mt-2 text-xl font-black uppercase text-white">
                    Races Per Class
                  </h3>

                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                    Each class can race a different number of times during this
                    day. Classes with small fields may also be eligible for a
                    combined physical race.
                  </p>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {classConfigs.map((config) => (
                    <ClassConfigCard
                      key={config.id}
                      config={config}
                      dayId={selectedDayId}
                    />
                  ))}
                </div>
              </section>

              <aside>
                <div className="sticky top-5 rounded-[26px] border border-white/10 bg-black/15 p-5">
                  <div className="flex items-center gap-3">
                    <Settings2 className="h-5 w-5 text-cyan-200" />

                    <div>
                      <div className="text-[9px] font-black uppercase tracking-[0.16em] text-cyan-200/60">
                        Generator
                      </div>

                      <h3 className="text-lg font-black text-white">
                        Scheduling Settings
                      </h3>
                    </div>
                  </div>

                  {settingsQuery.isLoading ? (
                    <div className="flex h-40 items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-cyan-200" />
                    </div>
                  ) : !settings ? (
                    <div className="mt-5 rounded-2xl border border-amber-300/15 bg-amber-300/[0.05] p-4">
                      <AlertTriangle className="h-5 w-5 text-amber-200" />

                      <p className="mt-2 text-xs leading-5 text-amber-100/70">
                        Race scheduling settings have not been configured for
                        this event.
                      </p>
                    </div>
                  ) : (
                    <div className="mt-5 space-y-3">
                      <SettingsToggle
                        label="Suggest class merges"
                        description="Allow compatible small classes to share a physical race."
                        checked={settings.suggestClassMerges}
                        disabled={settingsMutation.isPending}
                        onChange={(value) =>
                          handleSetting({
                            suggestClassMerges: value,
                          })
                        }
                      />

                      <NumberSetting
                        label="Small class threshold"
                        description="Classes at or below this racer count may be considered for merging."
                        value={settings.smallClassRacerThreshold}
                        min={1}
                        max={100}
                        disabled={settingsMutation.isPending}
                        onChange={(value) =>
                          handleSetting({
                            smallClassRacerThreshold: value,
                          })
                        }
                      />

                      <NumberSetting
                        label="Maximum combined racers"
                        description="Safety ceiling for the total field size of a combined physical race."
                        value={settings.maximumCombinedRacerCount}
                        min={1}
                        max={200}
                        disabled={settingsMutation.isPending}
                        onChange={(value) =>
                          handleSetting({
                            maximumCombinedRacerCount: value,
                          })
                        }
                      />

                      <NumberSetting
                        label="Maximum combined classes"
                        description="Maximum number of classes that may share one physical race."
                        value={settings.maximumClassesPerCombinedRace}
                        min={2}
                        max={10}
                        disabled={settingsMutation.isPending}
                        onChange={(value) =>
                          handleSetting({
                            maximumClassesPerCombinedRace: value,
                          })
                        }
                      />

                      <SettingsToggle
                        label="Automatic lunch break"
                        description="Insert the configured lunch break between early and later rounds."
                        checked={settings.insertLunchBreak}
                        disabled={settingsMutation.isPending}
                        onChange={(value) =>
                          handleSetting({
                            insertLunchBreak: value,
                          })
                        }
                      />

                      {settings.insertLunchBreak ? (
                        <NumberSetting
                          label="Lunch duration"
                          description="Number of minutes reserved for the automatic lunch break."
                          value={settings.lunchBreakDurationMinutes}
                          min={5}
                          max={240}
                          disabled={settingsMutation.isPending}
                          onChange={(value) =>
                            handleSetting({
                              lunchBreakDurationMinutes: value,
                            })
                          }
                        />
                      ) : null}

                      <SettingsToggle
                        label="Allow conflict override"
                        description="Permit publishing despite high-severity rest warnings when an administrator explicitly accepts them."
                        checked={settings.allowConflictOverride ?? false}
                        disabled={settingsMutation.isPending}
                        onChange={(value) =>
                          handleSetting({
                            allowConflictOverride: value,
                          })
                        }
                      />
                    </div>
                  )}

                  <div className="mt-6 border-t border-white/10 pt-5">
                    <div className="rounded-2xl border border-cyan-300/10 bg-cyan-300/[0.04] p-4">
                      <ShieldCheck className="h-5 w-5 text-cyan-200" />

                      <p className="mt-2 text-xs leading-5 text-slate-400">
                        The generator checks shared racers and tries to avoid
                        back-to-back races before creating the order.
                      </p>
                    </div>

                    <button
                      type="button"
                      disabled={
                        !schedule?.id ||
                        enabledClassCount === 0 ||
                        generateMutation.isPending
                      }
                      onClick={generate}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-4 py-4 text-xs font-black uppercase tracking-[0.13em] text-[#04101C] transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {generateMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      Generate Race Order
                      {!generateMutation.isPending ? (
                        <ChevronRight className="h-4 w-4" />
                      ) : null}
                    </button>

                    {schedule?.generatedAt ? (
                      <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-slate-600">
                        <RefreshCw className="h-3 w-3" />
                        Existing schedule will be regenerated
                      </div>
                    ) : null}
                  </div>
                </div>
              </aside>
            </div>

            {schedule?.slots?.length ? (
              <>
                <div className="mt-10">
                  <RaceScheduleEditor
                    dayId={selectedDayId}
                    schedule={schedule}
                    onChanged={() => {
                      dayQuery.refetch();
                    }}
                  />
                </div>

                <div className="mt-8">
                  <RaceSchedulePublishPanel
                    dayId={selectedDayId}
                    schedule={schedule}
                    onChanged={() => {
                      dayQuery.refetch();
                    }}
                  />
                </div>
              </>
            ) : null}
          </>
        )}
      </section>
    </OrganizationAdminLayout>
  );
}
