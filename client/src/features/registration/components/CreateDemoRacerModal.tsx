import { useEffect, useMemo, useState } from "react";
import { Loader2, MapPin, UserPlus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createDemoRegistrationRacer } from "../services/registrationDemoService";
import type {
  NewRegistrationRacerInput,
  RegistrationRacer,
} from "../types/registration.types";

type CreateDemoRacerModalProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (racer: RegistrationRacer) => void;
};

const inputClassName =
  "h-12 w-full rounded-[16px] border border-white/10 bg-white/[0.045] px-4 text-sm text-white outline-none placeholder:text-white/30 transition focus:border-cyan-300/30 focus:bg-cyan-300/[0.05] focus:ring-2 focus:ring-cyan-300/10";

const labelClassName =
  "mb-2 block text-[10px] font-black uppercase tracking-[0.13em] text-white/50";

const EMPTY_FORM: NewRegistrationRacerInput = {
  firstName: "",
  lastName: "",
  nickname: "",
  city: "",
  stateCode: "",
  countryCode: "US",
  raceNumber: "",
};

export default function CreateDemoRacerModal({
  open,
  onClose,
  onCreated,
}: CreateDemoRacerModalProps) {
  const { toast } = useToast();

  const [form, setForm] = useState<NewRegistrationRacerInput>(EMPTY_FORM);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setForm(EMPTY_FORM);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow || "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !submitting) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, submitting]);

  const canSubmit = useMemo(() => {
    return (
      form.firstName.trim().length > 0 &&
      form.lastName.trim().length > 0 &&
      form.city.trim().length > 0 &&
      form.countryCode.trim().length > 0 &&
      !submitting
    );
  }, [form.firstName, form.lastName, form.city, form.countryCode, submitting]);

  function updateField(field: keyof NewRegistrationRacerInput, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!canSubmit) {
      toast({
        title: "Missing racer information",
        description: "First name, last name, city, and country are required.",
        variant: "destructive",
      });

      return;
    }

    try {
      setSubmitting(true);

      const racer = await createDemoRegistrationRacer(form);

      onCreated(racer);

      toast({
        title: "Racer created",
        description: `${racer.name} has been selected for this demo registration.`,
      });

      onClose();
    } catch (error: any) {
      toast({
        title: "Unable to create racer",
        description: error?.message || "Please review the racer information.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[180] flex items-end justify-center sm:items-center sm:px-4">
      <button
        type="button"
        aria-label="Close create racer modal"
        onClick={() => {
          if (!submitting) {
            onClose();
          }
        }}
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
      />

      <div className="relative z-10 max-h-[94dvh] w-full overflow-y-auto rounded-t-[30px] border border-cyan-300/10 bg-[#07111F] shadow-[0_30px_100px_rgba(0,0,0,0.65)] sm:max-w-2xl sm:rounded-[30px]">
        <div className="sticky top-0 z-10 border-b border-white/10 bg-[#07111F]/95 p-5 backdrop-blur-xl sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-cyan-300/15 bg-cyan-300/10 text-cyan-200">
                <UserPlus className="h-5 w-5" />
              </div>

              <div>
                <div className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-200/60">
                  Demo Racer Record
                </div>

                <h2 className="mt-1 text-xl font-black uppercase tracking-[-0.025em] text-white sm:text-2xl">
                  Create New Racer
                </h2>

                <p className="mt-2 text-xs leading-5 text-white/45">
                  This creates a local demo record and does not update the
                  production database.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.05] text-white/60 transition hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className={labelClassName}>First name *</span>

              <input
                value={form.firstName}
                onChange={(event) =>
                  updateField("firstName", event.target.value)
                }
                autoComplete="given-name"
                className={inputClassName}
                placeholder="First name"
              />
            </label>

            <label>
              <span className={labelClassName}>Last name *</span>

              <input
                value={form.lastName}
                onChange={(event) =>
                  updateField("lastName", event.target.value)
                }
                autoComplete="family-name"
                className={inputClassName}
                placeholder="Last name"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className={labelClassName}>Nickname</span>

              <input
                value={form.nickname || ""}
                onChange={(event) =>
                  updateField("nickname", event.target.value)
                }
                className={inputClassName}
                placeholder="Optional"
              />
            </label>

            <label>
              <span className={labelClassName}>Race number</span>

              <input
                value={form.raceNumber || ""}
                onChange={(event) =>
                  updateField("raceNumber", event.target.value)
                }
                inputMode="numeric"
                className={inputClassName}
                placeholder="Optional"
              />
            </label>
          </div>

          <div className="rounded-[22px] border border-white/10 bg-white/[0.025] p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-cyan-200" />

              <h3 className="text-xs font-black uppercase tracking-[0.12em] text-white">
                Racer Location
              </h3>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label>
                <span className={labelClassName}>City *</span>

                <input
                  value={form.city}
                  onChange={(event) => updateField("city", event.target.value)}
                  autoComplete="address-level2"
                  className={inputClassName}
                  placeholder="City"
                />
              </label>

              <label>
                <span className={labelClassName}>State or province</span>

                <input
                  value={form.stateCode || ""}
                  onChange={(event) =>
                    updateField("stateCode", event.target.value)
                  }
                  autoComplete="address-level1"
                  className={inputClassName}
                  placeholder="CA, AZ, Ontario..."
                />
              </label>

              <label className="sm:col-span-2">
                <span className={labelClassName}>Country code *</span>

                <input
                  value={form.countryCode}
                  onChange={(event) =>
                    updateField(
                      "countryCode",
                      event.target.value.toUpperCase().slice(0, 3),
                    )
                  }
                  autoComplete="country"
                  className={inputClassName}
                  placeholder="US"
                />

                <p className="mt-2 text-[11px] leading-5 text-white/35">
                  Use a two-letter country code such as US, CA, GB, AU, or JP.
                </p>
              </label>
            </div>
          </div>

          <div className="sticky bottom-0 -mx-5 -mb-5 border-t border-white/10 bg-[#07111F]/95 p-4 backdrop-blur-xl sm:-mx-6 sm:-mb-6 sm:flex sm:justify-end sm:gap-3 sm:p-5">
            <button
              type="button"
              disabled={submitting}
              onClick={onClose}
              className="hidden min-h-12 rounded-full border border-white/10 bg-white/[0.05] px-5 text-[10px] font-black uppercase tracking-[0.14em] text-white/65 transition hover:bg-white/10 hover:text-white sm:inline-flex sm:items-center sm:justify-center"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!canSubmit}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-cyan-300 px-6 text-[10px] font-black uppercase tracking-[0.15em] text-[#06111d] shadow-[0_0_28px_rgba(34,211,238,0.2)] transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/35 sm:w-auto"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating Racer
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Create and Select Racer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
