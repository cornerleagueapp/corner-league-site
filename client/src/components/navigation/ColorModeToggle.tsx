import { Moon, Sun } from "lucide-react";
import { setColorMode, useColorMode } from "@/lib/colorMode";
export default function ColorModeToggle() {
  const mode = useColorMode();
  const dark = mode === "dark";
  return (
    <button
      type="button"
      className="cl-color-toggle"
      role="switch"
      aria-checked={dark}
      aria-label="Night mode"
      title={dark ? "Switch to light mode" : "Switch to night mode"}
      onClick={() => setColorMode(dark ? "light" : "dark")}
    >
      {dark ? (
        <Moon aria-hidden="true" size={19} />
      ) : (
        <Sun aria-hidden="true" size={19} />
      )}
    </button>
  );
}
