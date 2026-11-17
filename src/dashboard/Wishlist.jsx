import { useCallback, useEffect, useState } from "react";
import {
  Heart,
  MapPin,
  Star,
  ArrowUpRight,
  ArrowLeft,
  Loader2,
  RefreshCw,
  Trash2,
  CalendarDays,
  Sparkles,
  CircleAlert,
} from "lucide-react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";

import useAuth from "../hooks/useAuth";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/+$/, "");

const FALLBACK_IMAGE =
  "https://placehold.co/800x600?text=No+Turf+Image";

// --------------------------------------------------
// Utilities
// --------------------------------------------------

const formatPrice = (price) => {
  const value = Number(price);

  return (Number.isFinite(value) && value >= 0 ? value : 0)
    .toLocaleString("en-BD");
};

const getRating = (rating) => {
  const value = Number(rating);

  return Number.isFinite(value) && value > 0
    ? value.toFixed(1)
    : "New";
};

const normalizeTurf = (item) => {
  const turf = item?.turf && typeof item.turf === "object"
    ? item.turf
    : item;

  const turfId = String(
    item?.turfId ||
      item?.turf?._id ||
      item?.turf?.id ||
      item?._id ||
      item?.id ||
      ""
  ).trim();

  if (!turfId) return null;

  const facilities = [
    turf?.facilities,
    turf?.amenities,
    turf?.features,
  ].find(Array.isArray) || [];

  return {
    wishlistId: String(item?._id || item?.wishlistId || ""),
    turfId,
    name: turf?.name || "",
    image: turf?.image || "",
    location: turf?.location || turf?.area || "",
    area: turf?.area || "",
    sport: turf?.sport || "Sports Turf",
    surface: turf?.surface || "",
    size: turf?.size || "",
    price: turf?.price ?? 0,
    rating: turf?.rating ?? null,
    reviews: turf?.reviews ?? 0,
    facilities,
  };
};

const getFacilities = (turf) => {
  return turf.facilities
    .map((facility) => {
      if (typeof facility === "string") return facility;

      return facility?.name || facility?.title || "";
    })
    .filter(Boolean);
};

// --------------------------------------------------
// Skeleton Card
// --------------------------------------------------

const WishlistSkeleton = () => (
  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
    <div className="aspect-[16/10] animate-pulse bg-gray-200" />

    <div className="space-y-4 p-5">
      <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />

      <div className="h-5 w-3/4 animate-pulse rounded bg-gray-200" />

      <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />

      <div className="flex gap-2">
        <div className="h-6 w-16 animate-pulse rounded-full bg-gray-100" />
        <div className="h-6 w-20 animate-pulse rounded-full bg-gray-100" />
      </div>

      <div className="h-px bg-gray-100" />

      <div className="flex items-center justify-between">
        <div className="h-8 w-24 animate-pulse rounded bg-gray-200" />
        <div className="h-10 w-28 animate-pulse rounded-xl bg-gray-200" />
      </div>
    </div>
  </div>
);

// --------------------------------------------------
// Wishlist Card
// --------------------------------------------------

const WishlistCard = ({ turf, onRemove, isRemoving }) => {
  const [imageError, setImageError] = useState(false);

  const {
    turfId,
    name,
    image,
    location,
    sport,
    surface,
    size,
    price,
    rating,
    reviews,
  } = turf;

  const facilities = getFacilities(turf);

  const turfName = name || "Unnamed Turf";

  const imageUrl =
    !imageError && typeof image === "string" && image.trim()
      ? image.trim()
      : FALLBACK_IMAGE;

  const displayRating = getRating(rating);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-green-200 hover:shadow-xl hover:shadow-gray-200/50">
      {/* Image */}
      <div className="relative aspect-[16/10] shrink-0 overflow-hidden bg-gray-100">
        <img
          src={imageUrl}
          alt={turfName}
          loading="lazy"
          decoding="async"
          onError={() => setImageError(true)}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />

        {/* Sport Badge */}
        <span className="absolute left-4 top-4 rounded-full border border-white/50 bg-white/95 px-3 py-1.5 text-[11px] font-semibold text-gray-800 shadow-sm backdrop-blur">
          {sport}
        </span>

        {/* Remove Button */}
        <button
          type="button"
          onClick={() => onRemove(turfId, turfName)}
          disabled={isRemoving}
          aria-label={`Remove ${turfName} from wishlist`}
          title="Remove from wishlist"
          className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/95 text-red-500 shadow-sm backdrop-blur transition-all duration-200 hover:scale-105 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isRemoving ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Heart size={18} fill="currentColor" />
          )}
        </button>

        {/* Rating */}
        <div className="absolute bottom-4 left-4 inline-flex items-center gap-1.5 rounded-lg bg-black/55 px-2.5 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
          <Star
            size={13}
            fill={displayRating !== "New" ? "currentColor" : "none"}
            className="text-amber-400"
          />

          <span>{displayRating}</span>

          {Number(reviews) > 0 && (
            <span className="font-normal text-white/70">
              ({reviews})
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        {/* Name and Sport */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-green-700">
            {sport}
          </p>

          <h2
            title={turfName}
            className="mt-1.5 line-clamp-1 text-lg font-bold tracking-tight text-gray-900"
          >
            {turfName}
          </h2>
        </div>

        {/* Location */}
        <div className="mt-3 flex items-start gap-2 text-sm text-gray-500">
          <MapPin
            size={15}
            className="mt-0.5 shrink-0 text-green-600"
            aria-hidden="true"
          />

          <span className="line-clamp-2">
            {location || "Location unavailable"}
          </span>
        </div>

        {/* Features */}
        <div className="mt-4 flex min-h-7 flex-wrap gap-2">
          {size && (
            <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[10px] font-medium text-gray-600">
              {size}
            </span>
          )}

          {surface && (
            <span className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[10px] font-medium text-gray-600">
              {surface}
            </span>
          )}

          {facilities.slice(0, 2).map((facility, index) => (
            <span
              key={`${facility}-${index}`}
              className="rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[10px] font-medium text-gray-600"
            >
              {facility}
            </span>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-auto pt-5">
          <div className="mb-4 h-px bg-gray-100" />

          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-gray-400">
                Starting from
              </p>

              <p className="mt-1 text-xl font-bold tracking-tight text-gray-900">
                ৳{formatPrice(price)}
                <span className="ml-1 text-xs font-normal text-gray-400">
                  / hour
                </span>
              </p>
            </div>

            <Link
              to={`/turfs/${encodeURIComponent(turfId)}`}
              aria-label={`View ${turfName} details`}
              className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-gray-900 px-4 text-xs font-semibold text-white transition-all duration-200 hover:bg-green-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
            >
              View Details
              <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
};

// --------------------------------------------------
// Main Wishlist
// --------------------------------------------------

const Wishlist = () => {
  const { currentUser } = useAuth();

  const [wishlistTurfs, setWishlistTurfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState("");
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  const userEmail = currentUser?.email?.trim().toLowerCase() || "";

  // Fetch wishlist
  useEffect(() => {
    const controller = new AbortController();

    const fetchWishlist = async () => {
      if (!userEmail) {
        setWishlistTurfs([]);
        setLoading(false);
        setError("");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_URL}/wishlist/${encodeURIComponent(userEmail)}`,
          {
            signal: controller.signal,
          }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data?.message || "Failed to load your wishlist."
          );
        }

        const items = Array.isArray(data)
          ? data
          : Array.isArray(data?.wishlist)
            ? data.wishlist
            : Array.isArray(data?.data)
              ? data.data
              : [];

        const normalizedItems = items
          .map(normalizeTurf)
          .filter(Boolean);

        // Resolve incomplete turf information
        const resolvedItems = await Promise.all(
          normalizedItems.map(async (item) => {
            if (item.name) return item;

            try {
              const turfResponse = await fetch(
                `${API_URL}/turfs/${encodeURIComponent(item.turfId)}`,
                {
                  signal: controller.signal,
                }
              );

              if (!turfResponse.ok) return null;

              const turfData = await turfResponse.json().catch(() => ({}));

              const turf =
                turfData?.turf ||
                turfData?.data ||
                turfData;

              if (
                !turf ||
                typeof turf !== "object" ||
                Array.isArray(turf)
              ) {
                return null;
              }

              return {
                ...item,
                name: turf.name || "Unnamed Turf",
                image: turf.image || "",
                location: turf.location || turf.area || "",
                area: turf.area || "",
                sport: turf.sport || "Sports Turf",
                surface: turf.surface || "",
                size: turf.size || "",
                price: turf.price ?? 0,
                rating: turf.rating ?? null,
                reviews: turf.reviews ?? 0,
                facilities:
                  turf.facilities ||
                  turf.amenities ||
                  turf.features ||
                  [],
              };
            } catch (err) {
              if (err.name === "AbortError") throw err;

              console.error(
                `Failed to resolve turf ${item.turfId}:`,
                err
              );

              return null;
            }
          })
        );

        if (!controller.signal.aborted) {
          setWishlistTurfs(resolvedItems.filter(Boolean));
        }
      } catch (err) {
        if (err.name === "AbortError") return;

        console.error("Wishlist fetch error:", err);

        setError(err.message || "Failed to load your wishlist.");
        setWishlistTurfs([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchWishlist();

    return () => controller.abort();
  }, [userEmail, retryKey]);

  // Remove turf
  const handleRemove = async (turfId, turfName) => {
    if (!userEmail || !turfId || removingId) return;

    const result = await Swal.fire({
      title: "Remove from wishlist?",
      text: `Remove ${turfName} from your saved turfs?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Yes, remove",
      cancelButtonText: "Keep it",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      reverseButtons: true,
      focusCancel: true,
    });

    if (!result.isConfirmed) return;

    try {
      setRemovingId(String(turfId));

      const response = await fetch(
        `${API_URL}/wishlist/${encodeURIComponent(userEmail)}/${encodeURIComponent(turfId)}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to remove turf from wishlist."
        );
      }

      setWishlistTurfs((previous) =>
        previous.filter((turf) => turf.turfId !== String(turfId))
      );

      await Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: "Removed from wishlist",
        showConfirmButton: false,
        timer: 1600,
        timerProgressBar: true,
      });
    } catch (err) {
      console.error("Remove wishlist error:", err);

      Swal.fire({
        icon: "error",
        title: "Unable to remove turf",
        text: err.message || "Please try again.",
        confirmButtonColor: "#16a34a",
      });
    } finally {
      setRemovingId("");
    }
  };

  return (
    <main className="min-h-screen bg-gray-50/80">
      {/* Page Header */}
      <header className="border-b border-gray-200/80 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
          <Link
            to="/dashboard"
            className="group inline-flex items-center gap-2 text-xs font-medium text-gray-500 transition-colors hover:text-green-700"
          >
            <ArrowLeft
              size={16}
              className="transition-transform group-hover:-translate-x-1"
              aria-hidden="true"
            />
            Back to Dashboard
          </Link>

          <div className="mt-7 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-green-100 bg-green-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-green-700">
                <Heart size={13} fill="currentColor" />
                Saved Turfs
              </div>

              <h1 className="mt-4 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                Your Wishlist
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-gray-500 sm:text-base">
                Your favorite sports venues, all in one place.
                Save your preferred turfs and book whenever
                you're ready to play.
              </p>
            </div>

            {!loading && !error && (
              <div className="flex w-fit shrink-0 items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50 text-green-600">
                  <Heart size={18} />
                </div>

                <div>
                  <p className="text-lg font-bold leading-none text-gray-900">
                    {wishlistTurfs.length}
                  </p>

                  <p className="mt-1 text-[11px] text-gray-500">
                    {wishlistTurfs.length === 1
                      ? "Saved turf"
                      : "Saved turfs"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Wishlist Content */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        {/* Loading */}
        {loading && (
          <>
            <div
              className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
              aria-label="Loading wishlist"
            >
              {Array.from({ length: 3 }).map((_, index) => (
                <WishlistSkeleton key={index} />
              ))}
            </div>

            <p className="mt-7 flex items-center justify-center gap-2 text-xs font-medium text-gray-500">
              <Loader2
                size={16}
                className="animate-spin text-green-600"
              />
              Loading your saved turfs...
            </p>
          </>
        )}

        {/* Error */}
        {!loading && error && (
          <div
            role="alert"
            className="mx-auto max-w-lg rounded-2xl border border-red-100 bg-white px-6 py-12 text-center shadow-sm"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500">
              <CircleAlert size={25} />
            </div>

            <h2 className="mt-5 text-lg font-bold text-gray-900">
              Unable to load wishlist
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              {error}
            </p>

            <button
              type="button"
              onClick={() => setRetryKey((key) => key + 1)}
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-gray-900 px-5 text-sm font-semibold text-white transition hover:bg-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
            >
              <RefreshCw size={15} />
              Try again
            </button>
          </div>
        )}

        {/* Wishlist Grid */}
        {!loading && !error && wishlistTurfs.length > 0 && (
          <>
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Saved Collections
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  Turfs you've added to your wishlist.
                </p>
              </div>

              <Link
                to="/turfs"
                className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-green-700 transition hover:text-green-800"
              >
                Explore more
                <ArrowUpRight size={15} />
              </Link>
            </div>

            <div className="grid items-stretch gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {wishlistTurfs.map((turf) => (
                <WishlistCard
                  key={turf.wishlistId || turf.turfId}
                  turf={turf}
                  onRemove={handleRemove}
                  isRemoving={removingId === turf.turfId}
                />
              ))}
            </div>
          </>
        )}

        {/* Empty State */}
        {!loading && !error && wishlistTurfs.length === 0 && (
          <div className="rounded-3xl border border-gray-200 bg-white px-6 py-16 text-center sm:px-10 sm:py-20">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-green-50 text-green-600">
              <Heart size={34} strokeWidth={1.7} />
            </div>

            <div className="mt-6 inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-green-700">
              <Sparkles size={13} />
              Your saved collection
            </div>

            <h2 className="mt-3 text-2xl font-bold tracking-tight text-gray-900">
              Your wishlist is empty
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-500">
              You haven't saved any turfs yet. Explore available
              sports venues and add your favorites to find them
              easily whenever you're ready to play.
            </p>

            <Link
              to="/turfs"
              className="mt-7 inline-flex h-11 items-center gap-2 rounded-xl bg-green-600 px-5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-green-700 hover:shadow-lg hover:shadow-green-600/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
            >
              <CalendarDays size={17} />
              Explore Turfs
              <ArrowUpRight size={16} />
            </Link>
          </div>
        )}
      </section>
    </main>
  );
};

export default Wishlist;