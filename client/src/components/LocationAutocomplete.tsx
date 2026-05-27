import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Search, X } from "lucide-react";
import { apiRequest } from "@/lib/apiClient";

export type LocationSelection = {
  location: string;
  formattedAddress: string;
  latitude: string;
  longitude: string;
  placeId: string;
  locationProvider: "mapbox";
  city?: string | null;
  stateCode?: string | null;
  countryCode?: string | null;
};

type GeocodingResult = {
  id: string;
  provider: "mapbox";
  placeId: string;
  label: string;
  formattedAddress: string;
  longitude: number;
  latitude: number;
  placeName?: string;
  city?: string | null;
  stateCode?: string | null;
  countryCode?: string | null;
};

export function LocationAutocomplete({
  label = "Location",
  value,
  placeholder = "Search a city, venue, lake, or address...",
  onTextChange,
  onSelect,
}: {
  label?: string;
  value: string;
  placeholder?: string;
  onTextChange: (value: string) => void;
  onSelect: (location: LocationSelection) => void;
}) {
  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  const cleanQuery = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    if (cleanQuery.length < 2) {
      setResults([]);
      setError(null);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        setIsSearching(true);
        setError(null);

        const res = await apiRequest<{ results: GeocodingResult[] }>(
          "GET",
          `/geocoding/search?query=${encodeURIComponent(cleanQuery)}`,
        );

        if (cancelled) return;

        setResults(Array.isArray(res?.results) ? res.results : []);
        setIsOpen(true);
      } catch (e: any) {
        if (cancelled) return;
        setResults([]);
        setError(e?.message || "Location search failed");
      } finally {
        if (!cancelled) setIsSearching(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [cleanQuery]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function handleSelect(item: GeocodingResult) {
    const next: LocationSelection = {
      location: item.label || item.formattedAddress,
      formattedAddress: item.formattedAddress || item.label,
      latitude: String(item.latitude),
      longitude: String(item.longitude),
      placeId: item.placeId,
      locationProvider: "mapbox",
      city: item.city ?? null,
      stateCode: item.stateCode ?? null,
      countryCode: item.countryCode ?? null,
    };

    setQuery(next.location);
    onTextChange(next.location);
    onSelect(next);
    setIsOpen(false);
  }

  return (
    <div ref={wrapperRef} className="relative">
      <label className="mb-2 block text-xs font-bold uppercase tracking-[0.16em] text-white/60">
        {label}
      </label>

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-200/70" />

        <input
          value={query}
          placeholder={placeholder}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          onChange={(e) => {
            const next = e.target.value;
            setQuery(next);
            onTextChange(next);
            setIsOpen(true);
          }}
          className="h-12 w-full rounded-[14px] border border-white/10 bg-white/[0.055] pl-11 pr-11 text-white outline-none placeholder:text-white/35 focus:border-cyan-300/35 focus:ring-2 focus:ring-cyan-300/10"
        />

        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults([]);
              onTextChange("");
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-white/50 hover:bg-white/10 hover:text-white"
            aria-label="Clear location"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}

      {isOpen && (results.length > 0 || isSearching) ? (
        <div className="absolute z-[80] mt-2 max-h-72 w-full overflow-y-auto rounded-[18px] border border-cyan-300/15 bg-[#07111F] p-2 shadow-[0_24px_70px_rgba(0,0,0,0.55)]">
          {isSearching ? (
            <div className="px-3 py-3 text-sm text-white/55">
              Searching locations...
            </div>
          ) : null}

          {results.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item)}
              className="flex w-full items-start gap-3 rounded-[14px] px-3 py-3 text-left transition hover:bg-cyan-300/10"
            >
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" />

              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-white">
                  {item.label}
                </span>
                <span className="mt-0.5 block truncate text-xs text-white/45">
                  {item.latitude}, {item.longitude}
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
