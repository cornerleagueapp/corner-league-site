import { applyColorMode } from "@/lib/colorMode";
import { useEffect } from "react";
import { useSportSelection } from "@/hooks/useSportSelection";
import { sportTheme } from "@/lib/sportTheme";

/** Portaled controls and standalone pages share the same sport as AppShell. */
export default function ConsumerTheme() {
  const { sportKey } = useSportSelection();
  useEffect(() => { applyColorMode(); }, []);
  useEffect(() => {
    const root = document.documentElement;
    const theme = sportTheme(sportKey);
    root.style.setProperty("--cl-sport-accent", theme.accent);
    root.style.setProperty("--cl-sport-bright", theme.bright);
    root.dataset.consumerSport = sportKey;
  }, [sportKey]);
  return null;
}
