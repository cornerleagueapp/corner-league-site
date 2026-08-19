import { useMutation, useQueryClient } from "@tanstack/react-query";

import { syncRegistrationResultsEnrollment } from "../api/organizationResultsApi";

export function useSyncRegistrationResultsEnrollment(
  eventId: string | null | undefined,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (registrationId: string) =>
      syncRegistrationResultsEnrollment(registrationId),

    onSuccess: async () => {
      if (!eventId) {
        return;
      }

      await queryClient.invalidateQueries({
        queryKey: ["organization-admin-registrations", eventId],
      });
    },
  });
}
