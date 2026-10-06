import { useEffect, useSyncExternalStore } from "react";
import { useLocation } from "wouter";
import { usePublicSports } from "./usePublicSports";
import {
  resolveSport,
  routeSport,
  SPORT_STORAGE_KEY,
  validSportKey,
} from "@/lib/sportNavigation";
const changeEvent = "corner-league:sport-selected";
let memory: string | undefined;
function snapshot() {
  if (typeof window === "undefined") return undefined;
  try {
    const stored = window.localStorage.getItem(SPORT_STORAGE_KEY);
    return validSportKey(stored) ? stored : memory;
  } catch {
    return memory;
  }
}
function subscribe(listener: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === SPORT_STORAGE_KEY || event.key === null) listener();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(changeEvent, listener);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(changeEvent, listener);
  };
}
export function rememberSport(key: string) {
  if (!validSportKey(key) || typeof window === "undefined") return;
  memory = key;
  try {
    window.localStorage.setItem(SPORT_STORAGE_KEY, key);
  } catch {
    /* Private browsing still retains the selection for this session. */
  }
  window.dispatchEvent(new Event(changeEvent));
}
export function useSportSelection() {
  const [location] = useLocation();
  const saved = useSyncExternalStore(subscribe, snapshot, () => undefined);
  const availability = usePublicSports();
  const sports =
    !availability.isError && Array.isArray(availability.data)
      ? availability.data
      : [];
  const pending = availability.isPending;
  const sportKey =
    (pending || availability.isError) && saved && !routeSport(location)
      ? saved
      : resolveSport(location, saved, sports);
  const sport = sports.find((row) => row.key === sportKey);
  useEffect(() => {
    if (!sport || saved === sport.key) return;
    // A direct sport URL takes precedence; removed choices fall back to a populated sport.
    if (routeSport(location) || saved) rememberSport(sport.key);
  }, [location, sport?.key, saved]);
  return {
    sports,
    sport,
    sportKey,
    isLoading: pending,
    isJetSki: sportKey === "jet-ski",
    selectSport: (key: string) => {
      if (sports.some((row) => row.key === key)) rememberSport(key);
    },
  };
}
