
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Star,
  Heart,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import Swal from "sweetalert2";

import useAuth from "../hooks/useAuth";

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/+$/, "");

const FALLBACK_IMAGE =
  "https://placehold.co/800x600?text=No+Turf+Image";

const formatPrice = new Intl.NumberFormat("en-BD");

// -----------------------------------------------------------------------------
// Utilities
// -----------------------------------------------------------------------------

const getText = (value, fallback = "") => {
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim() || fallback;
  }

  return fallback;
};

const getLocation = (turf) => {
  const area = getText(turf?.area);

  if (area) return area;

  const location = turf?.location;

  if (typeof location === "string") {
    return location.trim() || "Dhaka, Bangladesh";
  }

  if (location && typeof location === "object") {
    return (
      getText(location.area) ||
      getText(location.city) ||
      getText(location.name) ||
      "Dhaka, Bangladesh"
    );
  }

  return "Dhaka, Bangladesh";
};

const getSports = (turf) => {
  const value = turf?.sport || turf?.sports;

  if (Array.isArray(value)) {
    return value
      .map((item) => getText(item))
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[,|]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const getValidPrice = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const price = Number(value);

  return Number.isFinite(price) && price >= 0 ? price : null;
};

const getValidRating = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const rating = Number(value);

  return Number.isFinite(rating) && rating >= 0
    ? rating
    : null;
};

// -----------------------------------------------------------------------------
// Component
// -----------------------------------------------------------------------------

const TurfCard = ({ turf }) => {
  const { currentUser } = useAuth();

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlistChecking, setWishlistChecking] = useState(false);
  const [wishlistAnimation, setWishlistAnimation] = useState(false);

  const animationTimer = useRef(null);

  // ---------------------------------------------------------------------------
  // Normalize Turf Data
  // ---------------------------------------------------------------------------

  const turfId = getText(turf?._id || turf?.id || turf?.slug);
  const turfName = getText(turf?.name || turf?.turfName, "Unnamed Turf");

  const image = getText(turf?.image, FALLBACK_IMAGE);

  const turfLocation = getLocation(turf);
  const turfArea = getText(turf?.area);
  const turfSports = getSports(turf);

  const turfSize = getText(turf?.size);
  const turfSurface = getText(turf?.surface);

  const price = getValidPrice(turf?.price);
  const rating = getValidRating(turf?.rating);

  const userEmail = getText(currentUser?.email).toLowerCase();

  const isAvailable = turf?.available !== false;

  const sportLabel = turfSports.length
    ? turfSports.join(" / ")
    : "Sports Turf";

  const isWishlistBusy = wishlistLoading || wishlistChecking;

  // ---------------------------------------------------------------------------
  // Check Wishlist Status
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const controller = new AbortController();

    const checkWishlist = async () => {
      if (!userEmail || !turfId) {
        setIsWishlisted(false);
        setWishlistChecking(false);
        return;
      }

      setWishlistChecking(true);

      try {
        const response = await fetch(
          `${API_URL}/wishlist/${encodeURIComponent(
            userEmail
          )}/${encodeURIComponent(turfId)}`,
          {
            signal: controller.signal,
            headers: {
              Accept: "application/json",
            },
          }
        );

        if (response.status === 404) {
          setIsWishlisted(false);
          return;
        }

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data?.message ||
              `Wishlist request failed (${response.status}).`
          );
        }

        if (!controller.signal.aborted) {
          setIsWishlisted(Boolean(data?.wishlisted));
        }
      } catch (error) {
        if (error.name !== "AbortError" && !controller.signal.aborted) {
          console.error("Wishlist status error:", error);
          setIsWishlisted(false);
        }
      } finally {
        if (!controller.signal.aborted) {
          setWishlistChecking(false);
        }
      }
    };

    checkWishlist();

    return () => controller.abort();
  }, [userEmail, turfId]);

  // ---------------------------------------------------------------------------
  // Cleanup Animation Timer
  // ---------------------------------------------------------------------------

  useEffect(() => {
    return () => {
      if (animationTimer.current !== null) {
        window.clearTimeout(animationTimer.current);
      }
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Wishlist Animation
  // ---------------------------------------------------------------------------

  const triggerWishlistAnimation = () => {
    if (animationTimer.current !== null) {
      window.clearTimeout(animationTimer.current);
    }

    setWishlistAnimation(true);

    animationTimer.current = window.setTimeout(() => {
      setWishlistAnimation(false);
      animationTimer.current = null;
    }, 600);
  };

  // ---------------------------------------------------------------------------
  // Toggle Wishlist
  // ---------------------------------------------------------------------------

  const handleWishlist = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!userEmail) {
      await Swal.fire({
        icon: "info",
        title: "Login required",
        text: "Please login to save turfs to your wishlist.",
        confirmButtonColor: "#059669",
      });

      return;
    }

    if (!turfId || isWishlistBusy) return;

    setWishlistLoading(true);

    try {
      const response = await fetch(`${API_URL}/wishlist/toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          userEmail,
          turfId,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Wishlist request failed (${response.status}).`
        );
      }

      const newStatus = Boolean(data?.wishlisted);

      setIsWishlisted(newStatus);

      if (newStatus) {
        triggerWishlistAnimation();
      } else {
        setWishlistAnimation(false);

        if (animationTimer.current !== null) {
          window.clearTimeout(animationTimer.current);
          animationTimer.current = null;
        }
      }

      Swal.fire({
        toast: true,
        position: "top-end",
        icon: "success",
        title: newStatus
          ? "Added to wishlist"
          : "Removed from wishlist",
        text: newStatus
          ? `${turfName} saved to your wishlist.`
          : `${turfName} removed from your wishlist.`,
        showConfirmButton: false,
        timer: 1600,
        timerProgressBar: true,
      });
    } catch (error) {
      console.error("Wishlist request failed:", error);

      await Swal.fire({
        icon: "error",
        title: "Wishlist failed",
        text:
          error?.message ||
          "Unable to update wishlist. Please try again.",
        confirmButtonColor: "#059669",
      });
    } finally {
      setWishlistLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Image Fallback
  // ---------------------------------------------------------------------------

  const handleImageError = (event) => {
    const img = event.currentTarget;

    if (img.src !== FALLBACK_IMAGE) {
      img.src = FALLBACK_IMAGE;
    }

    img.onerror = null;
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl hover:shadow-gray-200/60 motion-reduce:transform-none motion-reduce:transition-none">

      {/* ----------------------------------------------------------------- */}
      {/* Image */}
      {/* ----------------------------------------------------------------- */}

      <div className="relative aspect-[4/3] shrink-0 overflow-hidden bg-gray-100">
        <img
          src={image}
          alt={`${turfName} sports venue`}
          loading="lazy"
          decoding="async"
          onError={handleImageError}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 motion-reduce:transition-none"
        />

        {/* Image Overlay */}
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/10"
          aria-hidden="true"
        />

        {/* Top Actions */}
        <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 p-4">

          {/* Sport Badge */}
          <span className="max-w-[75%] truncate rounded-full border border-white/40 bg-white/95 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-gray-800 shadow-sm backdrop-blur-md">
            {sportLabel}
          </span>

          {/* Wishlist Button */}
          <button
            type="button"
            onClick={handleWishlist}
            disabled={!turfId || isWishlistBusy}
            aria-label={
              isWishlisted
                ? `Remove ${turfName} from wishlist`
                : `Add ${turfName} to wishlist`
            }
            aria-pressed={isWishlisted}
            aria-busy={isWishlistBusy}
            className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/50 bg-white/95 text-gray-600 shadow-md backdrop-blur-md transition-all duration-200 hover:scale-105 hover:text-red-500 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 ${
              isWishlisted ? "text-red-500" : ""
            } ${wishlistAnimation ? "scale-110" : ""}`}
          >
            {wishlistAnimation && (
              <span
                className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-red-400/30"
                aria-hidden="true"
              />
            )}

            {isWishlistBusy ? (
              <Loader2
                size={18}
                className="relative z-10 animate-spin"
                aria-hidden="true"
              />
            ) : (
              <Heart
                size={18}
                strokeWidth={2}
                fill={isWishlisted ? "currentColor" : "none"}
                className="relative z-10"
                aria-hidden="true"
              />
            )}
          </button>
        </div>

        {/* Availability Badge */}
        <div className="absolute bottom-4 left-4 z-10">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold shadow-sm backdrop-blur-md ${
              isAvailable
                ? "bg-gray-950/85 text-white"
                : "bg-red-950/85 text-red-50"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isAvailable ? "bg-emerald-400" : "bg-red-400"
              }`}
              aria-hidden="true"
            />

            {isAvailable ? "Available" : "Unavailable"}
          </span>
        </div>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Content */}
      {/* ----------------------------------------------------------------- */}

      <div className="flex flex-1 flex-col p-5">

        {/* Title & Rating */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3
              className="truncate text-[15px] font-bold tracking-tight text-gray-900 transition-colors group-hover:text-emerald-700"
              title={turfName}
            >
              {turfName}
            </h3>

            <div className="mt-2 flex min-w-0 items-center gap-1.5 text-xs text-gray-500">
              <MapPin
                size={14}
                className="shrink-0 text-emerald-600"
                aria-hidden="true"
              />

              <span className="truncate" title={turfLocation}>
                {turfLocation}
              </span>
            </div>
          </div>

          {/* Rating */}
          <div
            className="flex shrink-0 items-center gap-1 rounded-lg border border-amber-100 bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700"
            aria-label={
              rating !== null
                ? `Rating ${rating.toFixed(1)} out of 5`
                : "No ratings yet"
            }
          >
            <Star
              size={13}
              fill={rating !== null ? "currentColor" : "none"}
              aria-hidden="true"
            />

            <span>
              {rating !== null ? rating.toFixed(1) : "New"}
            </span>
          </div>
        </div>

        {/* Turf Specifications */}
        {(turfSize || turfSurface || turfArea) && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {turfArea && (
              <span className="max-w-full truncate rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-1.5 text-[10px] font-medium text-gray-600">
                {turfArea}
              </span>
            )}

            {turfSize && (
              <span className="rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-1.5 text-[10px] font-medium text-gray-600">
                {turfSize}
              </span>
            )}

            {turfSurface && (
              <span className="rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-1.5 text-[10px] font-medium text-gray-600">
                {turfSurface}
              </span>
            )}
          </div>
        )}

        {/* ----------------------------------------------------------------- */}
        {/* Footer */}
        {/* ----------------------------------------------------------------- */}

        <div className="mt-auto">
          <div className="my-5 border-t border-gray-100" />

          <div className="flex items-end justify-between gap-3">
            {/* Price */}
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-gray-400">
                Starting from
              </p>

              <p className="mt-1 truncate text-lg font-extrabold tracking-tight text-gray-900">
                {price !== null ? (
                  <>
                    ৳{formatPrice.format(price)}

                    <span className="ml-1 text-xs font-normal text-gray-400">
                      / hour
                    </span>
                  </>
                ) : (
                  <span className="text-sm font-semibold text-gray-500">
                    Price unavailable
                  </span>
                )}
              </p>
            </div>

            {/* Details Button */}
            {turfId ? (
              <Link
                to={`/turfs/${encodeURIComponent(turfId)}`}
                aria-label={`View details for ${turfName}`}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-gray-900 px-3.5 py-2.5 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:bg-emerald-600 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                View details

                <ArrowUpRight
                  size={14}
                  aria-hidden="true"
                  className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </Link>
            ) : (
              <span className="inline-flex shrink-0 cursor-not-allowed items-center rounded-xl bg-gray-100 px-3.5 py-2.5 text-xs font-semibold text-gray-400">
                Details unavailable
              </span>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

export default TurfCard;
