import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import {
  socialRequest,
  loadPreferences,
  parsePreferences,
  type Preferences,
} from "@/lib/socialApi";
import { SocialFailure, socialBox, socialButton } from "./SocialPosts";
export default function SocialPreferences() {
  const { user, isAuthenticated } = useAuth();
  const cache = useQueryClient();
  const key = ["social-preferences", user?.id];
  const query = useQuery({
    queryKey: key,
    queryFn: loadPreferences,
    enabled: isAuthenticated,
    retry: false,
  });
  const change = useMutation({
    mutationFn: (body: Partial<Preferences>) =>
      socialRequest<Preferences>("PATCH", "me/preferences", body).then(
        parsePreferences,
      ),
    onSuccess: (data) => cache.setQueryData(key, data),
  });
  return (
    <section className={socialBox}>
      <h2 className="text-xl font-bold">Notifications & messages</h2>
      <p className="mt-2 text-sm text-white/60">
        Choose your in-app alerts, optional emails and who can send you a direct
        message.
      </p>
      {query.isPending ? (
        <p role="status" className="mt-4">
          Loading preferences…
        </p>
      ) : query.isError ? (
        <>
          <SocialFailure error={query.error} />
          <button className={socialButton} onClick={() => void query.refetch()}>
            Retry
          </button>
        </>
      ) : (
        <div className="mt-5 space-y-4">
          {(
            [
              ["follows", "New followers"],
              ["likes", "Likes on my posts"],
              ["comments", "Comments on my posts"],
              ["posts", "New posts from users and athletes I follow"],
              ["messages", "New direct messages"],
            ] as const
          ).map(([key, label]) => (
            <label
              key={key}
              className="flex min-h-11 items-center justify-between gap-4"
            >
              <span className="text-sm text-white/85">{label}</span>
              <input
                type="checkbox"
                checked={query.data[key]}
                disabled={change.isPending}
                onChange={(event) =>
                  change.mutate({ [key]: event.target.checked })
                }
                className="h-5 w-5 accent-cyan-300"
              />
            </label>
          ))}
          <fieldset className="border-t border-white/10 pt-4">
            <legend className="font-semibold">Email notifications</legend>
            <p className="mb-3 text-xs text-white/60">
              Emails are off by default. Enable the matching in-app alert above
              to receive emails for new activity. Message emails never include
              the message body. Ticket receipts are separate.
            </p>
            {(
              [
                ["emailFollows", "New followers"],
                ["emailLikes", "Likes on my posts"],
                ["emailComments", "Comments on my posts"],
                ["emailPosts", "Updates from users and athletes I follow"],
                ["emailMessages", "New direct messages"],
              ] as const
            ).map(([key, label]) => (
              <label
                key={key}
                className="flex min-h-11 items-center justify-between gap-4"
              >
                <span className="text-sm text-white/85">{label}</span>
                <input
                  type="checkbox"
                  checked={query.data[key]}
                  disabled={change.isPending}
                  onChange={(event) =>
                    change.mutate({ [key]: event.target.checked })
                  }
                  className="h-5 w-5 accent-cyan-300"
                />
              </label>
            ))}
          </fieldset>
          <label className="block border-t border-white/10 pt-4 text-sm">
            Who can message me?
            <select
              aria-label="Who can message me"
              value={query.data.allowMessages}
              disabled={change.isPending}
              onChange={(event) =>
                change.mutate({
                  allowMessages: event.target
                    .value as Preferences["allowMessages"],
                })
              }
              className="mt-2 w-full rounded-xl border border-white/15 bg-[#07111f] p-3"
            >
              <option value="everyone">Everyone</option>
              <option value="following">People I follow</option>
              <option value="nobody">Nobody</option>
            </select>
          </label>
          <p className="text-xs text-white/50">
            These settings control new in-app alerts. You can still read earlier
            conversations.
          </p>
        </div>
      )}
      {change.isSuccess && (
        <p role="status" className="mt-3 text-sm text-cyan-100">
          Preferences saved.
        </p>
      )}
      {change.isError && <SocialFailure error={change.error} />}
    </section>
  );
}
