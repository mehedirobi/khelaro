import { useContext, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  Clock3,
  Wallet,
  Trophy,
  ArrowRight,
  ArrowUpRight,
  MapPin,
  CheckCircle2,
  RefreshCw,
  CircleAlert,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";

import { AuthContext } from "../contexts/AuthProvider";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/+$/, "");

const STATUS_STYLES = {
  confirmed: "bg-green-50 text-green-700 ring-green-600/10",
  pending: "bg-amber-50 text-amber-700 ring-amber-600/10",
  cancelled: "bg-red-50 text-red-700 ring-red-600/10",
  completed: "bg-blue-50 text-blue-700 ring-blue-600/10",
};

const formatPrice = (price) =>
  `৳${(Number(price) || 0).toLocaleString("en-BD")}`;

const formatDate = (date) => {
  if (!date) return "Date unavailable";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Date unavailable";
  }

  return parsedDate.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatStatus = (status) => {
  if (!status) return "Unknown";

  return String(status)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const DashboardOverview = () => {
  const { currentUser } = useContext(AuthContext);

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const userEmail = currentUser?.email?.trim().toLowerCase() || "";

  // Fetch user bookings
  useEffect(() => {
    const controller = new AbortController();

    const fetchBookings = async () => {
      if (!userEmail) {
        setBookings([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_URL}/bookings/user/${encodeURIComponent(userEmail)}`,
          { signal: controller.signal }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            data?.message || "Unable to load your bookings."
          );
        }

        const userBookings = Array.isArray(data?.bookings)
          ? data.bookings
          : Array.isArray(data)
            ? data
            : [];

        if (!controller.signal.aborted) {
          setBookings(userBookings);
        }
      } catch (err) {
        if (err.name === "AbortError") return;

        console.error("Dashboard booking error:", err);

        setError(err.message || "Something went wrong.");
        setBookings([]);
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchBookings();

    return () => controller.abort();
  }, [userEmail]);

  // Dashboard statistics
  const stats = useMemo(() => {
    const upcoming = bookings.filter((booking) =>
      ["pending", "confirmed"].includes(
        String(booking.status).toLowerCase()
      )
    );

    const completed = bookings.filter(
      (booking) =>
        String(booking.status).toLowerCase() === "completed"
    );

    const totalSpent = bookings.reduce((total, booking) => {
      if (
        String(booking.paymentStatus).toLowerCase() !== "paid"
      ) {
        return total;
      }

      const price = Number(booking.price);

      return total + (Number.isFinite(price) ? price : 0);
    }, 0);

    return [
      {
        title: "Total Bookings",
        value: bookings.length,
        description: "All your reservations",
        icon: CalendarDays,
        iconStyle: "bg-green-50 text-green-600",
      },
      {
        title: "Upcoming Games",
        value: upcoming.length,
        description: "Pending & confirmed",
        icon: Clock3,
        iconStyle: "bg-blue-50 text-blue-600",
      },
      {
        title: "Completed Games",
        value: completed.length,
        description: "Successfully played",
        icon: Trophy,
        iconStyle: "bg-amber-50 text-amber-600",
      },
      {
        title: "Total Spent",
        value: formatPrice(totalSpent),
        description: "Successfully paid",
        icon: Wallet,
        iconStyle: "bg-purple-50 text-purple-600",
      },
    ];
  }, [bookings]);

  // Recent bookings
  const recentBookings = useMemo(() => {
    return [...bookings]
      .sort((a, b) => {
        const dateA = new Date(a.createdAt || a.date).getTime();
        const dateB = new Date(b.createdAt || b.date).getTime();

        return (
          (Number.isFinite(dateB) ? dateB : 0) -
          (Number.isFinite(dateA) ? dateA : 0)
        );
      })
      .slice(0, 4);
  }, [bookings]);

  // User information
  const userName =
    currentUser?.displayName?.trim() ||
    currentUser?.name?.trim() ||
    currentUser?.email?.split("@")[0] ||
    "there";

  return (
    <main className="mx-auto w-full max-w-[1500px]">
      {/* Page Header */}
      <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-green-700">
              User Dashboard
            </p>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Welcome back, {userName}
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Manage your bookings and keep track of your games.
          </p>
        </div>

        <Link
          to="/"
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-green-600 px-5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-green-700 hover:shadow-lg hover:shadow-green-600/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 sm:self-center"
        >
          <CalendarDays size={17} aria-hidden="true" />
          Back To Home
          <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </header>

      {/* Statistics */}
      <section
        aria-label="Booking statistics"
        className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <article
              key={stat.title}
              className="group rounded-2xl border border-gray-200/80 bg-white p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md hover:shadow-gray-200/50"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-gray-500">
                  {stat.title}
                </p>

                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.iconStyle}`}
                >
                  <Icon size={20} strokeWidth={2} aria-hidden="true" />
                </div>
              </div>

              <h2 className="mt-5 truncate text-[27px] font-bold tracking-tight text-gray-900">
                {loading ? "—" : stat.value}
              </h2>

              <p className="mt-1.5 text-xs text-gray-400">
                {stat.description}
              </p>
            </article>
          );
        })}
      </section>

      {/* Dashboard Content */}
      <section className="mt-8 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_310px]">
        {/* Recent Bookings */}
        <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200/80 bg-white">
          {/* Section Header */}
          <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-5 sm:px-6">
            <div className="min-w-0">
              <h2 className="text-base font-bold text-gray-900">
                Recent Bookings
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                A quick look at your latest reservations.
              </p>
            </div>

            <Link
              to="/dashboard/bookings"
              className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-green-700 transition-colors hover:text-green-800 sm:text-sm"
            >
              View all
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex min-h-[280px] flex-col items-center justify-center px-5 py-12">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green-50">
                <RefreshCw
                  size={20}
                  className="animate-spin text-green-600"
                  aria-hidden="true"
                />
              </div>

              <p className="mt-4 text-sm font-medium text-gray-700">
                Loading bookings
              </p>

              <p className="mt-1 text-xs text-gray-400">
                Please wait while we fetch your reservations.
              </p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div
              role="alert"
              className="flex min-h-[280px] flex-col items-center justify-center px-5 py-12 text-center"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-50 text-red-600">
                <CircleAlert size={21} aria-hidden="true" />
              </div>

              <h3 className="mt-4 text-sm font-semibold text-gray-900">
                Unable to load bookings
              </h3>

              <p className="mt-2 max-w-sm text-xs leading-5 text-gray-500">
                {error}
              </p>

              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-5 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-gray-800"
              >
                <RefreshCw size={14} aria-hidden="true" />
                Refresh page
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && recentBookings.length === 0 && (
            <div className="flex min-h-[280px] flex-col items-center justify-center px-5 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                <CalendarDays size={25} aria-hidden="true" />
              </div>

              <h3 className="mt-4 text-base font-bold text-gray-900">
                No bookings yet
              </h3>

              <p className="mt-2 max-w-xs text-sm leading-6 text-gray-500">
                Your upcoming games will appear here once you
                make your first reservation.
              </p>

              <Link
                to="/turfs"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
              >
                Explore Turfs
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          )}

          {/* Booking List */}
          {!loading && !error && recentBookings.length > 0 && (
            <div className="divide-y divide-gray-100">
              {recentBookings.map((booking, index) => {
                const bookingId = booking._id || booking.id || index;

                const status = String(
                  booking.status || ""
                ).toLowerCase();

                const paymentStatus = String(
                  booking.paymentStatus || ""
                ).toLowerCase();

                const price = Number(booking.price);

                return (
                  <article
                    key={bookingId}
                    className="px-5 py-5 transition-colors hover:bg-gray-50/70 sm:px-6"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      {/* Booking Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2.5">
                          <h3 className="truncate text-sm font-bold text-gray-900 sm:text-[15px]">
                            {booking.turfName ||
                              booking.name ||
                              "Turf Booking"}
                          </h3>

                          <span
                            className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ring-inset ${
                              STATUS_STYLES[status] ||
                              "bg-gray-50 text-gray-600 ring-gray-500/10"
                            }`}
                          >
                            {formatStatus(status)}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-500">
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin
                              size={14}
                              className="shrink-0 text-gray-400"
                              aria-hidden="true"
                            />
                            <span className="max-w-[180px] truncate">
                              {booking.turfLocation ||
                                booking.location ||
                                "Location unavailable"}
                            </span>
                          </span>

                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays
                              size={14}
                              className="shrink-0 text-gray-400"
                              aria-hidden="true"
                            />
                            {formatDate(booking.date)}
                          </span>

                          <span className="inline-flex items-center gap-1.5">
                            <Clock3
                              size={14}
                              className="shrink-0 text-gray-400"
                              aria-hidden="true"
                            />
                            {booking.startTime || "--:--"} –{" "}
                            {booking.endTime || "--:--"}
                          </span>
                        </div>

                        <div className="mt-3">
                          <span
                            className={`inline-flex items-center gap-1.5 text-[11px] font-medium ${
                              paymentStatus === "paid"
                                ? "text-green-700"
                                : "text-gray-500"
                            }`}
                          >
                            <CheckCircle2
                              size={13}
                              aria-hidden="true"
                            />
                            {paymentStatus === "paid"
                              ? "Payment completed"
                              : "Payment pending"}
                          </span>
                        </div>
                      </div>

                      {/* Price and Booking ID */}
                      <div className="flex shrink-0 items-center justify-between border-t border-gray-100 pt-3 sm:block sm:border-0 sm:pt-0 sm:text-right">
                        <div>
                          <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                            Amount
                          </p>

                          <p className="mt-1 text-base font-bold text-gray-900">
                            {formatPrice(price)}
                          </p>
                        </div>

                        <p className="text-[10px] font-medium text-gray-400 sm:mt-2">
                          {booking._id || booking.id
                            ? `#${String(
                                booking._id || booking.id
                              )
                                .slice(-6)
                                .toUpperCase()}`
                            : "Booking"}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* Right Sidebar */}
        <aside className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
          {/* CTA Card */}
          <section className="relative overflow-hidden rounded-2xl bg-gray-900 p-6 text-white">
            <div
              aria-hidden="true"
              className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-green-500/10 blur-2xl"
            />

            <div className="relative">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-500/15 text-green-400">
                <Trophy size={22} aria-hidden="true" />
              </div>

              <p className="mt-5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-green-400">
                <Sparkles size={13} aria-hidden="true" />
                Make your next move
              </p>

              <h2 className="mt-2 text-xl font-bold tracking-tight">
                Ready for your next game?
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-400">
                Discover quality sports venues and book your
                preferred playing slot.
              </p>

              <Link
                to="/turfs"
                className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-green-500"
              >
                Explore Turfs
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </section>

          {/* Booking Tip */}
          <section className="rounded-2xl border border-gray-200/80 bg-white p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Clock3 size={20} aria-hidden="true" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  Booking Tip
                </h3>

                <p className="mt-1 text-[11px] text-gray-400">
                  Play smarter, plan ahead.
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-gray-500">
              Weekend and evening slots can fill up quickly.
              Book early to secure your preferred turf and
              playing time.
            </p>

            <Link
              to="/dashboard/bookings"
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 transition hover:text-green-800"
            >
              Manage bookings
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </section>
        </aside>
      </section>
    </main>
  );
};

export default DashboardOverview;