import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/apiClient";
import {
  marketingLabel,
  readMarketingStatus,
} from "@/lib/marketingPreferences";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
const actionClass =
  "min-h-11 rounded-xl border border-cl-border px-4 py-2 text-sm font-semibold disabled:opacity-50";
function useAccountMarketing(userId: string | number | undefined) {
  return useQuery({
    queryKey: ["marketing-account", userId],
    queryFn: readMarketingStatus,
    enabled: !!userId,
    staleTime: 0,
    gcTime: 0,
    retry: false,
    refetchOnWindowFocus: false,
  });
}
export function MarketingPreferences(props: {
  source?: "consumer-notifications" | "consumer-invite";
}) {
  const { user } = useAuth();
  return user ? <AccountPreferences key={String(user.id)} {...props} /> : null;
}
function AccountPreferences({
  source = "consumer-notifications",
}: {
  source?: "consumer-notifications" | "consumer-invite";
}) {
  const { user } = useAuth(),
    cache = useQueryClient(),
    { toast } = useToast(),
    q = useAccountMarketing(user?.id);
  const [checked, setChecked] = useState(false),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  if (!user) return null;
  async function change(subscribe: boolean) {
    if (busy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const json = await apiRequest(
        "POST",
        subscribe ? "/marketing/me/subscribe" : "/marketing/me/unsubscribe",
        subscribe ? { consent: true, adult: true, source } : {},
        { refreshOn401: false, logoutOn401: false },
      );
      const text =
        (json.data ?? json).message ||
        (subscribe
          ? "Check your inbox to confirm."
          : "Marketing emails are off.");
      setMessage(text);
      setChecked(false);
      if (source === "consumer-invite")
        toast({ title: "Email updates", description: text });
      await cache.invalidateQueries({
        queryKey: ["marketing-account", user?.id],
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      aria-label="Corner League marketing email preferences"
      className="rounded-2xl border border-cl-border bg-cl-surface p-5 space-y-3"
    >
      <h2 className="text-lg font-bold">Corner League email updates</h2>
      <p className="text-sm text-cl-muted">
        Optional news, platform updates and promotions. Transaction,
        organization and community notification settings are separate.
      </p>
      {q.isPending ? (
        <p role="status">Loading email preference…</p>
      ) : q.isError ? (
        <>
          <p role="alert">Unable to load your email preference.</p>
          <button
            type="button"
            className={actionClass}
            onClick={() => void q.refetch()}
          >
            Retry
          </button>
        </>
      ) : (
        q.data && (
          <>
            <p className="text-sm">{marketingLabel(q.data)}</p>
            <p className="text-sm text-cl-muted">{q.data.email}</p>
            {q.data.status === "confirmed" &&
              q.data.delivery === "suppressed" && (
                <p className="text-sm text-cl-muted">
                  Your email provider preference prevents campaigns. Use the
                  preferences link in your latest campaign email to review it.
                </p>
              )}
            {q.data.status !== "confirmed" && q.data.enabled && (
              <>
                <label className="flex items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={busy}
                    onChange={(e) => setChecked(e.target.checked)}
                    className="mt-1"
                  />
                  <span>{q.data.consentText}</span>
                </label>
                <button
                  type="button"
                  className={actionClass}
                  disabled={busy || !checked}
                  onClick={() => void change(true)}
                >
                  {q.data.status === "pending"
                    ? "Request confirmation again"
                    : "Subscribe to email updates"}
                </button>
                <p className="text-xs text-cl-muted">
                  Confirm using the email we send. Repeat confirmation requests
                  have a short cooldown.
                </p>
              </>
            )}
            {!q.data.enabled && q.data.status !== "confirmed" && (
              <p className="text-sm text-cl-muted">
                New subscriptions are currently unavailable.
              </p>
            )}
            {(q.data.status === "confirmed" || q.data.status === "pending") && (
              <button
                type="button"
                className={actionClass}
                disabled={busy}
                onClick={() => void change(false)}
              >
                {q.data.status === "pending"
                  ? "Cancel email subscription request"
                  : "Unsubscribe from marketing emails"}
              </button>
            )}
            <button
              type="button"
              className={actionClass}
              disabled={busy || q.isFetching}
              onClick={() => void q.refetch()}
            >
              Refresh email preference
            </button>
          </>
        )
      )}
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </section>
  );
}
export function MarketingInvitation() {
  const { user } = useAuth();
  return <AccountInvitation key={String(user?.id ?? "anonymous")} />;
}
function AccountInvitation() {
  const { user } = useAuth(),
    cache = useQueryClient(),
    status = useAccountMarketing(user?.id),
    [closed, setClosed] = useState(false),
    [granted, setGranted] = useState(false);
  const claim = useQuery({
    queryKey: ["marketing-invitation", user?.id],
    queryFn: async () => {
      const json = await apiRequest(
        "POST",
        "/marketing/me/prompt/claim",
        {},
        { refreshOn401: false, logoutOn401: false },
      );
      return (json.data ?? json) as { show: boolean };
    },
    enabled: !!user?.id && !!status.data?.promptEligible && !status.isFetching,
    staleTime: Infinity,
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
  useEffect(() => {
    if (
      !status.isFetching &&
      status.data?.promptEligible &&
      claim.data?.show === true
    )
      setGranted(true);
  }, [status.isFetching, status.data?.promptEligible, claim.data?.show]);
  const show = !closed && granted && status.data?.status === "none";
  function dismiss() {
    setClosed(true);
    cache.setQueryData(["marketing-invitation", user?.id], { show: false });
    void cache.invalidateQueries({ queryKey: ["marketing-account", user?.id] });
  }
  return (
    <Dialog
      open={show}
      onOpenChange={(open) => {
        if (!open) dismiss();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Stay in the loop with Corner League</DialogTitle>
          <DialogDescription>
            Choose whether to receive optional email updates. You can change
            this later on your Notifications page.
          </DialogDescription>
        </DialogHeader>
        <MarketingPreferences source="consumer-invite" />
        <button type="button" className={actionClass} onClick={dismiss}>
          No thanks / Close
        </button>
      </DialogContent>
    </Dialog>
  );
}
