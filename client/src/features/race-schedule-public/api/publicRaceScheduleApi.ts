import { apiRequest } from "@/lib/apiClient";

import type { PublicRaceScheduleDayResponse } from "../types/publicRaceSchedule";

type ApiEnvelope<T> = {
  status?: boolean;

  statusCode?: number;

  path?: string;

  message?: string;

  data?: T;

  result?: T;

  timestamp?: string;
};

function unwrap<T>(response: T | ApiEnvelope<T>): T {
  if (response && typeof response === "object") {
    const envelope = response as ApiEnvelope<T>;

    if (envelope.data !== undefined) {
      return envelope.data;
    }

    if (envelope.result !== undefined) {
      return envelope.result;
    }
  }

  return response as T;
}

export async function getPublishedRaceScheduleDay(
  dayId: string,
): Promise<PublicRaceScheduleDayResponse> {
  const response = await apiRequest<
    PublicRaceScheduleDayResponse | ApiEnvelope<PublicRaceScheduleDayResponse>
  >(
    "GET",
    `/race-scheduling/public/days/${encodeURIComponent(dayId)}`,
    undefined,
    {
      refreshOn401: false,

      logoutOn401: false,
    },
  );

  return unwrap(response);
}
