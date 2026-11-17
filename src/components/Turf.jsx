
import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  Map as MapIcon,
  RotateCcw,
  MapPin,
  Trophy,
  Check,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

import TurfCard from "../components/TurfCard";

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/+$/, "");

const TURFS_ENDPOINT = `${API_URL}/turfs`;

const ALL_LOCATIONS = "All locations";
const ALL_SPORTS = "All sports";

const SPORTS = [
  ALL_SPORTS,
  "Football",
  "Cricket",
  "Badminton",
];

const SORT_OPTIONS = [
  { value: "recommended", label: "Recommended" },
  { value: "rating", label: "Highest rated" },
  { value: "price-low", label: "Price: Low to high" },
  { value: "price-high", label: "Price: High to low" },
];

// -----------------------------------------------------------------------------
// Utilities
// -----------------------------------------------------------------------------

const normalize = (value) =>
  String(value ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .trim();

const getTurfId = (turf) =>
  turf?._id || turf?.id || turf?.slug || null;

const getTurfLocation = (turf) => {
  const area = String(turf?.area || "").trim();

  if (area) return area;

  const location = turf?.location;

  if (typeof location === "string") {
    return location.split(",")[0].trim();
  }

  if (location && typeof location === "object") {
    return String(
      location.area || location.city || location.name || ""
    ).trim();
  }

  return "";
};

const getTurfSports = (turf) => {
  const value = turf?.sport || turf?.sports;

  const sports = Array.isArray(value)
    ? value
    : String(value || "").split(/[,|]/);

  return [...new Set(sports.map(normalize).filter(Boolean))];
};

const getSearchableText = (turf) => {
  const location =
    typeof turf?.location === "string"
      ? turf.location
      : [
          turf?.location?.area,
          turf?.location?.city,
          turf?.location?.name,
        ]
          .filter(Boolean)
          .join(" ");

  const features = Array.isArray(turf?.features)
    ? turf.features.join(" ")
    : "";

  const amenities = Array.isArray(turf?.amenities)
    ? turf.amenities.join(" ")
    : "";

  return normalize(
    [
      turf?.name,
      turf?.turfName,
      turf?.description,
      turf?.area,
      location,
      getTurfSports(turf).join(" "),
      features,
      amenities,
    ].join(" ")
  );
};

const getRecords = (data) => {
  if (Array.isArray(data)) return data;

  const candidates = [
    data?.turfs,
    data?.data,
    data?.results,
    data?.items,
    data?.data?.turfs,
    data?.data?.items,
  ];

  return candidates.find(Array.isArray) || null;
};

const getPrice = (turf) => {
  const value = turf?.price;

  if (value === null || value === undefined || value === "") {
    return Infinity;
  }

  const price = Number(value);

  return Number.isFinite(price) && price >= 0
    ? price
    : Infinity;
};

const getRating = (turf) => {
  const rating = Number(turf?.rating);

  return Number.isFinite(rating) ? rating : 0;
};

// -----------------------------------------------------------------------------
// Loading Skeleton
// -----------------------------------------------------------------------------

function TurfSkeleton() {
  return (
    <article
      aria-hidden="true"
      className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm"
    >
      <div className="relative aspect-[4/3] animate-pulse bg-gray-100">
        <div className="absolute left-4 top-4 h-7 w-20 rounded-full bg-gray-200" />
        <div className="absolute right-4 top-4 h-10 w-10 rounded-full bg-gray-200" />
        <div className="absolute bottom-4 left-4 h-7 w-32 rounded-full bg-gray-200" />
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
            <div className="h-3 w-2/3 animate-pulse rounded bg-gray-100" />
          </div>

          <div className="h-7 w-14 animate-pulse rounded-lg bg-amber-50" />
        </div>

        <div className="flex gap-2">
          <div className="h-6 w-16 animate-pulse rounded-md bg-gray-100" />
          <div className="h-6 w-20 animate-pulse rounded-md bg-gray-100" />
          <div className="h-6 w-14 animate-pulse rounded-md bg-gray-100" />
        </div>

        <div className="border-t border-gray-100" />

        <div className="flex items-end justify-between gap-3">
          <div className="space-y-2">
            <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
            <div className="h-6 w-28 animate-pulse rounded bg-gray-200" />
          </div>

          <div className="h-10 w-28 animate-pulse rounded-lg bg-gray-200" />
        </div>
      </div>
    </article>
  );
}

function TurfGridSkeleton({ count = 6 }) {
  return (
    <div
      className="grid auto-rows-fr grid-cols-1 gap-5 sm:grid-cols-2 xl:gap-6"
      aria-label="Loading turfs"
      aria-busy="true"
    >
      {Array.from({ length: count }, (_, index) => (
        <TurfSkeleton key={index} />
      ))}

      <p className="sr-only" role="status">
        Loading available turfs. Please wait.
      </p>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Reusable Components
// -----------------------------------------------------------------------------

function FilterOption({ active, children, count, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
        active
          ? "bg-emerald-50 font-semibold text-emerald-700"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      <span className="flex min-w-0 items-center gap-2">
        <span
          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md border transition-colors ${
            active
              ? "border-emerald-600 bg-emerald-600 text-white"
              : "border-gray-300 bg-white group-hover:border-gray-400"
          }`}
        >
          {active && <Check size={11} strokeWidth={3} />}
        </span>

        <span className="truncate">{children}</span>
      </span>

      {count !== undefined && (
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            active
              ? "bg-white text-emerald-700"
              : "bg-gray-100 text-gray-500"
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function ActiveFilter({ children, onRemove }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:border-emerald-200 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
    >
      <span className="flex min-w-0 items-center gap-1.5 truncate">
        {children}
      </span>
      <X size={13} className="shrink-0" />
    </button>
  );
}

function FilterSection({ title, icon: Icon, children }) {
  return (
    <div className="border-t border-gray-100 pt-5 first:border-0 first:pt-0">
      <div className="mb-3 flex items-center gap-2">
        <Icon size={16} className="text-emerald-600" />

        <h3 className="text-sm font-semibold text-gray-900">
          {title}
        </h3>
      </div>

      <div className="space-y-1">{children}</div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Error & Empty States
// -----------------------------------------------------------------------------

function ErrorState({ message, onRetry }) {
  return (
    <div className="rounded-3xl border border-red-100 bg-white px-6 py-16 text-center shadow-sm">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
        <AlertCircle size={25} />
      </div>

      <h3 className="mt-5 text-lg font-bold text-gray-900">
        Unable to load turfs
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
        {message}
      </p>

      <button
        type="button"
        onClick={onRetry}
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
      >
        <RefreshCw size={15} />
        Try again
      </button>
    </div>
  );
}

function EmptyState({ hasActiveFilters, onReset }) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100">
        <Search size={26} className="text-gray-400" />
      </div>

      <h3 className="mt-5 text-lg font-bold text-gray-900">
        No turfs found
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
        {hasActiveFilters
          ? "No turfs match your current search and filters. Try changing your selection."
          : "There are currently no turfs available. Please check again later."}
      </p>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={onReset}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
        >
          <RotateCcw size={15} />
          Clear filters
        </button>
      )}
    </div>
  );
}

// -----------------------------------------------------------------------------
// Filter Sidebar
// -----------------------------------------------------------------------------

function FilterSidebar({
  locations,
  locationCounts,
  sportCounts,
  totalTurfCount,
  location,
  sport,
  onLocationChange,
  onSportChange,
  onReset,
  hasActiveFilters,
}) {
  return (
    <aside className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm lg:sticky lg:top-24">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <SlidersHorizontal size={17} />
          </div>

          <div>
            <h2 className="text-sm font-bold text-gray-900">
              Filters
            </h2>

            <p className="mt-0.5 text-xs text-gray-400">
              Refine your search
            </p>
          </div>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-semibold text-emerald-600 transition hover:text-emerald-700"
          >
            Reset
          </button>
        )}
      </div>

      <div className="space-y-5">
        <FilterSection title="Location" icon={MapPin}>
          {locations.map((item) => (
            <FilterOption
              key={item}
              active={location === item}
              count={locationCounts[normalize(item)] ?? 0}
              onClick={() => onLocationChange(item)}
            >
              {item}
            </FilterOption>
          ))}
        </FilterSection>

        <FilterSection title="Sport" icon={Trophy}>
          {SPORTS.map((item) => (
            <FilterOption
              key={item}
              active={sport === item}
              count={
                item === ALL_SPORTS
                  ? totalTurfCount
                  : sportCounts[normalize(item)] ?? 0
              }
              onClick={() => onSportChange(item)}
            >
              {item}
            </FilterOption>
          ))}
        </FilterSection>
      </div>
    </aside>
  );
}

// -----------------------------------------------------------------------------
// Main Page
// -----------------------------------------------------------------------------

const Turf = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [turfs, setTurfs] = useState([]);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("recommended");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const resultsRef = useRef(null);
  const previousFilterRef = useRef("");

  const deferredSearch = useDeferredValue(search);

  // ---------------------------------------------------------------------------
  // URL Filters
  // ---------------------------------------------------------------------------

  const locationParam = searchParams.get("location") || "";
  const sportParam = searchParams.get("sport") || "";

  // ---------------------------------------------------------------------------
  // Fetch Turfs
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const controller = new AbortController();

    const loadTurfs = async () => {
      setIsLoading(true);
      setError("");

      try {
        const response = await fetch(TURFS_ENDPOINT, {
          signal: controller.signal,
          headers: {
            Accept: "application/json",
          },
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.message || `Request failed (${response.status}).`
          );
        }

        const records = getRecords(data);

        if (!records) {
          throw new Error("Invalid turf data received from the server.");
        }

        if (!controller.signal.aborted) {
          setTurfs(records);
        }
      } catch (err) {
        if (err.name !== "AbortError" && !controller.signal.aborted) {
          setError(
            err.message || "Unable to load turfs. Please try again."
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    loadTurfs();

    return () => controller.abort();
  }, [reloadKey]);

  const handleRetry = useCallback(() => {
    setReloadKey((previous) => previous + 1);
  }, []);

  // ---------------------------------------------------------------------------
  // Prepare Turf Data
  // ---------------------------------------------------------------------------

  const preparedTurfs = useMemo(() => {
    return turfs.map((turf) => {
      const rawLocation = getTurfLocation(turf);

      const fullLocation =
        typeof turf?.location === "string"
          ? normalize(turf.location)
          : normalize(
              [
                turf?.location?.area,
                turf?.location?.city,
                turf?.location?.name,
                rawLocation,
              ]
                .filter(Boolean)
                .join(" ")
            );

      return {
        original: turf,
        id: getTurfId(turf),
        location: rawLocation,
        normalizedLocation: normalize(rawLocation),
        fullLocation,
        sports: getTurfSports(turf),
        searchableText: getSearchableText(turf),
        price: getPrice(turf),
        rating: getRating(turf),
      };
    });
  }, [turfs]);

  // ---------------------------------------------------------------------------
  // Locations & Counts
  // ---------------------------------------------------------------------------

  const locations = useMemo(() => {
    const unique = new Map();

    preparedTurfs.forEach((item) => {
      if (
        item.normalizedLocation &&
        !unique.has(item.normalizedLocation)
      ) {
        unique.set(item.normalizedLocation, item.location);
      }
    });

    return [
      ALL_LOCATIONS,
      ...Array.from(unique.values()).sort((a, b) =>
        a.localeCompare(b)
      ),
    ];
  }, [preparedTurfs]);

  const locationCounts = useMemo(() => {
    const counts = {
      [normalize(ALL_LOCATIONS)]: preparedTurfs.length,
    };

    preparedTurfs.forEach((item) => {
      if (item.normalizedLocation) {
        counts[item.normalizedLocation] =
          (counts[item.normalizedLocation] || 0) + 1;
      }
    });

    return counts;
  }, [preparedTurfs]);

  const sportCounts = useMemo(() => {
    const counts = {};

    preparedTurfs.forEach((item) => {
      item.sports.forEach((sportName) => {
        counts[sportName] = (counts[sportName] || 0) + 1;
      });
    });

    return counts;
  }, [preparedTurfs]);

  // ---------------------------------------------------------------------------
  // Resolve URL Filters
  // ---------------------------------------------------------------------------

  const location = useMemo(() => {
    if (!locationParam) return ALL_LOCATIONS;

    return (
      locations.find(
        (item) =>
          item !== ALL_LOCATIONS &&
          normalize(item) === normalize(locationParam)
      ) || ALL_LOCATIONS
    );
  }, [locationParam, locations]);

  const sport = useMemo(() => {
    if (!sportParam) return ALL_SPORTS;

    return (
      SPORTS.find(
        (item) => normalize(item) === normalize(sportParam)
      ) || ALL_SPORTS
    );
  }, [sportParam]);

  // ---------------------------------------------------------------------------
  // Update URL Filters
  // ---------------------------------------------------------------------------

  const updateFilters = useCallback(
    (key, value, defaultValue) => {
      const nextParams = new URLSearchParams(searchParams);

      if (value === defaultValue) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, normalize(value));
      }

      setSearchParams(nextParams);
    },
    [searchParams, setSearchParams]
  );

  const scrollToResults = useCallback(() => {
    window.requestAnimationFrame(() => {
      resultsRef.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      });
    });
  }, []);

  const handleLocationChange = useCallback(
    (value) => {
      updateFilters("location", value, ALL_LOCATIONS);
      setShowFilters(false);
      scrollToResults();
    },
    [updateFilters, scrollToResults]
  );

  const handleSportChange = useCallback(
    (value) => {
      updateFilters("sport", value, ALL_SPORTS);
      setShowFilters(false);
      scrollToResults();
    },
    [updateFilters, scrollToResults]
  );

  // ---------------------------------------------------------------------------
  // Filter & Sort
  // ---------------------------------------------------------------------------

  const filteredTurfs = useMemo(() => {
    const query = normalize(deferredSearch);
    const selectedLocation = normalize(location);
    const selectedSport = normalize(sport);

    const filtered = preparedTurfs.filter((item) => {
      const matchesSearch =
        !query || item.searchableText.includes(query);

      const matchesLocation =
        location === ALL_LOCATIONS ||
        item.normalizedLocation === selectedLocation ||
        item.fullLocation
          .split(",")
          .some((part) => normalize(part) === selectedLocation);

      const matchesSport =
        sport === ALL_SPORTS ||
        item.sports.includes(selectedSport);

      return matchesSearch && matchesLocation && matchesSport;
    });

    const comparators = {
      "price-low": (a, b) => a.price - b.price,
      "price-high": (a, b) => {
        if (a.price === Infinity) return 1;
        if (b.price === Infinity) return -1;
        return b.price - a.price;
      },
      rating: (a, b) => b.rating - a.rating,
    };

    const comparator = comparators[sort];

    if (comparator) {
      filtered.sort(comparator);
    }

    return filtered;
  }, [preparedTurfs, deferredSearch, location, sport, sort]);

  const hasActiveFilters =
    Boolean(search.trim()) ||
    location !== ALL_LOCATIONS ||
    sport !== ALL_SPORTS;

  // ---------------------------------------------------------------------------
  // Clear Filters
  // ---------------------------------------------------------------------------

  const clearFilters = useCallback(() => {
    setSearch("");
    setSort("recommended");
    setShowFilters(false);

    const nextParams = new URLSearchParams(searchParams);

    nextParams.delete("location");
    nextParams.delete("sport");

    setSearchParams(nextParams);
    scrollToResults();
  }, [searchParams, setSearchParams, scrollToResults]);

  // ---------------------------------------------------------------------------
  // Scroll on Browser Navigation
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const currentKey = `${location}|${sport}`;

    if (
      previousFilterRef.current &&
      previousFilterRef.current !== currentKey
    ) {
      scrollToResults();
    }

    previousFilterRef.current = currentKey;
  }, [location, sport, scrollToResults]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <main className="min-h-screen bg-[#f8faf9]">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-gray-200 bg-white">
        <div
          className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-emerald-500/5 blur-3xl"
          aria-hidden="true"
        />

        <div
          className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-emerald-500/5 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <MapPin size={14} />
              Explore sports venues
            </div>

            <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-gray-950 sm:text-4xl lg:text-5xl">
              Find the perfect{" "}
              <span className="text-emerald-600">turf</span>{" "}
              for your game
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-500 sm:text-base">
              Discover sports turfs, compare facilities, and find
              the right place for your next game.
            </p>
          </div>

          {/* Search */}
          <div className="mt-8 max-w-3xl">
            <div className="group relative">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-emerald-600"
                aria-hidden="true"
              />

              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by turf name, location or sport..."
                aria-label="Search turfs"
                className="h-12 w-full rounded-2xl border border-gray-200 bg-white pl-11 pr-12 text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Mobile Filter Button */}
            <button
              type="button"
              onClick={() => setShowFilters((previous) => !previous)}
              aria-expanded={showFilters}
              aria-controls="mobile-turf-filters"
              className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 lg:hidden"
            >
              <SlidersHorizontal size={17} />

              {showFilters ? "Hide filters" : "Filters"}

              {hasActiveFilters && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[10px] font-bold text-white">
                  !
                </span>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="grid items-start gap-7 lg:grid-cols-[250px_minmax(0,1fr)] xl:gap-8">
          {/* Sidebar */}
          <div
            id="mobile-turf-filters"
            className={`${showFilters ? "block" : "hidden"} lg:block`}
          >
            <FilterSidebar
              locations={locations}
              locationCounts={locationCounts}
              sportCounts={sportCounts}
              totalTurfCount={preparedTurfs.length}
              location={location}
              sport={sport}
              onLocationChange={handleLocationChange}
              onSportChange={handleSportChange}
              onReset={clearFilters}
              hasActiveFilters={hasActiveFilters}
            />
          </div>

          {/* Results */}
          <div
            ref={resultsRef}
            className="min-w-0 scroll-mt-24"
          >
            {/* Results Toolbar */}
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-gray-900">
                  Explore turfs
                </h2>

                <p
                  className="mt-1 text-sm text-gray-500"
                  aria-live="polite"
                >
                  {isLoading
                    ? "Finding available turfs..."
                    : `${filteredTurfs.length} ${
                        filteredTurfs.length === 1 ? "turf" : "turfs"
                      } found`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label
                  htmlFor="turf-sort"
                  className="hidden text-sm font-medium text-gray-500 sm:block"
                >
                  Sort by
                </label>

                <div className="relative flex-1 sm:flex-none">
                  <select
                    id="turf-sort"
                    value={sort}
                    onChange={(event) => setSort(event.target.value)}
                    className="h-10 w-full appearance-none rounded-xl border border-gray-200 bg-white pl-3 pr-9 text-sm font-medium text-gray-700 outline-none transition hover:border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 sm:w-auto"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <ChevronDown
                    size={15}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    aria-hidden="true"
                  />
                </div>

                <Link
                  to="/turfs/map"
                  className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <MapIcon size={16} />

                  <span className="hidden sm:inline">Map view</span>
                  <span className="sm:hidden">Map</span>
                </Link>
              </div>
            </div>

            {/* Active Filters */}
            {hasActiveFilters && (
              <div className="mb-5 flex flex-wrap items-center gap-2">
                {search.trim() && (
                  <ActiveFilter onRemove={() => setSearch("")}>
                    <Search size={12} />
                    {search}
                  </ActiveFilter>
                )}

                {location !== ALL_LOCATIONS && (
                  <ActiveFilter
                    onRemove={() => handleLocationChange(ALL_LOCATIONS)}
                  >
                    <MapPin size={12} />
                    {location}
                  </ActiveFilter>
                )}

                {sport !== ALL_SPORTS && (
                  <ActiveFilter
                    onRemove={() => handleSportChange(ALL_SPORTS)}
                  >
                    <Trophy size={12} />
                    {sport}
                  </ActiveFilter>
                )}

                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                >
                  <RotateCcw size={13} />
                  Clear all
                </button>
              </div>
            )}

            {/* Results Content */}
            {isLoading ? (
              <TurfGridSkeleton count={6} />
            ) : error ? (
              <ErrorState
                message={error}
                onRetry={handleRetry}
              />
            ) : filteredTurfs.length > 0 ? (
              <div
                key={`${location}-${sport}-${deferredSearch}-${sort}`}
                className="turf-results-enter grid auto-rows-fr grid-cols-1 gap-5 sm:grid-cols-2 xl:gap-6"
              >
                {filteredTurfs.map((item, index) => (
                  <div
                    key={item.id || `${item.original.name}-${index}`}
                    className="h-full min-w-0"
                  >
                    <TurfCard turf={item.original} />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                hasActiveFilters={hasActiveFilters}
                onReset={clearFilters}
              />
            )}
          </div>
        </div>
      </section>
    </main>
  );
};

export default Turf;
