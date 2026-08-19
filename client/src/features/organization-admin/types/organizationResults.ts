export type ResultsEnrollmentSyncResult = {
  message?: string;

  registrationId?: string;

  created?: number;

  updated?: number;

  skipped?: number;

  enrolled?: number;

  removed?: number;

  [key: string]: unknown;
};

export type ResultsEnrollmentSyncState = {
  registrationId: string;

  status: "idle" | "syncing" | "success" | "error";

  message?: string;
};
