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
    <div className="w-full max-w-6xl mx-auto py-16 px-4 sm:px-6 lg:px-8 text-white space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-cyan-300/80">
            Jet Ski
          </p>
          <h1 className="text-2xl font-semibold text-white">
            Create Organization
          </h1>
          <p className="text-sm text-zinc-400">
            Add a new AQUA race organization to your database.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            className="bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800"
            onClick={() => navigate("/aqua-organizations")}
          >
            View List
          </Button>
        </div>
      </div>

      <Card className="bg-zinc-900/70 border border-zinc-700/70 p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm text-zinc-300">Name *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="IJSBA"
              className="bg-zinc-950 border-zinc-700 text-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm text-zinc-300">
              Write IJSBA if Sanctioned
            </label>
            <Input
              value={abbreviation}
              onChange={(e) => setAbbreviation(e.target.value)}
              placeholder="IJSBA"
              className="bg-zinc-950 border-zinc-700 text-white"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm text-zinc-300">Description</label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Official world finals series..."
            className="bg-zinc-950 border-zinc-700 text-white"
          />
        </div>

        <div className="pt-2 flex items-center gap-3">
          <Button
            onClick={createOrganization}
            disabled={!canSubmit}
            className="bg-white text-black hover:bg-zinc-200"
          >
            {saving ? "Saving..." : "Create Organization"}
          </Button>

          <Button
            variant="ghost"
            className="text-zinc-300 hover:bg-zinc-800"
            onClick={() => navigate("/aqua-organizations")}
          >
            Cancel
          </Button>
        </div>

        <div className="text-xs text-zinc-500 pt-2">
          Note: This page creates an organization via{" "}
          <code>POST /organizations</code>.
        </div>
      </Card>
    </div>
  );
}
