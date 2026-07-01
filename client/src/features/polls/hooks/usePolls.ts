import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getActivePolls,
  getPollResults,
  votePoll,
  deletePoll,
  getAdminPolls,
  getFeaturedPoll,
  getPublicPolls,
  setFeaturedPoll,
  createPoll,
  getPollById,
  updatePoll,
} from "../api/pollsApi";
import { getAnonymousVoterKey } from "../utils/voterKey";
import type { VotePollPayload } from "../types/poll.types";

export function useActivePolls(params?: {
  organizationId?: string;
  eventId?: string;
}) {
  return useQuery({
    queryKey: ["polls", "active", params],
    queryFn: () => getActivePolls(params),
  });
}

export function usePollResults(params: {
  pollId?: string;
  userId?: string;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ["polls", params.pollId, "results", params.userId],
    queryFn: () =>
      getPollResults({
        pollId: params.pollId as string,
        anonymousVoterKey: getAnonymousVoterKey(),
        userId: params.userId,
      }),
    enabled: Boolean(params.pollId) && (params.enabled ?? true),
  });
}

export function useVotePoll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      pollId: string;
      payload: Omit<VotePollPayload, "anonymousVoterKey"> & {
        anonymousVoterKey?: string;
      };
    }) => {
      return votePoll({
        pollId: params.pollId,
        payload: {
          ...params.payload,
          anonymousVoterKey:
            params.payload.anonymousVoterKey ?? getAnonymousVoterKey(),
        },
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["polls", variables.pollId, "results"],
      });

      queryClient.invalidateQueries({
        queryKey: ["polls", "active"],
      });
    },
  });
}

export function usePublicPolls() {
  return useQuery({
    queryKey: ["polls", "public"],
    queryFn: getPublicPolls,
  });
}

export function useFeaturedPoll() {
  return useQuery({
    queryKey: ["polls", "featured"],
    queryFn: getFeaturedPoll,
  });
}

export function useAdminPolls() {
  return useQuery({
    queryKey: ["polls", "admin"],
    queryFn: getAdminPolls,
  });
}

export function useSetFeaturedPoll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pollId: string) => setFeaturedPoll(pollId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["polls"] });
    },
  });
}

export function useDeletePoll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pollId: string) => deletePoll(pollId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["polls"] });
    },
  });
}

export function usePollById(pollId?: string) {
  return useQuery({
    queryKey: ["polls", "detail", pollId],
    queryFn: () => getPollById(pollId as string),
    enabled: Boolean(pollId),
  });
}

export function useCreatePoll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPoll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["polls"] });
    },
  });
}

export function useUpdatePoll() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePoll,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["polls"] });
    },
  });
}
