import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createOrganizationMember,
  getOrganizationMembers,
  reactivateOrganizationMember,
  removeOrganizationMember,
  suspendOrganizationMember,
  updateOrganizationMember,
} from "../api/organizationMembersApi";

import type {
  CreateOrganizationMemberInput,
  UpdateOrganizationMemberInput,
} from "../types/organizationMembers";

export const organizationMembersQueryKey = (organizationId: string) => [
  "organization-admin",
  organizationId,
  "members",
];

export function useOrganizationMembers(organizationId: string, enabled = true) {
  return useQuery({
    queryKey: organizationMembersQueryKey(organizationId),

    queryFn: () => getOrganizationMembers(organizationId),

    enabled: enabled && !!organizationId,
  });
}

export function useCreateOrganizationMember(organizationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateOrganizationMemberInput) =>
      createOrganizationMember(organizationId, input),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: organizationMembersQueryKey(organizationId),
      });
    },
  });
}

export function useUpdateOrganizationMember(organizationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      memberId,
      input,
    }: {
      memberId: string;
      input: UpdateOrganizationMemberInput;
    }) => updateOrganizationMember(organizationId, memberId, input),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: organizationMembersQueryKey(organizationId),
      });
    },
  });
}

export function useSuspendOrganizationMember(organizationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) =>
      suspendOrganizationMember(organizationId, memberId),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: organizationMembersQueryKey(organizationId),
      });
    },
  });
}

export function useReactivateOrganizationMember(organizationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) =>
      reactivateOrganizationMember(organizationId, memberId),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: organizationMembersQueryKey(organizationId),
      });
    },
  });
}

export function useRemoveOrganizationMember(organizationId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (memberId: string) =>
      removeOrganizationMember(organizationId, memberId),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: organizationMembersQueryKey(organizationId),
      });
    },
  });
}
