import { AtSign, MapPin, Phone, ShieldCheck } from "lucide-react";
import type { RegistrationContact } from "../types/registration.types";

type ContactInformationStepProps = {
  contact: RegistrationContact;
  accountEmail?: string | null;
  onChange: (contact: Partial<RegistrationContact>) => void;
};

const inputClassName =
  "h-12 w-full rounded-[16px] border border-cl-border bg-cl-subtle px-4 text-sm text-cl-ink outline-none placeholder:text-cl-muted transition focus:border-cl-accent/30 focus:bg-cl-accent/[0.05] focus:ring-2 focus:ring-cl-accent/10";

const labelClassName =
  "mb-2 block text-[10px] font-black uppercase tracking-[0.13em] text-cl-muted";

export function isContactInformationComplete(contact: RegistrationContact) {
  return (
    contact.email.trim().length > 0 &&
    contact.email.includes("@") &&
    contact.phone.trim().length >= 7 &&
    contact.city.trim().length > 0 &&
    contact.countryCode.trim().length > 0
  );
}

export default function ContactInformationStep({
  contact,
  accountEmail,
  onChange,
}: ContactInformationStepProps) {
  const usingAccountEmail =
    Boolean(accountEmail) &&
    contact.email.trim().toLowerCase() ===
      String(accountEmail).trim().toLowerCase();

  return (
    <div className="space-y-5">
      <div>
        <div className="text-[9px] font-black uppercase tracking-[0.18em] text-cl-accent">
          Step 2 of 6
        </div>

        <h2 className="mt-2 text-2xl font-black uppercase tracking-[-0.035em] text-cl-ink sm:text-3xl">
          Contact information
        </h2>

        <p className="mt-2 max-w-2xl text-sm leading-7 text-cl-muted">
          This information is used for registration confirmation, race updates,
          payment communication, and organizer contact. It will not appear on
          the public racer list.
        </p>
      </div>

      {accountEmail ? (
        <div className="flex flex-col gap-3 rounded-[20px] border border-cl-accent/[0.15] bg-cl-accent/[0.055] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-cl-accent" />

            <div className="min-w-0">
              <p className="text-xs font-black uppercase tracking-[0.11em] text-cl-ink">
                Corner League account email
              </p>

              <p className="mt-1 truncate text-sm text-cl-muted">
                {accountEmail}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onChange({ email: accountEmail })}
            className={`shrink-0 rounded-full border px-4 py-2.5 text-[9px] font-black uppercase tracking-[0.13em] transition ${
              usingAccountEmail
                ? "border-emerald-300/20 bg-emerald-300/10 text-cl-success"
                : "border-cl-accent/20 bg-cl-accent/10 text-cl-accent hover:bg-cl-accent hover:text-cl-contrast"
            }`}
          >
            {usingAccountEmail ? "Account Email Applied" : "Use Account Email"}
          </button>
        </div>
      ) : null}

      <div className="rounded-[26px] border border-cl-accent/10 bg-cl-surface p-4 sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className={labelClassName}>Email address *</span>

            <div className="relative">
              <AtSign className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cl-muted" />

              <input
                type="email"
                value={contact.email}
                onChange={(event) => onChange({ email: event.target.value })}
                autoComplete="email"
                className={`${inputClassName} pl-11`}
                placeholder="registration@example.com"
              />
            </div>

            <p className="mt-2 text-[11px] leading-5 text-cl-muted">
              Registration confirmation and payment details will be sent to this
              address.
            </p>
          </label>

          <label className="sm:col-span-2">
            <span className={labelClassName}>Phone number *</span>

            <div className="relative">
              <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cl-muted" />

              <input
                type="tel"
                value={contact.phone}
                onChange={(event) => onChange({ phone: event.target.value })}
                autoComplete="tel"
                inputMode="tel"
                className={`${inputClassName} pl-11`}
                placeholder="+1 (951) 555-0123"
              />
            </div>
          </label>
        </div>
      </div>

      <div className="rounded-[26px] border border-cl-accent/10 bg-cl-surface p-4 sm:p-5">
        <div className="mb-4 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-cl-accent" />

          <h3 className="text-xs font-black uppercase tracking-[0.12em] text-cl-ink">
            Registrant Location
          </h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className={labelClassName}>City *</span>

            <input
              value={contact.city}
              onChange={(event) => onChange({ city: event.target.value })}
              autoComplete="address-level2"
              className={inputClassName}
              placeholder="City"
            />
          </label>

          <label>
            <span className={labelClassName}>State or province</span>

            <input
              value={contact.stateCode || ""}
              onChange={(event) => onChange({ stateCode: event.target.value })}
              autoComplete="address-level1"
              className={inputClassName}
              placeholder="CA, AZ, Ontario..."
            />
          </label>

          <label className="sm:col-span-2">
            <span className={labelClassName}>Country code *</span>

            <input
              value={contact.countryCode}
              onChange={(event) =>
                onChange({
                  countryCode: event.target.value.toUpperCase().slice(0, 3),
                })
              }
              autoComplete="country"
              className={inputClassName}
              placeholder="US"
            />

            <p className="mt-2 text-[11px] leading-5 text-cl-muted">
              Use a short country code such as US, CA, GB, AU, or JP.
            </p>
          </label>
        </div>
      </div>

      <div className="rounded-[20px] border border-cl-border bg-cl-subtle p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-cl-accent" />

          <p className="text-xs leading-6 text-cl-muted">
            Contact information remains private and will only be available to
            the race organization and authorized Corner League administrators.
          </p>
        </div>
      </div>
    </div>
  );
}
