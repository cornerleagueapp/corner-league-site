import { apiRequest } from "@/lib/apiClient";
import { unwrapSportData } from "@/lib/sportRegistration";
export type WaiverReceipt = {
  seasonId: string;
  signatureId: string;
  title: string;
  revision: number;
  athleteName: string;
  signerName: string;
  signedAt: string;
  filename: string;
  pdfBase64: string;
};
export async function loadWaiverReceipt(
  season: string,
  signature: string,
): Promise<WaiverReceipt> {
  const r = unwrapSportData<WaiverReceipt>(
    await apiRequest(
      "GET",
      `/season-registration/${season}/waivers/signatures/${signature}/receipt`,
    ),
  );
  if (r.seasonId !== season || r.signatureId !== signature)
    throw Error("Signing record does not match this request.");
  return r;
}
export function saveWaiverReceipt(
  r: Pick<WaiverReceipt, "filename" | "pdfBase64">,
) {
  const bytes = Uint8Array.from(atob(r.pdfBase64), (c) => c.charCodeAt(0)),
    url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" })),
    a = document.createElement("a");
  a.href = url;
  a.download = r.filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
