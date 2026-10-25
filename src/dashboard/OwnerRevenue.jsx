
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Wallet,
  TrendingUp,
  CalendarDays,
  Loader2,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Search,
  AlertCircle,
  ArrowUpRight,
  Receipt,
} from "lucide-react";
import toast from "react-hot-toast";

import { AuthContext } from "../contexts/AuthProvider";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/+$/, "");

const formatCurrency = (amount) =>
  `৳${Number(amount || 0).toLocaleString("en-BD", {
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return "Date unavailable";

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

const getAmount = (booking) =>
  Number(booking.price ?? booking.totalPrice ?? booking.amount ?? 0);

const getPaymentStatus = (booking) =>
  String(booking.paymentStatus || "unpaid").toLowerCase();

const getStatusStyle = (status) => {
  const styles = {
    paid: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    unpaid: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    pending: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    failed: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
    refunded: "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300",
    cancelled: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300",
    confirmed: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
  };

  return (
    styles[status] ||
    "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
  );
};

const readError = async (response) => {
  try {
    const data = await response.json();
    return data.message || data.error || "Failed to load revenue data.";
  } catch {
    return "Failed to load revenue data.";
  }
};

const OwnerRevenue = () => {
  const { currentUser } = useContext(AuthContext);

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");

  const fetchRevenue = useCallback(async (signal) => {
    if (!currentUser?.email) {
      setBookings([]);
      setError("Please sign in to view your revenue.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const turfResponse = await fetch(
        `${API_URL}/owner/turfs/${encodeURIComponent(currentUser.email)}`,
        { signal }
      );

      if (!turfResponse.ok) {
        throw new Error(await readError(turfResponse));
      }

      const turfs = await turfResponse.json();

      if (!Array.isArray(turfs)) {
        throw new Error("The server returned an invalid turf list.");
      }

      if (turfs.length === 0) {
        setBookings([]);
        return;
      }

      const results = await Promise.allSettled(
        turfs.map(async (turf) => {
          const response = await fetch(
            `${API_URL}/bookings/turf/${encodeURIComponent(turf._id)}`,
            { signal }
          );

          if (!response.ok) {
            throw new Error(
              `Could not load bookings for ${turf.name || "a turf"}.`
            );
          }

          const data = await response.json();

          if (!Array.isArray(data)) {
            throw new Error("Invalid booking data received.");
          }

          return data.map((booking) => ({
            ...booking,
            turfName: booking.turfName || turf.name || "Turf Booking",
            turfId: booking.turfId || turf._id,
          }));
        })
      );

      const allBookings = [];
      let failedCount = 0;

      for (const result of results) {
        if (result.status === "fulfilled") {
          allBookings.push(...result.value);
        } else if (result.reason?.name !== "AbortError") {
          failedCount += 1;
          console.error("Revenue booking request failed:", result.reason);
        }
      }

      const uniqueBookings = [
        ...new Map(
          allBookings.map((booking, index) => [
            booking._id || `${booking.turfId}-${index}`,
            booking,
          ])
        ).values(),
      ];

      uniqueBookings.sort(
        (a, b) =>
          new Date(b.createdAt || b.date || 0).getTime() -
          new Date(a.createdAt || a.date || 0).getTime()
      );

      setBookings(uniqueBookings);

      if (failedCount > 0) {
        toast.error(
          `${failedCount} turf booking request(s) failed to load. Some figures may be incomplete.`
        );
      }
    } catch (err) {
      if (err.name === "AbortError") return;

      console.error("Owner revenue error:", err);
      setError(err.message || "Failed to load revenue.");
      toast.error(err.message || "Failed to load revenue.");
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [currentUser?.email]);

  useEffect(() => {
    const controller = new AbortController();

    fetchRevenue(controller.signal);

    return () => controller.abort();
  }, [fetchRevenue, refreshKey]);

  const stats = useMemo(() => {
    const paidBookings = bookings.filter(
      (booking) =>
        getPaymentStatus(booking) === "paid" &&
        booking.status !== "cancelled"
    );

    const confirmedBookings = bookings.filter(
      (booking) => booking.status === "confirmed"
    );

    const cancelledBookings = bookings.filter(
      (booking) => booking.status === "cancelled"
    );

    const unpaidConfirmedBookings = confirmedBookings.filter(
      (booking) => getPaymentStatus(booking) !== "paid"
    );

    const totalPaidRevenue = paidBookings.reduce(
      (total, booking) => total + getAmount(booking),
      0
    );

    const confirmedBookingValue = confirmedBookings.reduce(
      (total, booking) => total + getAmount(booking),
      0
    );

    const unpaidConfirmedValue = unpaidConfirmedBookings.reduce(
      (total, booking) => total + getAmount(booking),
      0
    );

    return {
      totalPaidRevenue,
      paidCount: paidBookings.length,
      confirmedCount: confirmedBookings.length,
      confirmedBookingValue,
      unpaidConfirmedValue,
      cancelledCount: cancelledBookings.length,
      totalBookings: bookings.length,
    };
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    const query = search.trim().toLowerCase();

    return bookings.filter((booking) => {
      const paymentStatus = getPaymentStatus(booking);

      const matchesPayment =
        paymentFilter === "all" || paymentStatus === paymentFilter;

      const matchesSearch =
        !query ||
        [
          booking.turfName,
          booking.userName,
          booking.userEmail,
          booking._id,
          booking.date,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query);

      return matchesPayment && matchesSearch;
    });
  }, [bookings, search, paymentFilter]);

  const statCards = [
    {
      title: "Total Paid Revenue",
      value: formatCurrency(stats.totalPaidRevenue),
      description: "Recorded paid bookings",
      icon: Wallet,
      iconStyle: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
    },
    {
      title: "Paid Bookings",
      value: stats.paidCount,
      description: "Bookings marked as paid",
      icon: CheckCircle2,
      iconStyle: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
    },
    {
      title: "Confirmed Bookings",
      value: stats.confirmedCount,
      description: "Bookings currently confirmed",
      icon: CalendarDays,
      iconStyle: "bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400",
    },
    {
      title: "Unpaid Confirmed Value",
      value: formatCurrency(stats.unpaidConfirmedValue),
      description: "Confirmed bookings not marked paid",
      icon: Clock3,
      iconStyle: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
    },
  ];

  if (loading && bookings.length === 0) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          <Loader2 size={20} className="animate-spin text-emerald-600" />
          Loading revenue data...
        </div>
      </div>
    );
  }

  if (error && bookings.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
        <AlertCircle className="mx-auto text-red-500" size={32} />
        <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
          Unable to load revenue
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {error}
        </p>
        <button
          type="button"
          onClick={() => setRefreshKey((value) => value + 1)}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          <RefreshCw size={16} />
          Try again
        </button>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            Revenue
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Track paid bookings and outstanding confirmed booking value.
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

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p>{error} Displayed figures may be incomplete.</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ title, value, description, icon: Icon, iconStyle }) => (
          <article
            key={title}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {title}
                </p>
                <p className="mt-3 break-words text-2xl font-bold text-gray-900 dark:text-white">
                  {value}
                </p>
              </div>
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconStyle}`}>
                <Icon size={21} />
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
              {description}
            </p>
          </article>
        ))}
      </div>

      {/* Revenue summary */}
      <article className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <TrendingUp size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Revenue Summary
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Calculated from the booking records returned by the backend.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/70">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Total Paid Revenue
            </p>
            <p className="mt-2 text-xl font-bold text-emerald-700 dark:text-emerald-400">
              {formatCurrency(stats.totalPaidRevenue)}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Excludes bookings marked cancelled.
            </p>
          </div>

          <div className="rounded-xl bg-gray-50 p-4 dark:bg-gray-800/70">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Confirmed Booking Value
            </p>
            <p className="mt-2 text-xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(stats.confirmedBookingValue)}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Total value of confirmed bookings, whether paid or unpaid.
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-gray-100 pt-4 text-sm dark:border-gray-800">
          <p className="text-gray-500 dark:text-gray-400">
            Cancelled bookings:{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {stats.cancelledCount}
            </span>
          </p>
          <p className="text-gray-500 dark:text-gray-400">
            Total bookings:{" "}
            <span className="font-semibold text-gray-900 dark:text-white">
              {stats.totalBookings}
            </span>
          </p>
        </div>
      </article>

      {/* Booking payment history */}
      <article className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">
              <Receipt size={20} />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900 dark:text-white">
                Booking Payment History
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Payment status for your turf bookings.
              </p>
            </div>
          </div>

          <span className="text-sm text-gray-500 dark:text-gray-400">
            {filteredBookings.length} record(s)
          </span>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search turf or customer..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm text-gray-900 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          <select
            value={paymentFilter}
            onChange={(event) => setPaymentFilter(event.target.value)}
            aria-label="Filter by payment status"
            className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:min-w-40"
          >
            <option value="all">All payments</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        {filteredBookings.length === 0 ? (
          <div className="py-10 text-center">
            <Receipt className="mx-auto text-gray-300 dark:text-gray-600" size={30} />
            <p className="mt-3 font-medium text-gray-700 dark:text-gray-200">
              No payment records found
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Try changing the search term or payment filter.
            </p>
          </div>
        ) : (
          <div className="mt-5 divide-y divide-gray-100 dark:divide-gray-800">
            {filteredBookings.map((booking, index) => {
              const paymentStatus = getPaymentStatus(booking);

              return (
                <div
                  key={booking._id || `${booking.turfId}-${index}`}
                  className="flex flex-col justify-between gap-3 py-4 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0">
                    <p className="break-words font-medium text-gray-900 dark:text-white">
                      {booking.turfName || "Turf Booking"}
                    </p>
                    <p className="mt-1 break-all text-sm text-gray-500 dark:text-gray-400">
                      {booking.userName || booking.userEmail || "Customer"}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {formatDate(booking.date || booking.createdAt)}
                      {booking.startTime ? ` · ${booking.startTime}` : ""}
                    </p>
                  </div>

                  <div className="flex items-center justify-between gap-4 sm:justify-end">
                    <div className="sm:text-right">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(getAmount(booking))}
                      </p>
                      <span
                        className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${getStatusStyle(paymentStatus)}`}
                      >
                        {paymentStatus}
                      </span>
                    </div>
                    <ArrowUpRight
                      size={17}
                      className="shrink-0 text-gray-300 dark:text-gray-600"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </article>
    </section>
  );
};

export default OwnerRevenue;
