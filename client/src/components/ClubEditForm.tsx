import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { apiRequest } from "@/lib/apiClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

// util: make a slug the same way as create
function makeSlug(name: string) {
  return name
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 255);
}

function ClubEditForm({ clubId }: { clubId: string }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  // optional: fetch current details to prefill
  useEffect(() => {
    (async () => {
      try {
        const json = await apiRequest<any>("GET", `/clubs/${clubId}/details`);
        const d = json?.data ?? {};
        setName(d?.clubName ?? "");
        setDescription(d?.clubDescription ?? "");
      } catch {}
    })();
  }, [clubId]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const updateDetails = useMutation({
    mutationFn: async () => {
      const payload: any = {
        name: name.trim(),
        slug: makeSlug(name),
        description: description.trim(),
      };
      return apiRequest("PATCH", `/clubs/${clubId}`, payload);
    },
    onSuccess: async () => {
      toast({ title: "Club updated" });
      await Promise.allSettled([
        qc.invalidateQueries({ queryKey: ["club-details", clubId] }),
        qc.invalidateQueries({ queryKey: ["club-settings-details", clubId] }),
      ]);
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.message || e?.message || "Update failed";
      toast({
        title: "Update failed",
        description: msg,
        variant: "destructive",
      });
    },
  });

  const updateImage = useMutation({
    mutationFn: async () => {
      if (!imageFile) return;
      const fd = new FormData();
      fd.append("club-picture", imageFile, imageFile.name);
      return apiRequest("PATCH", `/clubs/${clubId}/image`, fd);
    },
    onSuccess: async () => {
      toast({ title: "Picture updated" });
      await Promise.allSettled([
        qc.invalidateQueries({ queryKey: ["club-details", clubId] }),
        qc.invalidateQueries({ queryKey: ["club-settings-details", clubId] }),
      ]);
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.message || e?.message || "Upload failed";
      toast({
        title: "Image upload failed",
        description: msg,
        variant: "destructive",
      });
    },
  });

  async function saveAll(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updateDetails.mutateAsync();
      if (imageFile) {
        await updateImage.mutateAsync();
        setImageFile(null);
        setPreview((p) => {
          if (p) URL.revokeObjectURL(p);
          return null;
        });
      }
      navigate(`/clubs/${clubId}`, { replace: true });
    } catch {}
  }

  return (
    <form onSubmit={saveAll} className="space-y-6">
      <div>
        <label className="block text-sm text-gray-300 mb-2">Club Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 rounded-md bg-gray-900 border border-gray-700"
          required
        />
      </div>

      <div>
        <label className="block text-sm text-gray-300 mb-2">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 rounded-md bg-gray-900 border border-gray-700"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm text-gray-300 mb-2">Club Picture</label>
        {preview && (
          <img
            src={preview}
            className="mb-2 h-40 w-full object-cover rounded-md border border-gray-700"
          />
        )}
        <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-white/10 bg-white/5 hover:bg-white/10 cursor-pointer">
          <span>Choose image</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              setImageFile(f);
              setPreview((p) => {
                if (p) URL.revokeObjectURL(p);
                return f ? URL.createObjectURL(f) : null;
              });
            }}
          />
        </label>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={updateDetails.isPending || updateImage.isPending}
          className="px-4 py-2 rounded-md bg-white text-black hover:bg-gray-200 disabled:opacity-60"
        >
          {updateDetails.isPending || updateImage.isPending
            ? "Saving…"
            : "Save Changes"}
        </button>
      </div>
    </form>
  );
}

export default ClubEditForm;
