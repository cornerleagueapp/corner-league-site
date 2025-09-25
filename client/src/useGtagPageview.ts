// src/useGtagPageview.ts
import { useEffect } from "react";
import { useLocation } from "wouter";

const MEASUREMENT_ID = "G-326PRN31WK";

export function useGtagPageview() {
  const [location] = useLocation(); // string path like "/clubs/123"

  useEffect(() => {
    if (typeof window === "undefined" || !window.gtag) return;

    const path = window.location?.pathname ?? location ?? "/";
    const search = window.location?.search ?? "";

    window.gtag("config", MEASUREMENT_ID, {
      page_path: path + search,
    });
  }, [location]);
}
