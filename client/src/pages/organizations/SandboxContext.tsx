import { createContext, useContext } from "react";
import { apiFetch } from "@/lib/apiClient";
export type PrivateSandbox = { id: string; account: string; data: any };
export const SandboxContext = createContext<PrivateSandbox | null>(null);
export const useSandbox = () => useContext(SandboxContext);
export function sandboxFetch(id: string, path: string) {
  return apiFetch(`/sandbox/organizations/${encodeURIComponent(id)}/request`, {
    method: "POST",
    cache: "no-store",
    noRefresh: true,
    body: { path, method: "GET" },
  });
}
export function useOrganizationPageApi() {
  const sandbox = useSandbox();
  return {
    sandbox,
    fetch: sandbox
      ? (path: string, _opts?: any) => sandboxFetch(sandbox.id, path)
      : apiFetch,
  };
}
