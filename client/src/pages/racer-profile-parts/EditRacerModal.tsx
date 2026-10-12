import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Camera,
  ExternalLink,
  Link as LinkIcon,
  Medal,
  Plus,
  Sparkles,
  Trash2,
  User,
  X as XIcon,
} from "lucide-react";
import type { EditValues, RacerSponsor, SponsorDraft } from "./types";
import { getSponsorLogo, getSponsorWebsite } from "./racerProfileUtils";
import { LocationAutocomplete } from "@/components/LocationAutocomplete";

type EditTab = "profile" | "media" | "sponsors" | "socials";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-xs text-cl-muted">{label}</div>
      {children}
    </label>
  );
}

function TabButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-[0.12em] transition ${
        active
          ? "border-cl-accent/40 bg-cl-accent/[0.15] text-cl-accent"
          : "border-cl-border bg-cl-subtle text-cl-muted hover:bg-cl-subtle hover:text-cl-ink"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

export function EditRacerModal({
  initial,
  onClose,
  onSave,
  uploadPct,
  profileImageUrl,
  headerImageUrl,
  sponsors = [],
}: {
  initial: EditValues;
  onClose: () => void;
  onSave: (v: EditValues) => Promise<void> | void;
  uploadPct?: number | null;
  profileImageUrl?: string | null;
  headerImageUrl?: string | null;
  sponsors?: RacerSponsor[];
}) {
  const [vals, setVals] = useState<EditValues>(initial);
  const [activeTab, setActiveTab] = useState<EditTab>("profile");
  const [saving, setSaving] = useState(false);
  const [profilePreviewUrl, setProfilePreviewUrl] = useState<string | null>(
    null,
  );
  const [headerPreviewUrl, setHeaderPreviewUrl] = useState<string | null>(null);

  const [sponsorDrafts, setSponsorDrafts] = useState<SponsorDraft[]>([
    {
      id: crypto.randomUUID(),
      name: "",
      websiteUrl: "",
      logoFile: null,
    },
  ]);

  const set =
    (k: keyof EditValues) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      setVals((p) => ({ ...p, [k]: e.target.value }));

  React.useEffect(() => {
    return () => {
      if (profilePreviewUrl) URL.revokeObjectURL(profilePreviewUrl);
      if (headerPreviewUrl) URL.revokeObjectURL(headerPreviewUrl);
    };
  }, [profilePreviewUrl, headerPreviewUrl]);

  const inputClass =
    "h-10 w-full rounded-md border border-cl-border bg-cl-subtle px-3 text-sm text-cl-ink outline-none placeholder:text-cl-muted";
  const fileClass =
    "h-10 w-full rounded-md border border-cl-border bg-cl-subtle px-3 py-1 text-sm text-cl-ink outline-none";
  const textAreaClass =
    "w-full rounded-md border border-cl-border bg-cl-subtle px-3 py-2 text-sm text-cl-ink outline-none placeholder:text-cl-muted";

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70"
      onClick={onClose}
    >
      <div
        className="flex h-[92vh] w-full flex-col overflow-hidden border border-cl-accent/10 bg-cl-canvas shadow-cl-panel md:max-w-3xl md:rounded-[30px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-cl-border px-4 py-4 md:px-6">
          <div>
            <h2 className="text-lg font-semibold text-cl-ink">Edit Profile</h2>
            <p className="mt-1 text-xs text-cl-muted">
              Update your profile info, media, sponsors, gallery, and socials.
            </p>
          </div>

          <button
            aria-label="Close"
            className="grid h-9 w-9 place-items-center rounded-full border border-cl-border bg-cl-subtle hover:bg-cl-subtle"
            onClick={onClose}
            disabled={saving}
          >
            <XIcon size={16} />
          </button>
        </div>

        <div className="shrink-0 flex gap-2 overflow-x-auto border-b border-cl-border px-4 py-3 md:px-6">
          <TabButton
            active={activeTab === "profile"}
            icon={<User className="h-4 w-4" />}
            label="Profile"
            onClick={() => setActiveTab("profile")}
          />
          <TabButton
            active={activeTab === "media"}
            icon={<Camera className="h-4 w-4" />}
            label="Images"
            onClick={() => setActiveTab("media")}
          />
          <TabButton
            active={activeTab === "sponsors"}
            icon={<Medal className="h-4 w-4" />}
            label="Sponsors"
            onClick={() => setActiveTab("sponsors")}
          />
          <TabButton
            active={activeTab === "socials"}
            icon={<LinkIcon className="h-4 w-4" />}
            label="Socials"
            onClick={() => setActiveTab("socials")}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-6">
          {activeTab === "profile" && (
            <div className="space-y-4">
              <div className="rounded-[18px] border border-yellow-300/20 bg-yellow-500/10 p-4">
                <div className="flex gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-cl-warning" />

                  <div>
                    <div className="text-sm font-semibold text-cl-warning">
                      Name changes are not recommended
                    </div>
                    <p className="mt-1 text-xs leading-5 text-cl-warning">
                      This racer name may be linked to rankings, results,
                      analytics, profile claims, and other historical records.
                      Only update it if the current name is incorrect or needs a
                      real correction.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="First Name">
                  <input
                    value={vals.firstName ?? ""}
                    onChange={set("firstName")}
                    className={inputClass}
                    placeholder="e.g., Michael"
                  />
                </Field>

                <Field label="Last Name">
                  <input
                    value={vals.lastName ?? ""}
                    onChange={set("lastName")}
                    className={inputClass}
                    placeholder="e.g., Peters"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Nickname">
                  <input
                    value={vals.nickname ?? ""}
                    onChange={set("nickname")}
                    className={inputClass}
                    placeholder="e.g., The Shark"
                  />
                </Field>

                <Field label="Racer Level">
                  <select
                    value={vals.skillLevel ?? "amateur"}
                    onChange={set("skillLevel")}
                    className={inputClass}
                  >
                    <option value="junior">Junior</option>
                    <option value="amateur">Amateur</option>
                    <option value="pro">Pro</option>
                  </select>
                </Field>
              </div>

              <Field label="Birthdate">
                <input
                  type="date"
                  value={vals.dateOfBirth ?? ""}
                  onChange={set("dateOfBirth")}
                  className={inputClass}
                />
              </Field>

              <Field label="Bio">
                <textarea
                  value={vals.bio ?? ""}
                  onChange={set("bio")}
                  rows={5}
                  className={textAreaClass}
                  placeholder="Tell people about you…"
                />
              </Field>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Height (inches)">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={36}
                    max={96}
                    step={1}
                    value={vals.heightInches ?? ""}
                    onChange={set("heightInches")}
                    className={inputClass}
                    placeholder="e.g., 70"
                  />
                </Field>

                <LocationAutocomplete
                  label="Location / Hometown"
                  value={vals.origin ?? ""}
                  placeholder="Search hometown, city, or country..."
                  onTextChange={(origin) =>
                    setVals((prev) => ({
                      ...prev,
                      origin,
                      formattedAddress: "",
                      latitude: "",
                      longitude: "",
                      placeId: "",
                      locationProvider: "",
                      city: "",
                      stateCode: "",
                      countryCode: "",
                    }))
                  }
                  onSelect={(selected) =>
                    setVals((prev) => ({
                      ...prev,
                      origin: selected.location,
                      formattedAddress: selected.formattedAddress,
                      latitude: selected.latitude,
                      longitude: selected.longitude,
                      placeId: selected.placeId,
                      locationProvider: selected.locationProvider,
                      city: selected.city ?? "",
                      stateCode: selected.stateCode ?? "",
                      countryCode: selected.countryCode ?? "",
                    }))
                  }
                />
              </div>

              <Field label="Boat Manufacturer / Ride">
                <input
                  value={vals.boatManufacturers ?? ""}
                  onChange={set("boatManufacturers")}
                  className={inputClass}
                  placeholder="e.g., Yamaha GP1800R SVHO"
                />
              </Field>
            </div>
          )}

          {activeTab === "media" && (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[22px] border border-cl-accent/10 bg-cl-accent/[0.04] p-4">
                  <div className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-cl-accent">
                    Current Racer Photo
                  </div>

                  {profilePreviewUrl ? (
                    <img
                      src={profilePreviewUrl}
                      alt="Selected profile preview"
                      className="h-32 w-32 rounded-full border border-cl-border object-cover"
                    />
                  ) : profileImageUrl ? (
                    <img
                      src={profileImageUrl}
                      alt="Current racer profile"
                      className="h-32 w-32 rounded-full border border-cl-border object-cover"
                    />
                  ) : (
                    <div className="grid h-32 w-32 place-items-center rounded-full border border-cl-border bg-cl-subtle text-xs text-cl-muted">
                      No photo
                    </div>
                  )}

                  <div className="mt-4">
                    <Field label="Replace Racer Photo">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => {
                          const file = e.currentTarget.files?.[0] || null;

                          if (
                            file &&
                            !/^image\/(jpeg|png|webp)$/.test(file.type)
                          ) {
                            alert("Please upload a JPG, PNG, or WEBP image.");
                            return;
                          }

                          setVals((p) => ({ ...p, imageFile: file }));

                          if (profilePreviewUrl) {
                            URL.revokeObjectURL(profilePreviewUrl);
                          }

                          setProfilePreviewUrl(
                            file ? URL.createObjectURL(file) : null,
                          );
                        }}
                        className={fileClass}
                      />
                    </Field>
                  </div>
                </div>

                <div className="rounded-[22px] border border-cl-accent/10 bg-cl-accent/[0.04] p-4">
                  <div className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-cl-accent">
                    Current Header Photo
                  </div>

                  {headerPreviewUrl ? (
                    <img
                      src={headerPreviewUrl}
                      alt="Selected header preview"
                      className="h-32 w-full rounded-[20px] border border-cl-border object-cover"
                    />
                  ) : headerImageUrl ? (
                    <img
                      src={headerImageUrl}
                      alt="Current header"
                      className="h-32 w-full rounded-[20px] border border-cl-border object-cover"
                    />
                  ) : (
                    <div className="grid h-32 w-full place-items-center rounded-[20px] border border-cl-border bg-cl-subtle text-xs text-cl-muted">
                      No header photo
                    </div>
                  )}

                  <div className="mt-4">
                    <Field label="Replace Header Photo / Action Image">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        onChange={(e) => {
                          const file = e.currentTarget.files?.[0] || null;

                          if (
                            file &&
                            !/^image\/(jpeg|png|webp)$/.test(file.type)
                          ) {
                            alert("Please upload a JPG, PNG, or WEBP image.");
                            return;
                          }

                          setVals((p) => ({ ...p, headerImageFile: file }));

                          if (headerPreviewUrl) {
                            URL.revokeObjectURL(headerPreviewUrl);
                          }

                          setHeaderPreviewUrl(
                            file ? URL.createObjectURL(file) : null,
                          );
                        }}
                        className={fileClass}
                      />
                    </Field>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "sponsors" && (
            <div className="space-y-4">
              <div className="rounded-[22px] border border-cl-accent/10 bg-cl-accent/[0.04] p-4">
                <div className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-cl-accent">
                  Current Sponsors
                </div>

                {sponsors.length === 0 ? (
                  <div className="rounded-[18px] border border-cl-border bg-cl-subtle p-4 text-sm text-cl-muted">
                    No sponsors added yet.
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {sponsors.map((sponsor) => {
                      const logo = getSponsorLogo(sponsor);
                      const website = getSponsorWebsite(sponsor);

                      return (
                        <a
                          key={sponsor.id}
                          href={website || "#"}
                          target={website ? "_blank" : undefined}
                          rel={website ? "noreferrer" : undefined}
                          className="flex items-center gap-3 rounded-[18px] border border-cl-border bg-cl-subtle p-3"
                          onClick={(e) => {
                            if (!website) e.preventDefault();
                          }}
                        >
                          {logo ? (
                            <img
                              src={logo}
                              alt={sponsor.name}
                              className="h-10 w-10 rounded-xl object-contain"
                            />
                          ) : (
                            <div className="grid h-10 w-10 place-items-center rounded-xl bg-cl-accent/10 text-cl-accent">
                              <Sparkles className="h-4 w-4" />
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold text-cl-ink">
                              {sponsor.name}
                            </div>
                            {website ? (
                              <div className="truncate text-xs text-cl-muted">
                                {website}
                              </div>
                            ) : null}
                          </div>

                          {website ? (
                            <ExternalLink className="h-4 w-4 text-cl-muted" />
                          ) : null}
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="rounded-[22px] border border-cl-accent/10 bg-cl-accent/[0.04] p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-cl-accent">
                    Add Sponsors
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setSponsorDrafts((prev) => [
                        ...prev,
                        {
                          id: crypto.randomUUID(),
                          name: "",
                          websiteUrl: "",
                          logoFile: null,
                        },
                      ])
                    }
                    className="inline-flex items-center gap-2 rounded-full border border-cl-accent/20 bg-cl-accent/10 px-3 py-2 text-xs font-bold text-cl-accent hover:bg-cl-accent/[0.15]"
                  >
                    <Plus className="h-4 w-4" />
                    Add Sponsor
                  </button>
                </div>

                <div className="space-y-4">
                  {sponsorDrafts.map((draft, index) => (
                    <div
                      key={draft.id}
                      className="rounded-[18px] border border-cl-border bg-cl-subtle p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div className="text-xs font-bold uppercase tracking-[0.14em] text-cl-muted">
                          Sponsor #{index + 1}
                        </div>

                        {sponsorDrafts.length > 1 ? (
                          <button
                            type="button"
                            onClick={() =>
                              setSponsorDrafts((prev) =>
                                prev.filter((item) => item.id !== draft.id),
                              )
                            }
                            className="grid h-8 w-8 place-items-center rounded-full border border-red-300/20 bg-red-500/10 text-cl-danger"
                            aria-label="Remove sponsor row"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        ) : null}
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Field label="Sponsor Name">
                          <input
                            value={draft.name}
                            onChange={(e) => {
                              const value = e.target.value;
                              setSponsorDrafts((prev) =>
                                prev.map((item) =>
                                  item.id === draft.id
                                    ? { ...item, name: value }
                                    : item,
                                ),
                              );
                            }}
                            className={inputClass}
                            placeholder="e.g., Red Bull"
                          />
                        </Field>

                        <Field label="Sponsor Website">
                          <input
                            value={draft.websiteUrl ?? ""}
                            onChange={(e) => {
                              const value = e.target.value;
                              setSponsorDrafts((prev) =>
                                prev.map((item) =>
                                  item.id === draft.id
                                    ? { ...item, websiteUrl: value }
                                    : item,
                                ),
                              );
                            }}
                            className={inputClass}
                            placeholder="https://sponsor.com"
                          />
                        </Field>
                      </div>

                      <div className="mt-3">
                        <Field label="Sponsor Logo">
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={(e) => {
                              const file = e.currentTarget.files?.[0] || null;
                              setSponsorDrafts((prev) =>
                                prev.map((item) =>
                                  item.id === draft.id
                                    ? { ...item, logoFile: file }
                                    : item,
                                ),
                              );
                            }}
                            className={fileClass}
                          />
                        </Field>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "socials" && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Instagram URL">
                <input
                  value={vals.instagramUrl ?? ""}
                  onChange={set("instagramUrl")}
                  className={inputClass}
                  placeholder="https://instagram.com/username"
                />
              </Field>

              <Field label="YouTube URL">
                <input
                  value={vals.youtubeUrl ?? ""}
                  onChange={set("youtubeUrl")}
                  className={inputClass}
                  placeholder="https://youtube.com/@username"
                />
              </Field>

              <Field label="TikTok URL">
                <input
                  value={vals.tiktokUrl ?? ""}
                  onChange={set("tiktokUrl")}
                  className={inputClass}
                  placeholder="https://tiktok.com/@username"
                />
              </Field>

              <Field label="Website URL">
                <input
                  value={vals.websiteUrl ?? ""}
                  onChange={set("websiteUrl")}
                  className={inputClass}
                  placeholder="https://example.com"
                />
              </Field>
            </div>
          )}
        </div>

        <div className="shrink-0 flex justify-end gap-2 border-t border-cl-border bg-cl-canvas px-4 py-4 md:px-6">
          <Button
            variant="ghost"
            onClick={onClose}
            className="border border-cl-border bg-transparent text-cl-ink hover:bg-cl-subtle"
            disabled={saving}
          >
            Cancel
          </Button>

          <Button
            onClick={async () => {
              try {
                setSaving(true);
                await onSave({
                  ...vals,
                  sponsorsToCreate: sponsorDrafts.filter((sponsor) =>
                    sponsor.name.trim(),
                  ),
                });
              } finally {
                setSaving(false);
              }
            }}
            className="bg-cl-surface text-cl-ink hover:bg-cl-subtle"
            disabled={saving}
          >
            {saving
              ? uploadPct != null
                ? `Uploading… ${uploadPct}%`
                : "Saving…"
              : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
