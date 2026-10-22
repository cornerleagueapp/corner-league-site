import { useQuery } from "@tanstack/react-query";
import { publicSportData } from "@/lib/sportRegistration";
export function useMarketingConfig() {
  return useQuery<{ enabled: boolean; consentText: string }>({
    queryKey: ["marketing-config"],
    queryFn: () => publicSportData("/marketing/config"),
    staleTime: 300000,
    retry: false,
  });
}
export default function SignupMarketingCheckbox({
  checked,
  onChange,
  consentText,
  disabled = false,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  consentText: string;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-start gap-3 rounded-xl border border-cl-border p-4 text-sm text-cl-ink">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1"
      />
      <span>
        {consentText}
        <span className="mt-1 block text-xs text-cl-muted">
          Optional. Confirm through the email we send you. Leaving this
          unchecked does not affect account creation.
        </span>
      </span>
    </label>
  );
}
