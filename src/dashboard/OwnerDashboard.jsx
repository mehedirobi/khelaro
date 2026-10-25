
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  ChartNoAxesCombined,
  CircleDollarSign,
  Clock3,
  MapPin,
  Plus,
  Trophy,
} from "lucide-react";

const stats = [
  {
    label: "Total Turfs",
    description: "Manage your venues",
    icon: MapPin,
    href: "/owner-dashboard/turfs",
  },
  {
    label: "Total Bookings",
    description: "View all reservations",
    icon: CalendarDays,
    href: "/owner-dashboard/bookings",
  },
  {
    label: "Pending Requests",
    description: "Bookings awaiting action",
    icon: Clock3,
    href: "/owner-dashboard/bookings",
  },
  {
    label: "Total Earnings",
    description: "Track your revenue",
    icon: CircleDollarSign,
    href: "/owner-dashboard/earnings",
  },
];

const quickActions = [
  {
    title: "Manage Turfs",
    description: "Update venue details and availability.",
    icon: MapPin,
    href: "/owner-dashboard/turfs",
  },
  {
    title: "Manage Bookings",
    description: "Review and respond to booking requests.",
    icon: CalendarDays,
    href: "/owner-dashboard/bookings",
  },
  {
    title: "View Earnings",
    description: "Review your booking revenue.",
    icon: ChartNoAxesCombined,
    href: "/owner-dashboard/earnings",
  },
];

const OwnerDashboard = () => {
  return (
    <main className="min-w-0 space-y-8 p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-emerald-600">
            Turf Management
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            Owner Dashboard
          </h1>

          <p className="mt-2 text-sm leading-6 text-gray-500 dark:text-gray-400">
            Manage your turfs, monitor bookings, and track your
            business performance.
          </p>
        </div>

        <Link
          to="/owner-dashboard/turfs"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
          <Plus size={18} />
          Manage Turfs
        </Link>
      </section>

      {/* Statistics */}
      <section aria-labelledby="overview-heading">
        <div className="mb-4">
          <h2
            id="overview-heading"
            className="text-lg font-semibold text-gray-900 dark:text-white"
          >
            Business Overview
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Your business metrics will appear here once connected
            to live data.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(({ label, description, icon: Icon, href }) => (
            <Link
              key={label}
              to={href}
              className="group rounded-2xl border border-gray-200 bg-white p-5 transition hover:border-emerald-300 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-emerald-800"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                  <Icon size={21} />
                </div>

                <ArrowRight
                  size={18}
                  className="text-gray-400 transition group-hover:translate-x-1 group-hover:text-emerald-600"
                />
              </div>

              <h3 className="mt-5 text-base font-semibold text-gray-900 dark:text-white">
                {label}
              </h3>

              <p className="mt-1 text-sm leading-5 text-gray-500 dark:text-gray-400">
                {description}
              </p>

              <p className="mt-4 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                View details
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick Actions */}
      <section aria-labelledby="actions-heading">
        <h2
          id="actions-heading"
          className="text-lg font-semibold text-gray-900 dark:text-white"
        >
          Quick Actions
        </h2>

        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Access your most frequently used tools.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {quickActions.map(
            ({ title, description, icon: Icon, href }) => (
              <Link
                key={title}
                to={href}
                className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-5 transition hover:border-emerald-300 hover:shadow-sm dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                  <Icon size={21} />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {title}
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
                    {description}
                  </p>

                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-emerald-600">
                    Open <ArrowRight size={15} />
                  </span>
                </div>
              </Link>
            )
          )}
        </div>
      </section>

      {/* Booking Activity Placeholder */}
      <section className="rounded-2xl border border-dashed border-gray-300 bg-gray-50/70 p-6 dark:border-gray-700 dark:bg-gray-900/50 sm:p-8">
        <div className="flex flex-col items-center py-5 text-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
            <Trophy size={26} />
          </div>

          <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
            Booking Activity
          </h2>

          <p className="mt-2 max-w-md text-sm leading-6 text-gray-500 dark:text-gray-400">
            Recent reservations, booking trends, and revenue
            reports will be displayed here after connecting the
            dashboard to your backend.
          </p>

          <Link
            to="/owner-dashboard/bookings"
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
          >
            View Bookings <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </main>
  );
};

export default OwnerDashboard;
