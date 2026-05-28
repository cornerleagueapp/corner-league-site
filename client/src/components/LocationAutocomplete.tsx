import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Loader2, MapPin, Search, X } from "lucide-react";
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

type DropdownPosition = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  placement: "top" | "bottom";
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
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [query, setQuery] = useState(value || "");
  const [results, setResults] = useState<GeocodingResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState<DropdownPosition | null>(null);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  const cleanQuery = useMemo(() => query.trim(), [query]);

  function updateDropdownPosition() {
    const el = inputRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();

    const gap = 8;
    const viewportPadding = 16;
    const preferredHeight = 320;

    const spaceBelow = window.innerHeight - rect.bottom - viewportPadding;
    const spaceAbove = rect.top - viewportPadding;

    const shouldOpenAbove = spaceBelow < 220 && spaceAbove > spaceBelow;

    const availableSpace = shouldOpenAbove ? spaceAbove : spaceBelow;

    const maxHeight = Math.max(
      180,
      Math.min(preferredHeight, availableSpace - gap),
    );

    setDropdownPos({
      left: rect.left,
      width: rect.width,
      maxHeight,
      placement: shouldOpenAbove ? "top" : "bottom",
      top: shouldOpenAbove
        ? Math.max(viewportPadding, rect.top - maxHeight - gap)
        : rect.bottom + gap,
    });
  }

  useLayoutEffect(() => {
    if (!isOpen) return;

    updateDropdownPosition();

    window.addEventListener("resize", updateDropdownPosition);
    window.addEventListener("scroll", updateDropdownPosition, true);

    return () => {
      window.removeEventListener("resize", updateDropdownPosition);
      window.removeEventListener("scroll", updateDropdownPosition, true);
    };
  }, [isOpen, query]);

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

        const res = await apiRequest<any>(
          "GET",
          `/geocoding/search?query=${encodeURIComponent(cleanQuery)}`,
        );

        if (cancelled) return;

        const list =
          res?.results ?? res?.data?.results ?? res?.data?.data?.results ?? [];

        const parsed = Array.isArray(list) ? list : [];

        setResults(parsed);
        setIsOpen(true);

        if (parsed.length === 0) {
          setError("No locations found. Try a city, state, or full address.");
        }
      } catch (e: any) {
        if (cancelled) return;

        console.error("[LocationAutocomplete] search failed", e);

        setResults([]);
        setError(e?.message || "Location search failed");
        setIsOpen(true);
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
      const target = e.target as Node;

      if (wrapperRef.current?.contains(target)) return;

      const dropdown = document.getElementById(
        "location-autocomplete-dropdown",
      );
      if (dropdown?.contains(target)) return;

      setIsOpen(false);
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

    setSelectedPlaceId(item.placeId);
    setQuery(next.location);
    onTextChange(next.location);
    onSelect(next);
    setIsOpen(false);
  }

  const dropdown =
    isOpen && dropdownPos && (results.length > 0 || isSearching || error)
      ? createPortal(
          <div
            id="location-autocomplete-dropdown"
            className={[
              "z-[9999] overflow-y-auto rounded-[18px] border border-cyan-300/20 bg-[#07111F] p-2 shadow-[0_24px_70px_rgba(0,0,0,0.65)]",
              dropdownPos.placement === "top"
                ? "animate-in fade-in slide-in-from-bottom-2"
                : "animate-in fade-in slide-in-from-top-2",
            ].join(" ")}
            style={{
              position: "fixed",
              top: dropdownPos.top,
              left: dropdownPos.left,
              width: dropdownPos.width,
              maxHeight: dropdownPos.maxHeight,
            }}
          >
            {isSearching ? (
              <div className="flex items-center gap-2 px-3 py-3 text-sm text-white/55">
                <Loader2 className="h-4 w-4 animate-spin text-cyan-200" />
                Searching locations...
              </div>
            ) : null}

            {!isSearching && error && results.length === 0 ? (
              <div className="px-3 py-3 text-sm text-white/55">{error}</div>
            ) : null}

            {!isSearching &&
              results.map((item) => {
                const isSelected = selectedPlaceId === item.placeId;

                return (
                  <button
                    key={item.id || item.placeId}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className="flex w-full items-start gap-3 rounded-[14px] px-3 py-3 text-left transition hover:bg-cyan-300/10"
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" />

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-white">
                        {item.label || item.formattedAddress}
                      </span>

                      <span className="mt-0.5 block truncate text-xs text-white/45">
                        {item.city || item.placeName || "Mapbox location"}
                        {item.stateCode ? `, ${item.stateCode}` : ""}
                        {item.countryCode ? `, ${item.countryCode}` : ""}
                      </span>

                      <span className="mt-0.5 block truncate text-[11px] text-cyan-100/45">
                        {Number(item.latitude).toFixed(5)},{" "}
                        {Number(item.longitude).toFixed(5)}
                      </span>
                    </span>

                    {isSelected ? (
                      <Check className="mt-1 h-4 w-4 text-cyan-200" />
                    ) : null}
                  </button>
                );
              })}
          </div>,
          document.body,
        )
      : null;

  return (
    <div ref={wrapperRef} className="relative">
      <label className="mb-2 block text-xs font-black uppercase tracking-[0.18em] text-white/60">
        {label}
      </label>

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-200/70" />

        <input
          ref={inputRef}
          value={query}
          placeholder={placeholder}
          autoComplete="off"
          onFocus={() => {
            updateDropdownPosition();
            if (results.length > 0 || cleanQuery.length >= 2) {
              setIsOpen(true);
            }
          }}
          onChange={(e) => {
            const next = e.target.value;

            setQuery(next);
            setSelectedPlaceId(null);
            onTextChange(next);
            setIsOpen(true);
            updateDropdownPosition();
          }}
          className="h-12 w-full rounded-[18px] border border-cyan-300/20 bg-white/[0.055] pl-11 pr-11 text-white outline-none placeholder:text-white/35 focus:border-cyan-300/45 focus:ring-2 focus:ring-cyan-300/10"
        />

        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setSelectedPlaceId(null);
              setResults([]);
              setError(null);
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

      {selectedPlaceId ? (
        <div className="mt-2 flex items-center gap-2 text-xs text-cyan-100/70">
          <Check className="h-3.5 w-3.5" />
          Location selected and coordinates attached.
        </div>
      ) : cleanQuery.length >= 2 ? (
        <div className="mt-2 text-xs text-white/40">
          Select a result from the dropdown to attach coordinates.
        </div>
      ) : null}

      {dropdown}
    </div>
  );
}
