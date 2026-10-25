import "./styles/team-public.css";
import "./styles/sport-hub-refresh.css";
import "./styles/game-center.css";
// src/main.tsx
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/consumer-theme.css";
import "./styles/consumer-editorial.css";
import "./styles/consumer-community.css";
import "./styles/consumer-organization.css";
import "./styles/consumer-night.css";
import "./styles/consumer-ui-finish.css";
import { HelmetProvider } from "react-helmet-async";

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>,
);
