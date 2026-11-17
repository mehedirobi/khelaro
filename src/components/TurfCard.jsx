
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

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/+$/, "");

const FALLBACK_IMAGE =
  "https://placehold.co/800x600?text=No+Turf+Image";

const formatPrice = new Intl.NumberFormat("en-BD");

const getText = (value, fallback = "") => {
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim() || fallback;
  }

  return fallback;
};

const TurfCard = ({ turf }) => {
  const { currentUser } = useAuth();

  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlistChecking, setWishlistChecking] = useState(false);
  const [wishlistAnimation, setWishlistAnimation] = useState(false);

  const animationTimer = useRef(null);

  // Normalize turf data
  const turfId = getText(turf?._id || turf?.id);
  const turfName = getText(turf?.name, "Unnamed Turf");
  const turfImage = getText(turf?.image, FALLBACK_IMAGE);
  const turfLocation = getText(
    turf?.location || turf?.area,
    "Dhaka, Bangladesh"
  );
  const turfArea = getText(turf?.area);
  const turfSport = getText(turf?.sport, "Sports Turf");
  const turfSize = getText(turf?.size);
  const turfSurface = getText(turf?.surface);

  const ratingValue = Number(turf?.rating);
  const hasRating =
    turf?.rating !== null &&
    turf?.rating !== undefined &&
    turf?.rating !== "" &&
    Number.isFinite(ratingValue);

  const priceValue = Number(turf?.price);
  const hasPrice =
    turf?.price !== null &&
    turf?.price !== undefined &&
    turf?.price !== "" &&
    Number.isFinite(priceValue) &&
    priceValue >= 0;

  const userEmail = getText(currentUser?.email).toLowerCase();
  const isAvailable = turf?.available !== false;

  // Check wishlist status
  useEffect(() => {
    const controller = new AbortController();

    const checkWishlistStatus = async () => {
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
              `Wishlist request failed (${response.status})`
          );
        }

        setIsWishlisted(Boolean(data?.wishlisted));
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Wishlist status error:", error);
          setIsWishlisted(false);
        }
      } finally {
        if (!controller.signal.aborted) {
          setWishlistChecking(false);
        }
      }
    };

    checkWishlistStatus();

    return () => controller.abort();
  }, [userEmail, turfId]);

  // Clean up animation timer
  useEffect(() => {
    return () => {
      if (animationTimer.current) {
        window.clearTimeout(animationTimer.current);
      }
    };
  }, []);

  // Toggle wishlist
  const handleWishlist = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    if (!userEmail) {
      await Swal.fire({
        icon: "info",
        title: "Login required",
        text: "Please login to save turfs to your wishlist.",
        confirmButtonColor: "#16a34a",
      });

      return;
    }

    if (!turfId || wishlistLoading || wishlistChecking) {
      return;
    }

    try {
      setWishlistLoading(true);

      const response = await fetch(`${API_URL}/wishlist/toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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
            `Wishlist request failed (${response.status})`
        );
      }

      const newStatus = Boolean(data?.wishlisted);

      setIsWishlisted(newStatus);

      if (animationTimer.current) {
        window.clearTimeout(animationTimer.current);
      }

      if (newStatus) {
        setWishlistAnimation(true);

        animationTimer.current = window.setTimeout(() => {
          setWishlistAnimation(false);
          animationTimer.current = null;
        }, 600);
      } else {
        setWishlistAnimation(false);
      }

      await Swal.fire({
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
        confirmButtonColor: "#16a34a",
      });
    } finally {
      setWishlistLoading(false);
    }
  };

  // Image fallback
  const handleImageError = (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = FALLBACK_IMAGE;
  };

  const isWishlistBusy = wishlistLoading || wishlistChecking;

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-gray-300 hover:shadow-xl hover:shadow-gray-200/60">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <img
          src={turfImage}
          alt={turfName}
          loading="lazy"
          decoding="async"
          onError={handleImageError}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />

        {/* Top actions */}
        <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between p-4">
          <span className="max-w-[70%] truncate rounded-full border border-white/30 bg-white/95 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-gray-800 shadow-sm backdrop-blur-md">
            {turfSport}
          </span>

          <button
            type="button"
            onClick={handleWishlist}
            disabled={isWishlistBusy || !turfId}
            aria-label={
              isWishlisted
                ? `Remove ${turfName} from wishlist`
                : `Add ${turfName} to wishlist`
            }
            aria-pressed={isWishlisted}
            aria-busy={isWishlistBusy}
            className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/40 bg-white/95 shadow-md backdrop-blur-md transition-all duration-200 hover:scale-105 active:scale-90 disabled:cursor-not-allowed disabled:opacity-70 ${
              isWishlisted
                ? "text-red-500"
                : "text-gray-600 hover:text-red-500"
            } ${wishlistAnimation ? "scale-125" : ""}`}
          >
            {wishlistAnimation && (
              <span className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-red-400/30" />
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

        {/* Availability */}
        <div className="absolute bottom-4 left-4 z-10">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold shadow-sm backdrop-blur-md ${
              isAvailable
                ? "bg-gray-950/85 text-white"
                : "bg-red-950/80 text-red-50"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isAvailable ? "bg-green-400" : "bg-red-400"
              }`}
            />

            {isAvailable
              ? "Available today"
              : "Currently unavailable"}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        {/* Title and rating */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3
              className="truncate text-[15px] font-semibold tracking-tight text-gray-900"
              title={turfName}
            >
              {turfName}
            </h3>

            <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
              <MapPin
                size={14}
                className="shrink-0 text-gray-400"
                aria-hidden="true"
              />

              <span className="truncate" title={turfLocation}>
                {turfLocation}
              </span>
            </div>
          </div>

          <div
            className="flex shrink-0 items-center gap-1 rounded-lg border border-amber-100 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700"
            aria-label={
              hasRating
                ? `Rating ${ratingValue.toFixed(1)} out of 5`
                : "No ratings yet"
            }
          >
            <Star
              size={13}
              fill={hasRating ? "currentColor" : "none"}
              aria-hidden="true"
            />

            <span>{hasRating ? ratingValue.toFixed(1) : "New"}</span>
          </div>
        </div>

        {/* Turf information */}
        {(turfArea || turfSize || turfSurface) && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {turfArea && (
              <span className="rounded-md border border-gray-100 bg-gray-50 px-2 py-1 text-[10px] font-medium text-gray-500">
                {turfArea}
              </span>
            )}

            {turfSize && (
              <span className="rounded-md border border-gray-100 bg-gray-50 px-2 py-1 text-[10px] font-medium text-gray-500">
                {turfSize}
              </span>
            )}

            {turfSurface && (
              <span className="rounded-md border border-gray-100 bg-gray-50 px-2 py-1 text-[10px] font-medium text-gray-500">
                {turfSurface}
              </span>
            )}
          </div>
        )}

        {/* Flexible spacing keeps card footers aligned */}
        <div className="mt-auto">
          <div className="my-5 border-t border-gray-100" />

          {/* Footer */}
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-medium text-gray-400">
                Starting from
              </p>

              <p className="mt-1 text-lg font-bold tracking-tight text-gray-900">
                {hasPrice ? (
                  <>
                    ৳{formatPrice.format(priceValue)}
                    <span className="ml-1 text-xs font-normal text-gray-400">
                      / hour
                    </span>
                  </>
                ) : (
                  <span className="text-sm font-medium text-gray-500">
                    Price unavailable
                  </span>
                )}
              </p>
            </div>

            {turfId ? (
              <Link
                to={`/turfs/${encodeURIComponent(turfId)}`}
                aria-label={`View details for ${turfName}`}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-gray-900 px-3.5 py-2.5 text-xs font-semibold text-white shadow-sm transition-all duration-200 hover:bg-green-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
              >
                View details

                <ArrowUpRight
                  size={14}
                  aria-hidden="true"
                  className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                />
              </Link>
            ) : (
              <span className="inline-flex shrink-0 cursor-not-allowed items-center gap-1.5 rounded-lg bg-gray-100 px-3.5 py-2.5 text-xs font-semibold text-gray-400">
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
