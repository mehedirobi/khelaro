
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  MapPin,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  CalendarDays,
  Search,
  RefreshCw,
  SlidersHorizontal,
  Building2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import { AuthContext } from "../contexts/AuthProvider";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/+$/, "");

const STATUS_STYLES = {
  approved:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  active:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  pending:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  rejected:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300",
};

const formatPrice = (price) => {
  const amount = Number(price);

  if (!Number.isFinite(amount) || amount < 0) {
    return "N/A";
  }

  return `৳${amount.toLocaleString("en-BD")}`;
};

const getStatusLabel = (status) => {
  if (!status) return "Unknown";

  return String(status)
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const getStatusStyle = (status) =>
  STATUS_STYLES[String(status || "").toLowerCase()] ||
  "border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300";

const MyTurfs = () => {
  const { currentUser } = useContext(AuthContext);

  const [turfs, setTurfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchMyTurfs = useCallback(async (signal) => {
    if (!currentUser?.email) {
      setTurfs([]);
      setLoadError("");
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError("");

    try {
      const response = await fetch(
        `${API_URL}/owner/turfs/${encodeURIComponent(
          currentUser.email
        )}`,
        { signal }
      );

      if (!response.ok) {
        throw new Error("Unable to load your turf listings.");
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error("The server returned an invalid turf list.");
      }

      setTurfs(data);
    } catch (error) {
      if (error.name === "AbortError") return;

      console.error("Fetch my turfs error:", error);
      setLoadError(error.message || "Something went wrong.");
    } finally {
      if (!signal?.aborted) {
        setLoading(false);
      }
    }
  }, [currentUser?.email]);

  useEffect(() => {
    const controller = new AbortController();

    fetchMyTurfs(controller.signal);

    return () => controller.abort();
  }, [fetchMyTurfs]);

  const filteredTurfs = useMemo(() => {
    const query = search.trim().toLowerCase();

    return turfs.filter((turf) => {
      const matchesSearch = [
        turf.name,
        turf.location,
        turf.surface,
      ].some((value) =>
        String(value || "").toLowerCase().includes(query)
      );

      const status = String(turf.status || "").toLowerCase();

      const matchesStatus =
        statusFilter === "all" || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [turfs, search, statusFilter]);

  const statusCounts = useMemo(() => {
    return turfs.reduce(
      (counts, turf) => {
        const status = String(turf.status || "").toLowerCase();

        counts.all += 1;

        if (status === "pending") counts.pending += 1;
        if (status === "approved" || status === "active") {
          counts.approved += 1;
        }
        if (status === "rejected") counts.rejected += 1;

        return counts;
      },
      { all: 0, pending: 0, approved: 0, rejected: 0 }
    );
  }, [turfs]);

  const handleDelete = async (id) => {
    const turf = turfs.find((item) => item._id === id);

    if (!turf || deleteLoading !== null) return;

    const confirmed = window.confirm(
      `Delete "${turf.name || "this turf"}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeleteLoading(id);

    try {
      const response = await fetch(`${API_URL}/turfs/${id}`, {
        method: "DELETE",
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Failed to delete turf.");
      }

      setTurfs((previous) =>
        previous.filter((item) => item._id !== id)
      );

      toast.success("Turf deleted successfully.");
    } catch (error) {
      console.error("Delete turf error:", error);
      toast.error(error.message || "Failed to delete turf.");
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleRefresh = () => {
    const controller = new AbortController();
    fetchMyTurfs(controller.signal);
  };

  if (loading && turfs.length === 0) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          <Loader2
            size={28}
            className="animate-spin text-emerald-600"
            aria-hidden="true"
          />
          Loading your turf listings...
        </div>
      </div>
    );
  }

  if (loadError && turfs.length === 0) {
    return (
      <div className="mx-auto flex min-h-[360px] max-w-lg flex-col items-center justify-center px-4 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-red-50 text-red-600 dark:bg-red-950">
          <AlertCircle size={26} />
        </div>

        <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
          Couldn't load your turfs
        </h2>

        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {loadError}
        </p>

        <button
          type="button"
          onClick={handleRefresh}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          <RefreshCw size={16} />
          Try again
        </button>
      </div>
    );
  }

  return (
    <main className="min-w-0 space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-600">
            Venue Management
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            My Turfs
          </h1>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Manage your venues, review their status, and access bookings.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            aria-label="Refresh turf listings"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>

          <Link
            to="/owner-dashboard/add-turf"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            <Plus size={18} />
            Add New Turf
          </Link>
        </div>
      </section>

      {/* Summary */}
      <section
        aria-label="Turf listing summary"
        className="grid grid-cols-2 gap-3 lg:grid-cols-4"
      >
        {[
          {
            label: "All Turfs",
            value: statusCounts.all,
            filter: "all",
          },
          {
            label: "Pending",
            value: statusCounts.pending,
            filter: "pending",
          },
          {
            label: "Approved / Active",
            value: statusCounts.approved,
            filter: "approved",
          },
          {
            label: "Rejected",
            value: statusCounts.rejected,
            filter: "rejected",
          },
        ].map((item) => (
          <button
            type="button"
            key={item.label}
            onClick={() =>
              setStatusFilter(
                item.filter === "approved"
                  ? "approved"
                  : item.filter
              )
            }
            className={`rounded-2xl border p-4 text-left transition sm:p-5 ${
              statusFilter === item.filter
                ? "border-emerald-300 bg-emerald-50/70 dark:border-emerald-800 dark:bg-emerald-950/40"
                : "border-gray-200 bg-white hover:border-gray-300 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700"
            }`}
          >
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {item.label}
            </p>
            <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
              {item.value}
            </p>
          </button>
        ))}
      </section>

      {/* Search and Filter */}
      <section className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900 sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search
              size={18}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by turf name, location, or surface..."
              aria-label="Search turf listings"
              className="min-h-11 w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:ring-emerald-950"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-white"
              >
                <X size={17} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal
              size={17}
              className="shrink-0 text-gray-400"
            />

            <label htmlFor="turf-status" className="sr-only">
              Filter by status
            </label>

            <select
              id="turf-status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="min-h-11 min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200 sm:min-w-44"
            >
              <option value="all">All statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="active">Active</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
          <span>
            Showing {filteredTurfs.length} of {turfs.length} turfs
          </span>

          {(search || statusFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
              className="font-medium text-emerald-600 hover:text-emerald-700"
            >
              Clear filters
            </button>
          )}
        </div>
      </section>

      {/* Recoverable refresh error */}
      {loadError && turfs.length > 0 && (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300 sm:flex-row sm:items-center sm:justify-between"
        >
          <span>{loadError} Showing the previously loaded listings.</span>

          <button
            type="button"
            onClick={handleRefresh}
            className="shrink-0 font-semibold underline underline-offset-2"
          >
            Retry
          </button>
        </div>
      )}

      {/* Turf Grid */}
      {turfs.length === 0 ? (
        <section className="rounded-2xl border border-gray-200 bg-white px-5 py-14 text-center dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
            <Building2 size={27} />
          </div>

          <h2 className="mt-5 text-lg font-semibold text-gray-900 dark:text-white">
            No turfs yet
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500 dark:text-gray-400">
            Add your first turf to start managing your venue and its bookings.
          </p>

          <Link
            to="/owner-dashboard/add-turf"
            className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            <Plus size={17} />
            Add Your First Turf
          </Link>
        </section>
      ) : filteredTurfs.length === 0 ? (
        <section className="rounded-2xl border border-gray-200 bg-white px-5 py-12 text-center dark:border-gray-800 dark:bg-gray-900">
          <Search
            size={28}
            className="mx-auto text-gray-400"
          />

          <h2 className="mt-4 font-semibold text-gray-900 dark:text-white">
            No matching turfs
          </h2>

          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Try another search term or change your status filter.
          </p>

          <button
            type="button"
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
            }}
            className="mt-4 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
          >
            Reset filters
          </button>
        </section>
      ) : (
        <section
          aria-label="Your turf listings"
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 2xl:grid-cols-3"
        >
          {filteredTurfs.map((turf) => (
            <article
              key={turf._id}
              className="group min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:hover:border-emerald-900"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden bg-gray-100 dark:bg-gray-800">
                {turf.image ? (
                  <img
                    src={turf.image}
                    alt={turf.name || "Turf venue"}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400">
                    <MapPin size={38} />
                  </div>
                )}

                <span
                  className={`absolute right-3 top-3 rounded-full border px-3 py-1 text-xs font-semibold ${getStatusStyle(turf.status)}`}
                >
                  {getStatusLabel(turf.status)}
                </span>
              </div>

              {/* Details */}
              <div className="p-5">
                <h2
                  className="truncate text-lg font-bold text-gray-900 dark:text-white"
                  title={turf.name || ""}
                >
                  {turf.name || "Untitled Turf"}
                </h2>

                <div className="mt-2 flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <MapPin
                    size={16}
                    className="mt-0.5 shrink-0 text-emerald-600"
                  />

                  <span className="line-clamp-2">
                    {turf.location || "Location not available"}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4 dark:border-gray-800">
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Price per hour
                    </p>

                    <p className="mt-1 truncate text-lg font-bold text-gray-900 dark:text-white">
                      {formatPrice(turf.price)}
                    </p>
                  </div>

                  <div className="min-w-0 text-right">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Surface
                    </p>

                    <p className="mt-1 truncate text-sm font-medium text-gray-800 dark:text-gray-200">
                      {turf.surface || "Not specified"}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <Link
                    to={`/owner-dashboard/turfs/edit/${turf._id}`}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-emerald-950"
                  >
                    <Pencil size={16} />
                    Edit
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleDelete(turf._id)}
                    disabled={deleteLoading !== null}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
                  >
                    {deleteLoading === turf._id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}

                    {deleteLoading === turf._id ? "Deleting" : "Delete"}
                  </button>
                </div>

                <Link
                  to={`/owner-dashboard/bookings?turfId=${encodeURIComponent(turf._id)}`}
                  className="mt-2 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:bg-gray-800 dark:hover:bg-gray-700"
                >
                  <CalendarDays size={16} />
                  View Bookings
                </Link>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
};

export default MyTurfs;
