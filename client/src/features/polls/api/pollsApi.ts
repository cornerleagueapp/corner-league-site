import { apiFetch } from "@/lib/apiClient";
import type {
  AdminPollListItem,
  CreatePollInput,
  Poll,
  PollResults,
  UpdatePollInput,
  VotePollPayload,
  VotePollResponse,
} from "../types/poll.types";

async function parseApiResponse<T>(response: Response): Promise<T> {
  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = json?.message || json?.error || "Request failed.";
    throw new Error(Array.isArray(message) ? message.join(", ") : message);
  }

  return json as T;
}

function unwrapArray<T>(payload: any): T[] {
  if (Array.isArray(payload)) return payload;

  if (Array.isArray(payload?.data)) return payload.data;

  if (Array.isArray(payload?.data?.items)) return payload.data.items;

  if (Array.isArray(payload?.data?.polls)) return payload.data.polls;

  if (Array.isArray(payload?.polls)) return payload.polls;

  if (Array.isArray(payload?.items)) return payload.items;

  return [];
}

function unwrapObject<T>(payload: any): T | null {
  if (!payload) return null;

  if (Object.prototype.hasOwnProperty.call(payload, "data")) {
    if (payload.data === null || payload.data === undefined) {
      return null;
    }

    if (payload.data?.poll) {
      return payload.data.poll as T;
    }

    return payload.data as T;
  }

  if (payload?.poll) {
    return payload.poll as T;
  }

  if (payload?.id) {
    return payload as T;
  }

  return null;
}

export async function getActivePolls(params?: {
  organizationId?: string;
  eventId?: string;
}): Promise<Poll[]> {
  const searchParams = new URLSearchParams();

  if (params?.organizationId) {
    searchParams.set("organizationId", params.organizationId);
  }

  if (params?.eventId) {
    searchParams.set("eventId", params.eventId);
  }

  const query = searchParams.toString();

  const response = await apiFetch(`/polls/active${query ? `?${query}` : ""}`, {
    method: "GET",
    skipAuth: true,
    noRefresh: true,
  });

  const payload = await parseApiResponse<any>(response);
  return unwrapArray<Poll>(payload);
}

export async function getPublicPolls(): Promise<Poll[]> {
  const response = await apiFetch(`/polls/public`, {
    method: "GET",
    skipAuth: true,
    noRefresh: true,
  });

  const payload = await parseApiResponse<any>(response);
  return unwrapArray<Poll>(payload);
}

export async function getFeaturedPoll(): Promise<Poll | null> {
  const response = await apiFetch(`/polls/featured`, {
    method: "GET",
    skipAuth: true,
    noRefresh: true,
  });

  const payload = await parseApiResponse<any>(response);
  const poll = unwrapObject<Poll>(payload);

  if (!poll?.id || !poll?.title) {
    return null;
  }

  return poll;
}

export async function getPollById(pollId: string): Promise<Poll> {
  const response = await apiFetch(`/polls/${pollId}`, {
    method: "GET",
    skipAuth: true,
    noRefresh: true,
  });

  const payload = await parseApiResponse<any>(response);
  const poll = unwrapObject<Poll>(payload);

  if (!poll) {
    throw new Error("Poll not found.");
  }

  return poll;
}

export async function getPollResults(params: {
  pollId: string;
  anonymousVoterKey?: string;
  userId?: string;
}): Promise<PollResults> {
  const searchParams = new URLSearchParams();

  if (params.anonymousVoterKey) {
    searchParams.set("anonymousVoterKey", params.anonymousVoterKey);
  }

  if (params.userId) {
    searchParams.set("userId", params.userId);
  }

  const query = searchParams.toString();

  const response = await apiFetch(
    `/polls/${params.pollId}/results${query ? `?${query}` : ""}`,
    {
      method: "GET",
      skipAuth: true,
      noRefresh: true,
    },
  );

  const payload = await parseApiResponse<any>(response);
  const results = unwrapObject<PollResults>(payload);

  if (!results) {
    throw new Error("Poll results not found.");
  }

  return results;
}

export async function votePoll(params: {
  pollId: string;
  payload: VotePollPayload;
}): Promise<VotePollResponse> {
  const response = await apiFetch(`/polls/${params.pollId}/vote`, {
    method: "POST",
    skipAuth: true,
    noRefresh: true,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params.payload),
  });

  const payload = await parseApiResponse<any>(response);
  const result = unwrapObject<VotePollResponse>(payload);

  if (!result) {
    throw new Error("Vote response not found.");
  }

  return result;
}

export async function getAdminPolls(): Promise<AdminPollListItem[]> {
  const response = await apiFetch(`/polls/admin`, {
    method: "GET",
    noRefresh: true,
  });

  const payload = await parseApiResponse<any>(response);
  return unwrapArray<AdminPollListItem>(payload);
}

export async function createPoll(payload: CreatePollInput): Promise<Poll> {
  const response = await apiFetch(`/polls`, {
    method: "POST",
    noRefresh: true,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const json = await parseApiResponse<any>(response);
  const poll = unwrapObject<Poll>(json);

  if (!poll) {
    throw new Error("Created poll was not returned.");
  }

  return poll;
}

export async function updatePoll(params: {
  pollId: string;
  payload: UpdatePollInput;
}): Promise<Poll> {
  const response = await apiFetch(`/polls/${params.pollId}`, {
    method: "PUT",
    noRefresh: true,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params.payload),
  });

  const json = await parseApiResponse<any>(response);
  const poll = unwrapObject<Poll>(json);

  if (!poll) {
    throw new Error("Updated poll was not returned.");
  }

  return poll;
}

export async function setFeaturedPoll(pollId: string): Promise<{
  success: boolean;
  message: string;
  poll: Poll;
}> {
  const response = await apiFetch(`/polls/${pollId}/set-featured`, {
    method: "POST",
    noRefresh: true,
  });

  const payload = await parseApiResponse<any>(response);

  return {
    success: Boolean(payload?.success ?? payload?.data?.success ?? true),
    message:
      payload?.message ?? payload?.data?.message ?? "Poll set as featured.",
    poll: unwrapObject<Poll>(payload?.poll ?? payload?.data?.poll) as Poll,
  };
}

export async function deletePoll(pollId: string): Promise<{
  success: boolean;
  message: string;
}> {
  const response = await apiFetch(`/polls/${pollId}`, {
    method: "DELETE",
    noRefresh: true,
  });

  const payload = await parseApiResponse<any>(response);

  return {
    success: Boolean(payload?.success ?? payload?.data?.success ?? true),
    message:
      payload?.message ??
      payload?.data?.message ??
      "Poll deleted successfully.",
  };
}
