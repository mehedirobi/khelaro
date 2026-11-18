
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  MapPin,
  Search,
  X,
  Loader2,
  Globe,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Receipt,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

const TABS = ["All", "Upcoming", "Completed", "Cancelled"];

const STATUS_STYLES = {
  Upcoming: "bg-blue-50 text-blue-700 ring-blue-100",
  Completed: "bg-green-50 text-green-700 ring-green-100",
  Cancelled: "bg-red-50 text-red-600 ring-red-100",
};

const PAYMENT_STYLES = {
  paid: "bg-green-50 text-green-700",
  unpaid: "bg-amber-50 text-amber-700",
  pending: "bg-amber-50 text-amber-700",
  failed: "bg-red-50 text-red-600",
  refunded: "bg-purple-50 text-purple-700",
};

const formatDate = (date) => {
  if (!date) return "Date unavailable";

  // Preserve date-only values in local calendar time.
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(date));

  const parsedDate = match
    ? new Date(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3])
      )
    : new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return String(date);
  }

  return parsedDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (time) => {
  if (!time) return "N/A";

  const match = /^(\d{1,2}):(\d{2})$/.exec(String(time));

  if (!match) return String(time);

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) return String(time);

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getBookingDate = (date) => {
  if (!date) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(date));

  const parsedDate = match
    ? new Date(
        Number(match[1]),
        Number(match[2]) - 1,
        Number(match[3])
      )
    : new Date(date);

  if (Number.isNaN(parsedDate.getTime())) return null;

  parsedDate.setHours(0, 0, 0, 0);

  return parsedDate;
};

const getDisplayStatus = (booking) => {
  const status = String(booking?.status || "")
    .trim()
    .toLowerCase();

  if (["cancelled", "canceled"].includes(status)) {
    return "Cancelled";
  }

  if (status === "completed") {
    return "Completed";
  }

  const bookingDate = getBookingDate(booking?.date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (bookingDate && bookingDate < today) {
    return "Completed";
  }

  return "Upcoming";
};

const getBookingReference = (booking) => {
  const id = booking?.bookingId || booking?._id || booking?.id;

  return id
    ? `KHL-${String(id).slice(-6).toUpperCase()}`
    : "Booking";
};

const getPaymentStatus = (status) => {
  const normalized = String(status || "unpaid").toLowerCase();

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const formatPrice = (price) => {
  const amount = Number(price);

  if (!Number.isFinite(amount)) return "N/A";

  return `৳${amount.toLocaleString("en-BD")}`;
};

const getStatusStyle = (status) =>
  STATUS_STYLES[status] || "bg-gray-50 text-gray-600 ring-gray-100";

const getPaymentStyle = (status) =>
  PAYMENT_STYLES[String(status || "unpaid").toLowerCase()] ||
  "bg-gray-50 text-gray-600";

const StatCard = ({ icon: Icon, label, value, description }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
          {value}
        </p>
        <p className="mt-1 text-xs text-gray-400">{description}</p>
      </div>

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600">
        <Icon size={19} />
      </div>
    </div>
  </div>
);

const BookingCard = ({ booking }) => {
  const status = getDisplayStatus(booking);

  const paymentStatus = String(
    booking?.paymentStatus || "unpaid"
  ).toLowerCase();

  const location =
    booking?.turfLocation || booking?.location;

  const bookingId =
    booking?._id || booking?.bookingId || booking?.id;

  return (
    <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white transition duration-200 hover:border-green-200 hover:shadow-md hover:shadow-gray-200/50">

      {/* Card Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${getStatusStyle(status)}`}
          >
            {status}
          </span>

          <span className="font-mono text-xs font-medium text-gray-400">
            {getBookingReference(booking)}
          </span>
        </div>

        <span className="flex items-center gap-1.5 text-xs text-gray-400">
          <CalendarDays size={14} />
          {formatDate(booking?.date)}
        </span>
      </div>

      {/* Card Body */}
      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_190px]">

        {/* Reservation Details */}
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
            {booking?.turfName || "Turf Reservation"}
          </h2>

          {location && (
            <p className="mt-2 flex items-start gap-2 text-sm text-gray-500">
              <MapPin
                size={16}
                className="mt-0.5 shrink-0 text-green-600"
              />
              <span className="min-w-0 break-words">{location}</span>
            </p>
          )}

          {/* Reservation Information */}
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-green-600 shadow-sm">
                <CalendarDays size={17} />
              </div>

              <div className="min-w-0">
                <p className="text-xs text-gray-400">Booking Date</p>
                <p className="mt-1 text-sm font-semibold text-gray-800">
                  {formatDate(booking?.date)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-green-600 shadow-sm">
                <Clock3 size={17} />
              </div>

              <div className="min-w-0">
                <p className="text-xs text-gray-400">Playing Time</p>
                <p className="mt-1 text-sm font-semibold text-gray-800">
                  {formatTime(booking?.startTime)}
                  {" - "}
                  {formatTime(booking?.endTime)}
                </p>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-gray-400">
              Payment Status:
            </span>

            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getPaymentStyle(paymentStatus)}`}
            >
              {getPaymentStatus(booking?.paymentStatus)}
            </span>
          </div>
        </div>

        {/* Price and Action */}
        <div className="flex flex-row items-center justify-between gap-4 border-t border-gray-100 pt-5 lg:flex-col lg:items-end lg:justify-between lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <div className="lg:text-right">
            <p className="text-xs font-medium text-gray-400">
              Total Amount
            </p>

            <p className="mt-1 text-2xl font-bold tracking-tight text-gray-900">
              {formatPrice(booking?.price)}
            </p>

            <p className="mt-1 text-xs text-gray-400">
              Booking total
            </p>
          </div>

          {bookingId ? (
            <Link
              to={`/dashboard/bookings/${encodeURIComponent(String(bookingId))}`}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-green-100 bg-green-50 px-4 text-sm font-semibold text-green-700 transition hover:border-green-600 hover:bg-green-600 hover:text-white focus:outline-none focus:ring-4 focus:ring-green-500/15"
            >
              View Details
              <ChevronRight size={16} />
            </Link>
          ) : (
            <span className="text-xs text-gray-400">
              Details unavailable
            </span>
          )}
        </div>
      </div>
    </article>
  );
};

const LoadingState = () => (
  <div
    className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-20"
    role="status"
    aria-live="polite"
  >
    <Loader2 size={30} className="animate-spin text-green-600" />
    <p className="mt-4 text-sm font-medium text-gray-500">
      Loading your bookings...
    </p>
  </div>
);

const EmptyState = ({ hasBookings, search, onClear }) => (
  <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center">
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 text-green-600">
      <CalendarDays size={29} />
    </div>

    <h2 className="mt-5 text-lg font-bold text-gray-900">
      {hasBookings ? "No matching bookings" : "No bookings yet"}
    </h2>

    <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
      {hasBookings
        ? "We couldn't find any bookings matching your current filters."
        : "You haven't made a turf reservation yet. Find your favorite turf and book your next game."}
    </p>

    {hasBookings ? (
      <button
        type="button"
        onClick={onClear}
        className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl border border-gray-200 px-4 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
      >
        <X size={15} />
        Clear Filters
      </button>
    ) : (
      <Link
        to="/turfs"
        className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-green-600 px-5 text-sm font-semibold text-white transition hover:bg-green-700"
      >
        <Globe size={16} />
        Explore Turfs
      </Link>
    )}
  </div>
);

const MyBookings = () => {
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState("All");
  const [search, setSearch] = useState("");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const fetchMyBookings = async () => {
      if (!currentUser?.email) {
        setBookings([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const email = encodeURIComponent(
          currentUser.email.trim().toLowerCase()
        );

        const response = await fetch(
          `${API_URL}/bookings/user/${email}`,
          {
            signal: controller.signal,
            headers: { Accept: "application/json" },
          }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data?.message || "Failed to fetch bookings."
          );
        }

        const bookingList = Array.isArray(data?.bookings)
          ? data.bookings
          : Array.isArray(data)
            ? data
            : [];

        setBookings(bookingList);
      } catch (error) {
        if (error.name === "AbortError") return;

        console.error("My bookings error:", error);

        setError(error.message || "Failed to load bookings.");
        setBookings([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchMyBookings();

    return () => controller.abort();
  }, [currentUser?.email]);

  // Booking statistics
  const stats = useMemo(() => {
    const result = {
      All: bookings.length,
      Upcoming: 0,
      Completed: 0,
      Cancelled: 0,
    };

    bookings.forEach((booking) => {
      result[getDisplayStatus(booking)]++;
    });

    return result;
  }, [bookings]);

  // Search and filtering
  const filteredBookings = useMemo(() => {
    const searchText = search.trim().toLowerCase();

    return bookings.filter((booking) => {
      const status = getDisplayStatus(booking);

      if (activeTab !== "All" && status !== activeTab) {
        return false;
      }

      if (!searchText) return true;

      const searchableText = [
        booking?.bookingId,
        booking?._id,
        booking?.turfName,
        booking?.turfLocation,
        booking?.location,
        booking?.ownerEmail,
        booking?.status,
        booking?.paymentStatus,
        booking?.date,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchableText.includes(searchText);
    });
  }, [bookings, activeTab, search]);

  const clearFilters = () => {
    setActiveTab("All");
    setSearch("");
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">

      {/* Page Header */}
      <header className="mb-8">
        <Link
          to="/turfs"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-green-600"
        >
          <ArrowLeft size={17} />
          Back to Home
        </Link>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-green-600">
              Account Dashboard
            </p>

            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
              My Bookings
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Track and manage all your turf reservations in one place.
            </p>
          </div>

          <Link
            to="/turfs"
            className="inline-flex h-10 w-fit items-center gap-2 rounded-xl bg-green-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
          >
            <Globe size={16} />
            Find a Turf
          </Link>
        </div>
      </header>

      {/* Statistics */}
      <section
        aria-label="Booking statistics"
        className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        <StatCard
          icon={Receipt}
          label="Total Bookings"
          value={stats.All}
          description="All reservations"
        />

        <StatCard
          icon={CalendarCheck}
          label="Upcoming"
          value={stats.Upcoming}
          description="Scheduled games"
        />

        <StatCard
          icon={CheckCircle2}
          label="Completed"
          value={stats.Completed}
          description="Finished games"
        />

        <StatCard
          icon={XCircle}
          label="Cancelled"
          value={stats.Cancelled}
          description="Cancelled bookings"
        />
      </section>

      {/* Filters */}
      <section className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          {/* Tabs */}
          <div
            className="flex gap-1.5 overflow-x-auto pb-1 lg:pb-0"
            role="group"
            aria-label="Filter bookings by status"
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab;

              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  aria-pressed={isActive}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-4 focus:ring-green-500/10 ${
                    isActive
                      ? "bg-green-600 text-white shadow-sm"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  {tab}

                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {stats[tab]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative w-full lg:max-w-xs">
            <Search
              size={17}
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search turf or booking ID..."
              aria-label="Search bookings"
              className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-10 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-green-500 focus:bg-white focus:ring-4 focus:ring-green-500/10"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 transition hover:text-gray-700"
              >
                <X size={15} />
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
          <p className="text-xs text-gray-400">
            Showing{" "}
            <span className="font-semibold text-gray-700">
              {filteredBookings.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-700">
              {bookings.length}
            </span>{" "}
            bookings
          </p>

          {(search || activeTab !== "All") && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-600 transition hover:text-green-700"
            >
              <RefreshCw size={12} />
              Reset filters
            </button>
          )}
        </div>
      </section>

      {/* Error State */}
      {!loading && error && (
        <div
          className="rounded-2xl border border-red-100 bg-red-50 p-6 text-center"
          role="alert"
        >
          <XCircle size={28} className="mx-auto text-red-500" />

          <h2 className="mt-3 font-semibold text-red-700">
            Unable to load bookings
          </h2>

          <p className="mt-2 text-sm text-red-600">{error}</p>

          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            <RefreshCw size={15} />
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && <LoadingState />}

      {/* Booking List */}
      {!loading && !error && (
        <section aria-label="Your bookings">
          {filteredBookings.length > 0 ? (
            <>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold text-gray-800">
                  Reservation History
                </h2>

                <span className="text-xs text-gray-400">
                  {filteredBookings.length} results
                </span>
              </div>

              <div className="space-y-4">
                {filteredBookings.map((booking) => (
                  <BookingCard
                    key={
                      booking?._id ||
                      booking?.bookingId ||
                      booking?.id
                    }
                    booking={booking}
                  />
                ))}
              </div>
            </>
          ) : (
            <EmptyState
              hasBookings={bookings.length > 0}
              search={search}
              onClear={clearFilters}
            />
          )}
        </section>
      )}
    </main>
  );
};

export default MyBookings;
