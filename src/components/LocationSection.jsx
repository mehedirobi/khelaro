import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  ArrowUpRight,
  Building2,
  Users,
  ChevronRight,
  MapPinned,
  LoaderCircle,
  RefreshCw,
  ExternalLink,
} from "lucide-react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  ZoomControl,
  useMap,
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "https://khelaro-server.vercel.app"
).replace(/\/+$/, "");

const DHAKA_CENTER = [23.8103, 90.4125];

const LOCATIONS = [
  {
    name: "Mirpur",
    value: "mirpur",
    center: [23.8223, 90.3654],
    aliases: ["mirpur", "mirpur 1", "mirpur 2", "mirpur 10", "mirpur 11", "mirpur 12", "pallabi", "kazipara", "shewrapara"],
  },
  {
    name: "Uttara",
    value: "uttara",
    center: [23.8759, 90.3795],
    aliases: ["uttara", "uttara sector", "airport", "azampur", "abdullahpur"],
  },
  {
    name: "Mohammadpur",
    value: "mohammadpur",
    center: [23.7663, 90.3587],
    aliases: ["mohammadpur", "mohammedpur", "adabor", "bosila", "basila"],
  },
  {
    name: "Dhanmondi",
    value: "dhanmondi",
    center: [23.7461, 90.3742],
    aliases: ["dhanmondi", "jigatola", "satmasjid", "kalabagan"],
  },
  {
    name: "Badda",
    value: "badda",
    center: [23.7806, 90.4254],
    aliases: ["badda", "north badda", "middle badda", "merul badda", "rampura", "hatirjheel"],
  },
  {
    name: "Bashundhara",
    value: "bashundhara",
    center: [23.8151, 90.4255],
    aliases: ["bashundhara", "bashundhara r a", "bashundhara residential area"],
  },
];

const normalizeText = (value = "") =>
  String(value)
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[._-]+/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const getTurfName = (turf) =>
  turf?.name || turf?.turfName || turf?.title || "Sports turf";

const getTurfId = (turf) =>
  turf?._id || turf?.id || turf?.slug || turf?.turfId || "";

const getTextValue = (value) => {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  return "";
};

/**
 * Build searchable text from common turf schemas.
 * This allows area matching even when the backend has no coordinates.
 */
const getSearchableLocationText = (turf) => {
  const address = turf?.address;
  const location = turf?.location;

  const values = [
    turf?.name,
    turf?.turfName,
    turf?.title,
    turf?.area,
    turf?.areaName,
    turf?.locationName,
    turf?.city,
    turf?.district,
    turf?.address,
    turf?.location,
    turf?.fullAddress,
    turf?.venueAddress,
    typeof address === "object" ? address.street : "",
    typeof address === "object" ? address.area : "",
    typeof address === "object" ? address.city : "",
    typeof address === "object" ? address.district : "",
    typeof address === "object" ? address.address : "",
    typeof location === "object" ? location.name : "",
    typeof location === "object" ? location.area : "",
    typeof location === "object" ? location.city : "",
    typeof location === "object" ? location.address : "",
  ];

  return normalizeText(
    values.map(getTextValue).filter(Boolean).join(" ")
  );
};

const matchesArea = (turf, area) => {
  const searchableText = getSearchableLocationText(turf);
  const aliases = [area.name, ...area.aliases].map(normalizeText);

  return aliases.some((alias) => {
    if (!alias) return false;

    // Match complete phrases rather than arbitrary partial words.
    return ` ${searchableText} `.includes(` ${alias} `);
  });
};

const findMatchingArea = (turf) =>
  LOCATIONS.find((area) => matchesArea(turf, area)) || null;

/**
 * Prefer genuine coordinates if the API has them.
 * GeoJSON uses [longitude, latitude].
 */
const getCoordinates = (turf) => {
  let latitude =
    turf?.latitude ??
    turf?.lat ??
    turf?.location?.latitude ??
    turf?.location?.lat ??
    turf?.address?.latitude ??
    turf?.address?.lat;

  let longitude =
    turf?.longitude ??
    turf?.lng ??
    turf?.lon ??
    turf?.location?.longitude ??
    turf?.location?.lng ??
    turf?.location?.lon ??
    turf?.address?.longitude ??
    turf?.address?.lng;

  const geoJsonCoordinates = turf?.location?.coordinates;

  if (
    latitude == null &&
    longitude == null &&
    Array.isArray(geoJsonCoordinates) &&
    geoJsonCoordinates.length >= 2
  ) {
    [longitude, latitude] = geoJsonCoordinates;
  }

  // A top-level coordinates array is also commonly stored as GeoJSON.
  const coordinates = turf?.coordinates;

  if (
    latitude == null &&
    longitude == null &&
    Array.isArray(coordinates) &&
    coordinates.length >= 2
  ) {
    [longitude, latitude] = coordinates;
  }

  if (
    latitude == null ||
    longitude == null ||
    latitude === "" ||
    longitude === ""
  ) {
    return null;
  }

  const lat = Number(latitude);
  const lng = Number(longitude);

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180 ||
    (lat === 0 && lng === 0)
  ) {
    return null;
  }

  return [lat, lng];
};

const getTurfAddress = (turf) => {
  const address = turf?.address;
  const location = turf?.location;

  if (typeof address === "string" && address.trim()) {
    return address;
  }

  if (address && typeof address === "object") {
    const parts = [
      address.street,
      address.area,
      address.city,
      address.district,
    ].filter((part) => typeof part === "string" && part.trim());

    if (parts.length) return parts.join(", ");
  }

  if (typeof location === "string" && location.trim()) {
    return location;
  }

  return (
    turf?.area ||
    turf?.areaName ||
    turf?.locationName ||
    "Dhaka, Bangladesh"
  );
};

const isApprovedTurf = (turf) => {
  const status = String(turf?.status || "").toLowerCase().trim();

  // If status is absent, preserve the API record.
  if (!status) return true;

  return ["approved", "active", "published"].includes(status);
};

const getRecords = (result) => {
  if (Array.isArray(result)) return result;

  const possibleArrays = [
    result?.turfs,
    result?.data,
    result?.results,
    result?.items,
    result?.data?.turfs,
    result?.data?.items,
    result?.result?.turfs,
  ];

  return possibleArrays.find(Array.isArray) || null;
};

const createTurfIcon = () =>
  L.divIcon({
    className: "khelaro-map-marker",
    html: `
      <div class="khelaro-marker-pin">
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/>
          <circle cx="12" cy="10" r="2.5"/>
        </svg>
      </div>
    `,
    iconSize: [38, 44],
    iconAnchor: [19, 42],
    popupAnchor: [0, -40],
  });

const turfIcon = createTurfIcon();

const FlyToLocation = ({ center, zoom }) => {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { duration: 0.8 });
    }
  }, [center, zoom, map]);

  return null;
};

const LocationSection = () => {
  const [turfs, setTurfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [mapCenter, setMapCenter] = useState(DHAKA_CENTER);
  const [mapZoom, setMapZoom] = useState(11);

  const fetchTurfs = useCallback(async (signal) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/turfs`, { signal });

      if (!response.ok) {
        throw new Error(`Unable to load turfs (${response.status}).`);
      }

      const result = await response.json();
      const records = getRecords(result);

      if (!records) {
        throw new Error(
          "Unexpected API response. Please check the GET /turfs response format."
        );
      }

      setTurfs(records.filter(isApprovedTurf));
    } catch (err) {
      if (err.name === "AbortError") return;

      setError(
        err.message || "Unable to load turf locations. Please try again."
      );
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    fetchTurfs(controller.signal);

    return () => controller.abort();
  }, [fetchTurfs]);

  const mappedTurfs = useMemo(
    () =>
      turfs.map((turf, index) => {
        const actualCoordinates = getCoordinates(turf);
        const matchedArea = findMatchingArea(turf);

        // Real coordinates take priority. Otherwise use a known area's
        // approximate center when the turf text matches that area.
        const mapCoordinates =
          actualCoordinates || matchedArea?.center || null;

        return {
          ...turf,
          _mapKey:
            getTurfId(turf) ||
            `${normalizeText(getTurfName(turf))}-${index}`,
          _mapName: getTurfName(turf),
          _mapAddress: getTurfAddress(turf),
          _mapCoordinates: mapCoordinates,
          _matchedArea: matchedArea,
          _isApproximate: !actualCoordinates && Boolean(matchedArea),
        };
      }),
    [turfs]
  );

  const selectedLocation = useMemo(
    () => LOCATIONS.find((area) => area.value === selectedArea) || null,
    [selectedArea]
  );

  const areaCounts = useMemo(() => {
    const counts = {};

    LOCATIONS.forEach((area) => {
      counts[area.value] = turfs.filter((turf) =>
        matchesArea(turf, area)
      ).length;
    });

    return counts;
  }, [turfs]);

  const filteredMapTurfs = useMemo(() => {
    const withLocations = mappedTurfs.filter(
      (turf) => turf._mapCoordinates
    );

    if (!selectedLocation) return withLocations;

    return withLocations.filter(
      (turf) =>
        turf._matchedArea?.value === selectedLocation.value ||
        matchesArea(turf, selectedLocation)
    );
  }, [mappedTurfs, selectedLocation]);

  const approximateCount = useMemo(
    () =>
      filteredMapTurfs.filter((turf) => turf._isApproximate).length,
    [filteredMapTurfs]
  );

  const handleAreaSelect = (area) => {
    setSelectedArea(area.value);
    setMapCenter(area.center);
    setMapZoom(13);
  };

  const clearArea = () => {
    setSelectedArea("");
    setMapCenter(DHAKA_CENTER);
    setMapZoom(11);
  };

  return (
    <section className="relative overflow-hidden bg-white py-16 sm:py-20 lg:py-24">
      <div
        className="pointer-events-none absolute -right-40 top-20 h-80 w-80 rounded-full bg-green-50/70 blur-3xl"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute -left-40 bottom-10 h-72 w-72 rounded-full bg-emerald-50/50 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-green-600">
              <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
              Explore Dhaka
            </div>

            <h2 className="text-3xl font-extrabold tracking-[-0.025em] text-gray-950 sm:text-4xl lg:text-[42px] lg:leading-[1.15]">
              Find a turf near you
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-6 text-gray-500 sm:text-base sm:leading-7">
              Explore sports venues by area and find the locations that match
              your preferred part of Dhaka.
            </p>
          </div>

          <Link
            to="/turfs"
            className="group inline-flex w-fit items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:-translate-y-0.5 hover:border-green-200 hover:bg-green-50 hover:text-green-700 hover:shadow-md"
          >
            View all turfs
            <ArrowUpRight
              size={16}
              className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </Link>
        </div>

        {/* Area selection cards */}
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:mt-10 lg:grid-cols-3">
          {LOCATIONS.map((area) => {
            const count = areaCounts[area.value] || 0;
            const isSelected = selectedArea === area.value;

            return (
              <button
                key={area.value}
                type="button"
                onClick={() => handleAreaSelect(area)}
                aria-pressed={isSelected}
                className={[
                  "group relative overflow-hidden rounded-2xl border p-4 text-left transition duration-200 sm:p-5",
                  isSelected
                    ? "border-green-500 bg-green-50 shadow-md shadow-green-900/5"
                    : "border-gray-200 bg-white hover:-translate-y-0.5 hover:border-green-200 hover:shadow-lg hover:shadow-green-900/[0.05]",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={[
                        "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-colors",
                        isSelected
                          ? "bg-green-600 text-white"
                          : "bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white",
                      ].join(" ")}
                    >
                      <MapPin size={20} />
                    </div>

                    <div className="min-w-0">
                      <h3 className="font-bold text-gray-900">
                        {area.name}
                      </h3>

                      <p className="mt-1 text-xs text-gray-500">
                        {loading
                          ? "Loading turfs..."
                          : `${count} ${count === 1 ? "turf" : "turfs"} listed`}
                      </p>
                    </div>
                  </div>

                  <ChevronRight
                    size={19}
                    className={[
                      "shrink-0 transition-transform",
                      isSelected
                        ? "translate-x-0.5 text-green-600"
                        : "text-gray-300 group-hover:translate-x-0.5 group-hover:text-green-600",
                    ].join(" ")}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Interactive map */}
        <div className="mt-8 overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm lg:mt-10">
          <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <MapPinned size={22} />
              </div>

              <div>
                <h3 className="font-bold text-gray-900">
                  Turf locations map
                </h3>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  {loading
                    ? "Loading turf data..."
                    : selectedLocation
                      ? `Showing ${filteredMapTurfs.length} mapped ${
                          filteredMapTurfs.length === 1 ? "turf" : "turfs"
                        } in ${selectedLocation.name}`
                      : `${filteredMapTurfs.length} mapped ${
                          filteredMapTurfs.length === 1 ? "turf" : "turfs"
                        } across Dhaka`}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {selectedArea && (
                <button
                  type="button"
                  onClick={clearArea}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50"
                >
                  All areas
                </button>
              )}

              <Link
                to={
                  selectedArea
                    ? `/turfs?area=${encodeURIComponent(selectedArea)}`
                    : "/turfs"
                }
                className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-green-700"
              >
                View results
                <ArrowUpRight size={14} />
              </Link>
            </div>
          </div>

          {error ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center px-6 py-10 text-center sm:min-h-[380px]">
              <MapPinned size={34} className="text-gray-300" />

              <h4 className="mt-4 font-bold text-gray-900">
                Unable to load turf locations
              </h4>

              <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
                {error}
              </p>

              <button
                type="button"
                onClick={() => fetchTurfs()}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
              >
                <RefreshCw size={15} />
                Try again
              </button>
            </div>
          ) : (
            <div className="relative">
              {loading && (
                <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-white/75 backdrop-blur-[2px]">
                  <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-lg">
                    <LoaderCircle
                      size={20}
                      className="animate-spin text-green-600"
                    />
                    <span className="text-sm font-semibold text-gray-700">
                      Loading map...
                    </span>
                  </div>
                </div>
              )}

              <MapContainer
                center={DHAKA_CENTER}
                zoom={11}
                scrollWheelZoom={false}
                zoomControl={false}
                className="khelaro-location-map"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  maxZoom={19}
                />

                <ZoomControl position="bottomright" />

                <FlyToLocation center={mapCenter} zoom={mapZoom} />

                {filteredMapTurfs.map((turf) => (
                  <Marker
                    key={turf._mapKey}
                    position={turf._mapCoordinates}
                    icon={turfIcon}
                  >
                    <Popup>
                      <div className="min-w-[170px]">
                        <h4 className="font-bold text-gray-900">
                          {turf._mapName}
                        </h4>

                        <p className="mt-1 text-xs leading-5 text-gray-500">
                          {turf._mapAddress}
                        </p>

                        {turf._isApproximate && (
                          <p className="mt-2 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800">
                            Approximate area location — exact coordinates
                            unavailable
                          </p>
                        )}

                        {turf.sport && (
                          <p className="mt-2 text-xs font-semibold text-green-700">
                            {Array.isArray(turf.sport)
                              ? turf.sport.join(", ")
                              : turf.sport}
                          </p>
                        )}

                        {getTurfId(turf) && (
                          <Link
                            to={
                              turf.slug
                                ? `/turfs/${turf.slug}`
                                : `/turfs/${getTurfId(turf)}`
                            }
                            className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-green-700"
                          >
                            View turf
                            <ExternalLink size={12} />
                          </Link>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>

              {!loading && filteredMapTurfs.length === 0 && (
                <div className="absolute left-3 right-3 top-3 z-[500] mx-auto max-w-md rounded-xl border border-gray-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:left-1/2 sm:right-auto sm:w-max sm:-translate-x-1/2">
                  <p className="text-sm font-bold text-gray-800">
                    No mapped turfs found
                  </p>
                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    {selectedArea
                      ? `No turf location matched ${selectedLocation?.name || selectedArea}. Check that the turf name, area, or address contains a recognizable location.`
                      : "No turf coordinates or recognized Dhaka areas were found in the API data."}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2 border-t border-gray-100 bg-gray-50/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-xs leading-5 text-gray-500">
              {approximateCount > 0
                ? `${approximateCount} displayed ${
                    approximateCount === 1 ? "marker uses" : "markers use"
                  } approximate area coordinates. Exact venue coordinates are not available for those turfs.`
                : "Markers use coordinates supplied by the turf data."}
            </p>

            <a
              href="https://www.openstreetmap.org/"
              target="_blank"
              rel="noreferrer"
              className="w-fit text-xs font-semibold text-gray-600 underline-offset-4 hover:text-green-700 hover:underline"
            >
              OpenStreetMap
            </a>
          </div>
        </div>

        {/* Information cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="group rounded-2xl border border-gray-100 bg-gray-50 p-5 transition hover:border-green-100 hover:bg-green-50/50">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-green-600 shadow-sm transition group-hover:bg-green-600 group-hover:text-white">
                <Building2 size={21} />
              </div>

              <div>
                <p className="text-sm font-bold text-gray-900">
                  Discover local venues
                </p>
                <p className="mt-1.5 text-xs leading-5 text-gray-500">
                  Explore turf locations and open available venue details from
                  the map.
                </p>
              </div>
            </div>
          </div>

          <div className="group rounded-2xl border border-gray-100 bg-gray-50 p-5 transition hover:border-green-100 hover:bg-green-50/50">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-green-600 shadow-sm transition group-hover:bg-green-600 group-hover:text-white">
                <Users size={21} />
              </div>

              <div>
                <p className="text-sm font-bold text-gray-900">
                  Find your next game
                </p>
                <p className="mt-1.5 text-xs leading-5 text-gray-500">
                  Choose an area, explore its turfs, and continue to the
                  booking flow.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .khelaro-location-map {
          z-index: 0;
          width: 100%;
          height: 430px;
          background: #f3f4f6;
        }

        .khelaro-map-marker {
          background: transparent;
          border: none;
        }

        .khelaro-marker-pin {
          display: flex;
          width: 38px;
          height: 38px;
          align-items: center;
          justify-content: center;
          color: white;
          background: #16a34a;
          border: 3px solid white;
          border-radius: 50% 50% 50% 8px;
          box-shadow: 0 4px 12px rgba(22, 101, 52, 0.3);
          transform: rotate(-45deg);
          transition: background-color 180ms ease;
        }

        .khelaro-marker-pin svg {
          transform: rotate(45deg);
        }

        .khelaro-map-marker:hover .khelaro-marker-pin {
          background: #15803d;
        }

        .khelaro-location-map .leaflet-popup-content-wrapper {
          border-radius: 12px;
        }

        .khelaro-location-map .leaflet-popup-content {
          margin: 14px;
          line-height: 1.5;
        }

        .khelaro-location-map .leaflet-control-zoom a {
          color: #374151;
        }

        @media (max-width: 640px) {
          .khelaro-location-map {
            height: 340px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .khelaro-map-marker,
          .khelaro-marker-pin {
            transition: none;
          }
        }
      `}</style>
    </section>
  );
};

export default LocationSection;