
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  Map,
  RotateCcw,
  MapPin,
  Trophy,
  Check,
  AlertCircle,
  RefreshCw,
  LoaderCircle,
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
  turf?._id || turf?.id || turf?.slug;

const getTurfLocation = (turf) => {
  const area = String(turf?.area || "").trim();

  if (area) return area;

  const location = turf?.location;

  if (typeof location === "string") {
    return location.split(",")[0].trim();
  }

  if (location && typeof location === "object") {
    return (
      location.area ||
      location.city ||
      location.name ||
      ""
    );
  }

  return "";
};

const getTurfSport = (turf) => {
  const value = turf?.sport || turf?.sports;

  if (Array.isArray(value)) {
    return value.join(" ");
  }

  return String(value || "");
};

const getSearchableText = (turf) => {
  const features = Array.isArray(turf?.features)
    ? turf.features.join(" ")
    : "";

  const amenities = Array.isArray(turf?.amenities)
    ? turf.amenities.join(" ")
    : "";

  const location =
    typeof turf?.location === "string"
      ? turf.location
      : JSON.stringify(turf?.location || "");

  return normalize(
    [
      turf?.name,
      turf?.turfName,
      turf?.description,
      turf?.area,
      location,
      getTurfSport(turf),
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
  ];

  return candidates.find(Array.isArray) || null;
};

const getPrice = (turf) => {
  const price = Number(turf?.price);

  return Number.isFinite(price) ? price : 0;
};

const getRating = (turf) => {
  const rating = Number(turf?.rating);

  return Number.isFinite(rating) ? rating : 0;
};

// -----------------------------------------------------------------------------
// Skeleton
// -----------------------------------------------------------------------------

function TurfSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
      aria-hidden="true"
    >
      <div className="relative aspect-[16/10] animate-pulse bg-gray-200">
        <div className="absolute left-4 top-4 h-7 w-20 rounded-full bg-white/70" />
        <div className="absolute right-4 top-4 h-10 w-10 rounded-full bg-white/70" />
      </div>

      <div className="space-y-4 p-5">
        <div className="space-y-2">
          <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
          <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200" />
        </div>

        <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />

        <div className="flex gap-2">
          <div className="h-6 w-16 animate-pulse rounded-full bg-gray-100" />
          <div className="h-6 w-20 animate-pulse rounded-full bg-gray-100" />
        </div>

        <div className="h-px bg-gray-100" />

        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
            <div className="h-6 w-24 animate-pulse rounded bg-gray-200" />
          </div>

          <div className="h-10 w-10 animate-pulse rounded-xl bg-gray-200" />
        </div>
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Reusable UI
// -----------------------------------------------------------------------------

function FilterButton({
  active,
  children,
  onClick,
  count,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1 ${
        active
          ? "bg-emerald-50 font-semibold text-emerald-700"
          : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      <span className="flex min-w-0 items-center gap-2">
        {active && (
          <Check
            size={14}
            className="shrink-0 text-emerald-600"
          />
        )}

        <span className="truncate">{children}</span>
      </span>

      {count !== undefined && (
        <span
          className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
            active
              ? "bg-white text-emerald-700"
              : "bg-gray-100 text-gray-400"
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
      className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:border-emerald-200 hover:bg-emerald-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
    >
      <span className="truncate">{children}</span>
      <X size={13} className="shrink-0" />
    </button>
  );
}

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
        className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
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
          ? "We couldn't find any turfs matching your current search and filters. Try adjusting your selection."
          : "There are currently no turfs available. Please check again later."}
      </p>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={onReset}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gray-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
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
  location,
  sport,
  onLocationChange,
  onSportChange,
  onReset,
  hasActiveFilters,
}) {
  return (
    <aside className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:sticky lg:top-24 lg:self-start">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-gray-900">
            Filters
          </h2>

          <p className="mt-1 text-xs text-gray-400">
            Refine your search
          </p>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Location */}

      <div className="mt-6">
        <div className="mb-3 flex items-center gap-2">
          <MapPin size={15} className="text-emerald-600" />

          <h3 className="text-sm font-semibold text-gray-900">
            Location
          </h3>
        </div>

        <div className="space-y-1">
          {locations.map((item) => (
            <FilterButton
              key={item}
              active={location === item}
              count={locationCounts[item] || 0}
              onClick={() => onLocationChange(item)}
            >
              {item}
            </FilterButton>
          ))}
        </div>
      </div>

      {/* Sport */}

      <div className="mt-6 border-t border-gray-100 pt-6">
        <div className="mb-3 flex items-center gap-2">
          <Trophy size={15} className="text-emerald-600" />

          <h3 className="text-sm font-semibold text-gray-900">
            Sport
          </h3>
        </div>

        <div className="space-y-1">
          {SPORTS.map((item) => (
            <FilterButton
              key={item}
              active={sport === item}
              onClick={() => onSportChange(item)}
            >
              {item}
            </FilterButton>
          ))}
        </div>
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

  // Read filter values directly from the URL.
  const locationParam = searchParams.get("location") || "";
  const sportParam = searchParams.get("sport") || "";

  // ---------------------------------------------------------------------------
  // API
  // ---------------------------------------------------------------------------

  const fetchTurfs = useCallback(async (signal) => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch(TURFS_ENDPOINT, {
        method: "GET",
        signal,
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

      if (!signal.aborted) {
        setTurfs(records);
      }
    } catch (err) {
      if (err.name === "AbortError") return;

      setError(
        err.message || "Something went wrong while loading turfs."
      );
    } finally {
      if (!signal.aborted) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    fetchTurfs(controller.signal);

    return () => controller.abort();
  }, [fetchTurfs]);

  // ---------------------------------------------------------------------------
  // Normalize data once
  // ---------------------------------------------------------------------------

  const preparedTurfs = useMemo(() => {
    return turfs.map((turf) => ({
      original: turf,
      name: normalize(turf?.name || turf?.turfName),
      location: normalize(getTurfLocation(turf)),
      fullLocation: normalize(
        typeof turf?.location === "string"
          ? turf.location
          : getTurfLocation(turf)
      ),
      sport: normalize(getTurfSport(turf)),
      searchableText: getSearchableText(turf),
      price: getPrice(turf),
      rating: getRating(turf),
    }));
  }, [turfs]);

  // ---------------------------------------------------------------------------
  // Dynamic locations
  // ---------------------------------------------------------------------------

  const locations = useMemo(() => {
    const uniqueLocations = new Set();

    preparedTurfs.forEach((item) => {
      if (item.location) {
        uniqueLocations.add(
          item.original.area?.trim()
            ? String(item.original.area).trim()
            : getTurfLocation(item.original)
        );
      }
    });

    return [
      ALL_LOCATIONS,
      ...Array.from(uniqueLocations).sort((a, b) =>
        a.localeCompare(b)
      ),
    ];
  }, [preparedTurfs]);

  // Resolve URL parameters to available filter values.
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
  // URL updates
  // ---------------------------------------------------------------------------

  const updateFilters = useCallback(
    (key, value, defaultValue) => {
      const nextParams = new URLSearchParams(searchParams);

      if (value === defaultValue) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value.toLowerCase());
      }

      setSearchParams(nextParams);
    },
    [searchParams, setSearchParams]
  );

  const handleLocationChange = (value) => {
    updateFilters("location", value, ALL_LOCATIONS);
    setShowFilters(false);
  };

  const handleSportChange = (value) => {
    updateFilters("sport", value, ALL_SPORTS);
    setShowFilters(false);
  };

  // ---------------------------------------------------------------------------
  // Location counts - single pass
  // ---------------------------------------------------------------------------

  const locationCounts = useMemo(() => {
    const counts = {
      [ALL_LOCATIONS]: preparedTurfs.length,
    };

    preparedTurfs.forEach((item) => {
      const key =
        locations.find(
          (locationName) =>
            locationName !== ALL_LOCATIONS &&
            normalize(locationName) === item.location
        );

      if (key) {
        counts[key] = (counts[key] || 0) + 1;
      }
    });

    return counts;
  }, [preparedTurfs, locations]);

  // ---------------------------------------------------------------------------
  // Active filters
  // ---------------------------------------------------------------------------

  const hasActiveFilters =
    Boolean(search.trim()) ||
    location !== ALL_LOCATIONS ||
    sport !== ALL_SPORTS;

  const clearFilters = () => {
    setSearch("");
    setSort("recommended");

    const nextParams = new URLSearchParams(searchParams);

    nextParams.delete("location");
    nextParams.delete("sport");

    setSearchParams(nextParams);
    setShowFilters(false);
  };

  // ---------------------------------------------------------------------------
  // Filter and sort
  // ---------------------------------------------------------------------------

  const filteredTurfs = useMemo(() => {
    const query = normalize(search);
    const selectedLocation = normalize(location);
    const selectedSport = normalize(sport);

    const filtered = preparedTurfs.filter((item) => {
      const matchesSearch =
        !query || item.searchableText.includes(query);

      const matchesLocation =
        location === ALL_LOCATIONS ||
        item.location === selectedLocation ||
        item.fullLocation.includes(selectedLocation);

      const matchesSport =
        sport === ALL_SPORTS ||
        item.sport
          .split(/\s+/)
          .includes(selectedSport);

      return (
        matchesSearch &&
        matchesLocation &&
        matchesSport
      );
    });

    const comparators = {
      "price-low": (a, b) => a.price - b.price,
      "price-high": (a, b) => b.price - a.price,
      rating: (a, b) => b.rating - a.rating,
    };

    const comparator = comparators[sort];

    if (comparator) {
      filtered.sort(comparator);
    }

    return filtered.map((item) => item.original);
  }, [preparedTurfs, search, location, sport, sort]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}

      <section className="relative overflow-hidden border-b border-gray-200 bg-white">
        <div
          className="pointer-events-none absolute -left-24 top-10 h-64 w-64 rounded-full bg-emerald-500/5 blur-3xl"
          aria-hidden="true"
        />

        <div
          className="pointer-events-none absolute -right-24 bottom-0 h-64 w-64 rounded-full bg-emerald-500/5 blur-3xl"
          aria-hidden="true"
        />

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <MapPin size={14} />
              Explore Dhaka
            </div>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-gray-950 sm:text-4xl lg:text-5xl">
              Find the perfect{" "}
              <span className="text-emerald-600">turf</span>{" "}
              for your game
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-gray-500 sm:text-base">
              Discover sports turfs across Dhaka, compare your
              options, and find a convenient place for your
              next game.
            </p>
          </div>

          {/* Search */}

          <div className="mt-8 max-w-4xl">
            <div className="group relative">
              <Search
                size={19}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-emerald-600"
                aria-hidden="true"
              />

              <input
                type="search"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search by turf name, location or sport..."
                aria-label="Search turfs"
                className="h-13 w-full rounded-2xl border border-gray-200 bg-white pl-11 pr-12 text-sm text-gray-900 shadow-sm outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
              />

              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Mobile filters toggle */}

            <button
              type="button"
              onClick={() =>
                setShowFilters((previous) => !previous)
              }
              aria-expanded={showFilters}
              aria-controls="mobile-turf-filters"
              className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 lg:hidden"
            >
              <SlidersHorizontal size={17} />

              {showFilters ? "Hide filters" : "Show filters"}

              {hasActiveFilters && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1.5 text-[10px] font-bold text-white">
                  !
                </span>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Main content */}

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[250px_minmax(0,1fr)]">
          {/* Sidebar */}

          <div
            id="mobile-turf-filters"
            className={`${
              showFilters ? "block" : "hidden"
            } lg:block`}
          >
            <FilterSidebar
              locations={locations}
              locationCounts={locationCounts}
              location={location}
              sport={sport}
              onLocationChange={handleLocationChange}
              onSportChange={handleSportChange}
              onReset={clearFilters}
              hasActiveFilters={hasActiveFilters}
            />
          </div>

          {/* Results */}

          <div className="min-w-0">
            {/* Toolbar */}

            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p
                  className="text-sm text-gray-500"
                  aria-live="polite"
                >
                  Showing{" "}
                  <span className="font-bold text-gray-900">
                    {isLoading ? "..." : filteredTurfs.length}
                  </span>{" "}
                  {filteredTurfs.length === 1 ? "turf" : "turfs"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label
                  htmlFor="turf-sort"
                  className="hidden text-sm text-gray-500 sm:block"
                >
                  Sort by
                </label>

                <div className="relative">
                  <select
                    id="turf-sort"
                    value={sort}
                    onChange={(event) =>
                      setSort(event.target.value)
                    }
                    className="h-10 appearance-none rounded-xl border border-gray-200 bg-white pl-3 pr-9 text-sm font-medium text-gray-700 outline-none transition hover:border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10"
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option
                        key={option.value}
                        value={option.value}
                      >
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
                  className="hidden h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 sm:inline-flex"
                >
                  <Map size={16} />
                  Map
                </Link>
              </div>
            </div>

            {/* Active filters */}

            {hasActiveFilters && (
              <div className="mb-6 flex flex-wrap items-center gap-2">
                {search.trim() && (
                  <ActiveFilter
                    onRemove={() => setSearch("")}
                  >
                    <Search size={12} />
                    {search}
                  </ActiveFilter>
                )}

                {location !== ALL_LOCATIONS && (
                  <ActiveFilter
                    onRemove={() =>
                      handleLocationChange(ALL_LOCATIONS)
                    }
                  >
                    <MapPin size={12} />
                    {location}
                  </ActiveFilter>
                )}

                {sport !== ALL_SPORTS && (
                  <ActiveFilter
                    onRemove={() =>
                      handleSportChange(ALL_SPORTS)
                    }
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
                  Reset
                </button>
              </div>
            )}

            {/* Loading */}

            {isLoading ? (
              <div
                className="grid gap-5 sm:grid-cols-2 xl:gap-6"
                aria-label="Loading turfs"
                aria-busy="true"
              >
                {Array.from({ length: 6 }).map((_, index) => (
                  <TurfSkeleton key={index} />
                ))}
              </div>
            ) : error ? (
              <ErrorState
                message={error}
                onRetry={() => {
                  const controller = new AbortController();
                  fetchTurfs(controller.signal);
                }}
              />
            ) : filteredTurfs.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:gap-6">
                {filteredTurfs.map((turf) => (
                  <div key={getTurfId(turf)}>
                    <TurfCard turf={turf} />
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
