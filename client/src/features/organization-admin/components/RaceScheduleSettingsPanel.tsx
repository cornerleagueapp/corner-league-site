import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Combine,
  Loader2,
  Save,
  Settings2,
  ShieldAlert,
  Utensils,
} from "lucide-react";

import {
  useRaceScheduleSettings,
  useUpdateRaceScheduleSettings,
} from "../hooks/useOrganizationRaceSchedule";

import type {
  RaceScheduleSettings,
  UpdateRaceScheduleSettingsInput,
} from "../types/organizationRaceSchedule";

type Props = {
  eventId: string;

  onChanged?: () => void;
};

type SettingsDraft = {
  defaultRacesPerClass: number;

  minimumRestRaceGap: number;

  suggestClassMerges: boolean;

  smallClassRacerThreshold: number;

  maximumCombinedRacerCount: number;

  maximumClassesPerCombinedRace: number;

  insertLunchBreak: boolean;

  lunchBreakLabel: string;

  lunchBreakDurationMinutes: number;

  allowConflictOverride: boolean;
};

function createDraft(settings?: RaceScheduleSettings | null): SettingsDraft {
  return {
    defaultRacesPerClass: settings?.defaultRacesPerClass ?? 2,

    minimumRestRaceGap: settings?.minimumRestRaceGap ?? 2,

    suggestClassMerges: settings?.suggestClassMerges ?? true,

    smallClassRacerThreshold: settings?.smallClassRacerThreshold ?? 3,

    maximumCombinedRacerCount: settings?.maximumCombinedRacerCount ?? 12,

    maximumClassesPerCombinedRace: settings?.maximumClassesPerCombinedRace ?? 2,

    insertLunchBreak: settings?.insertLunchBreak ?? true,

    lunchBreakLabel: settings?.lunchBreakLabel ?? "Lunch Break",

    lunchBreakDurationMinutes: settings?.lunchBreakDurationMinutes ?? 45,

    allowConflictOverride: settings?.allowConflictOverride ?? true,
  };
}

function NumberSetting({
  label,
  description,
  value,
  min,
  max,
  onChange,
}: {
  label: string;

  description: string;

  value: number;

  min: number;

  max: number;

  onChange: (value: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-black/15 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-black text-white">{label}</div>

          <p className="mt-1 max-w-sm text-[11px] leading-5 text-white/35">
            {description}
          </p>
        </div>

        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(event) => {
            const nextValue = Number(event.target.value);

            if (!Number.isFinite(nextValue)) {
              return;
            }

            onChange(nextValue);
          }}
          className="h-10 w-20 shrink-0 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-center text-sm font-black text-white outline-none transition focus:border-cyan-300/40"
        />
      </div>
    </div>
  );
}

function ToggleSetting({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;

  description: string;

  checked: boolean;

  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-2xl border border-white/[0.07] bg-black/15 p-4 text-left transition hover:bg-white/[0.035]"
    >
      <div>
        <div className="text-xs font-black text-white">{label}</div>

        <p className="mt-1 max-w-md text-[11px] leading-5 text-white/35">
          {description}
        </p>
      </div>

      <div
        className={`relative h-6 w-11 shrink-0 rounded-full border transition ${
          checked
            ? "border-cyan-300/40 bg-cyan-300"
            : "border-white/10 bg-white/[0.06]"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4.5 w-4.5 rounded-full bg-white transition ${
            checked ? "left-[21px]" : "left-[3px]"
          }`}
        />
      </div>
    </button>
  );
}

export function RaceScheduleSettingsPanel({ eventId, onChanged }: Props) {
  const [open, setOpen] = useState(false);

  const settingsQuery = useRaceScheduleSettings(eventId);

  const updateMutation = useUpdateRaceScheduleSettings(eventId);

  const [draft, setDraft] = useState<SettingsDraft>(() => createDraft(null));

  useEffect(() => {
    if (!settingsQuery.data) {
      return;
    }

    setDraft(createDraft(settingsQuery.data));
  }, [settingsQuery.data]);

  const savedDraft = useMemo(
    () => createDraft(settingsQuery.data),
    [settingsQuery.data],
  );

  const dirty = JSON.stringify(draft) !== JSON.stringify(savedDraft);

  const updateDraft = <K extends keyof SettingsDraft>(
    key: K,
    value: SettingsDraft[K],
  ) => {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const save = async () => {
    const input: UpdateRaceScheduleSettingsInput = {
      defaultRacesPerClass: Math.max(
        1,
        Math.min(10, draft.defaultRacesPerClass),
      ),

      minimumRestRaceGap: Math.max(0, Math.min(20, draft.minimumRestRaceGap)),

      suggestClassMerges: draft.suggestClassMerges,

      smallClassRacerThreshold: Math.max(
        1,
        Math.min(50, draft.smallClassRacerThreshold),
      ),

      maximumCombinedRacerCount: Math.max(
        1,
        Math.min(100, draft.maximumCombinedRacerCount),
      ),

      maximumClassesPerCombinedRace: Math.max(
        1,
        Math.min(10, draft.maximumClassesPerCombinedRace),
      ),

      insertLunchBreak: draft.insertLunchBreak,

      lunchBreakLabel: draft.lunchBreakLabel.trim() || "Lunch Break",

      lunchBreakDurationMinutes: Math.max(
        1,
        Math.min(240, draft.lunchBreakDurationMinutes),
      ),

      allowConflictOverride: draft.allowConflictOverride,
    };

    await updateMutation.mutateAsync(input);

    await settingsQuery.refetch();

    onChanged?.();
  };

  const error = updateMutation.error || settingsQuery.error;

  if (settingsQuery.isLoading) {
    return (
      <div className="mt-6 flex items-center gap-3 rounded-[22px] border border-white/[0.07] bg-white/[0.02] p-5 text-sm text-white/40">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading race schedule settings...
      </div>
    );
  }

  return (
    <section className="mt-6 overflow-hidden rounded-[24px] border border-cyan-300/10 bg-[#091522]">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="flex w-full items-center justify-between gap-5 p-5 text-left transition hover:bg-white/[0.02] sm:p-6"
      >
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.07]">
            <Settings2 className="h-5 w-5 text-cyan-200" />
          </div>

          <div>
            <div className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-200/60">
              Race Director Settings
            </div>

            <h3 className="mt-1 text-lg font-black uppercase text-white">
              Schedule Settings
            </h3>

            <p className="mt-1 max-w-2xl text-xs leading-5 text-white/35">
              Control racer rest spacing, automatic class combining, default
              race counts, lunch placement, and conflict behavior.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {dirty ? (
            <span className="hidden rounded-full border border-amber-300/20 bg-amber-300/[0.08] px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.1em] text-amber-200 sm:inline-flex">
              Unsaved
            </span>
          ) : null}

          {open ? (
            <ChevronUp className="h-5 w-5 text-white/40" />
          ) : (
            <ChevronDown className="h-5 w-5 text-white/40" />
          )}
        </div>
      </button>

      {open ? (
        <div className="border-t border-white/[0.06] p-5 sm:p-6">
          <div className="grid gap-5 xl:grid-cols-3">
            {/* -------------------------------- */}
            {/* Race generation */}
            {/* -------------------------------- */}

            <div>
              <div className="mb-3 flex items-center gap-2">
                <Settings2 className="h-4 w-4 text-cyan-200" />

                <div className="text-[9px] font-black uppercase tracking-[0.15em] text-cyan-200/70">
                  Race Generation
                </div>
              </div>

              <div className="space-y-3">
                <NumberSetting
                  label="Default Races Per Class"
                  description="Default number of races/motos assigned when a new race day is initialized."
                  value={draft.defaultRacesPerClass}
                  min={1}
                  max={10}
                  onChange={(value) =>
                    updateDraft("defaultRacesPerClass", value)
                  }
                />

                <NumberSetting
                  label="Minimum Rest Gap"
                  description="Minimum number of other races a multi-class racer should receive before racing again."
                  value={draft.minimumRestRaceGap}
                  min={0}
                  max={20}
                  onChange={(value) => updateDraft("minimumRestRaceGap", value)}
                />
              </div>
            </div>

            {/* -------------------------------- */}
            {/* Automatic combining */}
            {/* -------------------------------- */}

            <div>
              <div className="mb-3 flex items-center gap-2">
                <Combine className="h-4 w-4 text-purple-200" />

                <div className="text-[9px] font-black uppercase tracking-[0.15em] text-purple-200/70">
                  Automatic Combining
                </div>
              </div>

              <div className="space-y-3">
                <ToggleSetting
                  label="Suggest Class Merges"
                  description="Allow the schedule generator to combine compatible small classes into one physical race."
                  checked={draft.suggestClassMerges}
                  onChange={(value) => updateDraft("suggestClassMerges", value)}
                />

                <NumberSetting
                  label="Small Class Threshold"
                  description="Classes at or below this racer count may be considered for automatic combining."
                  value={draft.smallClassRacerThreshold}
                  min={1}
                  max={50}
                  onChange={(value) =>
                    updateDraft("smallClassRacerThreshold", value)
                  }
                />

                <NumberSetting
                  label="Maximum Combined Racers"
                  description="Maximum total racers allowed in one automatically combined race."
                  value={draft.maximumCombinedRacerCount}
                  min={1}
                  max={100}
                  onChange={(value) =>
                    updateDraft("maximumCombinedRacerCount", value)
                  }
                />

                <NumberSetting
                  label="Maximum Classes Combined"
                  description="Maximum number of classes that may share one physical race."
                  value={draft.maximumClassesPerCombinedRace}
                  min={1}
                  max={10}
                  onChange={(value) =>
                    updateDraft("maximumClassesPerCombinedRace", value)
                  }
                />
              </div>
            </div>

            {/* -------------------------------- */}
            {/* Day behavior */}
            {/* -------------------------------- */}

            <div>
              <div className="mb-3 flex items-center gap-2">
                <Utensils className="h-4 w-4 text-orange-200" />

                <div className="text-[9px] font-black uppercase tracking-[0.15em] text-orange-200/70">
                  Day Behavior
                </div>
              </div>

              <div className="space-y-3">
                <ToggleSetting
                  label="Insert Lunch Break"
                  description="Automatically place a lunch break between generated race rounds."
                  checked={draft.insertLunchBreak}
                  onChange={(value) => updateDraft("insertLunchBreak", value)}
                />

                {draft.insertLunchBreak ? (
                  <>
                    <div className="rounded-2xl border border-white/[0.07] bg-black/15 p-4">
                      <label className="text-xs font-black text-white">
                        Lunch Label
                      </label>

                      <input
                        value={draft.lunchBreakLabel}
                        onChange={(event) =>
                          updateDraft("lunchBreakLabel", event.target.value)
                        }
                        className="mt-3 h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none placeholder:text-white/20 focus:border-cyan-300/40"
                        placeholder="Lunch Break"
                      />
                    </div>

                    <NumberSetting
                      label="Lunch Duration"
                      description="Length of the automatically inserted lunch break in minutes."
                      value={draft.lunchBreakDurationMinutes}
                      min={1}
                      max={240}
                      onChange={(value) =>
                        updateDraft("lunchBreakDurationMinutes", value)
                      }
                    />
                  </>
                ) : null}

                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <ShieldAlert className="h-4 w-4 text-amber-200" />

                    <div className="text-[9px] font-black uppercase tracking-[0.12em] text-amber-200/70">
                      Conflict Behavior
                    </div>
                  </div>

                  <ToggleSetting
                    label="Allow Conflict Override"
                    description="Allow a race director to intentionally publish a schedule that contains acknowledged rest warnings."
                    checked={draft.allowConflictOverride}
                    onChange={(value) =>
                      updateDraft("allowConflictOverride", value)
                    }
                  />
                </div>
              </div>
            </div>
          </div>

          {error ? (
            <div className="mt-5 rounded-2xl border border-red-300/15 bg-red-300/[0.05] p-4 text-xs leading-5 text-red-100/70">
              {(error as any)?.body?.message ??
                (error as any)?.message ??
                "Unable to save schedule settings."}
            </div>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 border-t border-white/[0.06] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-2xl text-[11px] leading-5 text-white/30">
              These settings apply to this event. Existing generated race orders
              are not automatically regenerated when settings change.
            </p>

            <button
              type="button"
              disabled={!dirty || updateMutation.isPending}
              onClick={save}
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-cyan-300 px-5 text-[10px] font-black uppercase tracking-[0.12em] text-[#04101C] transition hover:bg-cyan-200 disabled:opacity-35"
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}

              {updateMutation.isPending ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
