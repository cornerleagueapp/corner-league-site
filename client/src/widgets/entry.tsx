import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { requireWidget, type WidgetPayload } from "./contract";
import { WidgetView } from "./WidgetView";
import "./widget.css";
import { startWidgetPolling } from "./poller";
const mount = document.getElementById("cl-widget");
const id = mount?.dataset.id ?? "";
const revision = Number(mount?.dataset.revision ?? 0);
const assets = new URL(import.meta.url).origin;
const initial = document.getElementById("cl-widget-data")?.textContent;
let preview: WidgetPayload | undefined;
try {
  if (initial) preview = requireWidget(JSON.parse(initial), "preview", assets);
} catch {
  /* Render a safe unavailable state. */
}
function WidgetApp() {
  const [data, setData] = useState<WidgetPayload | undefined>(preview);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(!preview);
  const poller = useRef<{ refresh: () => void; stop: () => void }>();
  useEffect(() => {
    if (initial) {
      if (!preview) {
        setError("This preview could not be verified.");
        setBusy(false);
      }
      return;
    }
    if (!/^[a-f\d-]{36}$/i.test(id)) {
      setError("Widget unavailable.");
      setBusy(false);
      return;
    }
    poller.current = startWidgetPolling<WidgetPayload>({
      onData: setData,
      onBusy: setBusy,
      onError: setError,
      load: async (signal) => {
        const url = new URL(window.location.href);
        url.pathname = url.pathname.replace(/\/frame$/, "/data");
        url.search = `?revision=${revision}`;
        url.hash = "";
        if (!/\/widgets\/public\/[a-f\d-]{36}\/data$/i.test(url.pathname))
          throw Error("Widget unavailable.");
        const res = await fetch(url, {
          credentials: "omit",
          cache: "no-store",
          referrerPolicy: "no-referrer",
          signal,
        });
        if (res.status === 409) {
          window.location.reload();
          throw Error("Widget settings changed. Reloading…");
        }
        if (!res.ok)
          throw Error(
            res.status === 404
              ? "This widget or its published source is no longer available."
              : "Unable to refresh this widget. Please try again.",
          );
        const body = await res.json();
        return requireWidget(body?.data ?? body, id, assets);
      },
    });
    return () => poller.current?.stop();
  }, []);
  const refresh = () => {
    if (!busy) void poller.current?.refresh();
  };
  if (data)
    return (
      <WidgetView
        data={data}
        busy={busy}
        onRefresh={initial ? undefined : refresh}
      />
    );
  return (
    <main className="clw-widget clw-light clw-empty">
      <span className="clw-mark">CL</span>
      <h1>{error ? "Widget unavailable" : "Loading scores…"}</h1>
      <p role={error ? "alert" : "status"}>
        {error || "Fetching the latest published information."}
      </p>
      {!initial && (
        <button type="button" onClick={refresh} disabled={busy}>
          {busy ? "Loading…" : "Try again"}
        </button>
      )}
    </main>
  );
}
if (mount) createRoot(mount).render(<WidgetApp />);
