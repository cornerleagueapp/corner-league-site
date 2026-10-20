// src/main.tsx
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/consumer-theme.css";
import "./styles/consumer-editorial.css";
import "./styles/consumer-community.css";
import "./styles/consumer-organization.css";
import { HelmetProvider } from "react-helmet-async";

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>,
);
