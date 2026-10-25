
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Loader2,
  MapPin,
  Phone,
  RefreshCw,
  Search,
  UserRound,
  XCircle,
  CalendarCheck,
  AlertCircle,
  Wallet,
} from "lucide-react";
import toast from "react-hot-toast";

import { AuthContext } from "../contexts/AuthProvider";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/+$/, "");

const STATUS_STYLES = {
  pending:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300",
  confirmed:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
  cancelled:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300",
  completed:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300",
};

const formatCurrency = (amount) =>
  `৳${Number(amount || 0).toLocaleString("en-BD", {
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return "Date not available";

  // Keep date-only values from shifting to the previous day.
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    const [year, month, day] = value.split("-").map(Number);
    return new Intl.DateTimeFormat("en-BD", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(year, month - 1, day));
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("en-BD", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatStatus = (status) =>
  String(status || "unknown")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());

const getBookingStatusStyle = (status) =>
  STATUS_STYLES[String(status || "").toLowerCase()] ||
  "border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300";

const getBookingAmount = (booking) =>
  booking.price ?? booking.totalPrice ?? booking.amount ?? 0;

const getErrorMessage = async (response) => {
  try {
    const data = await response.json();
    return data.message || data.error || "Request failed.";
  } catch {
    return "Request failed. Please try again.";
  }
};

const OwnerBookings = () => {
  const { currentUser } = useContext(AuthContext);

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [updatingId, setUpdatingId] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchBookings = useCallback(async (signal) => {
    if (!currentUser?.email) {
      setBookings([]);
      setLoadError("Please sign in to view your bookings.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError("");

    try {
      // Load the current owner's turfs.
      const turfResponse = await fetch(
        `${API_URL}/owner/turfs/${encodeURIComponent(currentUser.email)}`,
        { signal }
      );

      if (!turfResponse.ok) {
        throw new Error(await getErrorMessage(turfResponse));
      }

      const turfs = await turfResponse.json();

      if (!Array.isArray(turfs)) {
        throw new Error("The server returned an invalid turf list.");
      }

      if (turfs.length === 0) {
        setBookings([]);
        return;
      }

      // Fetch bookings for the owner's turfs.
      // Keep successful results if one turf's request fails.
      const results = await Promise.allSettled(
        turfs.map(async (turf) => {
          const response = await fetch(
            `${API_URL}/bookings/turf/${encodeURIComponent(turf._id)}`,
            { signal }
          );

          if (!response.ok) {
            throw new Error(`Failed to load bookings for ${turf.name || "a turf"}.`);
          }

          const data = await response.json();

          if (!Array.isArray(data)) {
            throw new Error("Invalid booking data returned by the server.");
          }

          return data.map((booking) => ({
            ...booking,
            turfName: booking.turfName || turf.name || "Turf Booking",
            turfLocation: booking.turfLocation || turf.location || "",
            turfId: booking.turfId || turf._id,
          }));
        })
      );

      const allBookings = [];
      let failedRequests = 0;

      results.forEach((result) => {
        if (result.status === "fulfilled") {
          allBookings.push(...result.value);
        } else if (result.reason?.name !== "AbortError") {
          failedRequests += 1;
          console.error("Turf booking request failed:", result.reason);
        }
      });

      // Deduplicate defensively in case the same booking appears twice.
      const uniqueBookings = [
        ...new Map(
          allBookings.map((booking) => [booking._id, booking])
        ).values(),
      ];

      uniqueBookings.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.date || 0).getTime();
        const dateB = new Date(b.createdAt || b.date || 0).getTime();
        return dateB - dateA;
      });

      setBookings(uniqueBookings);

      if (failedRequests > 0) {
        toast.error(
          `Some bookings could not be loaded (${failedRequests} request${failedRequests === 1 ? "" : "s"} failed).`
        );
      }
    } catch (error) {
      if (error.name === "AbortError") return;

      console.error("Owner bookings error:", error);
      setLoadError(error.message || "Failed to load bookings.");
      toast.error(error.message || "Failed to load bookings.");
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [currentUser?.email]);

  useEffect(() => {
    const controller = new AbortController();

    fetchBookings(controller.signal);

    return () => controller.abort();
  }, [fetchBookings, refreshKey]);

  const updateBookingStatus = async (booking, status) => {
    if (!booking?._id || updatingId) return;

    const previousStatus = booking.status;

    try {
      setUpdatingId(booking._id);

      const response = await fetch(
        `${API_URL}/bookings/${encodeURIComponent(booking._id)}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        }
      );

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      // Update local UI only after the server confirms success.
      setBookings((previous) =>
        previous.map((item) =>
          item._id === booking._id
            ? { ...item, status }
            : item
        )
      );

      toast.success(
        `Booking ${status === "confirmed" ? "confirmed" : "cancelled"} successfully.`
      );
    } catch (error) {
      console.error("Update booking error:", error);
      toast.error(error.message || "Failed to update booking.");

      // Preserve the existing state if the server update fails.
      setBookings((previous) =>
        previous.map((item) =>
          item._id === booking._id
            ? { ...item, status: previousStatus }
            : item
        )
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const summary = useMemo(() => {
    const pending = bookings.filter(
      (booking) => booking.status === "pending"
    ).length;

    const confirmed = bookings.filter(
      (booking) => booking.status === "confirmed"
    ).length;

    const revenue = bookings
      .filter((booking) => booking.status === "confirmed")
      .reduce(
        (total, booking) => total + Number(getBookingAmount(booking) || 0),
        0
      );

    return {
      total: bookings.length,
      pending,
      confirmed,
      revenue,
    };
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    const query = search.trim().toLowerCase();

    return bookings.filter((booking) => {
      const status = String(booking.status || "").toLowerCase();

      const matchesStatus =
        statusFilter === "all" || status === statusFilter;

      const searchableText = [
        booking.turfName,
        booking.turfLocation,
        booking.userName,
        booking.userEmail,
        booking.userPhone,
        booking.date,
        booking._id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return matchesStatus && (!query || searchableText.includes(query));
    });
  }, [bookings, search, statusFilter]);

  const summaryCards = [
    {
      label: "Total Bookings",
      value: summary.total,
      icon: CalendarDays,
      color: "text-blue-600 bg-blue-50 dark:bg-blue-500/10",
    },
    {
      label: "Pending",
      value: summary.pending,
      icon: Clock3,
      color: "text-amber-600 bg-amber-50 dark:bg-amber-500/10",
    },
    {
      label: "Confirmed",
      value: summary.confirmed,
      icon: CalendarCheck,
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10",
    },
    {
      label: "Confirmed Booking Value",
      value: formatCurrency(summary.revenue),
      icon: Wallet,
      color: "text-violet-600 bg-violet-50 dark:bg-violet-500/10",
    },
  ];

  if (loading && bookings.length === 0) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          <Loader2 size={20} className="animate-spin text-emerald-600" />
          Loading your bookings...
        </div>
      </div>
    );
  }

  if (loadError && bookings.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
        <AlertCircle className="mx-auto text-red-500" size={32} />
        <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
          Unable to load bookings
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {loadError}
        </p>
        <button
          type="button"
          onClick={() => setRefreshKey((value) => value + 1)}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          <RefreshCw size={16} />
          Try again
        </button>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Bookings
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Review and manage bookings made for your turfs.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setRefreshKey((value) => value + 1)}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(({ label, value, icon: Icon, color }) => (
          <div
            key={label}
            className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {label}
              </p>
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}>
                <Icon size={19} />
              </div>
            </div>
            <p className="mt-3 break-words text-2xl font-bold text-gray-900 dark:text-white">
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Search and filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 sm:flex-row dark:border-gray-800 dark:bg-gray-900">
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search turf, customer, phone or booking ID..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:min-w-44"
          aria-label="Filter bookings by status"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Booking list */}
      {filteredBookings.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 bg-white px-5 py-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10">
            <CalendarDays size={26} />
          </div>

          <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
            {bookings.length === 0
              ? "No bookings yet"
              : "No matching bookings"}
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">
            {bookings.length === 0
              ? "Customer bookings for your turfs will appear here."
              : "Try a different search term or change the status filter."}
          </p>

          {(search || statusFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
              className="mt-4 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
            <span>
              Showing {filteredBookings.length} of {bookings.length} bookings
            </span>
            {loading && (
              <Loader2 size={16} className="animate-spin text-emerald-600" />
            )}
          </div>

          {filteredBookings.map((booking) => {
            const status = String(booking.status || "unknown").toLowerCase();
            const isUpdating = updatingId === booking._id;

            return (
              <article
                key={booking._id}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex flex-col justify-between gap-5 lg:flex-row">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="break-words text-lg font-semibold text-gray-900 dark:text-white">
                        {booking.turfName || "Turf Booking"}
                      </h2>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${getBookingStatusStyle(status)}`}
                      >
                        {formatStatus(status)}
                      </span>
                    </div>

                    {booking.turfLocation && (
                      <p className="mt-2 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        <MapPin size={15} className="shrink-0 text-emerald-600" />
                        {booking.turfLocation}
                      </p>
                    )}

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <CalendarDays size={16} className="shrink-0 text-emerald-600" />
                        <span>{formatDate(booking.date)}</span>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <Clock3 size={16} className="shrink-0 text-emerald-600" />
                        <span>
                          {booking.startTime || "--:--"} - {booking.endTime || "--:--"}
                        </span>
                      </div>

                      <div className="flex min-w-0 items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <UserRound size={16} className="shrink-0 text-emerald-600" />
                        <span className="break-all">
                          {booking.userName || booking.userEmail || "Customer"}
                        </span>
                      </div>

                      {booking.userPhone && (
                        <a
                          href={`tel:${booking.userPhone}`}
                          className="flex items-center gap-2 text-sm text-gray-600 hover:text-emerald-600 dark:text-gray-300"
                        >
                          <Phone size={16} className="shrink-0 text-emerald-600" />
                          <span>{booking.userPhone}</span>
                        </a>
                      )}
                    </div>

                    {booking._id && (
                      <p className="mt-4 break-all text-xs text-gray-400">
                        Booking ID: {booking._id}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-row items-end justify-between gap-4 border-t border-gray-100 pt-4 lg:min-w-48 lg:flex-col lg:items-end lg:justify-start lg:border-t-0 lg:pt-0 dark:border-gray-800">
                    <div className="lg:text-right">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Booking Amount
                      </p>
                      <p className="mt-1 text-xl font-bold text-gray-900 dark:text-white">
                        {formatCurrency(getBookingAmount(booking))}
                      </p>
                    </div>

                    {status === "pending" && (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={Boolean(updatingId)}
                          onClick={() => updateBookingStatus(booking, "confirmed")}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isUpdating ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <CheckCircle2 size={15} />
                          )}
                          Confirm
                        </button>

                        <button
                          type="button"
                          disabled={Boolean(updatingId)}
                          onClick={() => updateBookingStatus(booking, "cancelled")}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-3 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/30 dark:hover:bg-red-500/10"
                        >
                          {isUpdating ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <XCircle size={15} />
                          )}
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default OwnerBookings;
