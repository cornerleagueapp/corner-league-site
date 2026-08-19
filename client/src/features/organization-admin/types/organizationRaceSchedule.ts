export type RaceScheduleStatus = "draft" | "published" | "completed" | string;

export type RaceScheduleSettings = {
  id?: string;

  eventId?: string;

  suggestClassMerges: boolean;

  smallClassRacerThreshold: number;

  maximumCombinedRacerCount: number;

  maximumClassesPerCombinedRace: number;

  insertLunchBreak: boolean;

  lunchBreakLabel: string;

  lunchBreakDurationMinutes: number;

  allowConflictOverride?: boolean;
};

export type RaceScheduleClassConfig = {
  id: string;

  raceCount: number;

  allowCombinedRace: boolean;

  mergeCompatibilityGroup: string | null;

  minimumRestRaceGapOverride?: number | null;

  eventClass: {
    id: string;

    displayName?: string | null;

    division?: {
      id?: string;

      name?: string | null;
    } | null;
  };

  racerCount?: number;

  participants?: Array<{
    racerId: string;

    racerName?: string;
  }>;
};

export type RaceScheduleSlotClass = {
  id?: string;

  roundNumber: number;

  displayOrder?: number;

  eventClass: {
    id: string;

    displayName?: string | null;

    division?: {
      id?: string;

      name?: string | null;
    } | null;
  };
};

export type RaceScheduleSlot = {
  id: string;

  slotType: "race" | "break" | string;

  displayOrder: number;

  raceNumber: number | null;

  label?: string | null;

  durationMinutes?: number | null;

  isLocked?: boolean;

  isCombinedRace?: boolean;

  notes?: string | null;

  analysisMetadata?: {
    racerCount?: number;

    roundNumber?: number;

    warnings?: unknown[];

    [key: string]: unknown;
  } | null;

  classes: RaceScheduleSlotClass[];
};

export type RaceSchedule = {
  id: string;

  status: RaceScheduleStatus;

  version: number;

  generatedAt?: string | null;

  publishedAt?: string | null;

  analysisSummary?: Record<string, unknown> | null;

  slots: RaceScheduleSlot[];
};

export type RaceScheduleDayResponse = {
  eventDay: {
    id: string;

    dayKey?: string;

    label: string;

    eventDate?: string;

    startsAt?: string | null;

    endsAt?: string | null;
  };

  schedule: RaceSchedule;

  classConfigs: RaceScheduleClassConfig[];

  settings?: RaceScheduleSettings | null;

  minimumRestRaceGap?: number;
};

export type UpdateRaceScheduleClassConfigInput = {
  raceCount?: number;

  allowCombinedRace?: boolean;

  mergeCompatibilityGroup?: string | null;

  minimumRestRaceGapOverride?: number | null;
};

export type UpdateRaceScheduleSettingsInput = {
  suggestClassMerges?: boolean;

  smallClassRacerThreshold?: number;

  maximumCombinedRacerCount?: number;

  maximumClassesPerCombinedRace?: number;

  insertLunchBreak?: boolean;

  lunchBreakLabel?: string;

  lunchBreakDurationMinutes?: number;

  allowConflictOverride?: boolean;
};

export type RaceScheduleGenerationResult = {
  scheduleId?: string;

  previousVersion?: number;

  version?: number;

  generatedAt?: string;

  preservedLockedRaceCount?: number;

  summary?: {
    classCount?: number;

    physicalRaceCount?: number;

    multiClassRacerCount?: number;

    classOverlapCount?: number;

    racerRestConflictCount?: number;

    backToBackConflictCount?: number;

    combinedRaceCount?: number;

    preservedLockedRaceCount?: number;

    [key: string]: unknown;
  };

  warnings?: unknown[];
};

export type RaceScheduleWarningSeverity = "low" | "medium" | "high" | string;

export type RaceScheduleRaceWarning = {
  type?: string;

  severity: RaceScheduleWarningSeverity;

  racerId?: string;

  racerName?: string;

  previousRaceNumber?: number;

  nextRaceNumber?: number;

  raceNumbers?: number[];

  classNames?: string[];

  reason: string;
};

export type RaceScheduleDuplicateClassRoundWarning = {
  type: "DUPLICATE_CLASS_ROUND";

  severity: "high";

  className: string;

  roundNumber: number;

  raceNumbers: number[];

  reason: string;
};

export type RaceScheduleMissingClassRoundWarning = {
  type: "MISSING_CLASS_ROUND";

  severity: "high";

  eventClassId: string;

  className: string;

  roundNumber: number;

  reason: string;
};

export type RaceScheduleEmptySlotWarning = {
  type: "EMPTY_RACE_SLOT";

  severity: "high";

  raceNumber: number | null;

  slotId: string;

  reason: string;
};

export type RaceScheduleValidationResult = {
  scheduleId: string;

  valid: boolean;

  structurallyValid: boolean;

  minimumRestRaceGap: number;

  summary?: Record<string, unknown> | null;

  raceWarnings: RaceScheduleRaceWarning[];

  multiClassRacerWarnings?: Array<{
    racerId?: string;

    racerName?: string;

    classNames?: string[];

    reason?: string;
  }>;

  classOverlaps?: unknown[];

  duplicateClassRoundWarnings: RaceScheduleDuplicateClassRoundWarning[];

  missingClassRoundWarnings: RaceScheduleMissingClassRoundWarning[];

  emptyRaceSlotWarnings: RaceScheduleEmptySlotWarning[];
};

export type AddRaceScheduleBreakInput = {
  displayOrder: number;

  label: string;

  durationMinutes: number;
};

export type MoveRaceScheduleSlotInput = {
  displayOrder: number;
};

export type SetRaceScheduleSlotLockInput = {
  isLocked: boolean;
};

export type MergeRaceScheduleSlotsInput = {
  sourceSlotId: string;
};

export type SplitRaceScheduleSlotInput = {
  slotClassId: string;
};

export type RaceSchedulePublishResult = {
  message: string;

  scheduleId: string;

  status: RaceScheduleStatus;

  version: number;

  publishedAt?: string | null;

  warnings?: RaceScheduleRaceWarning[];

  summary?: Record<string, unknown> | null;
};

export type RaceScheduleUnpublishResult = {
  message: string;

  scheduleId: string;

  status: RaceScheduleStatus;

  version: number;
};
