// src/pages/admin-create-organization.tsx
import React, { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/apiClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Organization = {
  id: string;
  name: string;
  abbreviation?: string | null;
  description?: string | null;
  logoUrl?: string | null;
};

function pickOrgFromResponse(json: any): Organization | null {
  return (
    json?.data?.organization ?? json?.organization ?? json?.data ?? json ?? null
  );
}

export default function AdminCreateOrganizationPage() {
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [name, setName] = useState("");
  const [abbreviation, setAbbreviation] = useState("");
  const [description, setDescription] = useState("");

  const [saving, setSaving] = useState(false);

  const canSubmit = useMemo(() => {
    return name.trim().length > 0 && !saving;
  }, [name, saving]);

  async function createOrganization() {
    if (!name.trim()) {
      toast({
        variant: "destructive",
        title: "Missing name",
        description: "Organization name is required.",
      });
      return;
    }

    setSaving(true);
    try {
      // 1) Create the org
      const res = await apiFetch("/organizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          abbreviation: abbreviation.trim() || undefined,
          description: description.trim() || undefined,
        }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(json?.message || "Failed to create organization.");
      }

      toast({
        title: "Success",
        description: "Organization created.",
      });

      navigate("/aqua-organizations");
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: e?.message || "Something went wrong.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030913] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_28%),radial-gradient(circle_at_82%_12%,rgba(255,107,53,0.10),transparent_24%),linear-gradient(180deg,#030913_0%,#07111F_48%,#02050A_100%)]" />
        <div className="absolute inset-0 opacity-[0.04] [background-image:linear-gradient(rgba(255,255,255,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.16)_1px,transparent_1px)] [background-size:72px_72px]" />
      </div>

      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <section className="relative overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[linear-gradient(180deg,rgba(7,17,31,0.94)_0%,rgba(4,10,19,0.98)_100%)] p-5 shadow-[0_30px_90px_rgba(0,0,0,0.42)] sm:rounded-[38px] sm:p-8">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -left-24 top-0 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
            <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-[#FF6B35]/10 blur-3xl" />
            <div className="absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:72px_72px]" />
          </div>

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">
                  <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.95)]" />
                  Jet Ski Admin
                </div>

                <div className="inline-flex items-center rounded-full border border-[#FF6B35]/20 bg-[#FF6B35]/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#FFB199]">
                  Organization Setup
                </div>
              </div>

              <h1 className="max-w-3xl text-3xl font-black uppercase leading-[0.95] tracking-[-0.04em] text-white sm:text-5xl">
                Create{" "}
                <span className="bg-[linear-gradient(90deg,#19E3FF_0%,#7CF4FF_35%,#FF7849_100%)] bg-clip-text text-transparent">
                  Organization
                </span>
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
                Add a new AQUA race organization to your Corner League database.
              </p>
            </div>

            <Button
              variant="outline"
              className="w-full rounded-full border-cyan-300/15 bg-cyan-300/10 px-5 py-5 text-xs font-black uppercase tracking-[0.18em] text-cyan-100 hover:bg-cyan-300/15 hover:text-white sm:w-auto"
              onClick={() => navigate("/aqua-organizations")}
            >
              View List
            </Button>
          </div>
        </section>

        <Card className="mt-6 overflow-hidden rounded-[30px] border border-cyan-300/10 bg-[#07111F]/90 p-0 shadow-[0_28px_80px_rgba(0,0,0,0.32)]">
          <div className="border-b border-white/10 px-5 py-5 sm:px-6">
            <div className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300/80">
              Organization Details
            </div>
            <p className="mt-2 text-sm text-white/55">
              Required fields are marked with an asterisk.
            </p>
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">
                  Name *
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="IJSBA"
                  className="h-12 rounded-[14px] border-white/10 bg-white/[0.05] text-white outline-none placeholder:text-white/35 focus-visible:ring-cyan-300/30"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">
                  Write IJSBA if Sanctioned
                </label>
                <Input
                  value={abbreviation}
                  onChange={(e) => setAbbreviation(e.target.value)}
                  placeholder="IJSBA"
                  className="h-12 rounded-[14px] border-white/10 bg-white/[0.05] text-white outline-none placeholder:text-white/35 focus-visible:ring-cyan-300/30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">
                Description
              </label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Official world finals series..."
                className="h-12 rounded-[14px] border-white/10 bg-white/[0.05] text-white outline-none placeholder:text-white/35 focus-visible:ring-cyan-300/30"
              />
            </div>

            <div className="flex flex-col gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center">
              <Button
                onClick={createOrganization}
                disabled={!canSubmit}
                className="h-12 rounded-full bg-cyan-300 px-6 text-xs font-black uppercase tracking-[0.16em] text-[#06111d] shadow-[0_0_28px_rgba(34,211,238,0.25)] hover:bg-cyan-200 disabled:opacity-50 sm:w-auto"
              >
                {saving ? "Saving..." : "Create Organization"}
              </Button>

              <Button
                variant="ghost"
                className="h-12 rounded-full border border-white/10 px-6 text-xs font-black uppercase tracking-[0.16em] text-white/70 hover:bg-white/10 hover:text-white sm:w-auto"
                onClick={() => navigate("/aqua-organizations")}
              >
                Cancel
              </Button>
            </div>

            <div className="rounded-[18px] border border-[#FF6B35]/15 bg-[#FF6B35]/[0.06] px-4 py-3 text-xs leading-6 text-[#FFB199]/80">
              Note: This page creates an organization via{" "}
              <code className="rounded bg-black/25 px-1.5 py-0.5 text-[#FFD2C2]">
                POST /organizations
              </code>
              .
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
